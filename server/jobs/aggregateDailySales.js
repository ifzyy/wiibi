/**
 * jobs/aggregateDailySales.js
 *
 * Nightly cron job. Run once per day (e.g. 00:05 WAT).
 * Aggregates yesterday's orders and page views into daily_sales_stats.
 *
 * SAFE TO RE-RUN — uses upsert (INSERT ... ON DUPLICATE KEY UPDATE).
 *
 * SETUP:
 *  Option A — node-cron (already in your stack):
 *    import cron from 'node-cron';
 *    import { runAggregation } from './jobs/aggregateDailySales.js';
 *    cron.schedule('5 0 * * *', runAggregation, { timezone: 'Africa/Lagos' });
 *
 *  Option B — separate process (production preferred):
 *    node jobs/aggregateDailySales.js
 *    Schedule via crontab: 5 0 * * * /path/to/node /path/to/jobs/aggregateDailySales.js
 *
 * The job also backfills any missing dates in the last 7 days on each run.
 * This means a server restart won't leave gaps in your stats.
 */

import { aggregateDay } from '../services/AnalyticsService.js';

const addDays = (dateStr, n) => {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
};

/**
 * Aggregate yesterday and backfill the last 7 days (filling any gaps).
 */
export const runAggregation = async () => {
  console.log('[AggregateJob] Starting daily aggregation...');
  const today = new Date().toISOString().slice(0, 10);

  // Always do yesterday (primary purpose)
  const yesterday = addDays(today, -1);

  // Backfill up to 7 days for safety
  const dates = [];
  for (let i = 1; i <= 7; i++) {
    dates.push(addDays(today, -i));
  }

  let success = 0;
  let failed  = 0;

  for (const date of dates) {
    try {
      await aggregateDay(date);
      success++;
    } catch (err) {
      console.error(`[AggregateJob] Failed for ${date}:`, err.message);
      failed++;
    }
  }

  console.log(`[AggregateJob] Done. Success: ${success}, Failed: ${failed}`);
};

// Allow direct execution: node jobs/aggregateDailySales.js
if (process.argv[1]?.endsWith('aggregateDailySales.js')) {
  runAggregation()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('[AggregateJob] Fatal error:', err);
      process.exit(1);
    });
}
