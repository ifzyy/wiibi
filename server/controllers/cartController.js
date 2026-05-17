import Joi from 'joi';
import asyncHandler from '../utils/Asynchandler.js';
import { sendSuccess } from '../utils/response.js';
import { ValidationError } from '../utils/AppError.js';
import {
  getOrCreateCart,
  getCartWithItems,
  addToCart,
  updateCartItem,
  removeCartItem,
  clearCart,
  calculateCartTotal,
  getSavedCarts,
  saveCart,
  deleteSavedCart,
} from '../services/Cart.services.js';

const addItemSchema = Joi.object({
  productId: Joi.number().integer().positive().required(),
  quantity:  Joi.number().integer().min(1).max(999).required(),
});

const updateItemSchema = Joi.object({
  quantity: Joi.number().integer().min(1).max(999).required(),
});

/** Resolves the cart for authenticated user or guest (X-Guest-Token header). */
const resolveCart = (req) => {
  if (req.user) return getOrCreateCart(req.user.id);
  const guestToken = req.headers['x-guest-token'] || null;
  return getOrCreateCart(null, guestToken);
};

export const handleGetCart = asyncHandler(async (req, res) => {
  const cart     = await resolveCart(req);
  const fullCart = await getCartWithItems(cart.id);
  const total    = calculateCartTotal(fullCart.items || []);

  return sendSuccess(res, {
    cartId:     cart.id,
    guestToken: cart.guestToken, // returned so guest can persist it client-side
    total:      total.toFixed(2),
    items:      fullCart.items,
  });
});

export const handleAddToCart = asyncHandler(async (req, res) => {
  const { error, value } = addItemSchema.validate(req.body);
    console.log(error)
  if (error) throw new ValidationError(error.details[0].message);

  const cart = await resolveCart(req);
  const item = await addToCart(cart.id, value.productId, value.quantity);
  return sendSuccess(res, item, 'Item added to cart');
});

export const handleUpdateItem = asyncHandler(async (req, res) => {
  const { error, value } = updateItemSchema.validate(req.body);
  console.log(error)
  if (error) throw new ValidationError(error.details[0].message);

  const cart = await resolveCart(req);
  const item = await updateCartItem(cart.id, req.params.itemId, value.quantity);
  return sendSuccess(res, item, 'Cart item updated');
});

export const handleRemoveItem = asyncHandler(async (req, res) => {
  const cart = await resolveCart(req);
  await removeCartItem(cart.id, req.params.itemId);
  return sendSuccess(res, null, 'Item removed from cart');
});

export const handleClearCart = asyncHandler(async (req, res) => {
  const cart = await resolveCart(req);
  await clearCart(cart.id);
  return sendSuccess(res, null, 'Cart cleared');
});

export const handleGetSavedCarts = asyncHandler(async (req, res) => {
  const carts = await getSavedCarts(req.user.id);
  return sendSuccess(res, carts);
});

export const handleSaveCart = asyncHandler(async (req, res) => {
  const savedCart = await saveCart(req.user.id);
  return sendSuccess(res, savedCart, 'Cart saved');
});

export const handleDeleteSavedCart = asyncHandler(async (req, res) => {
  await deleteSavedCart(req.user.id, req.params.cartId);
  return sendSuccess(res, null, 'Saved cart deleted');
});