/**
 * services/AnalyticsService.js
 *
 * All reads — no writes except the nightly aggregation job.
 *
 * Query strategy:
 *  - Historical data (anything before today): read from daily_sales_stats.
 *    This table has at most 365 rows per year. Fast regardless of order volume.
 *
 *  - "Today" data: query orders/page_views directly.
 *    Cache result for 5 minutes in Redis when wired.
 *    Comment shows the cache key pattern to drop in.
 *
 * All functions accept a { startDate, endDate } range in YYYY-MM-DD format.
 * Caller (controller) is responsible for validating and defaulting these.
 */

import { Op, fn, col, literal, QueryTypes } from 'sequelize';
import db from '../models/index.js';
import { getCustomerStats } from './CustomerService.js';

/* ── Date helpers ─────────────────────────────────────────────────────────── */

const toDate = (str) => new Date(str + 'T00:00:00+01:00');   // WAT
const today  = ()    => new Date().toISOString().slice(0, 10);

const dateRange = (startDate, endDate) => ({
  [Op.between]: [
    new Date(startDate + 'T00:00:00+01:00'),
    new Date(endDate   + 'T23:59:59+01:00'),
  ],
});

/* ── getSalesSummary ──────────────────────────────────────────────────────── */

/**
 * Returns revenue + order count totals for a date range.
 * Breaks the range into:
 *   1. history (before today) → daily_sales_stats (fast, precomputed)
 *   2. today              → live query on orders (accurate, cached 5 min)
 *
 * @param {{ startDate: string, endDate: string }} range
 * @returns {{
 *   totalRevenue:    number,
 *   totalOrders:     number,
 *   ordersByStatus:  Record<string, number>,
 *   dailyBreakdown:  Array<{ date, revenue, orders }>,
 *   period:          { startDate, endDate }
 * }}
 */
export const getSalesSummary = async ({ startDate, endDate }) => {
  const todayStr = today();

  // ── Redis cache pattern (wire when ready) ─────────────────────────────────
  // const cacheKey = `analytics:sales:${startDate}:${endDate}`;
  // const cached = await Cache.get(cacheKey);
  // if (cached) return cached;

  // ── Historical rows from precomputed table ────────────────────────────────
  const histEnd = endDate >= todayStr ? addDays(todayStr, -1) : endDate;

  let historicalStats = [];
  if (startDate <= histEnd) {
    historicalStats = await db.DailySalesStat.findAll({
      where: { date: { [Op.between]: [startDate, histEnd] } },
      order: [['date', 'ASC']],
      raw:   true,
    });
  }

  // ── Live query for today ──────────────────────────────────────────────────
  let todayStats = null;
  if (endDate >= todayStr) {
    const startOfToday = toDate(todayStr);
    const [paidRevenue, statusCounts] = await Promise.all([
      db.Order.sum('totalAmount', {
        where: { createdAt: { [Op.gte]: startOfToday }, paymentStatus: 'paid' },
      }),
      db.Order.findAll({
        where:      { createdAt: { [Op.gte]: startOfToday } },
        attributes: ['status', [fn('COUNT', col('id')), 'count']],
        group:      ['status'],
        raw:        true,
      }),
    ]);

    const byStatus = {};
    for (const row of statusCounts) byStatus[row.status] = parseInt(row.count, 10);

    todayStats = {
      date:          todayStr,
      totalRevenue:  parseFloat(paidRevenue || 0),
      totalOrders:   Object.values(byStatus).reduce((s, n) => s + n, 0),
      ...byStatus,
    };
  }

  // ── Merge and compute aggregates ──────────────────────────────────────────
  const allDays = [
    ...historicalStats,
    ...(todayStats ? [todayStats] : []),
  ];

  const totalRevenue = allDays.reduce((s, d) => s + parseFloat(d.totalRevenue || d.total_revenue || 0), 0);
  const totalOrders  = allDays.reduce((s, d) => s + parseInt(d.totalOrders   || d.total_orders  || 0, 10), 0);

  // Aggregate status breakdown across all days
  const ordersByStatus = {
    pending:    allDays.reduce((s, d) => s + parseInt(d.pendingOrders    || d.pending_orders    || 0, 10), 0),
    processing: allDays.reduce((s, d) => s + parseInt(d.processingOrders || d.processing_orders || 0, 10), 0),
    completed:  allDays.reduce((s, d) => s + parseInt(d.completedOrders  || d.completed_orders  || 0, 10), 0),
    cancelled:  allDays.reduce((s, d) => s + parseInt(d.cancelledOrders  || d.cancelled_orders  || 0, 10), 0),
    refunded:   allDays.reduce((s, d) => s + parseInt(d.refundedOrders   || d.refunded_orders   || 0, 10), 0),
  };

  const dailyBreakdown = allDays.map(d => ({
    date:    d.date,
    revenue: parseFloat(d.totalRevenue || d.total_revenue || 0),
    orders:  parseInt(d.totalOrders   || d.total_orders  || 0, 10),
  }));

  const result = {
    totalRevenue: parseFloat(totalRevenue.toFixed(2)),
    totalOrders,
    ordersByStatus,
    dailyBreakdown,
    period: { startDate, endDate },
  };

  // await Cache.set(cacheKey, result, 300);   // 5 min TTL
  return result;
};

