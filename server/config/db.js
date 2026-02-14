// src/config/db.js
import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

// Validate required environment variables
const requiredEnv = ['DB_NAME', 'DB_USER', 'DB_PASSWORD', 'DB_HOST'];
for (const envVar of requiredEnv) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST || 'localhost',
    dialect: 'mysql',
  

    // Connection pool settings (production-ready)
    pool: {
      max: parseInt(process.env.DB_POOL_MAX || '10', 10),
      min: parseInt(process.env.DB_POOL_MIN || '0', 10),
      acquire: 30000,
      idle: 10000,
    },

    // Logging control
    logging: process.env.NODE_ENV === 'development' ? console.log : false,

    // Recommended MySQL options
    timezone: '+01:00', // WAT timezone
    dialectOptions: {
      dateStrings: true,
      typeCast: true,
    },

    // Define global model options
    define: {
      timestamps: true,
      underscored: true, // snake_case column names (optional but common)
      paranoid: true,    // soft deletes (deletedAt)
    },
  }
);

// Test connection on startup (only in dev)
if (process.env.NODE_ENV !== 'production') {
  sequelize
    .authenticate()
    .then(() => {
      console.log('Database connection has been established successfully.');
    })
    .catch((err) => {
      console.error('Unable to connect to the database:', err);
      process.exit(1);
    });
}

export default sequelize;