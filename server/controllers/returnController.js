/**
 * controllers/returnController.js
 *
 * Endpoints:
 *   GET  /returns                  — all return requests (admin)
 *   POST /returns/:orderId/request — mark order as return_requested
 *   POST /returns/:orderId/confirm — confirm receipt + trigger refund
 *   GET  /returns/manual-refunds   — all manual_required refunds
 *   POST /returns/refunds/:refundId/complete — mark manual refund complete
 */

import asyncHandler from '../utils/Asynchandler.js';
import { sendSuccess, sendCreated, sendPaginated } from '../utils/response.js';
import { ValidationError } from '../utils/AppError.js';
import {
  requestReturn,
  confirmReturn,
  getReturnRequests,
  getPendingManualRefunds,
} from '../services/ReturnService.js';

// Re-exported so returnRoutes.js only needs to import from one controller file
export { handleMarkRefundComplete } from './paymentController.js';

export const handleGetReturns = asyncHandler(async (req, res) => {
  const page   = parseInt(req.query.page  || '1');
  const limit  = Math.min(parseInt(req.query.limit || '20'), 100);
  const status = req.query.status || null;

  const result = await getReturnRequests({ page, limit, status });
  return sendPaginated(res, result.returns, result.pagination);
});

export const handleRequestReturn = asyncHandler(async (req, res) => {
  const { reason, notes } = req.body;
  if (!reason) throw new ValidationError('reason is required');

  const order = await requestReturn(req.params.orderId, req.user.id, { reason, notes });
  return sendSuccess(res, order, 'Return request created');
});

export const handleConfirmReturn = asyncHandler(async (req, res) => {
  const { refundMethod, notes } = req.body;

  const result = await confirmReturn(req.params.orderId, req.user.id, { refundMethod, notes });

  const message = result.manualRequired
    ? `Return confirmed. Manual ${result.method} refund required — see manual refunds queue.`
    : 'Return confirmed and refund initiated';

  return sendSuccess(res, result, message);
});

export const handleGetManualRefunds = asyncHandler(async (req, res) => {
  const page  = parseInt(req.query.page  || '1');
  const limit = Math.min(parseInt(req.query.limit || '20'), 100);

  const result = await getPendingManualRefunds({ page, limit });
  return sendPaginated(res, result.refunds, result.pagination);
});