/* ── getOrderStats ────────────────────────────────────────────────────────── */

/**
 * Order breakdown by status for a date range.
 * Used for the status pie chart on the dashboard.
 *
 * Hits orders table directly — fine because it's a simple GROUP BY with index.
 */
export const getOrderStats = async ({ startDate, endDate }) => {
  // Redis: `analytics:orders:${startDate}:${endDate}` TTL 5min

  const rows = await db.Order.findAll({
    where: {
      createdAt:     dateRange(startDate, endDate),
    },
    attributes: [
      'status',
      'paymentStatus',
      [fn('COUNT', col('id')), 'count'],
      [fn('SUM', col('total_amount')), 'total'],
    ],
    group: ['status', 'paymentStatus'],
    raw:   true,
  });

  // Reshape into { byStatus: {...}, byPaymentStatus: {...}, totals }
  const byStatus        = {};
  const byPaymentStatus = {};
  let   totalRevenue    = 0;
  let   totalCount      = 0;

  for (const row of rows) {
    const count = parseInt(row.count, 10);
    const total = parseFloat(row.total || 0);

    byStatus[row.status] = (byStatus[row.status] || 0) + count;

    byPaymentStatus[row.paymentStatus] = (byPaymentStatus[row.paymentStatus] || 0) + count;

    if (row.paymentStatus === 'paid') totalRevenue += total;
    totalCount += count;
  }

  return {
    byStatus,
    byPaymentStatus,
    totalRevenue: parseFloat(totalRevenue.toFixed(2)),
    totalCount,
    period: { startDate, endDate },
  };
};

/* ── getTrafficSummary ────────────────────────────────────────────────────── */

/**
 * Traffic stats: total views, unique visitors, most visited pages.
 *
 * Separates history (DailySalesStat) from today (PageView live query).
 * Most-visited pages are ALWAYS queried live from page_views — this is
 * an aggregation on a string column, fast with the composite index.
 */
export const getTrafficSummary = async ({ startDate, endDate, topPagesLimit = 10 }) => {
  // Redis: `analytics:traffic:${startDate}:${endDate}` TTL 10min

  const todayStr = today();
  const histEnd  = endDate >= todayStr ? addDays(todayStr, -1) : endDate;

  // ── Historical from precomputed table ─────────────────────────────────────
  let histPageViews    = 0;
  let histUniqueVisits = 0;

  if (startDate <= histEnd) {
    const histRows = await db.DailySalesStat.findAll({
      where:      { date: { [Op.between]: [startDate, histEnd] } },
      attributes: [
        [fn('SUM', col('page_views')),     'totalViews'],
        [fn('SUM', col('unique_visitors')), 'totalUnique'],
      ],
      raw: true,
    });
    histPageViews    = parseInt(histRows[0]?.totalViews  || 0, 10);
    histUniqueVisits = parseInt(histRows[0]?.totalUnique || 0, 10);
  }

  // ── Today live ────────────────────────────────────────────────────────────
  let todayViews  = 0;
  let todayUnique = 0;

  if (endDate >= todayStr) {
    const startOfToday = toDate(todayStr);
    const [views, unique] = await Promise.all([
      db.PageView.count({ where: { createdAt: { [Op.gte]: startOfToday } } }),
      db.PageView.count({
        where:    { createdAt: { [Op.gte]: startOfToday } },
        distinct: true,
        col:      'ip_hash',
      }),
    ]);
    todayViews  = views;
    todayUnique = unique;
  }

  // ── Top pages (live query — composite index makes this fast) ──────────────
  const topPages = await db.PageView.findAll({
    where: {
      createdAt: dateRange(startDate, endDate),
    },
    attributes: [
      'path',
      [fn('COUNT', col('id')), 'views'],
    ],
    group: ['path'],
    order: [[literal('views'), 'DESC']],
    limit: topPagesLimit,
    raw:   true,
  });

  return {
    totalPageViews:   histPageViews + todayViews,
    uniqueVisitors:   histUniqueVisits + todayUnique,
    topPages:         topPages.map(p => ({ path: p.path, views: parseInt(p.views, 10) })),
    period:           { startDate, endDate },
  };
};

