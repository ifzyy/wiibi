'use strict';

/**
 * seeders/seed-daily-sales-stats.cjs
 *
 * 60 days of precomputed daily_sales_stats rows.
 *
 * IMPORTANT: Run this AFTER you have real order data in the DB, OR run it
 * as standalone seed data to test the analytics dashboard.
 *
 * If you already have orders, run the aggregation job instead:
 *   node -e "import('./jobs/aggregateDailySales.js').then(m => m.runAggregation())"
 *
 * This seed generates plausible data for a growing Nigerian solar company:
 *  - Revenue trends upward with some volatility
 *  - Weekends are slower
 *  - Traffic grows over time
 *  - Realistic Nigerian naira order values (₦150k–₦2.5M)
 *
 * Run: npx sequelize-cli db:seed --seed seed-daily-sales-stats.cjs
 */

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

function isWeekend(dateStr) {
  const day = new Date(dateStr).getDay();
  return day === 0 || day === 6;
}

// Smooth upward trend with noise
function trendValue(day, base, growth, noise) {
  const trend = base + (growth * (60 - day) / 60);
  const jitter = (Math.random() - 0.5) * noise;
  return Math.max(0, trend + jitter);
}

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const rows = [];

    for (let day = 59; day >= 0; day--) {
      const date      = daysAgo(day);
      const weekend   = isWeekend(date);
      const multiplier = weekend ? 0.45 : 1;

      // Orders: 3-15 per weekday, 1-6 on weekends
      const totalOrders = Math.max(0, Math.round(
        trendValue(day, 8, 6, 4) * multiplier
      ));

      // Status split (realistic for an e-commerce store)
      const pending    = Math.round(totalOrders * (0.10 + Math.random() * 0.08));
      const processing = Math.round(totalOrders * (0.12 + Math.random() * 0.06));
      const completed  = Math.round(totalOrders * (0.62 + Math.random() * 0.10));
      const cancelled  = Math.round(totalOrders * (0.06 + Math.random() * 0.04));
      const refunded   = Math.max(0, totalOrders - pending - processing - completed - cancelled);

      // Revenue: completed orders × avg order value (₦250k–₦900k)
      const avgOrderValue = 250000 + Math.random() * 650000;
      const totalRevenue  = parseFloat((completed * avgOrderValue).toFixed(2));

      // Traffic: 40-180 views on weekdays, 20-80 weekends, growing over time
      const pageViews     = Math.round(trendValue(day, 60, 80, 30) * multiplier);
      const uniqueVisitors = Math.round(pageViews * (0.55 + Math.random() * 0.20));

      // New customers: 1-4 per weekday
      const newCustomers = Math.max(0, Math.round(
        trendValue(day, 1, 3, 1.5) * multiplier
      ));

      rows.push({
        date,
        total_revenue:      totalRevenue,
        total_orders:       totalOrders,
        pending_orders:     pending,
        processing_orders:  processing,
        completed_orders:   completed,
        cancelled_orders:   cancelled,
        refunded_orders:    refunded,
        page_views:         pageViews,
        unique_visitors:    uniqueVisitors,
        new_customers:      newCustomers,
        created_at:         new Date(date + 'T23:05:00+01:00'),  // written at 11pm WAT by nightly job
        updated_at:         new Date(date + 'T23:05:00+01:00'),
      });
    }

    // Use INSERT IGNORE in case some dates already exist from the real aggregation job
    // bulkInsert with ignoreDuplicates handles ON DUPLICATE KEY IGNORE
    await queryInterface.bulkInsert('daily_sales_stats', rows, {
      ignoreDuplicates: true,
    });

    const totalRevenue = rows.reduce((s, r) => s + r.total_revenue, 0);
    const totalOrders  = rows.reduce((s, r) => s + r.total_orders, 0);
    console.log(`[Seed] Inserted ${rows.length} daily_sales_stats rows`);
    console.log(`[Seed] Total seeded revenue: ₦${totalRevenue.toLocaleString('en-NG', { maximumFractionDigits: 0 })}`);
    console.log(`[Seed] Total seeded orders: ${totalOrders}`);
  },

  async down(queryInterface) {
    // Only deletes the seeded rows — leaves any real aggregated data intact
    const dates = Array.from({ length: 60 }, (_, i) => daysAgo(59 - i));
    await queryInterface.bulkDelete('daily_sales_stats', {
      date: dates,
    }, {});
  },
};
