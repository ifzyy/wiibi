import crypto from 'crypto';
import db from '../models/index.js';
import { NotFoundError, ConflictError, AppError } from '../utils/AppError.js';

const generateGuestToken = () => crypto.randomBytes(32).toString('hex');

// ── Cart resolution ───────────────────────────────────────────────────────────

export const getOrCreateCart = async (userId = null, guestToken = null) => {
  if (userId) {
    const [cart] = await db.Cart.findOrCreate({
      where:    { userId, status: 'active' },
      defaults: { userId },
    });
    return cart;
  }

  if (guestToken) {
    let cart = await db.Cart.findOne({ where: { guestToken, status: 'active' } });
    if (!cart) cart = await db.Cart.create({ guestToken });
    return cart;
  }

  // Brand-new guest — generate a token and return it so the client can persist it
  const newToken = generateGuestToken();
  return db.Cart.create({ guestToken: newToken });
};

export const getCartWithItems = async (cartId) => {
  const cart = await db.Cart.findByPk(cartId, {
    include: [{
      model: db.CartItem,
      as:    'items',
      include: [{
        model:      db.Product,
        as:         'product',
        attributes: ['id', 'name', 'slug', 'price', 'sale_price', 'stock', 'is_visible', 'featured_image_url', 'delivery_fee'],
      }],
    }],
  });
  if (!cart) throw new NotFoundError('Cart not found');
  return cart;
};

// ── Item operations ───────────────────────────────────────────────────────────

const validateProductForCart = async (productId, quantity) => {
  const product = await db.Product.findByPk(productId);
  if (!product || !product.is_visible) throw new NotFoundError('Product not found or unavailable');
  if (product.stock < quantity)        throw new ConflictError('Insufficient stock. Available: ' + product.stock);
  return product;
};

export const addToCart = async (cartId, productId, quantity) => {
  if (quantity < 1) throw new AppError('Quantity must be at least 1', 422);
  const product  = await validateProductForCart(productId, quantity);
  const existing = await db.CartItem.findOne({ where: { cartId, productId } });

  if (existing) {
    const newQty = existing.quantity + quantity;
    if (product.stock < newQty) {
      throw new ConflictError('Only ' + product.stock + ' unit(s) available');
    }
    await existing.update({ quantity: newQty });
    return existing.reload();
  }

  const unitPrice = product.sale_price ?? product.price;
  return db.CartItem.create({ cartId, productId, quantity, unitPrice });
};

export const updateCartItem = async (cartId, itemId, quantity) => {
  if (quantity < 1) throw new AppError('Quantity must be at least 1', 422);

  const item = await db.CartItem.findOne({ where: { id: itemId, cartId } });
  if (!item) throw new NotFoundError('Cart item not found');

  await validateProductForCart(item.productId, quantity);
  await item.update({ quantity });
  return item.reload();
};

export const removeCartItem = async (cartId, itemId) => {
  const item = await db.CartItem.findOne({ where: { id: itemId, cartId } });
  if (!item) throw new NotFoundError('Cart item not found');
  await item.destroy();
};

export const clearCart = async (cartId) => {
  await db.CartItem.destroy({ where: { cartId } });
};

export const calculateCartTotal = (items) =>
  items.reduce((sum, item) => sum + parseFloat(item.unitPrice) * item.quantity, 0);
export const getSavedCarts = async (userId) => {
  if (!userId) throw new AppError('Authentication required', 401);
  return Cart.findAll({
    where: { userId, status: 'saved' },
    include: [{
      model: db.CartItem,
      as: 'items',
      include: [{
        model: db.Product,
        as: 'product',
        attributes: ['id', 'name', 'slug', 'price', 'sale_price', 'stock', 'is_visible', 'featured_image_url', 'delivery_fee'],
      }],
    }],
    order: [['created_at', 'DESC']],
  });
};

export const saveCart = async (userId) => {
  if (!userId) throw new AppError('Authentication required', 401);

  const activeCart = await Cart.findOne({
    where: { userId, status: 'active' },
    include: [{ model: db.CartItem, as: 'items' }],
  });

  if (!activeCart || !activeCart.items?.length) {
    throw new AppError('No active cart items to save', 400);
  }

  const transaction = await sequelize.transaction();
  try {
    const savedCart = await Cart.create({
      userId,
      status: 'saved',
    }, { transaction });

    const itemRows = activeCart.items.map((item) => ({
      cartId: savedCart.id,
      productId: item.productId,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
    }));

    await db.CartItem.bulkCreate(itemRows, { transaction });
    await transaction.commit();
    return getCartWithItems(savedCart.id);
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
};

export const deleteSavedCart = async (userId, cartId) => {
  const cart = await Cart.findOne({ where: { id: cartId, userId, status: 'saved' } });
  if (!cart) throw new NotFoundError('Saved cart not found');
  await db.CartItem.destroy({ where: { cartId: cart.id } });
  await cart.destroy();
};
// ── Guest merge ───────────────────────────────────────────────────────────────

const { Cart, CartItem, Product, sequelize } = db;

export const mergeGuestCart = async (guestToken, userId) => {
  if (!guestToken || !userId) return;

  const t = await sequelize.transaction();
  try {
    const guestCart = await Cart.findOne({
      where:   { guestToken, userId: null },
      include: [{ model: CartItem, as: 'items' }],
      transaction: t,
    });

    if (!guestCart || !guestCart.items?.length) {
      await t.rollback();
      return;
    }

    const [userCart] = await Cart.findOrCreate({
      where:       { userId, status: 'active' },
      defaults:    { userId },
      transaction: t,
    });

    const existingItems = await CartItem.findAll({
      where:       { cartId: userCart.id },
      transaction: t,
    });
    const itemMap = new Map(existingItems.map((i) => [i.productId, i]));

    for (const guestItem of guestCart.items) {
      const existing = itemMap.get(guestItem.productId);

      const product = await Product.findByPk(guestItem.productId, { transaction: t });

      // FIX: was product?.stockQuantity (wrong field name) — correct field is `stock`
      const maxStock = product?.stock ?? Infinity;

      if (existing) {
        const newQty = Math.min(existing.quantity + guestItem.quantity, maxStock);
        await existing.update({ quantity: newQty }, { transaction: t });
      } else {
        const qty = Math.min(guestItem.quantity, maxStock);
        await CartItem.create({
          cartId:    userCart.id,
          productId: guestItem.productId,
          quantity:  qty,
          unitPrice: guestItem.unitPrice,
        }, { transaction: t });
      }
    }

    // Destroy guest cart (cascade deletes its items)
    await guestCart.destroy({ transaction: t });

    await t.commit();
  } catch (err) {
    await t.rollback();
    throw err;
  }
};