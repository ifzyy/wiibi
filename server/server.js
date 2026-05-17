import 'dotenv/config';
import express from 'express';
import path from 'path';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import db from './models/index.js';

// ── Existing routes (unchanged) ───────────────────────────────────────────────
import authRoutes    from './routes/authRoutes.js';
import publicRoutes  from './routes/publicRoutes.js';
import adminRoutes   from './routes/adminRoutes.js';
import productRoutes from './routes/productRoutes.js';
import projectRoutes from './routes/projectsRoutes.js';
import blogRoutes    from './routes/blogRoutes.js';
import productReviewRoutes from './routes/productReviewRoutes.js';
import faqRoutes from './routes/faqRoutes.js'; // new FAQ routes
import formRoutes from './routes/formRoutes.js'; // new form admin routes
import oauthRoutes from './routes/oauthRoutes.js'; // new OAuth routes
// ── New routes ────────────────────────────────────────────────────────────────
import userRoutes  from './routes/userRoutes.js';
import cartRoutes  from './routes/cartRoutes.js';
import paymentRoutes from "./routes/paymentRoutes.js"
import orderRoutes from './routes/orderRoutes.js';
import returnRoutes from './routes/returnRoutes.js';
// ── Solar calculator ──────────────────────────────────────────────────────────
import solarRoutes      from './routes/solarRoutes.js';
import solarAdminRoutes from './routes/solarAdminRoutes.js';

// ── Middleware ────────────────────────────────────────────────────────────────
import { globalRateLimit }    from './middleware/RateLimit.js';
import { errorHandler, notFound } from './middleware/Error.js';
import logger from './utils/logger.js';

const app  = express();
const PORT = process.env.PORT || 5000;

// ── Security & compression ────────────────────────────────────────────────────
app.use(helmet());
app.use(compression());

// ── CORS ──────────────────────────────────────────────────────────────────────
app.use(cors({
  origin:      process.env.ALLOWED_ORIGINS?.split(',') || 'http://localhost:5173',
  credentials: true,
}));

// ── Body parsing ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10kb' }));
  app.use(express.json({
    verify: (req, _res, buf) => { req.rawBody = buf.toString('utf8'); }
   }));
app.use(express.urlencoded({ extended: false, limit: '10kb' }));
app.use(cookieParser());

// ── CORP header (needed for your uploads to be accessible cross-origin) ────────
app.use((req, res, next) => {
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
});

// ── Static uploads ────────────────────────────────────────────────────────────
app.use('/uploads', express.static(path.join(process.cwd(), 'public/uploads')));

// ── Trust proxy (accurate IP behind Nginx / load balancers) ──────────────────
app.set('trust proxy', 1);

// ── Global rate limiter ───────────────────────────────────────────────────────
// app.use(globalRateLimit);

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/health', (req, res) =>
  res.json({ status: 'ok', environment: process.env.NODE_ENV || 'development' })
);

// ══════════════════════════════════════════════════════════════════════════════
// ROUTES
// ── Existing (untouched paths) ────────────────────────────────────────────────
app.use('/api/auth',              authRoutes);
app.use('/api/oauth',             oauthRoutes); // new OAuth routes
app.use('/api/admin/projects',    projectRoutes);
app.use('/api/public',            publicRoutes);
app.use('/api/admin',             adminRoutes);
app.use('/api/admin/faqs',       faqRoutes); // new FAQ routes
app.use('/api',                   blogRoutes);
app.use('/api/admin/products',    productRoutes);
app.use('/api', formRoutes);
app.use('/api/public/products',   productRoutes);
app.use('/api/reviews',           productReviewRoutes);
// ── E-commerce ────────────────────────────────────────────────────────────────
app.use('/api/users',             userRoutes);
app.use('/api/cart',              cartRoutes);
app.use('/api/orders',            orderRoutes);
app.use('/api/payment',           paymentRoutes);

app.use('/api/returns', returnRoutes);
// ── Solar calculator ──────────────────────────────────────────────────────────
app.use('/api/solar',             solarRoutes);       // public calculator
app.use('/api/admin/solar',       solarAdminRoutes);  // admin management

// ══════════════════════════════════════════════════════════════════════════════
// ERROR HANDLING
// ══════════════════════════════════════════════════════════════════════════════
app.use(notFound);
app.use(errorHandler);

// ── Startup ───────────────────────────────────────────────────────────────────
app.listen(PORT, async () => {
  try {
    await db.sequelize.authenticate();
    logger.info('Database connected successfully');
    logger.info('Server running on http://localhost:' + PORT);
  } catch (err) {
    logger.error('Unable to connect to the database: ' + err.message);
    process.exit(1);
  }
});

/**
 * Paste this into your server entry point (app.js / server.js / index.js)
 * after your DB connection is confirmed ready.
 *
 * Requires: npm install node-cron
 */

import cron                  from 'node-cron';
import { runExpireJob } from './jobs/ExpireAbondonedOrders.js';

// Run every hour at :00 — adjust the schedule to taste:
//   '0 * * * *'    every hour
//   '*/30 * * * *' every 30 minutes
//   '0 */2 * * *'  every 2 hours
cron.schedule('0 * * * *', async () => {
  try {
    await runExpireJob();
  } catch (err) {
    console.error('[Cron] expireAbandonedOrders crashed:', err.message);
  }
});

console.log('[Cron] expireAbandonedOrders scheduled — every hour');

export default app;