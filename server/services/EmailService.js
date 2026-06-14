/**
 * services/EmailService.js
 *
 * Transactional email via SMTP (nodemailer).
 *
 * Configuration (all optional — service degrades to a logged no-op when
 * SMTP_HOST is unset, so dev environments work without a mail account):
 *   SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASS
 *   EMAIL_FROM       e.g. "Wiibi Energy <no-reply@wiibienergy.com>"
 *   FRONTEND_URL     used for the "View your order" button
 *   BACKEND_URL      used to absolutize relative product image URLs
 *
 * Templates are full order summaries (line items with product images,
 * totals, shipping address, tracking box, CTA button) — built with table
 * layout + inline styles for email-client compatibility.
 *
 * All send functions are FIRE-AND-FORGET SAFE: they never throw. Callers in
 * OrderService invoke them after the DB transaction commits — a mail outage
 * must never fail or roll back an order update.
 */

import nodemailer from 'nodemailer';
import db from '../models/index.js';
import logger from '../utils/logger.js';

const APP_NAME = process.env.APP_NAME || 'Wiibi Energy';
const BRAND = {
  amber:  '#FFAA14',
  ink:    '#1A1102',
  text:   '#3F3A30',
  muted:  '#8A857A',
  border: '#ECEAE4',
  bg:     '#F5F5F3',
  panel:  '#FAFAF8',
  green:  '#2F7D44',
};

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
/*  Recipient + data resolution                                                */
/* ─────────────────────────────────────────────────────────────────────────── */

/**
 * OrderService convention: every order stores a reachable address in
 * guestEmail regardless of auth state. User/shipping name is looked up
 * purely for a personalised greeting.
 * Returns { email, firstName } or null when the order has no reachable address.
 */
const resolveRecipient = async (order) => {
  let email     = order.guestEmail ?? null;
  let firstName = order.shippingAddress?.fullName?.split(' ')[0] ?? null;

  if (order.userId) {
    const user = await db.User.findByPk(order.userId, {
      attributes: ['email', 'firstName'],
    });
    email     = email     ?? user?.email     ?? null;
    firstName = firstName ?? user?.firstName ?? null;
  }

  return email ? { email, firstName } : null;
};

/** Line items with product image — never throws, an email without the items
 *  table is better than no email. */
const fetchOrderItems = async (orderId) => {
  try {
    return await db.OrderItem.findAll({
      where:   { orderId },
      include: [{
        model:      db.Product,
        as:         'product',
        attributes: ['featured_image_url', 'slug'],
        required:   false,
      }],
    });
  } catch {
    return [];
  }
};

/* ─────────────────────────────────────────────────────────────────────────── */
/*  Formatting helpers                                                         */
/* ─────────────────────────────────────────────────────────────────────────── */

const fmtNaira = (n) =>
  `₦${parseFloat(n || 0).toLocaleString('en-NG', { minimumFractionDigits: 2 })}`;

const fmtLongDate = (d) =>
  new Date(d).toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' });

