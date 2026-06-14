import 'dotenv/config';
import express    from 'express';
import path       from 'path';
import cors       from 'cors';
import helmet     from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import { createServer }       from 'http';
import { Server as SocketIO } from 'socket.io';
import jwt from 'jsonwebtoken';
import db from './models/index.js';

// ── Existing routes (unchanged) ───────────────────────────────────────────────
import authRoutes          from './routes/authRoutes.js';
import publicRoutes        from './routes/publicRoutes.js';
import adminRoutes         from './routes/adminRoutes.js';
import productRoutes       from './routes/productRoutes.js';
import projectRoutes       from './routes/projectsRoutes.js';
import blogRoutes          from './routes/blogRoutes.js';
import productReviewRoutes from './routes/productReviewRoutes.js';
import faqRoutes           from './routes/faqRoutes.js';
import formRoutes          from './routes/formRoutes.js';
import oauthRoutes         from './routes/oauthRoutes.js';
import userRoutes          from './routes/userRoutes.js';
import cartRoutes          from './routes/cartRoutes.js';
import paymentRoutes       from './routes/paymentRoutes.js';
import orderRoutes         from './routes/orderRoutes.js';
import returnRoutes        from './routes/returnRoutes.js';
import solarRoutes         from './routes/solarRoutes.js';
import solarAdminRoutes    from './routes/solarAdminRoutes.js';

// ── New dashboard routes ───────────────────────────────────────────────────────
import analyticsRoutes    from './routes/analyticsRoutes.js';
import customerRoutes     from './routes/customerRoutes.js';
import paymentAdminRoutes from './routes/paymentAdminRoutes.js';
import { adminSupportRouter, publicSupportRouter } from './routes/supportRoutes.js';
import { adminPromoRouter, publicPromoRouter } from './routes/promoRoutes.js';

// ── Jobs & utils ───────────────────────────────────────────────────────────────
import cron                from 'node-cron';
import { runExpireJob }    from './jobs/expireAbondonedOrders.js';
import { runAggregation }  from './jobs/aggregateDailySales.js';
import { getEmitter }      from './utils/emitter.js';

// ── Middleware ────────────────────────────────────────────────────────────────
import { errorHandler, notFound } from './middleware/Error.js';
import logger                     from './utils/logger.js';

const app        = express();
const httpServer = createServer(app);   // ← wrap app in http.Server for socket.io
const PORT       = process.env.PORT || 5000;

// ── socket.io ─────────────────────────────────────────────────────────────────
const io = new SocketIO(httpServer, {
  cors: {
    origin:      process.env.FRONTEND_URL ?? 'http://localhost:5173',
    credentials: true,
  },
});

// The 'admins' room receives live order amounts and ticket data, so joining
// must be gated on a verified admin session — never on the client's say-so.
// The admin dashboard connects with withCredentials:true, so the httpOnly
// accessToken cookie is present on the handshake.
const resolveSocketUser = async (socket) => {
  try {
    const rawCookie = socket.handshake.headers.cookie || '';
    const match     = rawCookie.match(/(?:^|;\s*)accessToken=([^;]+)/);
    const token     = match ? decodeURIComponent(match[1]) : socket.handshake.auth?.token;
    if (!token) return null;

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user    = await db.User.findByPk(decoded.id, { attributes: ['id', 'role', 'isActive'] });
    return user?.isActive ? { user, expMs: decoded.exp * 1000 } : null;
  } catch {
    return null;
  }
};

io.on('connection', (socket) => {
  // Admin dashboard joins the 'admins' room after login
  // Frontend: socket.emit('join:admin')
  socket.on('join:admin', async () => {
    const resolved = await resolveSocketUser(socket);
    if (resolved?.user.role !== 'admin') return;

    socket.join('admins');

    // Room membership must not outlive the token it was granted on. Disconnect
    // at expiry — the client auto-reconnects with its refreshed cookie and
    // re-emits join:admin, so an active admin session is re-admitted seamlessly
    // while a revoked/expired one is not.
    clearTimeout(socket.data.adminExpiryTimer);
    socket.data.adminExpiryTimer = setTimeout(
      () => socket.disconnect(true),
      Math.max(resolved.expMs - Date.now(), 0)
    );
  });

  socket.on('disconnect', () => clearTimeout(socket.data.adminExpiryTimer));
});

// Wire internal emitter → socket.io broadcasts
const emitter = getEmitter();

emitter.on('order:paid',      (d) => io.to('admins').emit('live:order',  { type: 'paid',      ...d }));
emitter.on('order:cancelled', (d) => io.to('admins').emit('live:order',  { type: 'cancelled', ...d }));
emitter.on('ticket:created',  (d) => io.to('admins').emit('live:ticket', { type: 'created',   ...d }));
emitter.on('ticket:updated',  (d) => io.to('admins').emit('live:ticket', { type: 'updated',   ...d }));
emitter.on('ticket:message',  (d) => io.to('admins').emit('live:ticket', { type: 'message',   ...d }));

