import express from 'express';
import path from 'path'
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { rateLimit } from 'express-rate-limit';
import db from './models/index.js';
import authRoutes from './routes/authRoutes.js';
import publicRoutes from './routes/publicRoutes.js';
import adminRoutes from './routes/adminRoutes.js'
import productRoutes from './routes/productRoutes.js'
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(compression());
app.use(cors());
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: { message: 'Too many requests, please try again later' },
});
app.use(limiter);

// Serve static files (uploads folder publicly accessible)
app.use('/uploads', express.static(path.join(process.cwd(), 'public/uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/admin',adminRoutes)
app.use('/api/admin/products', productRoutes);
app.use('/api/public/products', productRoutes); // same router handles both
// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', environment: process.env.NODE_ENV || 'development' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Endpoint not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Global error:', err);
  res.status(500).json({ message: 'Internal server error' });
});

app.listen(PORT, async () => {
  try {
    await db.sequelize.authenticate();
    console.log(`Database connected successfully`);
    console.log(`Server running on http://localhost:${PORT}`);
  } catch (err) {
    console.error('Unable to connect to the database:', err);
  }
});