const escapeHtml = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/** Absolutize a product image URL so it loads inside email clients. */
const absUrl = (u) => {
  if (!u) return null;
  if (/^https?:\/\//i.test(u)) return u;
  const base = (process.env.BACKEND_URL || process.env.APP_URL || '').replace(/\/$/, '');
  return base ? `${base}${u.startsWith('/') ? '' : '/'}${u}` : null;
};

const orderUrl = (order) => {
  const base = (process.env.FRONTEND_URL || '').replace(/\/$/, '');
  return base ? `${base}/orders/${order.id}` : null;
};

/* ─────────────────────────────────────────────────────────────────────────── */
/*  Status copy                                                                */
/* ─────────────────────────────────────────────────────────────────────────── */

// Customer-facing copy per fulfillment status. Statuses not listed here
// (e.g. 'expired') are internal and never emailed.
const STATUS_COPY = {
  processing: {
    subject: (o) => `Order ${o.orderNumber} confirmed — we're on it`,
    heading: 'Your order is being processed',
    body:    'We’ve received your order and our team is preparing it for dispatch. We’ll let you know the moment it ships.',
  },
  shipped: {
    subject: (o) => `Your order ${o.orderNumber} has shipped 📦`,
    heading: 'Your order is on its way',
    body:    'Great news — your order has left our warehouse and is en route to you. Tracking details are below.',
  },
  in_transit: {
    subject: (o) => `Order ${o.orderNumber} is in transit`,
    heading: 'Your order is in transit',
    body:    'Your package is moving through the delivery network and getting closer to you.',
  },
  delivered: {
    subject: (o) => `Order ${o.orderNumber} delivered ✅`,
    heading: 'Your order has been delivered',
    body:    'Your order has been delivered. We hope everything arrived in perfect condition — enjoy your new solar equipment!',
  },
  cancelled: {
    subject: (o) => `Order ${o.orderNumber} has been cancelled`,
    heading: 'Your order has been cancelled',
    body:    'Your order has been cancelled. If you were charged, a refund will be processed shortly. If this wasn’t expected, please contact our support team.',
  },
  return_requested: {
    subject: (o) => `Return started for order ${o.orderNumber}`,
    heading: 'Return request received',
    body:    'We’ve registered your return request and our team will be in touch with the next steps shortly.',
  },
  returned: {
    subject: (o) => `Return completed for order ${o.orderNumber}`,
    heading: 'Your return is complete',
    body:    'We’ve received your returned items. Any applicable refund is being processed and will reflect in your account soon.',
  },
};

/* ─────────────────────────────────────────────────────────────────────────── */
/*  Template blocks (table layout + inline styles for email clients)           */
/* ─────────────────────────────────────────────────────────────────────────── */

const itemsTable = (items) => {
  if (!items?.length) return '';
  const rows = items.map((it) => {
    const img = absUrl(it.product?.featured_image_url);
    const thumb = img
      ? `<img src="${img}" width="56" height="56" alt="" style="display:block;width:56px;height:56px;object-fit:cover;border-radius:8px;border:1px solid ${BRAND.border};" />`
      : `<div style="width:56px;height:56px;border-radius:8px;background:${BRAND.bg};border:1px solid ${BRAND.border};text-align:center;line-height:56px;font-size:20px;">☀️</div>`;
    return `
      <tr>
        <td style="padding:12px 0;border-bottom:1px solid ${BRAND.border};width:68px;vertical-align:top;">${thumb}</td>
        <td style="padding:12px 12px;border-bottom:1px solid ${BRAND.border};vertical-align:top;">
          <div style="font-size:14px;font-weight:700;color:${BRAND.ink};line-height:1.4;">${escapeHtml(it.productName)}</div>
          <div style="font-size:12px;color:${BRAND.muted};margin-top:2px;">Qty ${it.quantity} × ${fmtNaira(it.unitPrice)}</div>
        </td>
        <td style="padding:12px 0;border-bottom:1px solid ${BRAND.border};text-align:right;vertical-align:top;white-space:nowrap;">
          <span style="font-size:14px;font-weight:700;color:${BRAND.ink};">${fmtNaira(it.totalPrice)}</span>
        </td>
      </tr>`;
  }).join('');

  return `
    <p style="margin:28px 0 6px;font-size:11px;font-weight:700;color:${BRAND.muted};text-transform:uppercase;letter-spacing:0.08em;">Order summary</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rows}</table>`;
};

const totalsBlock = (order, items) => {
  const delivery = parseFloat(order.deliveryFee || 0);
  const total    = parseFloat(order.totalAmount || 0);
  const subtotal = items?.length
    ? items.reduce((s, it) => s + parseFloat(it.totalPrice || 0), 0)
    : total - delivery;

  const row = (label, value, bold = false) => `
    <tr>
      <td style="padding:5px 0;font-size:13px;color:${bold ? BRAND.ink : BRAND.muted};${bold ? 'font-weight:800;font-size:15px;' : ''}">${label}</td>
      <td style="padding:5px 0;font-size:13px;color:${BRAND.ink};text-align:right;${bold ? 'font-weight:800;font-size:15px;' : 'font-weight:600;'}">${value}</td>
    </tr>`;

  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:10px;">
      ${row('Subtotal', fmtNaira(subtotal))}
      ${row('Delivery', delivery > 0 ? fmtNaira(delivery) : 'Free')}
      <tr><td colspan="2" style="padding:6px 0;"><div style="border-top:1px solid ${BRAND.border};"></div></td></tr>
      ${row('Total', fmtNaira(order.totalAmount), true)}
    </table>`;
};

const trackingBlock = (order, extras = {}) => {
  const tracking = extras.trackingNumber   ?? order.trackingNumber;
  const carrier  = extras.carrier          ?? order.carrier;
  const expected = extras.expectedDelivery ?? order.expectedDelivery;
  if (!tracking && !carrier && !expected) return '';

  const line = (label, value) => value ? `
    <tr>
      <td style="padding:4px 0;font-size:13px;color:${BRAND.muted};width:150px;">${label}</td>
      <td style="padding:4px 0;font-size:13px;color:${BRAND.ink};font-weight:700;">${escapeHtml(value)}</td>
    </tr>` : '';

  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
           style="margin-top:24px;background:${BRAND.panel};border:1px solid ${BRAND.border};border-radius:12px;">
      <tr><td style="padding:16px 20px;">
        <p style="margin:0 0 8px;font-size:11px;font-weight:700;color:${BRAND.muted};text-transform:uppercase;letter-spacing:0.08em;">Delivery details</p>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          ${line('Tracking number', tracking)}
          ${line('Carrier', carrier)}
          ${line('Expected delivery', expected ? fmtLongDate(expected) : null)}
        </table>
      </td></tr>
    </table>`;
};

const addressBlock = (addr) => {
  if (!addr) return '';
  const lines = [
    addr.fullName,
    [addr.addressLine1, addr.addressLine2].filter(Boolean).join(', '),
    [addr.city, addr.state].filter(Boolean).join(', '),
    addr.country,
    addr.phone,
  ].filter(Boolean).map(escapeHtml);
  if (!lines.length) return '';

  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:16px;">
      <tr><td>
        <p style="margin:0 0 6px;font-size:11px;font-weight:700;color:${BRAND.muted};text-transform:uppercase;letter-spacing:0.08em;">Shipping to</p>
        <p style="margin:0;font-size:13px;color:${BRAND.text};line-height:1.7;">${lines.join('<br/>')}</p>
      </td></tr>
    </table>`;
};

const ctaButton = (order, label = 'View your order') => {
  const url = orderUrl(order);
  if (!url) return '';
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:28px auto 4px;">
      <tr><td style="border-radius:10px;background:${BRAND.amber};">
        <a href="${url}" target="_blank"
           style="display:inline-block;padding:13px 36px;font-size:14px;font-weight:800;color:${BRAND.ink};text-decoration:none;border-radius:10px;font-family:'Segoe UI',Arial,sans-serif;">
          ${label}
        </a>
      </td></tr>
    </table>`;
};

const noteBlock = (note) => note ? `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:20px;">
    <tr><td style="background:#FFF8EC;border:1px solid #F2D9A4;border-radius:12px;padding:14px 18px;">
      <p style="margin:0;font-size:13px;color:#7A5A12;line-height:1.6;"><strong>Update from our team:</strong> ${escapeHtml(note)}</p>
    </td></tr>
  </table>` : '';

const layout = ({ preheader, heading, greeting, intro, contentHtml, order }) => `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  </head>
  <body style="margin:0;padding:0;background:${BRAND.bg};font-family:'Segoe UI',Arial,Helvetica,sans-serif;-webkit-font-smoothing:antialiased;">
    <!-- preheader: shows next to the subject in inbox list, hidden in body -->
    <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${escapeHtml(preheader)}</div>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.bg};padding:36px 16px;">
      <tr><td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

          <!-- Header -->
          <tr><td style="background:${BRAND.ink};border-radius:16px 16px 0 0;padding:22px 36px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
              <td>
                <span style="font-size:19px;font-weight:800;color:#ffffff;letter-spacing:-0.02em;">Wiibi</span><span style="font-size:19px;font-weight:800;color:${BRAND.amber};letter-spacing:-0.02em;"> Energy</span>
              </td>
              <td style="text-align:right;">
                <span style="font-size:11px;color:#B8B2A6;letter-spacing:0.06em;text-transform:uppercase;">Order ${escapeHtml(order.orderNumber)}</span>
              </td>
            </tr></table>
          </td></tr>

          <!-- Body -->
          <tr><td style="background:#ffffff;border:1px solid ${BRAND.border};border-top:none;padding:36px;">
            <h1 style="margin:0 0 10px;font-size:22px;line-height:1.3;color:${BRAND.ink};letter-spacing:-0.02em;">${heading}</h1>
            <p style="margin:0 0 6px;font-size:14px;color:${BRAND.text};">${escapeHtml(greeting)}</p>
            <p style="margin:0;font-size:14px;color:${BRAND.text};line-height:1.7;">${intro}</p>
            ${contentHtml}
            <p style="margin:28px 0 0;font-size:13px;color:${BRAND.muted};line-height:1.7;">
              Need help with this order? Just reply to this email and our team will get back to you.
            </p>
          </td></tr>

          <!-- Footer -->
          <tr><td style="background:${BRAND.panel};border:1px solid ${BRAND.border};border-top:none;border-radius:0 0 16px 16px;padding:22px 36px;">
            <p style="margin:0 0 4px;font-size:12px;font-weight:700;color:${BRAND.text};">${APP_NAME}</p>
            <p style="margin:0 0 10px;font-size:12px;color:${BRAND.muted};line-height:1.6;">
              Solar systems, inverters, batteries &amp; professional installation.
            </p>
            <p style="margin:0;font-size:11px;color:${BRAND.muted};line-height:1.6;">
              You’re receiving this email because an order was placed with this address at ${APP_NAME}.
              This is a transactional message about your order — it’s not marketing.
              <br/>© ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.
            </p>
          </td></tr>

        </table>
      </td></tr>
    </table>
  </body>
</html>`;

/* ─────────────────────────────────────────────────────────────────────────── */
/*  Send primitive                                                             */
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

    const items    = await fetchOrderItems(order.id);
    const greeting = recipient.firstName ? `Hi ${recipient.firstName},` : 'Hello,';

    const contentHtml = `
      ${noteBlock(extras.note)}
      ${trackingBlock(order, extras)}
      ${itemsTable(items)}
      ${totalsBlock(order, items)}
      ${addressBlock(order.shippingAddress)}
      ${ctaButton(order, order.status === 'delivered' ? 'View your order' : 'Track your order')}
    `;

    return await send({
      to:      recipient.email,
      subject: copy.subject(order),
      html: layout({
        preheader: copy.body,
        heading:   copy.heading,
        greeting,
        intro:     copy.body,
        contentHtml,
        order,
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

    const items    = await fetchOrderItems(order.id);
    const greeting = recipient.firstName ? `Hi ${recipient.firstName},` : 'Hello,';

    const receiptBlock = `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
             style="margin-top:24px;background:#F1F7F2;border:1px solid #CDE3D2;border-radius:12px;">
        <tr><td style="padding:16px 20px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
            <td>
              <p style="margin:0;font-size:11px;font-weight:700;color:${BRAND.green};text-transform:uppercase;letter-spacing:0.08em;">Payment received</p>
              <p style="margin:4px 0 0;font-size:20px;font-weight:800;color:${BRAND.ink};">${fmtNaira(amountNgn ?? order.totalAmount)}</p>
            </td>
            <td style="text-align:right;vertical-align:bottom;">
              ${reference ? `<p style="margin:0;font-size:11px;color:${BRAND.muted};">Ref: ${escapeHtml(reference)}</p>` : ''}
            </td>
          </tr></table>
        </td></tr>
      </table>`;

    const contentHtml = `
      ${receiptBlock}
      ${itemsTable(items)}
      ${totalsBlock(order, items)}
      ${addressBlock(order.shippingAddress)}
      ${order.expectedDelivery ? trackingBlock(order) : ''}
      ${ctaButton(order, 'Track your order')}
    `;

    return await send({
      to:      recipient.email,
      subject: `Payment received — order ${order.orderNumber} confirmed 🧾`,
      html: layout({
        preheader: 'Thanks for your purchase! Your payment is confirmed and your order is being processed.',
        heading:   'Payment confirmed — thank you!',
        greeting,
        intro:     'We’ve received your payment and your order is now being processed. You’ll get another email with tracking details as soon as it ships.',
        contentHtml,
        order,
      }),
    });
  } catch (err) {
    logger.error(`[EmailService] sendPaymentConfirmationEmail failed for order ${order?.id}: ${err.message}`);
    return false;
  }
};

/* ─────────────────────────────────────────────────────────────────────────── */
/*  Support ticket reply notification                                          */
/* ─────────────────────────────────────────────────────────────────────────── */

/** Minimal branded layout for non-order emails (support). */
const supportLayout = ({ preheader, heading, greeting, bodyHtml }) => `<!doctype html>
<html>
  <head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /></head>
  <body style="margin:0;padding:0;background:${BRAND.bg};font-family:'Segoe UI',Arial,Helvetica,sans-serif;">
    <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${escapeHtml(preheader)}</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.bg};padding:36px 16px;">
      <tr><td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
          <tr><td style="background:${BRAND.ink};border-radius:16px 16px 0 0;padding:22px 36px;">
            <span style="font-size:19px;font-weight:800;color:#ffffff;letter-spacing:-0.02em;">Wiibi</span><span style="font-size:19px;font-weight:800;color:${BRAND.amber};letter-spacing:-0.02em;"> Energy</span>
            <span style="float:right;font-size:11px;color:#B8B2A6;letter-spacing:0.06em;text-transform:uppercase;">Support</span>
          </td></tr>
          <tr><td style="background:#ffffff;border:1px solid ${BRAND.border};border-top:none;padding:36px;">
            <h1 style="margin:0 0 10px;font-size:21px;line-height:1.3;color:${BRAND.ink};letter-spacing:-0.02em;">${heading}</h1>
            <p style="margin:0 0 6px;font-size:14px;color:${BRAND.text};">${escapeHtml(greeting)}</p>
            ${bodyHtml}
          </td></tr>
          <tr><td style="background:${BRAND.panel};border:1px solid ${BRAND.border};border-top:none;border-radius:0 0 16px 16px;padding:22px 36px;">
            <p style="margin:0;font-size:11px;color:${BRAND.muted};line-height:1.6;">
              This is a notification about your support conversation with ${APP_NAME}.
              <br/>© ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.
            </p>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;

const quoteBlock = (body) => `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;">
    <tr><td style="background:${BRAND.panel};border:1px solid ${BRAND.border};border-left:3px solid ${BRAND.amber};border-radius:10px;padding:14px 18px;">
      <p style="margin:0;font-size:14px;color:${BRAND.text};line-height:1.7;white-space:pre-wrap;">${escapeHtml(body)}</p>
    </td></tr>
  </table>`;

const supportCta = (href, label) => href ? `
  <table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0 4px;">
    <tr><td style="border-radius:10px;background:${BRAND.amber};">
      <a href="${href}" target="_blank" style="display:inline-block;padding:13px 32px;font-size:14px;font-weight:800;color:${BRAND.ink};text-decoration:none;border-radius:10px;font-family:'Segoe UI',Arial,sans-serif;">${label}</a>
    </td></tr>
  </table>` : '';

/**
 * Notify the other party when a non-internal message is added to a ticket.
 * Called by SupportService.addMessage AFTER commit (fire-and-forget).
 *
 *  - admin reply    → emails the customer (with a link to their ticket thread)
 *  - customer reply → emails the assigned admin, or SUPPORT_EMAIL as fallback
 */
export const sendSupportReplyEmail = async ({ ticketId, senderType, body }) => {
  try {
    const ticket = await db.SupportTicket.findByPk(ticketId, {
      attributes: ['ticketNumber', 'subject', 'requesterName', 'requesterEmail'],
      include: [{ model: db.User, as: 'assignee', attributes: ['email', 'firstName'], required: false }],
    });
    if (!ticket) return false;

    if (senderType === 'admin') {
      // → customer
      const to = ticket.requesterEmail;
      if (!to) return false;
      const firstName = ticket.requesterName?.split(' ')[0];
      const link = (process.env.FRONTEND_URL || '').replace(/\/$/, '');
      const href = link ? `${link}/support/tickets/${ticket.ticketNumber}` : null;

      return await send({
        to,
        subject: `Re: ${ticket.subject} [${ticket.ticketNumber}]`,
        html: supportLayout({
          preheader: 'Our support team has replied to your request.',
          heading:   'You have a new reply from our team',
          greeting:  firstName ? `Hi ${firstName},` : 'Hello,',
          bodyHtml: `
            <p style="margin:0;font-size:14px;color:${BRAND.text};line-height:1.7;">
              Our support team has responded to your ticket
              <strong>${escapeHtml(ticket.ticketNumber)}</strong>:
            </p>
            ${quoteBlock(body)}
            ${supportCta(href, 'View & reply')}
            <p style="margin:18px 0 0;font-size:13px;color:${BRAND.muted};line-height:1.7;">
              You can also reply directly to this email and it will reach our team.
            </p>`,
        }),
      });
    }

    // senderType === 'customer'  → assigned admin / support inbox
    const to = ticket.assignee?.email || process.env.SUPPORT_EMAIL || null;
    if (!to) return false;

    return await send({
      to,
      subject: `Customer reply: ${ticket.subject} [${ticket.ticketNumber}]`,
      html: supportLayout({
        preheader: 'A customer has replied to a support ticket.',
        heading:   'New customer reply',
        greeting:  ticket.assignee?.firstName ? `Hi ${ticket.assignee.firstName},` : 'Hello,',
        bodyHtml: `
          <p style="margin:0;font-size:14px;color:${BRAND.text};line-height:1.7;">
            <strong>${escapeHtml(ticket.requesterName || ticket.requesterEmail)}</strong>
            replied to ticket <strong>${escapeHtml(ticket.ticketNumber)}</strong>:
          </p>
          ${quoteBlock(body)}
          <p style="margin:18px 0 0;font-size:13px;color:${BRAND.muted};line-height:1.7;">
            Open the Support Desk in the admin dashboard to respond.
          </p>`,
      }),
    });
  } catch (err) {
    logger.error(`[EmailService] sendSupportReplyEmail failed for ticket ${ticketId}: ${err.message}`);
    return false;
  }
};
