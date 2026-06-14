/**
 * services/OrderService.js
 *
 * Pure order domain service. ONE job: manage order lifecycle.
 *
 * HARD RULES:
 *  1. NEVER calls any payment service. Payment is the controller's concern.
 *  2. NEVER makes external HTTP calls inside a DB transaction.
 *  3. ALL DB mutations are inside a single transaction — commit or rollback, nothing between.
 *  4. Cart is NEVER marked checked_out. Orders are independent snapshots.
 *     Cart stays active so the user can always retry a failed checkout.
 *  5. Payment reference is generated HERE at order creation — one stable key
 *     used across Order ↔ Paystack ↔ Webhook ↔ Refund.
 *  6. handlePaymentSuccess() and handlePaymentFailure() are fully IDEMPOTENT —
 *     calling them twice with the same reference produces no side effects.
 *
 * Email convention:
 *  Every order stores an email in guestEmail regardless of auth state.
 *  For guests:         guestEmail comes from the checkout form.
 *  For logged-in users: guestEmail is resolved from the User record here
 *                       so paymentController never has to do a second lookup.
 *  This is the single source of truth — paymentController just reads order.guestEmail.
 *
 * Naming convention:
 *  JS attributes are camelCase. Models use underscored:true.
 *  Sequelize maps camelCase attrs → snake_case columns automatically.
 *  Never use raw column names in queries — always use model attribute names.
 */

import crypto     from 'crypto';
import db         from '../models/index.js';
import { NotFoundError, AppError, ConflictError } from '../utils/AppError.js';
import { calculateCartTotal } from './Cart.services.js';
import { getEmitter }         from '../utils/emitter.js';
import { Sequelize, Op }      from 'sequelize';
import {
  sendOrderStatusEmail,
  sendPaymentConfirmationEmail,
} from './EmailService.js';
import { findUsablePromo, evaluatePromo } from './PromoService.js';

/* ── Status machine ───────────────────────────────────────────────────────── */

const VALID_TRANSITIONS = {
  pending:    ['processing', 'cancelled'],
  processing: ['shipped',    'cancelled'],
  shipped:    ['in_transit', 'delivered', 'cancelled'],
  in_transit: ['delivered'],
  delivered:  [],
  cancelled:  [],
};

const CUSTOMER_CANCELLABLE = ['pending', 'processing'];
const ADMIN_CANCELLABLE    = ['pending', 'processing', 'shipped', 'in_transit'];

/* ── Tracking note templates ──────────────────────────────────────────────── */

const TRACKING_NOTES = {
  pending:    ()           => 'Order placed — awaiting payment',
  processing: ()           => 'Payment confirmed — your items are being prepared',
  shipped:    ()           => 'Your order is out for delivery',
  in_transit: ()           => 'Your order is in transit and on its way to you',
  delivered:  ()           => 'Order delivered successfully',
  cancelled:  (by, reason) =>
    `Order cancelled${by ? ` by ${by}` : ''}${reason ? ` · ${reason}` : ''}`,
};

/* ── Shared query includes ────────────────────────────────────────────────── */

// Always camelCase attr names — underscored:true in models maps to snake_case columns
const PRODUCT_ATTRS = ['id', 'name', 'featured_image_url', 'slug', 'sku'];

const itemsInclude = {
  model:   db.OrderItem,
  as:      'items',
  include: [{ model: db.Product, as: 'product', attributes: PRODUCT_ATTRS }],
};

const timelineInclude = {
  model: db.OrderTracking,
  as:    'timeline',
  order: [['createdAt', 'ASC']],
};

/* ── Delivery fee ─────────────────────────────────────────────────────────── */

/**
 * Resolves the delivery fee for an order.
 *
 * Rule: if any cart item's product defines its own delivery_fee, the order is
 * charged the HIGHEST product fee in the cart — one delivery, priced by the
 * bulkiest item (an inverter ships differently from a wall socket). If no
 * product overrides, the admin-configurable global `delivery_fee` setting
 * applies. The global setting row is created with a 0 default on first use so
 * the admin Settings page always has something to edit; each order snapshots
 * the value it was actually charged.
 *
 * @param {Array} [items] — cart items with product.delivery_fee loaded
 */
export const getDeliveryFee = async (items = []) => {
  const productFees = items
    .map(i => parseFloat(i.product?.delivery_fee))
    .filter(f => Number.isFinite(f) && f >= 0);

  if (productFees.length) return Math.max(...productFees);

  const [setting] = await db.GlobalSetting.findOrCreate({
    where:    { key: 'delivery_fee' },
    defaults: {
      key:         'delivery_fee',
      value:       0,
      type:        'number',
      group:       'commerce',
      label:       'Delivery Fee',
      description: 'Default delivery fee in ₦ added to orders at checkout. Products can override it; orders charge the highest product fee in the cart. Set to 0 for free delivery.',
      isPublic:    true,
      isSystem:    false,
    },
  });

  const fee = parseFloat(setting.value);
  return Number.isFinite(fee) && fee > 0 ? fee : 0;
};

