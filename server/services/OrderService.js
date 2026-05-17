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
import { Sequelize, Op }      from 'sequelize';

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
}) => {
  console.log(`[OrderService] Starting checkout for userId=${userId} guestToken=${guestToken} idempotencyKey=${idempotencyKey} guestEmail=${guestEmail} `);
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
          attributes: ['id', 'name', 'slug', 'featured_image_url', 'price', 'sale_price', 'stock', 'is_visible'],
          lock:       transaction.LOCK.UPDATE,  // lock each product row → no overselling
        }],
      }],
      lock:    transaction.LOCK.UPDATE,         // lock cart row → no double checkout
      transaction,
    });

    if (!cart?.items?.length) throw new AppError('Your cart is empty', 422);

    // ── 6. Validate items ─────────────────────────────────────────────────
    validateCartItems(cart.items);

    const totalAmount      = calculateCartTotal(cart.items);
    const paymentReference = generatePaymentReference();

    // ── 7. Create order ───────────────────────────────────────────────────
    const order = await db.Order.create({
      userId:          userId        || null,
      // resolvedEmail is stored as guestEmail on ALL orders — guests and logged-in users.
      // This is the authoritative email for payment and comms on this order.
      guestEmail:      resolvedEmail || null,
      guestToken:      guestToken    || null,
      orderNumber:     generateOrderNumber(),
      status:          'pending',
      paymentStatus:   'unpaid',
      totalAmount,
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
      order.id, 'pending', TRACKING_NOTES.pending(), userId, transaction
    );

    // ── 11. Commit ────────────────────────────────────────────────────────
    await transaction.commit();

    return getOrderById(order.id, userId, guestToken);

  } catch (err) {
    await transaction.rollback();
    // Cart is still active — user can retry without any cleanup.
    if (err.name === 'SequelizeDeadlockError' || err.name === 'SequelizeTimeoutError') {
      throw new AppError('Order processing temporarily unavailable. Please try again.', 503);
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

    // Double-refund guard
    const existingRefund = await db.Refund.findOne({
      where:       { orderId, status: { [Op.in]: ['pending', 'completed'] } },
      transaction,
    });
    if (existingRefund) {
      throw new AppError(
        'A refund is already in progress. Wait for it to complete before issuing another.', 409
      );
    }

    const orderTotal = parseFloat(order.totalAmount);
    const refundAmt  = amount ? Math.min(parseFloat(amount), orderTotal) : orderTotal;
    if (refundAmt <= 0) throw new AppError('Refund amount must be greater than zero', 422);

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
  paymentStatus  = null,
  note           = null,
  trackingNumber = null,
  carrier        = null,
  refund         = null,
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

    const allowed = VALID_TRANSITIONS[order.status] ?? [];
    if (!allowed.includes(fulfillmentStatus)) {
      throw new AppError(
        `Cannot move from "${order.status}" to "${fulfillmentStatus}". ` +
        `Allowed: ${allowed.length ? allowed.join(', ') : 'none'}`,
        422
      );
    }

    await order.update({
      status: fulfillmentStatus,
      ...(paymentStatus  != null && { paymentStatus }),
      ...(trackingNumber != null && { trackingNumber }),
      ...(carrier        != null && { carrier }),
    }, { transaction });

    await addTrackingEvent(
      orderId,
      fulfillmentStatus,
      note || TRACKING_NOTES[fulfillmentStatus]?.() || `Status updated to ${fulfillmentStatus}`,
      actorId,
      transaction,
    );

    if (refund?.amount > 0) {
      await db.Refund.create({
        orderId,
        amount:      refund.amount,
        reason:      refund.reason || null,
        method:      refund.method,
        processedBy: actorId,
        status:      'completed',
      }, { transaction });
    }

    await transaction.commit();
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