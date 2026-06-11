'use strict';

/**
 * seeders/seed-page-views.cjs
 *
 * 60 days of realistic page view data.
 * - Weekdays get more traffic than weekends
 * - Product and store pages get the most hits
 * - A handful of sessions per day from unique IP hashes
 * - Mix of logged-in users (user_id set) and guests (null)
 *
 * Run: npx sequelize-cli db:seed --seed seed-page-views.cjs
 */

const crypto = require('crypto');

const PATHS = [
  { path: '/',                     weight: 20 },
  { path: '/store',                weight: 18 },
  { path: '/store/solar-panel-5kw', weight: 14 },
  { path: '/store/inverter-2kva',   weight: 12 },
  { path: '/store/solar-panel-3kw', weight: 10 },
  { path: '/about',                weight: 8  },
  { path: '/services',             weight: 8  },
  { path: '/blog',                 weight: 7  },
  { path: '/contact',              weight: 6  },
  { path: '/calculator',           weight: 5  },
  { path: '/projects',             weight: 4  },
  { path: '/blog/how-solar-works', weight: 4  },
  { path: '/blog/power-outage-tips', weight: 3 },
  { path: '/cart',                 weight: 3  },
];

const REFERRERS = [
  'https://google.com',
  'https://google.com',
  'https://google.com',
  'https://facebook.com',
  'https://instagram.com',
  null,   // direct
  null,
  null,
  'https://twitter.com',
  'https://linkedin.com',
];

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/119.0.0.0',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
  'Mozilla/5.0 (Linux; Android 13; Samsung Galaxy S23) AppleWebKit/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/121.0',
];

const FAKE_USER_IDS = [
  '550e8400-e29b-41d4-a716-446655440001',
  '550e8400-e29b-41d4-a716-446655440002',
  '550e8400-e29b-41d4-a716-446655440003',
  '550e8400-e29b-41d4-a716-446655440004',
  '550e8400-e29b-41d4-a716-446655440005',
];

function weightedPick(items) {
  const total = items.reduce((s, i) => s + i.weight, 0);
  let r = Math.random() * total;
  for (const item of items) {
    r -= item.weight;
    if (r <= 0) return item.path;
  }
  return items[0].path;
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function hashIp(ip, date) {
  return crypto.createHash('sha256').update(ip + date).digest('hex');
}

function addMinutes(date, mins) {
  return new Date(date.getTime() + mins * 60 * 1000);
}

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const rows = [];
    const now  = new Date();

    for (let day = 59; day >= 0; day--) {
      const date    = new Date(now);
      date.setDate(date.getDate() - day);
      date.setHours(0, 0, 0, 0);

      const dateStr   = date.toISOString().slice(0, 10);
      const dayOfWeek = date.getDay(); // 0=Sun, 6=Sat
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

      // 40-120 views on weekdays, 20-60 on weekends
      const viewCount = isWeekend
        ? 20 + Math.floor(Math.random() * 40)
        : 40 + Math.floor(Math.random() * 80);

      // 8-20 unique IPs per day
      const ipCount   = isWeekend ? 8 + Math.floor(Math.random() * 8) : 12 + Math.floor(Math.random() * 8);
      const ips       = Array.from({ length: ipCount }, (_, i) => `192.168.${day % 10}.${i + 1}`);

      for (let v = 0; v < viewCount; v++) {
        // Spread views across the day (8am–11pm WAT)
        const minuteOffset = (8 * 60) + Math.floor(Math.random() * (15 * 60));
        const createdAt    = addMinutes(date, minuteOffset);

        const ip      = pick(ips);
        const isLoggedIn = Math.random() < 0.25; // 25% logged-in users

        rows.push({
          user_id:     isLoggedIn ? pick(FAKE_USER_IDS) : null,
          session_id:  crypto.randomBytes(16).toString('hex'),
          path:        weightedPick(PATHS),
          referrer:    pick(REFERRERS),
          user_agent:  pick(USER_AGENTS),
          ip_hash:     hashIp(ip, dateStr),
          response_ms: 80 + Math.floor(Math.random() * 320),
          created_at:  createdAt,
        });
      }
    }

    // Insert in batches of 500 to avoid packet size issues
    const BATCH = 500;
    for (let i = 0; i < rows.length; i += BATCH) {
      await queryInterface.bulkInsert('page_views', rows.slice(i, i + BATCH));
    }

    console.log(`[Seed] Inserted ${rows.length} page_views across 60 days`);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('page_views', null, {});
  },
};