/* ── Private helpers ──────────────────────────────────────────────────────── */

const generateOrderNumber = () => {
  const ts   = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `ORD-${ts}-${rand}`;
};

/**
 * Generates a cryptographically unique payment reference at order creation.
 * This is the ONE stable key linking Order ↔ Paystack ↔ Webhook ↔ Refund.
 * Never regenerated — retries and webhooks always find the right order via this.
 */
const generatePaymentReference = () =>
  `PAY-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(8).toString('hex').toUpperCase()}`;

/**
 * Resolves the email to store on the order.
 *
 * Priority:
 *  1. guestEmail passed explicitly (from checkout form — works for guests AND logged-in users)
 *  2. User.email from DB          (fallback for logged-in users who didn't send it)
 *  3. null                        (guest with no email — validateCheckoutInput will catch this)
 *
 * By resolving here, every order in the DB has a populated guestEmail.
 * paymentController reads order.guestEmail and never needs a second User lookup.
 */
const resolveEmail = async (userId, guestEmail) => {
  if (guestEmail) return guestEmail;
  if (!userId)    return null;

  const user = await db.User.findByPk(userId, { attributes: ['email'] });
  return user?.email ?? null;
};

/**
 * Validates checkout inputs before any DB work.
 * Throwing here wastes zero DB connections.
 */
const validateCheckoutInput = (userId, { shippingAddress, guestEmail, guestToken, resolvedEmail }) => {
  if (!shippingAddress || typeof shippingAddress !== 'object') {
    throw new AppError('Valid shipping address is required', 400);
  }
  if (!userId) {
    // Guest path — both token and email are required
    if (!guestToken) throw new AppError('Guest session token is required', 400);
    if (!resolvedEmail) throw new AppError('Email address is required for guest checkout', 400);
  }
  // Logged-in users with no email anywhere are allowed to proceed —
  // resolvedEmail may still be null for phone-only accounts with no email on file.
  // That is acceptable: paymentController handles the no-email case gracefully.
};

/**
 * Uses camelCase model attributes (is_visible, not is_visible).
 * Sequelize translates via underscored:true — never use raw column names here.
 */
const validateCartItems = (items) => {
  for (const item of items) {
    if (!item.product?.is_visible) {
      throw new AppError(
        `"${item.product?.name || 'A product'}" is no longer available`, 422
      );
    }
    if (item.product.stock < item.quantity) {
      throw new ConflictError(`Insufficient stock for: ${item.product.name}`);
    }
  }
};

const buildOrderItem = (orderId, item) => ({
  orderId,
  productId:       item.productId,
  productName:     item.product.name,
  productSlug:     item.product.slug,
  productImageUrl: item.product.featured_image_url ?? null,
  quantity:        item.quantity,
  unitPrice:       item.product.sale_price ?? item.product.price,
  totalPrice:      parseFloat(item.product.sale_price ?? item.product.price) * item.quantity,
});

const addTrackingEvent = (orderId, status, note, updatedBy, transaction) =>
  db.OrderTracking.create(
    { orderId, status, note, updatedBy: updatedBy ?? null },
    { transaction }
  );

/**
 * Idempotency check — runs BEFORE opening any transaction.
 * Ownership verified before re-surfacing an order so a guest cannot
 * claim another session's order via a matching idempotency key.
 */
const resolveIdempotentOrder = async (idempotencyKey, userId, guestToken) => {
  if (!idempotencyKey) return null;

  const existing = await db.Order.findOne({
    where:      { idempotencyKey },
    attributes: ['id', 'userId', 'guestToken'],
  });

  if (!existing) return null;

  const isGuest = !userId;
  if (isGuest  && existing.guestToken !== guestToken) throw new AppError('Order not found', 404);
  if (!isGuest && existing.userId     !== userId)     throw new AppError('Order not found', 404);

  return getOrderById(existing.id, userId, guestToken);
};

/* ─────────────────────────────────────────────────────────────────────────── */
/*  createOrderFromCart()                                                      */
/* ─────────────────────────────────────────────────────────────────────────── */

/**
 * Creates an order snapshot from the caller's active cart.
 *
 * Design decisions:
 *
 *  • Email resolved HERE before the transaction opens — resolveEmail() does
 *    a lightweight User lookup if needed. The resolved email is stored as
 *    guestEmail on every order, regardless of auth state. This means
 *    paymentController.handleInitialize() just reads order.guestEmail and
 *    never needs its own User lookup. Phone-only accounts are handled cleanly.
 *
 *  • paymentReference generated HERE — stable key for Paystack + webhook + refund.
 *    Generated once, never regenerated, so retries are safe.
 *
 *  • Cart stays active (not checked_out). If anything fails the user retries
 *    immediately without needing support to reset their cart.
 *
 *  • Stock decremented inside the transaction — reserves inventory the moment
 *    an order is created, preventing overselling during the pending→paid window.
 *    handlePaymentFailure() restores stock if payment doesn't go through.
 *
 * @param {string|null} userId
 * @param {{
 *   shippingAddress: object,
 *   idempotencyKey?: string,
 *   currency?:       string,
 *   guestEmail?:     string,
 *   guestToken?:     string,
 * }} options
 */
