const express = require('express');
const chatRoutes = require('./routes/chat.routes');
const screeningRoutes = require('./routes/screening.routes');
const { initDatabases } = require('./config/db');
const { initRedis } = require('./config/redis');

const router = express.Router();

// Mount sub-routes
router.use('/', chatRoutes);
router.use('/', screeningRoutes);

/**
 * Initialize all chat module databases and caches.
 * Call this once at app startup.
 */
async function initChatModule() {
  try {
    initRedis();
    await initDatabases();
    console.log('✅ Chat module initialized');
  } catch (err) {
    console.error('❌ Chat module init failed:', err.message);
    // Non-fatal: the module should still mount routes
  }
}

module.exports = { router, initChatModule };