// ── Security & compression ────────────────────────────────────────────────────
app.use(helmet());
app.use(compression());

// ── CORS ──────────────────────────────────────────────────────────────────────
app.use(cors({
  origin:      process.env.ALLOWED_ORIGINS?.split(',') || 'http://localhost:5173',
  credentials: true,
}));

// ── Body parsing ──────────────────────────────────────────────────────────────
// rawBody capture must come first — used by Paystack webhook signature verification
app.use(express.json({
  limit:  '10kb',
  verify: (req, _res, buf) => { req.rawBody = buf.toString('utf8'); },
}));
app.use(express.urlencoded({ extended: false, limit: '10kb' }));
app.use(cookieParser());

// ── CORP header ───────────────────────────────────────────────────────────────
app.use((_req, res, next) => {
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
});

// ── Static uploads ────────────────────────────────────────────────────────────
app.use('/uploads', express.static(path.join(process.cwd(), 'public/uploads')));

// ── Trust proxy ───────────────────────────────────────────────────────────────
app.set('trust proxy', 1);

// ── Rate limiting ─────────────────────────────────────────────────────────────
// No global limiter: the SPA legitimately fires many API calls per page view,
// so a blanket cap locks real users out of public browsing. Sensitive endpoints
// keep their own targeted limiters where they're mounted:
//   otpRateLimit / passwordRateLimit / refreshRateLimit → authRoutes
//   paymentRateLimit                                    → paymentRoutes

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/health', (_req, res) =>
  res.json({ status: 'ok', environment: process.env.NODE_ENV || 'development' })
);

// ══════════════════════════════════════════════════════════════════════════════
// ROUTES
// ── Auth & OAuth ──────────────────────────────────────────────────────────────
app.use('/api/auth',           authRoutes);
app.use('/api/oauth',          oauthRoutes);

// ── Admin ─────────────────────────────────────────────────────────────────────
app.use('/api/admin',                adminRoutes);
app.use('/api/admin/projects',       projectRoutes);
app.use('/api/admin/products',       productRoutes);
app.use('/api/admin/faqs',           faqRoutes);
app.use('/api/admin/solar',          solarAdminRoutes);

// ── New admin dashboard modules ───────────────────────────────────────────────
app.use('/api/admin/analytics',      analyticsRoutes);
app.use('/api/admin/customers',      customerRoutes);
app.use('/api/admin/payments',       paymentAdminRoutes);
app.use('/api/admin/support',        adminSupportRouter);
app.use('/api/admin/promos',         adminPromoRouter);

// ── Public ────────────────────────────────────────────────────────────────────
app.use('/api/public',               publicRoutes);
app.use('/api/public/products',      productRoutes);
app.use('/api',                      blogRoutes);
app.use('/api',                      formRoutes);
app.use('/api/reviews',              productReviewRoutes);
app.use('/api/solar',                solarRoutes);

// ── E-commerce ────────────────────────────────────────────────────────────────
app.use('/api/users',                userRoutes);
app.use('/api/cart',                 cartRoutes);
app.use('/api/orders',               orderRoutes);
app.use('/api/payment',              paymentRoutes);
app.use('/api/returns',              returnRoutes);

// ── Support (public — customer ticket submission) ─────────────────────────────
app.use('/api/support',              publicSupportRouter);
app.use('/api/promo',                publicPromoRouter);

// ══════════════════════════════════════════════════════════════════════════════
// ERROR HANDLING
// ══════════════════════════════════════════════════════════════════════════════
app.use(notFound);
app.use(errorHandler);

// ══════════════════════════════════════════════════════════════════════════════
// CRON JOBS
// ══════════════════════════════════════════════════════════════════════════════

// Expire abandoned orders — every hour
cron.schedule('0 * * * *', async () => {
  try {
    await runExpireJob();
  } catch (err) {
    logger.error('[Cron] expireAbandonedOrders crashed: ' + err.message);
  }
});

// Aggregate daily sales stats — 00:05 WAT every day
// Backfills last 7 days on each run so gaps never form
if (process.env.NODE_ENV === 'production' || process.env.ENABLE_CRON === 'true') {
  cron.schedule('5 0 * * *', async () => {
    try {
      await runAggregation();
    } catch (err) {
      logger.error('[Cron] aggregateDailySales crashed: ' + err.message);
    }
  }, { timezone: 'Africa/Lagos' });

  logger.info('[Cron] Daily sales aggregation scheduled at 00:05 WAT');
}

// ══════════════════════════════════════════════════════════════════════════════
// STARTUP
// ══════════════════════════════════════════════════════════════════════════════
httpServer.listen(PORT, async () => {
  try {
    await db.sequelize.authenticate();
    logger.info('Database connected successfully');
    logger.info('Server running on http://localhost:' + PORT);
    logger.info('WebSocket ready on ws://localhost:' + PORT);
  } catch (err) {
    logger.error('Unable to connect to the database: ' + err.message);
    process.exit(1);
  }
});

export default app;