export const createOrderFromCart = async (userId, {
  shippingAddress,
  idempotencyKey = null,
  currency       = 'NGN',
  guestEmail     = null,
  guestToken     = null,
  promoCode      = null,
  paymentMethod  = 'online',
}) => {
  // Avoid logging PII (email / guest token). IDs and presence flags only.
  console.log(`[OrderService] Starting checkout userId=${userId ?? 'guest'} hasIdempotencyKey=${!!idempotencyKey}`);
  // ── 1. Resolve email BEFORE the transaction ───────────────────────────────
  //
  // For logged-in users: checks guestEmail first (sent by form), then falls
  // back to User.email in the DB. This single lookup here means paymentController
  // can always read order.guestEmail without any extra queries.
  const resolvedEmail = await resolveEmail(userId, guestEmail);

  // ── 2. Validate inputs ────────────────────────────────────────────────────
  validateCheckoutInput(userId, { shippingAddress, guestEmail, guestToken, resolvedEmail });

  // ── 3. Idempotency — read-only, outside any transaction ───────────────────
  const existingOrder = await resolveIdempotentOrder(idempotencyKey, userId, guestToken);
  if (existingOrder) return existingOrder;

  // ── 4. Open transaction ───────────────────────────────────────────────────
  const transaction = await db.sequelize.transaction({
    isolationLevel: Sequelize.Transaction.ISOLATION_LEVELS.READ_COMMITTED,
  });

  try {
    // ── 5. Lock and load cart ─────────────────────────────────────────────
    // SELECT FOR UPDATE prevents two concurrent requests from checking out
    // the same cart simultaneously. The second request blocks until the first
    // commits, then finds no active cart and throws 'cart is empty'.
    const cartWhere = userId
      ? { userId,     status: 'active' }
      : { guestToken, status: 'active' };

    const cart = await db.Cart.findOne({
      where:   cartWhere,
      include: [{
        model:   db.CartItem,
        as:      'items',
        include: [{
          model:      db.Product,
          as:         'product',
          attributes: ['id', 'name', 'slug', 'featured_image_url', 'price', 'sale_price', 'stock', 'is_visible', 'delivery_fee', 'listing_type'],
          lock:       transaction.LOCK.UPDATE,  // lock each product row → no overselling
        }],
      }],
      lock:    transaction.LOCK.UPDATE,         // lock cart row → no double checkout
      transaction,
    });

    if (!cart?.items?.length) throw new AppError('Your cart is empty', 422);

    // ── 6. Validate items ─────────────────────────────────────────────────
    validateCartItems(cart.items);

    const subtotal         = calculateCartTotal(cart.items);
    const deliveryFee      = await getDeliveryFee(cart.items);

    // ── 6b. Promo code — validate + reserve a redemption inside the txn ─────
    // Recomputed server-side from the locked promo row; the client's discount
    // is never trusted. The row lock makes the usage-limit check race-safe.
    let discount     = 0;
    let appliedPromo = null;
    if (promoCode) {
      const promo = await findUsablePromo(promoCode, { transaction });
      const result = evaluatePromo(promo, subtotal);   // throws AppError if invalid
      discount     = result.discount;
      appliedPromo = result.promo;
      await appliedPromo.increment('usedCount', { by: 1, transaction });
    }

    // Pay on Delivery is not available with a promo code — discounted orders
    // must be paid online so the discount is captured at the gateway.
    const isCod = paymentMethod === 'on_delivery';
    if (isCod && discount > 0) {
      throw new AppError(
        'Pay on Delivery isn’t available with a promo code. Remove the code or pay online to use the discount.',
        422
      );
    }

    const totalAmount      = Math.max(0, subtotal + deliveryFee - discount);
    const paymentReference = generatePaymentReference();

    // Default delivery estimate: ~7 days for normal items, ~30 days when the
    // order contains a full system package (engineer survey + installation).
    // Admins refine the date from the order management modal.
    const needsSurvey      = cart.items.some(i => i.product?.listing_type === 'package');
    const expectedDelivery = new Date(Date.now() + (needsSurvey ? 30 : 7) * 24 * 60 * 60 * 1000);

    // ── 7. Create order ───────────────────────────────────────────────────
    const order = await db.Order.create({
      userId:          userId        || null,
      // resolvedEmail is stored as guestEmail on ALL orders — guests and logged-in users.
      // This is the authoritative email for payment and comms on this order.
      guestEmail:      resolvedEmail || null,
      guestToken:      guestToken    || null,
      orderNumber:     generateOrderNumber(),
      // COD is confirmed immediately (no online payment step); online orders
      // wait in 'pending' until the gateway confirms payment.
      status:          isCod ? 'processing' : 'pending',
      paymentStatus:   'unpaid',
      paymentMethod,
      totalAmount,
      deliveryFee,
      discount,
      promoCode:       appliedPromo?.code ?? null,
      expectedDelivery,
      currency,
      shippingAddress,
      paymentReference,
      idempotencyKey:  idempotencyKey || null,
    }, { transaction });

    // ── 8. Snapshot cart items as order items ─────────────────────────────
    await db.OrderItem.bulkCreate(
      cart.items.map(item => buildOrderItem(order.id, item)),
      { transaction }
    );

    // ── 9. Reserve stock ──────────────────────────────────────────────────
    // Products already locked above — parallel requests block here, not race.
    await Promise.all(
      cart.items.map(item =>
        db.Product.decrement('stock', {
          by:    item.quantity,
          where: { id: item.productId },
          transaction,
        })
      )
    );

    // ── 10. Initial tracking event ────────────────────────────────────────
    await addTrackingEvent(
      order.id,
      isCod ? 'processing' : 'pending',
      isCod ? 'Order confirmed — Pay on Delivery' : TRACKING_NOTES.pending(),
      userId,
      transaction
    );

    // ── 11. Commit ────────────────────────────────────────────────────────
    await transaction.commit();

    // COD orders are confirmed at creation, so send the confirmation email now
    // (online orders email on payment success instead). Fire-and-forget.
    if (isCod) {
      sendOrderStatusEmail(order, {
        note: `You chose Pay on Delivery. Please have ₦${parseFloat(totalAmount).toLocaleString('en-NG')} ready for our delivery agent.`,
      });
    }

    return getOrderById(order.id, userId, guestToken);

  } catch (err) {
    await transaction.rollback();
    // Cart is still active — user can retry without any cleanup.
    if (err.name === 'SequelizeDeadlockError' || err.name === 'SequelizeTimeoutError') {
      throw new AppError('Order processing temporarily unavailable. Please try again.', 503);
    }
    // A concurrent request with the same idempotencyKey won the INSERT race.
    // The unique constraint stopped the duplicate order — return the winner
    // instead of surfacing a raw 500 to the client.
    if (err.name === 'SequelizeUniqueConstraintError' && idempotencyKey) {
      const existing = await resolveIdempotentOrder(idempotencyKey, userId, guestToken);
      if (existing) return existing;
    }
    throw err;
  }
};

