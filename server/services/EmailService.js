/**
 * services/EmailService.js
 *
 * Transactional email via SMTP (nodemailer).
 *
 * Configuration (all optional — service degrades to a logged no-op when
 * SMTP_HOST is unset, so dev environments work without a mail account):
 *   SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASS
 *   EMAIL_FROM       e.g. "Wiibi Energy <no-reply@wiibienergy.com>"
 *
 * All send functions are FIRE-AND-FORGET SAFE: they never throw. Callers in
 * OrderService invoke them after the DB transaction commits — a mail outage
 * must never fail or roll back an order update.
 */

import nodemailer from 'nodemailer';
import db from '../models/index.js';
import logger from '../utils/logger.js';

const APP_NAME = process.env.APP_NAME || 'Wiibi Energy';
const BRAND    = { amber: '#FFAA14', ink: '#1A1102', muted: '#6b7280', border: '#E8E8E0', bg: '#F5F5F3' };

let _transporter = null;
let _warned      = false;

const getTransporter = () => {
  if (!process.env.SMTP_HOST) {
    if (!_warned) {
      logger.warn('[EmailService] SMTP_HOST not set — order emails are disabled (logged only)');
      _warned = true;
    }
    return null;
  }
  if (!_transporter) {
    _transporter = nodemailer.createTransport({
      host:   process.env.SMTP_HOST,
      port:   parseInt(process.env.SMTP_PORT ?? '587', 10),
      secure: process.env.SMTP_SECURE === 'true',
      auth: process.env.SMTP_USER
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        : undefined,
    });
  }
  return _transporter;
};

/* ─────────────────────────────────────────────────────────────────────────── */
/*  Recipient resolution                                                       */
/* ─────────────────────────────────────────────────────────────────────────── */

/**
 * OrderService convention: every order stores a reachable address in
 * guestEmail regardless of auth state (resolved from the User record at
 * checkout for logged-in users). We still look the user up when present,
 * purely for a personalised greeting.
 * Returns { email, firstName } or null when the order has no reachable address.
 */
const resolveRecipient = async (order) => {
  let email     = order.guestEmail ?? null;
  let firstName = null;

  if (order.userId) {
    const user = await db.User.findByPk(order.userId, {
      attributes: ['email', 'firstName'],
    });
    email     = email ?? user?.email ?? null;
    firstName = user?.firstName ?? null;
  }

  return email ? { email, firstName } : null;
};

/* ─────────────────────────────────────────────────────────────────────────── */
/*  Templates                                                                  */
/* ─────────────────────────────────────────────────────────────────────────── */

const fmtNaira = (n) =>
  `₦${parseFloat(n || 0).toLocaleString('en-NG', { minimumFractionDigits: 2 })}`;

// Customer-facing copy per fulfillment status. Statuses not listed here
// (e.g. 'expired') are internal and never emailed.
const STATUS_COPY = {
  processing: {
    subject: (o) => `Order ${o.orderNumber} confirmed — we're on it`,
    heading: 'Your order is being processed',
    body:    'We’ve received your order and our team is preparing it for dispatch.',
  },
  shipped: {
    subject: (o) => `Order ${o.orderNumber} has shipped`,
    heading: 'Your order is on its way',
    body:    'Your order has left our warehouse and is en route to you.',
  },
  in_transit: {
    subject: (o) => `Order ${o.orderNumber} is in transit`,
    heading: 'Your order is in transit',
    body:    'Your package is moving through the delivery network.',
  },
  delivered: {
    subject: (o) => `Order ${o.orderNumber} delivered`,
    heading: 'Your order has been delivered',
    body:    'Your order has been delivered. We hope everything arrived in perfect condition!',
  },
  cancelled: {
    subject: (o) => `Order ${o.orderNumber} cancelled`,
    heading: 'Your order has been cancelled',
    body:    'Your order has been cancelled. If you were charged, a refund will follow shortly.',
  },
  return_requested: {
    subject: (o) => `Return started for order ${o.orderNumber}`,
    heading: 'Return request received',
    body:    'We’ve registered your return request and will be in touch with the next steps.',
  },
  returned: {
    subject: (o) => `Return completed for order ${o.orderNumber}`,
    heading: 'Your return is complete',
    body:    'We’ve received your returned items. Any applicable refund is being processed.',
  },
};

