/**
 * utils/viewCounter.js
 *
 * Buffered view counting — turns one UPDATE per page view into at most one
 * UPDATE per blog per flush interval. View counts are advisory data: losing a
 * few seconds of buffer on a crash is acceptable, hammering the DB on every
 * read is not.
 *
 * No Redis — same single-process strategy as utils/Cache.js.
 */

import db from '../models/index.js';
import logger from './logger.js';

const FLUSH_INTERVAL_MS = 30_000;

const pending = new Map(); // blogId → count

export const bumpBlogView = (blogId) => {
  pending.set(blogId, (pending.get(blogId) ?? 0) + 1);
};

const flush = async () => {
  if (!pending.size) return;

  const batch = [...pending.entries()];
  pending.clear();

  const results = await Promise.allSettled(
    batch.map(([id, by]) =>
      db.Blog.increment('view_count', { by, where: { id } })
    )
  );

  results.forEach((r, i) => {
    if (r.status === 'rejected') {
      logger.error(`[ViewCounter] flush failed for blog ${batch[i][0]}: ${r.reason?.message}`);
    }
  });
};

// unref() so the interval never keeps a shutting-down process alive
setInterval(flush, FLUSH_INTERVAL_MS).unref();

// Best-effort flush on clean exit
process.once('beforeExit', flush);