// Named alias so any controller still importing the old name keeps working
export const checkout = createOrderFromCart;

/* ─────────────────────────────────────────────────────────────────────────── */
/*  handlePaymentSuccess()                                                     */
/* ─────────────────────────────────────────────────────────────────────────── */

/**
 * Marks an order as paid and advances it to 'processing'.
 *
 * FULLY IDEMPOTENT — safe to call repeatedly with the same reference.
 * Duplicate webhook deliveries, retried verify calls — all resolve harmlessly.
 *
 * Called by: PaymentController only. Never called internally.
 *
 * @param {string} paymentReference
 * @param {object} gatewayData  — raw Paystack response data object
 * @returns {{ order: Order, alreadyPaid: boolean }}
 */
export const handlePaymentSuccess = async (paymentReference, gatewayData = {}) => {
  const transaction = await db.sequelize.transaction();

  try {
    // Lock the row so concurrent webhook deliveries queue, not race.
    const order = await db.Order.findOne({
      where: { paymentReference },
      lock:  transaction.LOCK.UPDATE,
      transaction,
    });

    if (!order) throw new NotFoundError('Order not found for this payment reference');

    // IDEMPOTENCY: already paid → return cleanly, nothing to do.
    if (order.paymentStatus === 'paid') {
      await transaction.rollback();
      return { order: await getOrderById(order.id), alreadyPaid: true };
    }

    if (order.status === 'cancelled') {
      await transaction.rollback();
      throw new AppError('Cannot confirm payment for a cancelled order', 422);
    }

    // SECURITY: confirm the gateway actually collected the full amount in the
    // correct currency before marking the order paid. Without this, a 'success'
    // for a smaller charge (or a replayed cheaper reference) would yield free
    // goods. Amounts from the gateway are in kobo (NGN × 100).
    const paidKobo     = Number.parseInt(gatewayData.amount, 10);
    const expectedKobo = Math.round(parseFloat(order.totalAmount) * 100);
    if (!Number.isFinite(paidKobo) || paidKobo < expectedKobo) {
      await transaction.rollback();
      throw new AppError(
        `Payment amount mismatch for ${paymentReference}: ` +
        `received ${Number.isFinite(paidKobo) ? paidKobo : 'none'} kobo, expected ${expectedKobo} kobo`,
        422
      );
    }
    const paidCurrency = (gatewayData.currency ?? order.currency ?? 'NGN').toUpperCase();
    if (paidCurrency !== (order.currency ?? 'NGN').toUpperCase()) {
      await transaction.rollback();
      throw new AppError(
        `Payment currency mismatch for ${paymentReference}: received ${paidCurrency}, expected ${order.currency}`,
        422
      );
    }

    // Advance to processing if still pending; don't regress if already further along.
    const nextStatus = VALID_TRANSITIONS[order.status]?.includes('processing')
      ? 'processing'
      : order.status;

    // Paystack sends amounts in kobo — convert to NGN for the human-readable note.
    const amountNgn = gatewayData.amount
      ? parseFloat(gatewayData.amount) / 100
      : parseFloat(order.totalAmount);

    await order.update({ paymentStatus: 'paid', status: nextStatus }, { transaction });

    await addTrackingEvent(
      order.id,
      nextStatus,
      `Payment confirmed · ₦${amountNgn.toLocaleString('en-NG')} · ref: ${paymentReference}`,
      null,
      transaction,
    );

    await transaction.commit();

    // Notify the admin dashboard in real time. Best-effort — a listener error
    // must never roll back or fail the now-committed payment.
    try {
      getEmitter().emit('order:paid', {
        orderId:     order.id,
        orderNumber: order.orderNumber,
        amount:      parseFloat(order.totalAmount),
        currency:    order.currency ?? 'NGN',
      });
    } catch { /* non-fatal */ }

    // Receipt email — fire-and-forget AFTER commit (rule 2: no external calls
    // inside a transaction). EmailService never throws.
    sendPaymentConfirmationEmail(order, {
      amountNgn,
      reference: paymentReference,
    });

    return { order: await getOrderById(order.id), alreadyPaid: false };

  } catch (err) {
    await transaction.rollback();
    throw err;
  }
};