/* ── getDashboardSummary ──────────────────────────────────────────────────── */

/**
 * Single aggregated call for the dashboard home page.
 * Returns everything the admin dashboard needs in ONE request.
 * Runs all sub-queries in parallel with Promise.all.
 *
 * Redis: `analytics:dashboard:${startDate}:${endDate}` TTL 5min
 */
export const getDashboardSummary = async ({ startDate, endDate }) => {
  const [sales, orders, traffic, customers, recentOrders] = await Promise.all([
    getSalesSummary({ startDate, endDate }),
    getOrderStats({ startDate, endDate }),
    getTrafficSummary({ startDate, endDate }),
    getCustomerStats(),
    // Last 5 orders for the dashboard feed — no pagination needed here
    db.Order.findAll({
      order:      [['createdAt', 'DESC']],
      limit:      5,
      attributes: ['id', 'orderNumber', 'totalAmount', 'status', 'paymentStatus', 'createdAt'],
      include: [{
        model:      db.User,
        as:         'user',
        attributes: ['firstName', 'lastName', 'email'],
        required:   false,
      }],
    }),
  ]);

  return {
    revenue: {
      total:         sales.totalRevenue,
      dailyBreakdown: sales.dailyBreakdown,
    },
    orders: {
      total:         sales.totalOrders,
      byStatus:      orders.byStatus,
      byPaymentStatus: orders.byPaymentStatus,
    },
    traffic: {
      pageViews:     traffic.totalPageViews,
      uniqueVisitors: traffic.uniqueVisitors,
      topPages:      traffic.topPages,
    },
    customers: {
      total:     customers.total,
      newThisMonth: customers.newThisMonth,
      returning: customers.returningCustomers,
      active:    customers.activeCustomers,
    },
    recentOrders:   recentOrders,
    period:         { startDate, endDate },
  };
};

/* ── Nightly aggregation (called by jobs/aggregateDailySales.js) ──────────── */

/**
 * Aggregates one day's data into daily_sales_stats.
 * Uses INSERT ... ON DUPLICATE KEY UPDATE so re-running is safe.
 * Called with yesterday's date by the nightly cron.
 *
 * @param {string} dateStr YYYY-MM-DD
 */
export const aggregateDay = async (dateStr) => {
  const start = new Date(dateStr + 'T00:00:00+01:00');
  const end   = new Date(dateStr + 'T23:59:59+01:00');

  const [
    revenueResult,
    statusCounts,
    pageViewCount,
    uniqueVisitorCount,
    newCustomerCount,
  ] = await Promise.all([
    // Paid revenue for the day
    db.Order.sum('totalAmount', {
      where: { createdAt: { [Op.between]: [start, end] }, paymentStatus: 'paid' },
    }),
    // Order status breakdown
    db.Order.findAll({
      where:      { createdAt: { [Op.between]: [start, end] } },
      attributes: ['status', [fn('COUNT', col('id')), 'count']],
      group:      ['status'],
      raw:        true,
    }),
    // Page views
    db.PageView.count({ where: { createdAt: { [Op.between]: [start, end] } } }),
    // Unique visitors by ip_hash
    db.PageView.count({
      where:    { createdAt: { [Op.between]: [start, end] } },
      distinct: true,
      col:      'ip_hash',
    }),
    // New users
    db.User.count({ where: { createdAt: { [Op.between]: [start, end] } } }),
  ]);

  const byStatus = {};
  for (const row of statusCounts) {
    byStatus[row.status] = parseInt(row.count, 10);
  }

  const totalOrders = Object.values(byStatus).reduce((s, n) => s + n, 0);

  // Upsert — safe to re-run
  await db.DailySalesStat.upsert({
    date:              dateStr,
    totalRevenue:      parseFloat(revenueResult || 0),
    totalOrders,
    pendingOrders:    byStatus['pending']    || 0,
    processingOrders: byStatus['processing'] || 0,
    completedOrders:  byStatus['delivered']  || 0,
    cancelledOrders:  byStatus['cancelled']  || 0,
    refundedOrders:   byStatus['refunded']   || 0,
    pageViews:        pageViewCount,
    uniqueVisitors:   uniqueVisitorCount,
    newCustomers:     newCustomerCount,
  });

  console.log(`[AnalyticsService] Aggregated ${dateStr}: revenue=${revenueResult}, orders=${totalOrders}`);
};

/* ── Private util ─────────────────────────────────────────────────────────── */

function addDays(dateStr, n) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}
