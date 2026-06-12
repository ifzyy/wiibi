/**
 * scripts/test-order-emails.mjs
 *
 * Walks a throwaway order through the full lifecycle using the REAL service
 * code (OrderService → EmailService), so the recipient receives every email a
 * customer would: payment confirmation, shipped, in transit, delivered.
 *
 * Usage:  node scripts/test-order-emails.mjs [recipient@email.com]
 *
 * Needs MySQL running and SMTP_* configured in .env. The order it creates is
 * visible in the admin Orders page (notes: "Test order — email walkthrough").
 */

import 'dotenv/config';
import db from '../models/index.js';
import { handlePaymentSuccess, updateOrderStatus } from '../services/OrderService.js';

const recipient = process.argv[2] || 'johnsonnifemi8@gmail.com';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const ref   = `TEST-${Date.now()}`;
const total = 250000;

const order = await db.Order.create({
  guestEmail:       recipient,
  orderNumber:      `WB-TEST-${Date.now().toString().slice(-8)}`,
  status:           'pending',
  paymentStatus:    'unpaid',
  totalAmount:      total,
  deliveryFee:      5000,
  currency:         'NGN',
  paymentReference: ref,
  notes:            'Test order — email walkthrough',
});
console.log(`Order ${order.orderNumber} created for ${recipient}`);

// pending → paid/processing  (sends: payment confirmation)
await handlePaymentSuccess(ref, { amount: total * 100, currency: 'NGN' });
console.log('✓ paid          → "Payment received" email');

// processing → shipped       (sends: shipped, with tracking details)
await updateOrderStatus(order.id, {
  fulfillmentStatus: 'shipped',
  trackingNumber:    'TRK-2026-0001',
  carrier:           'GIG Logistics',
  note:              'Left our Lagos warehouse',
  actorId:           null,
});
console.log('✓ shipped       → "Order has shipped" email');

// shipped → in_transit       (sends: in transit, with admin note)
await updateOrderStatus(order.id, {
  fulfillmentStatus: 'in_transit',
  note:              'Package arrived at Ibadan distribution hub',
  actorId:           null,
});
console.log('✓ in transit    → "Order is in transit" email');

// in_transit → delivered     (sends: delivered)
await updateOrderStatus(order.id, { fulfillmentStatus: 'delivered', actorId: null });
console.log('✓ delivered     → "Order delivered" email');

// Email sends are fire-and-forget — give the SMTP connections time to flush.
console.log('Waiting 12s for emails to flush…');
await sleep(12000);

await db.sequelize.close();
console.log(`Done — check ${recipient} (4 emails, possibly in spam/promotions).`);