/* ─────────────────────────────────────────────────────────────────────────── */
/*  handlePaymentFailure()                                                     */
/* ─────────────────────────────────────────────────────────────────────────── */

/**
 * Records a payment failure and restores reserved stock.
 *
 * FULLY IDEMPOTENT — calling twice for the same reference is safe.
 *
 * Order stays in the system with paymentStatus='failed' so the customer
 * can retry payment on the same order without placing a new one.
 * Stock is restored so other customers can purchase the same items.
 *
 * Called by: PaymentController only.
 *
 * @param {string} paymentReference
 * @param {string} [failureReason]
 */
export const handlePaymentFailure = async (paymentReference, failureReason = 'Payment declined') => {
  const transaction = await db.sequelize.transaction();

  try {
    const order = await db.Order.findOne({
      where:   { paymentReference },
      include: [{ model: db.OrderItem, as: 'items' }],
      lock:    transaction.LOCK.UPDATE,
      transaction,
    });

    if (!order) throw new NotFoundError('Order not found for this payment reference');

    // IDEMPOTENCY: already handled → return cleanly.
    if (['failed', 'paid'].includes(order.paymentStatus)) {
      await transaction.rollback();
      return { order: await getOrderById(order.id), alreadyHandled: true };
    }

    // Restore stock — payment failed so inventory should be purchasable again.
    await Promise.all(
      (order.items ?? []).map(item =>
        db.Product.increment('stock', {
          by:    item.quantity,
          where: { id: item.productId },
          transaction,
        })
      )
    );

    await order.update({ paymentStatus: 'failed' }, { transaction });

    await addTrackingEvent(
      order.id,
      order.status,  // fulfillment status unchanged — only payment status changes
      `Payment failed — ${failureReason}. Stock restored. Customer may retry.`,
      null,
      transaction,
    );

    await transaction.commit();
    return { order: await getOrderById(order.id), alreadyHandled: false };

  } catch (err) {
    await transaction.rollback();
    throw err;
  }
};

/* ─────────────────────────────────────────────────────────────────────────── */
/*  initiateRefundFlow()                                                       */
/* ─────────────────────────────────────────────────────────────────────────── */

/**
 * Creates a refund record and returns everything PaymentController needs
 * to call Paystack. Does NOT call Paystack itself.
 *
 * Pattern:
 *  1. Controller calls initiateRefundFlow() → DB record created, transaction commits
 *  2. Controller calls PaymentService.initiateRefund() outside any transaction
 *  3. Controller calls updateRefundStatus() with the gateway result
 *
 * This keeps all external HTTP calls outside DB transactions.
 */
