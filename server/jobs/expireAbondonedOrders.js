/**
 * jobs/expireAbandonedOrders.js
 *
 * Cleans up orders that were created but never paid.
 *
 * Why this exists:
 *   createOrderFromCart() decrements stock immediately to reserve inventory.
 *   If a user abandons checkout and never pays, that stock is locked forever.
 *   This job finds those orphaned orders, restores the stock, and marks them
 *   expired so the inventory is available to other customers.
 *
 * What it does:
 *   1. Finds all orders where:
 *      - status        = 'pending'
 *      - paymentStatus = 'unpaid' OR 'failed'
 *      - createdAt     < now - EXPIRY_MINUTES
 *   2. For each order: restores stock + marks order expired in ONE transaction
 *   3. Logs what happened — nothing silent
 *
 * What it does NOT do:
 *   - Touch orders that are paid, processing, shipped, delivered, or cancelled
 *   - Touch orders that are pending but within the grace window
 *   - Send emails (add that later if needed)
 *
 * Usage:
 *   import { runExpireJob } from './jobs/expireAbandonedOrders.js';
 *
 *   // Run every hour via node-cron:
 *   import cron from 'node-cron';
 *   cron.schedule('0 * * * *', runExpireJob);
 *
 *   // Or call manually in tests / admin panel:
 *   await runExpireJob();
 *
 * ENV:
 *   ORDER_EXPIRY_MINUTES=60   how long a pending/unpaid order lives (default 60 min)
 */

import { Op } from 'sequelize';
import db      from '../models/index.js';

const EXPIRY_MINUTES = parseInt(process.env.ORDER_EXPIRY_MINUTES ?? '60');

export const runExpireJob = async () => {
  const cutoff = new Date(Date.now() - EXPIRY_MINUTES * 60 * 1000);

  // Find all candidate orders with their items in one query
  const expiredOrders = await db.Order.findAll({
    where: {
      status:        'pending',
      paymentStatus: { [Op.in]: ['unpaid', 'failed'] },
      createdAt:     { [Op.lt]: cutoff },
    },
    include: [{ model: db.OrderItem, as: 'items' }],
  });

  if (expiredOrders.length === 0) {
    console.log(`[ExpireJob] No abandoned orders found (cutoff: ${cutoff.toISOString()})`);
    return { expired: 0 };
  }

  console.log(`[ExpireJob] Found ${expiredOrders.length} abandoned order(s) to expire`);

  let successCount = 0;
  let errorCount   = 0;

  // Process each order in its own transaction.
  // One failure does NOT block the others — we want to restore as much stock
  // as possible even if one order has a corrupted item row.
  for (const order of expiredOrders) {
    const transaction = await db.sequelize.transaction();

    try {
      // Restore stock for every item on this order
      if (order.items?.length) {
        await Promise.all(
          order.items.map(item =>
            db.Product.increment('stock', {
              by:    item.quantity,
              where: { id: item.productId },
              transaction,
            })
          )
        );
      }

      // Mark the order expired
      await order.update({ status: 'expired' }, { transaction });

      // Audit trail
      await db.OrderTracking.create({
        orderId:   order.id,
        status:    'expired',
        note:      `Order expired after ${EXPIRY_MINUTES} minutes without payment. Stock restored.`,
        updatedBy: null,
      }, { transaction });

      await transaction.commit();

      console.log(`[ExpireJob] Expired order ${order.orderNumber} — restored ${order.items?.length ?? 0} item(s)`);
      successCount++;

    } catch (err) {
      await transaction.rollback();
      console.error(`[ExpireJob] Failed to expire order ${order.orderNumber}:`, err.message);
      errorCount++;
    }
  }

  console.log(`[ExpireJob] Done — expired: ${successCount}, errors: ${errorCount}`);
  return { expired: successCount, errors: errorCount };
};