const layout = ({ heading, greeting, bodyHtml }) => `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:${BRAND.bg};font-family:'Segoe UI',Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.bg};padding:32px 16px;">
      <tr><td align="center">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#ffffff;border:1px solid ${BRAND.border};border-radius:14px;overflow:hidden;">
          <tr>
            <td style="background:${BRAND.ink};padding:20px 32px;">
              <span style="color:${BRAND.amber};font-size:18px;font-weight:800;letter-spacing:-0.02em;">${APP_NAME}</span>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              <h1 style="margin:0 0 8px;font-size:20px;color:${BRAND.ink};letter-spacing:-0.02em;">${heading}</h1>
              <p style="margin:0 0 20px;font-size:14px;color:${BRAND.muted};">${greeting}</p>
              ${bodyHtml}
            </td>
          </tr>
          <tr>
            <td style="padding:18px 32px;border-top:1px solid ${BRAND.border};">
              <p style="margin:0;font-size:12px;color:${BRAND.muted};">
                This is an automated message from ${APP_NAME}. Questions? Just reply to this email or contact our support team.
              </p>
            </td>
          </tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;

const detailRow = (label, value) => `
  <tr>
    <td style="padding:8px 0;font-size:13px;color:${BRAND.muted};width:160px;">${label}</td>
    <td style="padding:8px 0;font-size:13px;color:${BRAND.ink};font-weight:600;">${value}</td>
  </tr>`;

const detailsTable = (rows) => `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
         style="background:${BRAND.bg};border-radius:10px;padding:8px 16px;margin:0 0 20px;">
    <tr><td style="padding:8px 16px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rows.join('')}</table>
    </td></tr>
  </table>`;

/* ─────────────────────────────────────────────────────────────────────────── */
/*  Send primitives                                                            */
/* ─────────────────────────────────────────────────────────────────────────── */

const send = async ({ to, subject, html }) => {
  const transporter = getTransporter();
  if (!transporter) {
    logger.info(`[EmailService] (disabled) would send "${subject}" to ${to}`);
    return false;
  }
  await transporter.sendMail({
    from: process.env.EMAIL_FROM || `${APP_NAME} <no-reply@wiibienergy.com>`,
    to,
    subject,
    html,
  });
  logger.info(`[EmailService] sent "${subject}" to ${to}`);
  return true;
};

/* ─────────────────────────────────────────────────────────────────────────── */
/*  Public API — all fire-and-forget safe (never throw)                        */
/* ─────────────────────────────────────────────────────────────────────────── */

/**
 * Notify the customer that their order moved to a new fulfillment status.
 * Called by OrderService.updateOrderStatus AFTER the transaction commits.
 *
 * @param {Order}  order     — updated order (plain or model instance)
 * @param {object} extras    — { note, trackingNumber, carrier, expectedDelivery }
 */
export const sendOrderStatusEmail = async (order, extras = {}) => {
  try {
    const copy = STATUS_COPY[order.status];
    if (!copy) return false;                      // internal status — no email

    const recipient = await resolveRecipient(order);
    if (!recipient) return false;                 // no reachable address

    const greeting = recipient.firstName ? `Hi ${recipient.firstName},` : 'Hello,';

    const rows = [
      detailRow('Order number', order.orderNumber),
      detailRow('Status', order.status.replace(/_/g, ' ')),
      detailRow('Order total', fmtNaira(order.totalAmount)),
    ];
    const tracking = extras.trackingNumber ?? order.trackingNumber;
    const carrier  = extras.carrier        ?? order.carrier;
    const expected = extras.expectedDelivery ?? order.expectedDelivery;
    if (tracking) rows.push(detailRow('Tracking number', tracking));
    if (carrier)  rows.push(detailRow('Carrier', carrier));
    if (expected) rows.push(detailRow('Expected delivery',
      new Date(expected).toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' })));

    const noteHtml = extras.note
      ? `<p style="margin:0 0 20px;font-size:14px;color:${BRAND.ink};background:#FFF8EC;border:1px solid #F5C96A;border-radius:10px;padding:12px 16px;">${extras.note}</p>`
      : '';

    return await send({
      to:      recipient.email,
      subject: copy.subject(order),
      html: layout({
        heading:  copy.heading,
        greeting,
        bodyHtml: `
          <p style="margin:0 0 20px;font-size:14px;color:${BRAND.ink};line-height:1.6;">${copy.body}</p>
          ${noteHtml}
          ${detailsTable(rows)}`,
      }),
    });
  } catch (err) {
    logger.error(`[EmailService] sendOrderStatusEmail failed for order ${order?.id}: ${err.message}`);
    return false;
  }
};

/**
 * Payment receipt — sent once when an order is confirmed paid.
 * Called by OrderService.handlePaymentSuccess AFTER the transaction commits
 * (and only when alreadyPaid is false, so duplicate webhooks don't re-send).
 */
export const sendPaymentConfirmationEmail = async (order, { amountNgn, reference } = {}) => {
  try {
    const recipient = await resolveRecipient(order);
    if (!recipient) return false;

    const greeting = recipient.firstName ? `Hi ${recipient.firstName},` : 'Hello,';
    const rows = [
      detailRow('Order number', order.orderNumber),
      detailRow('Amount paid', fmtNaira(amountNgn ?? order.totalAmount)),
    ];
    if (reference) rows.push(detailRow('Payment reference', reference));

    return await send({
      to:      recipient.email,
      subject: `Payment received for order ${order.orderNumber}`,
      html: layout({
        heading:  'Payment confirmed — thank you!',
        greeting,
        bodyHtml: `
          <p style="margin:0 0 20px;font-size:14px;color:${BRAND.ink};line-height:1.6;">
            We’ve received your payment and your order is now being processed.
            You’ll get another email as soon as it ships.
          </p>
          ${detailsTable(rows)}`,
      }),
    });
  } catch (err) {
    logger.error(`[EmailService] sendPaymentConfirmationEmail failed for order ${order?.id}: ${err.message}`);
    return false;
  }
};