export const initiateRefundFlow = async (orderId, {
  amount  = null,
  reason,
  method  = 'Paystack',
  actorId = null,
}) => {
  const transaction = await db.sequelize.transaction();

  try {
    const order = await db.Order.findOne({
      where: { id: orderId },
      lock:  transaction.LOCK.UPDATE,
      transaction,
    });

    if (!order) throw new NotFoundError('Order not found');

    if (!['paid', 'partially_refunded'].includes(order.paymentStatus)) {
      throw new AppError('Order has not been paid — nothing to refund', 422);
    }

    // Double-refund guard — block if ANY non-failed refund already exists.
    // 'manual_required' and 'processing' MUST be included: a manual bank-transfer
    // refund still represents money owed/paid out, so issuing another on top of it
    // would over-refund the order.
    const REFUND_ACTIVE = ['pending', 'processing', 'completed', 'manual_required'];
    const existingRefund = await db.Refund.findOne({
      where:       { orderId, status: { [Op.in]: REFUND_ACTIVE } },
      transaction,
    });
    if (existingRefund) {
      throw new AppError(
        'A refund already exists for this order. Wait for it to complete before issuing another.', 409
      );
    }

    const orderTotal = parseFloat(order.totalAmount);
    const refundAmt  = amount ? Math.min(parseFloat(amount), orderTotal) : orderTotal;
    if (refundAmt <= 0) throw new AppError('Refund amount must be greater than zero', 422);

    // Cumulative cap — defense in depth. Sum prior non-failed refunds and ensure
    // the running total never exceeds the order total even if the guard above is
    // ever bypassed by a future code path.
    const priorRefunded = Number(await db.Refund.sum('amount', {
      where: { orderId, status: { [Op.in]: REFUND_ACTIVE } },
      transaction,
    })) || 0;
    if (priorRefunded + refundAmt > orderTotal + 0.001) {
      throw new AppError(
        `Refund would exceed the order total (already refunded ₦${priorRefunded} of ₦${orderTotal})`, 422
      );
    }

    const refund = await db.Refund.create({
      orderId,
      amount:      refundAmt,
      currency:    order.currency ?? 'NGN',
      reason,
      method,
      status:      'pending',
      processedBy: actorId,
      processedAt: new Date(),
    }, { transaction });

    await transaction.commit();

    return {
      refund,
      order:            await getOrderById(orderId),
      paymentReference: order.paymentReference,
      refundAmount:     refundAmt,
    };

  } catch (err) {
    await transaction.rollback();
    throw err;
  }
};

/**
 * Updates a refund record with the gateway response.
 * Called by PaymentController after the Paystack call completes (or fails).
 * Recalculates paymentStatus on the order when the refund is finalised.
 */
export const updateRefundStatus = async (refundId, {
  gatewayReference = null,
  status,
  failureReason    = null,
}) => {
  const refund = await db.Refund.findByPk(refundId);
  if (!refund) throw new NotFoundError('Refund not found');

  await refund.update({
    status,
    ...(gatewayReference && { gatewayReference }),
    ...(failureReason    && { failureReason }),
    processedAt: new Date(),
  });

  if (['completed', 'manual_required'].includes(status)) {
    const allRefunds = await db.Refund.findAll({
      where: {
        orderId: refund.orderId,
        status:  { [Op.in]: ['pending', 'completed', 'manual_required'] },
      },
    });

    const totalRefunded = allRefunds.reduce((s, r) => s + parseFloat(r.amount), 0);
    const order         = await db.Order.findByPk(refund.orderId);

    if (order) {
      await order.update({
        paymentStatus: totalRefunded >= parseFloat(order.totalAmount) ? 'refunded' : 'partially_refunded',
      });
      await db.OrderTracking.create({
        orderId:   refund.orderId,
        status:    order.status,
        note:      `Refund of ₦${parseFloat(refund.amount).toLocaleString('en-NG')} ${status}`,
        updatedBy: refund.processedBy ?? null,
      });
    }
  }

  return refund.reload();
};

/* ─────────────────────────────────────────────────────────────────────────── */
/*  getOrderById()                                                             */
/* ─────────────────────────────────────────────────────────────────────────── */

export const getOrderById = async (orderId, userId = null, guestToken = null) => {
  const isUUID  = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(orderId);
  const idWhere = isUUID ? { id: orderId } : { orderNumber: orderId };

  const where = { ...idWhere };
  if (userId)          where.userId     = userId;
  else if (guestToken) where.guestToken = guestToken;

  const order = await db.Order.findOne({
    where,
    include: [
      itemsInclude,
      timelineInclude,
      { model: db.Refund, as: 'refunds', required: false },
    ],
  });

  if (!order) throw new NotFoundError('Order not found');
  return order;
};

/* ─────────────────────────────────────────────────────────────────────────── */
/*  getUserOrders()                                                            */
/* ─────────────────────────────────────────────────────────────────────────── */

export const getUserOrders = async (
  userId,
  { page = 1, limit = 20 } = {},
  guestEmail = null,
) => {
  const safeLimit = Math.min(limit, 100);
  const offset    = (page - 1) * safeLimit;
  const where     = userId ? { userId } : { guestEmail };

  const { rows, count } = await db.Order.findAndCountAll({
    where,
    include:  [itemsInclude],
    order:    [['createdAt', 'DESC']],
    limit:    safeLimit,
    offset,
    distinct: true,
  });

  return {
    orders:     rows,
    pagination: { page, limit: safeLimit, total: count, pages: Math.ceil(count / safeLimit) },
  };
};

