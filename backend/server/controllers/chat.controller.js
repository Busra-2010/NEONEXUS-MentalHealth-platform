const { v4: uuidv4 } = require('uuid');
const { setSession, getSession } = require('../config/redis');
const { detectAndLog } = require('../services/crisisDetection.service');
const { classifyIntent } = require('../services/nlp.service');
const { generateReply } = require('../services/chat.service');

// Try to require ChatLog — it may fail if MongoDB is not connected
let ChatLog;
try {
  ChatLog = require('../models/ChatLog');
} catch {
  ChatLog = null;
}

const mongoose = require('mongoose');

/**
 * Check if MongoDB is connected and ready for writes.
 */
function isMongoConnected() {
  return ChatLog && mongoose.connection && mongoose.connection.readyState === 1;
}

/**
 * POST /api/chat/session
 * Create an anonymous session, return UUID token.
 */
async function createSession(req, res) {
  try {
    const sessionId = uuidv4();
    const sessionData = {
      id: sessionId,
      createdAt: new Date().toISOString(),
      messageCount: 0,
    };

    await setSession(sessionId, sessionData);

    res.status(200).json({
      success: true,
      sessionId,
      createdAt: sessionData.createdAt,
    });
  } catch (err) {
    console.error('createSession error:', err);
    res.status(500).json({ success: false, error: 'Failed to create session' });
  }
}

/**
 * POST /api/chat/message
 * Body: { sessionId, message, language }
 * Returns: { reply, crisisDetected, intent, severity }
 */
async function handleMessage(req, res) {
  try {
    const { sessionId, message, language = 'en' } = req.body;

    if (!sessionId || !message) {
      return res.status(400).json({
        success: false,
        error: 'sessionId and message are required',
      });
    }

    // 1. Two-layer crisis detection (keyword + BERT)
    const crisisResult = await detectAndLog(sessionId, message, language);

    // 2. Intent classification
    const { intent, confidence } = await classifyIntent(message, language);

    // 3. Generate reply — escalate if either layer fires
    let reply;
    if (crisisResult.escalated) {
      // Override reply with crisis-specific response
      reply = generateReply(message, 'crisis', language);
    } else {
      reply = generateReply(message, intent, language);
    }

    // 4. Log to MongoDB (only if connected — skip to avoid 10s buffer timeout)
    if (isMongoConnected()) {
      try {
        await ChatLog.create({
          sessionId,
          role: 'user',
          message,
          language,
          intent,
          timestamp: new Date(),
        });
        await ChatLog.create({
          sessionId,
          role: 'bot',
          message: reply,
          language,
          intent,
          timestamp: new Date(),
        });
      } catch (logErr) {
        console.warn('ChatLog write failed (MongoDB may be offline):', logErr.message);
      }
    }

    // 5. Update session message count
    const session = await getSession(sessionId);
    if (session) {
      session.messageCount = (session.messageCount || 0) + 1;
      await setSession(sessionId, session);
    }

    const response = {
      success: true,
      reply,
      crisisDetected: crisisResult.crisisDetected,
      escalated: crisisResult.escalated,
      intent,
      confidence,
      bertSeverity: crisisResult.bertResult.severity,
      bertConfidence: crisisResult.bertResult.confidence,
    };

    if (crisisResult.escalated) {
      response.helplines = crisisResult.helplines;
      response.severity = crisisResult.bertResult.severity !== 'none'
        ? crisisResult.bertResult.severity
        : 'crisis';
    }

    res.status(200).json(response);
  } catch (err) {
    console.error('handleMessage error:', err);
    res.status(500).json({ success: false, error: 'Failed to process message' });
  }
}

module.exports = { createSession, handleMessage };
