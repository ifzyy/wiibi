/**
 * services/CustomerService.js
 *
 * CRM layer. Read-heavy. No writes except admin notes.
 *
 * Design decisions:
 *  - getCustomerList() is paginated and filterable. Never returns all rows.
 *  - getCustomerProfile() runs its sub-queries in parallel (Promise.all).
 *    A single customer profile page triggers ~4 DB queries total — all fast
 *    with the existing indexes on orders, form_submissions.
 *  - Purchase history reuses the existing Order model and associations.
 *    No new joins needed.
 *  - Inquiry history reads FormSubmission (existing model) filtered by email.
 *    This covers quote requests and contact form submissions.
 *  - lifetimeValue is computed as SUM of paid orders, not stored. Computed
 *    at profile load time, cached per customer with a 10-min TTL when Redis
 *    is wired.
 */

import { Op, fn, col, literal } from 'sequelize';
import db from '../models/index.js';
import { NotFoundError } from '../utils/AppError.js';

/* ── Shared includes ──────────────────────────────────────────────────────── */

const USER_SAFE_ATTRS = [
  'id', 'email', 'phoneNumber', 'firstName', 'lastName',
  'avatarUrl', 'isVerified', 'isActive', 'role',
  'lastLoginAt', 'shippingAddress', 'createdAt',
];

/* ── getCustomerList ──────────────────────────────────────────────────────── */

/**
 * Paginated list of all customers (role = 'user').
 *
 * Supports:
 *  - Search by name, email, or phone (LIKE — add fulltext index for scale)
 *  - Filter by isActive, isVerified
 *  - Sort by createdAt, lastLoginAt, totalOrders (subquery sort)
 *  - Pagination
 */
export const getCustomerList = async ({
  page       = 1,
  limit      = 20,
  search     = null,
  isActive   = null,
  isVerified = null,
  sortBy     = 'createdAt',
  sortDir    = 'DESC',
} = {}) => {
  // Redis: `customers:list:${page}:${limit}:${search}:${isActive}:${isVerified}` TTL 2min

  const safeLimit = Math.min(limit, 100);
  const offset    = (page - 1) * safeLimit;

  const where = { role: 'user' };

  if (isActive   !== null) where.isActive   = isActive;
  if (isVerified !== null) where.isVerified = isVerified;

  if (search) {
    const like = { [Op.like]: `%${search}%` };
    where[Op.or] = [
      { firstName:   like },
      { lastName:    like },
      { email:       like },
      { phoneNumber: like },
    ];
  }

  const validSorts = ['createdAt', 'lastLoginAt', 'email', 'firstName'];
  const orderField = validSorts.includes(sortBy) ? sortBy : 'createdAt';
  const orderDir   = sortDir.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

  const { rows, count } = await db.User.findAndCountAll({
    where,
    attributes: [
      ...USER_SAFE_ATTRS,
      // Subquery: total order count per customer (no extra JOIN overhead)
      [
        literal(`(SELECT COUNT(*) FROM orders WHERE orders.user_id = User.id)`),
        'orderCount',
      ],
    ],
    order:    [[orderField, orderDir]],
    limit:    safeLimit,
    offset,
    distinct: true,
  });

  return {
    customers:  rows,
    pagination: { page, limit: safeLimit, total: count, pages: Math.ceil(count / safeLimit) },
  };
};

/* ── getCustomerProfile ───────────────────────────────────────────────────── */

/**
 * Full customer profile for the CRM detail page.
 * Runs all sub-queries in parallel — profile load is one HTTP request.
 */
