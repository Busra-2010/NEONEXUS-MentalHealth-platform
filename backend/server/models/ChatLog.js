const mongoose = require('mongoose');

const chatLogSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true,
    index: true,
  },
  role: {
    type: String,
    enum: ['user', 'bot', 'system'],
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  language: {
    type: String,
    default: 'en',
  },
  intent: {
    type: String,
    default: null,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

// Only register the model if Mongoose is connected
let ChatLog;
try {
  ChatLog = mongoose.model('ChatLog');
} catch {
  ChatLog = mongoose.model('ChatLog', chatLogSchema);
}

module.exports = ChatLog;
