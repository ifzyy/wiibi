import express from 'express';
import {
  handleGetCart,
  handleAddToCart,
  handleUpdateItem,
  handleRemoveItem,
  handleClearCart,
  handleGetSavedCarts,
  handleSaveCart,
  handleDeleteSavedCart,
} from '../controllers/cartController.js';
import { optionalAuth, authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// All cart routes support both authenticated users and guests (X-Guest-Token header)
router.get   ('/',              optionalAuth, handleGetCart);
router.post  ('/items',         optionalAuth, handleAddToCart);
router.put   ('/items/:itemId', optionalAuth, handleUpdateItem);
router.delete('/items/:itemId', optionalAuth, handleRemoveItem);
router.delete('/',              optionalAuth, handleClearCart);

router.get('/saved',            authMiddleware, handleGetSavedCarts);
router.post('/saved',           authMiddleware, handleSaveCart);
router.delete('/saved/:cartId', authMiddleware, handleDeleteSavedCart);

export default router;