/* ─────────────────────────────────────────────────────────────────────────── */
/*  claimGuestOrders()                                                         */
/* ─────────────────────────────────────────────────────────────────────────── */

export const claimGuestOrders = async (guestToken, userId) => {
  if (!guestToken || !userId) return 0;

  const [count] = await db.Order.update(
    { userId, guestToken: null },
    { where: { guestToken, userId: null } }
  );

  if (count > 0) {
    console.log(`[OrderService] Claimed ${count} guest order(s) for user ${userId}`);
  }

  return count;
};

/* ─────────────────────────────────────────────────────────────────────────── */
/*  updateOrderStatus()  — admin / fulfilment                                  */
/* ─────────────────────────────────────────────────────────────────────────── */

export const updateOrderStatus = async (orderId, {
  fulfillmentStatus,
  paymentStatus    = null,
  note             = null,
  trackingNumber   = null,
  carrier          = null,
  expectedDelivery = null,
  refund           = null,
  actorId,
}) => {
  const transaction = await db.sequelize.transaction();

  try {
    const order = await db.Order.findOne({
      where: { id: orderId },
      lock:  transaction.LOCK.UPDATE,
      transaction,
    });
    if (!order) throw new NotFoundError('Order not found');

    // Same-status saves are SHIPMENT UPDATES: the admin posts a progress note
    // ("Package arrived at Ibadan hub") to the customer-visible timeline
    // without advancing the order. Only actual transitions are validated.
    const isSameStatus = fulfillmentStatus === order.status;

    if (!isSameStatus) {
      const allowed = VALID_TRANSITIONS[order.status] ?? [];
      if (!allowed.includes(fulfillmentStatus)) {
        throw new AppError(
          `Cannot move from "${order.status}" to "${fulfillmentStatus}". ` +
          `Allowed: ${allowed.length ? allowed.join(', ') : 'none'}`,
          422
        );
      }
    }

    await order.update({
      status: fulfillmentStatus,
      ...(paymentStatus    != null && { paymentStatus }),
      ...(trackingNumber   != null && { trackingNumber }),
      ...(carrier          != null && { carrier }),
      ...(expectedDelivery != null && { expectedDelivery }),
    }, { transaction });

    await addTrackingEvent(
      orderId,
      fulfillmentStatus,
      note
        || (isSameStatus
              ? 'Shipment update'
              : TRACKING_NOTES[fulfillmentStatus]?.() || `Status updated to ${fulfillmentStatus}`),
      actorId,
      transaction,
    );

    if (refund?.amount > 0) {
      // This admin path records a refund directly (status 'completed'), bypassing
      // initiateRefundFlow. It still MUST enforce the cumulative cap, or an admin
      // could refund more than the order total across multiple status updates.
      const REFUND_ACTIVE = ['pending', 'processing', 'completed', 'manual_required'];
      const orderTotal    = parseFloat(order.totalAmount);
      const refundAmt     = parseFloat(refund.amount);

      const priorRefunded = Number(await db.Refund.sum('amount', {
        where: { orderId, status: { [Op.in]: REFUND_ACTIVE } },
        transaction,
      })) || 0;
      if (priorRefunded + refundAmt > orderTotal + 0.001) {
        throw new AppError(
          `Refund would exceed the order total (already refunded ₦${priorRefunded} of ₦${orderTotal})`, 422
        );
      }

      await db.Refund.create({
        orderId,
        amount:      refundAmt,
        currency:    order.currency ?? 'NGN',
        reason:      refund.reason || null,
        method:      refund.method,
        processedBy: actorId,
        status:      'completed',
      }, { transaction });
    }

    await transaction.commit();

    // Customer notification — fire-and-forget AFTER commit. Real transitions
    // always email; same-status shipment updates only email when the admin
    // wrote a note (that note IS the message — no point sending an empty one).
    // Payment-confirmation emails are handled by handlePaymentSuccess, so a
    // processing transition triggered there won't double-send: this path only
    // runs for admin-driven status updates.
    if (!isSameStatus || note) {
      sendOrderStatusEmail(order, {
        note,
        trackingNumber,
        carrier,
        expectedDelivery,
      });
    }

    return getOrderById(orderId);

  } catch (err) {
    await transaction.rollback();
    throw err;
  }
};

/* ─────────────────────────────────────────────────────────────────────────── */
/*  cancelOrderByCustomer()                                                    */
/* ─────────────────────────────────────────────────────────────────────────── */