export const getCustomerProfile = async (userId) => {
  // Redis: `customers:profile:${userId}` TTL 10min (invalidate on order/form changes)

  const user = await db.User.findOne({
    where:      { id: userId, role: 'user' },
    attributes: USER_SAFE_ATTRS,
  });

  if (!user) throw new NotFoundError('Customer not found');

  // Run all enrichment queries in parallel
  const [
    lifetimeStats,
    recentOrders,
    oauthAccounts,
    formSubmissions,
    openTickets,
  ] = await Promise.all([
    // Lifetime purchase stats
    db.Order.findOne({
      where:      { userId },
      attributes: [
        [fn('COUNT', col('id')),                        'totalOrders'],
        [fn('SUM',   col('total_amount')),               'totalSpend'],
        [fn('SUM',   literal(`CASE WHEN payment_status = 'paid' THEN total_amount ELSE 0 END`)), 'paidRevenue'],
        [fn('COUNT', literal(`CASE WHEN status = 'cancelled' THEN 1 END`)),  'cancelledOrders'],
        [fn('COUNT', literal(`CASE WHEN payment_status = 'refunded' THEN 1 END`)), 'refundedOrders'],
      ],
      raw: true,
    }),

    // Last 10 orders (purchase history)
    db.Order.findAll({
      where:   { userId },
      include: [{
        model:      db.OrderItem,
        as:         'items',
        attributes: ['productName', 'quantity', 'unitPrice', 'totalPrice'],
      }],
      order:   [['createdAt', 'DESC']],
      limit:   10,
    }),

    // OAuth accounts (Google/Facebook login links)
    db.OAuthAccount
      ? db.OAuthAccount.findAll({
          where:      { userId },
          attributes: ['provider', 'createdAt'],
        })
      : Promise.resolve([]),

    // Inquiry/form submission history (quote requests, contact forms)
    db.FormSubmission.findAll({
      where:   { [Op.or]: [
        { data: { [Op.like]: `%${user.email}%` } },
      ]},
      include: [{ model: db.Form, as: 'form', attributes: ['name'] }],
      order:   [['createdAt', 'DESC']],
      limit:   20,
      attributes: ['id', 'createdAt', 'formId'],
    }).catch(() => []),  // graceful — if FormSubmission doesn't have email in data

    // Open support tickets for this customer
    db.SupportTicket.findAll({
      where:      { userId, status: { [Op.notIn]: ['resolved', 'closed'] } },
      attributes: ['id', 'ticketNumber', 'subject', 'status', 'priority', 'createdAt'],
      order:      [['createdAt', 'DESC']],
      limit:      5,
    }),
  ]);

  return {
    profile:    user,
    stats: {
      totalOrders:     parseInt(lifetimeStats?.totalOrders  || 0, 10),
      totalSpend:      parseFloat(lifetimeStats?.totalSpend || 0),
      lifetimeValue:   parseFloat(lifetimeStats?.paidRevenue || 0),
      cancelledOrders: parseInt(lifetimeStats?.cancelledOrders || 0, 10),
      refundedOrders:  parseInt(lifetimeStats?.refundedOrders  || 0, 10),
    },
    recentOrders,
    oauthAccounts,
    formSubmissions,
    openTickets,
  };
};

/* ── getCustomerOrders ────────────────────────────────────────────────────── */

/**
 * Full paginated order history for a customer.
 * Used when admin clicks "View all orders" on a customer profile.
 */
export const getCustomerOrders = async (userId, {
  page   = 1,
  limit  = 20,
  status = null,
} = {}) => {
  const safeLimit = Math.min(limit, 100);
  const offset    = (page - 1) * safeLimit;
  const where     = { userId };
  if (status) where.status = status;

  const { rows, count } = await db.Order.findAndCountAll({
    where,
    include: [
      { model: db.OrderItem, as: 'items', attributes: ['productName', 'quantity', 'unitPrice', 'totalPrice'] },
      { model: db.Refund,    as: 'refunds', required: false },
    ],
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

/* ── getCustomerInquiries ─────────────────────────────────────────────────── */

/**
 * All form submissions (quote requests, contact forms) for a customer.
 * Also includes their support tickets.
 */
export const getCustomerInquiries = async (userId, { page = 1, limit = 20 } = {}) => {
  const safeLimit = Math.min(limit, 100);
  const offset    = (page - 1) * safeLimit;

  const [submissions, tickets] = await Promise.all([
    db.FormSubmission.findAndCountAll({
      where:   { userId },
      include: [{ model: db.Form, as: 'form', attributes: ['name'] }],
      order:   [['createdAt', 'DESC']],
      limit:   safeLimit,
      offset,
    }).catch(() => ({ rows: [], count: 0 })),

    db.SupportTicket.findAll({
      where:      { userId },
      attributes: ['id', 'ticketNumber', 'subject', 'status', 'priority', 'type', 'createdAt'],
      order:      [['createdAt', 'DESC']],
      limit:      safeLimit,
    }),
  ]);

  return {
    formSubmissions: {
      data:       submissions.rows,
      total:      submissions.count,
      pagination: { page, limit: safeLimit, total: submissions.count, pages: Math.ceil(submissions.count / safeLimit) },
    },
    supportTickets: tickets,
  };
};

/* ── getCustomerStats ─────────────────────────────────────────────────────── */

/**
 * Aggregated customer metrics for the CRM dashboard header.
 * Total customers, new this month, active, churned (no orders in 90 days).
 */
export const getCustomerStats = async () => {
  // Redis: `customers:stats` TTL 15min

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  const [total, newThisMonth, withRecentOrders, returningRows] = await Promise.all([
    db.User.count({ where: { role: 'user' } }),

    db.User.count({
      where: {
        role:      'user',
        createdAt: { [Op.gte]: thirtyDaysAgo },
      },
    }),

    // Customers who placed an order in the last 90 days (active customers)
    db.Order.count({
      where:    { createdAt: { [Op.gte]: ninetyDaysAgo }, userId: { [Op.ne]: null } },
      distinct: true,
      col:      'user_id',
    }),

    // Returning customers — placed more than one order, ever
    db.Order.findAll({
      where:      { userId: { [Op.ne]: null } },
      attributes: ['userId'],
      group:      ['user_id'],
      having:     literal('COUNT(*) > 1'),
      raw:        true,
    }),
  ]);

  return {
    total,
    newThisMonth,
    returningCustomers: returningRows.length,
    activeCustomers:    withRecentOrders,
    inactiveCustomers:  Math.max(0, total - withRecentOrders),
  };
};
