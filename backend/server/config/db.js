const { Sequelize } = require('sequelize');
const mongoose = require('mongoose');

/**
 * Initialize Sequelize — uses DATABASE_URL for PostgreSQL in production,
 * falls back to SQLite for local development.
 */
function createSequelize() {
  if (process.env.DATABASE_URL) {
    return new Sequelize(process.env.DATABASE_URL, {
      dialect: 'postgres',
      logging: process.env.NODE_ENV === 'development' ? console.log : false,
      pool: { max: 5, min: 0, acquire: 30000, idle: 10000 },
    });
  }

  // Fallback: SQLite for local dev
  return new Sequelize({
    dialect: 'sqlite',
    storage: process.env.CHAT_DB_PATH || './data/chat.sqlite',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
  });
}

const sequelize = createSequelize();

/**
 * Connect to MongoDB (for ChatLog storage).
 * Silently skips if MONGODB_URI is not configured.
 */
async function connectMongo() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.warn('⚠️  MONGODB_URI not set — ChatLog persistence disabled');
    return null;
  }
  try {
    await mongoose.connect(uri);
    console.log('🍃 MongoDB connected');
    return mongoose.connection;
  } catch (err) {
    console.error('❌ MongoDB connection failed:', err.message);
    return null;
  }
}

/**
 * Sync Sequelize models and connect Mongo.
 */
async function initDatabases() {
  await sequelize.sync({ alter: false });
  console.log('🐘 Sequelize synced');
  await connectMongo();
}

module.exports = { sequelize, mongoose, initDatabases };