export const cancelOrderByCustomer = async (
  orderId, userId, guestToken, { reason, details }
) => {
  const transaction = await db.sequelize.transaction();

  try {
    const isUUID     = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(orderId);
    const idField    = isUUID ? { id: orderId } : { orderNumber: orderId };
    const ownerWhere = userId
      ? { ...idField, userId }
      : { ...idField, guestToken };

    const order = await db.Order.findOne({
      where:   ownerWhere,
      include: [{ model: db.OrderItem, as: 'items' }],
      lock:    transaction.LOCK.UPDATE,
      transaction,
    });

    if (!order) throw new NotFoundError('Order not found');

    const realOrderId = order.id;

    if (!CUSTOMER_CANCELLABLE.includes(order.status)) {
      const inTransit = ['shipped', 'in_transit'].includes(order.status);
      throw new AppError(
        inTransit
          ? 'Your order is already on its way and cannot be cancelled. Contact support to arrange a return.'
          : `Order cannot be cancelled at this stage (status: ${order.status})`,
        422
      );
    }

    await Promise.all(
      (order.items ?? []).map(item =>
        db.Product.increment('stock', {
          by: item.quantity, where: { id: item.productId }, transaction,
        })
      )
    );

    await order.update({ status: 'cancelled' }, { transaction });

    await addTrackingEvent(
      realOrderId, 'cancelled',
      TRACKING_NOTES.cancelled('customer', reason) + (details ? ` — ${details}` : ''),
      userId,
      transaction,
    );

    await transaction.commit();

    // Cancellation confirmation — fire-and-forget after commit
    sendOrderStatusEmail(order, { note: reason ? `Reason: ${reason}` : null });

    return {
      order:            await getOrderById(realOrderId, userId, guestToken),
      needsRefund:      order.paymentStatus === 'paid',
      paymentReference: order.paymentReference,
      totalAmount:      order.totalAmount,
      currency:         order.currency,
    };

  } catch (err) {
    await transaction.rollback();
    throw err;
  }
};

/* ─────────────────────────────────────────────────────────────────────────── */
/*  cancelOrderByAdmin()                                                       */
/* ─────────────────────────────────────────────────────────────────────────── */

export const cancelOrderByAdmin = async (orderId, adminId, {
  reason,
  issueRefund  = false,
  refundAmount,
  refundMethod = 'Paystack',
}) => {
  const transaction = await db.sequelize.transaction();

  try {
    const order = await db.Order.findOne({
      where:   { id: orderId },
      include: [{ model: db.OrderItem, as: 'items' }],
      lock:    transaction.LOCK.UPDATE,
      transaction,
    });

    if (!order) throw new NotFoundError('Order not found');

    if (!ADMIN_CANCELLABLE.includes(order.status)) {
      throw new AppError(
        `Cannot cancel order with status "${order.status}". ` +
        `Cancellable: ${ADMIN_CANCELLABLE.join(', ')}`,
        422
      );
    }

    if (['pending', 'processing'].includes(order.status)) {
      await Promise.all(
        (order.items ?? []).map(item =>
          db.Product.increment('stock', {
            by: item.quantity, where: { id: item.productId }, transaction,
          })
        )
      );
    }

    await order.update({ status: 'cancelled' }, { transaction });
    await addTrackingEvent(
      orderId, 'cancelled',
      TRACKING_NOTES.cancelled('admin', reason),
      adminId, transaction,
    );

    await transaction.commit();

    // Cancellation notification — fire-and-forget after commit
    sendOrderStatusEmail(order, { note: reason ? `Reason: ${reason}` : null });

    return {
      order:            await getOrderById(orderId),
      needsRefund:      issueRefund || order.paymentStatus === 'paid',
      paymentReference: order.paymentReference,
      refundAmount:     refundAmount ?? null,
      refundMethod,
    };

  } catch (err) {
    await transaction.rollback();
    throw err;
  }
};

/* ─────────────────────────────────────────────────────────────────────────── */
/*  getAllOrders()  — admin listing                                             */
/* ─────────────────────────────────────────────────────────────────────────── */

export const getAllOrders = async ({
  page          = 1,
  limit         = 20,
  status        = null,
  paymentStatus = null,
} = {}) => {
  const where     = {};
  if (status)        where.status        = status;
  if (paymentStatus) where.paymentStatus = paymentStatus;

  const safeLimit = Math.min(limit, 100);
  const offset    = (page - 1) * safeLimit;

  const { rows, count } = await db.Order.findAndCountAll({
    where,
    include: [
      {
        model:      db.User,
        as:         'user',
        attributes: ['id', 'phoneNumber', 'firstName', 'lastName', 'email'],
        required:   false,
      },
      itemsInclude,
      { model: db.Refund, as: 'refunds', required: false },
    ],
    order:    [['createdAt', 'DESC']],
    limit:    safeLimit,
    offset,
    distinct: true,
    subQuery: false,
  });

  return {
    orders:     rows,
    pagination: { page, limit: safeLimit, total: count, pages: Math.ceil(count / safeLimit) },
  };
};

export const CANCEL_REASONS = [
  'Changed my mind',
  'Ordered by mistake',
  'Found a better price elsewhere',
  'Delivery time is too long',
  'Payment issue',
  'Other',
];