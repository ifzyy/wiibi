/**
 * scripts/clearAnalytics.js
 *
 * Wipes all analytics data so you can start collecting from scratch — removes
 * every row from `page_views` (raw traffic) and `daily_sales_stats` (the
 * nightly aggregates). Useful for clearing seeded demo data before going live.
 *
 * This is destructive and irreversible, so it refuses to run without --yes:
 *
 *   node scripts/clearAnalytics.js --yes
 *
 * It does NOT touch orders, users, products or any other table.
 */
import sequelize from '../config/db.js';
import db from '../models/index.js';

const TABLES = ['PageView', 'DailySalesStat'];

const run = async () => {
  if (!process.argv.includes('--yes')) {
    console.log('Refusing to run without confirmation.');
    console.log('This permanently deletes all rows in: page_views, daily_sales_stats.');
    console.log('Re-run with:  node scripts/clearAnalytics.js --yes');
    process.exit(1);
  }

  let total = 0;
  for (const name of TABLES) {
    const model = db[name];
    if (!model) {
      console.warn(`! Model ${name} not found — skipping`);
      continue;
    }
    const before = await model.count();
    await model.destroy({ where: {}, truncate: true, force: true });
    console.log(`✓ ${model.tableName}: cleared ${before} row(s)`);
    total += before;
  }

  console.log(`\nDone — removed ${total} analytics row(s). Tracking starts fresh from now.`);
  await sequelize.close();
  process.exit(0);
};

run().catch(async (err) => {
  console.error('Failed to clear analytics:', err.message);
  try { await sequelize.close(); } catch { /* ignore */ }
  process.exit(1);
});
