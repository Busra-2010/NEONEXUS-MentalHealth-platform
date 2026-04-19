const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const crypto = require('crypto');

/**
 * AES-256-GCM encryption helpers.
 *
 * Key: 32-byte hex string from process.env.CRISIS_ENCRYPTION_KEY
 * Each encrypted value stores:  iv (12 bytes) + authTag (16 bytes) + ciphertext
 * all hex-encoded and colon-separated:  "iv:authTag:ciphertext"
 */

const ENCRYPTION_KEY = process.env.CRISIS_ENCRYPTION_KEY;
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // GCM standard

function encryptMessage(plaintext) {
  if (!ENCRYPTION_KEY) {
    // If no key configured, store a placeholder — never store plaintext
    return '[encrypted — key not configured]';
  }
  const key = Buffer.from(ENCRYPTION_KEY, 'hex');
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');

  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

function decryptMessage(encryptedString) {
  if (!ENCRYPTION_KEY || !encryptedString.includes(':')) {
    return encryptedString; // not encrypted or no key
  }
  const [ivHex, authTagHex, ciphertext] = encryptedString.split(':');
  const key = Buffer.from(ENCRYPTION_KEY, 'hex');
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(ciphertext, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

/**
 * CrisisLog — records both keyword and BERT crisis detection results
 * for every analyzed message, regardless of outcome.
 */
const CrisisLog = sequelize.define('CrisisLog', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  sessionId: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'session_id',
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false,
    // Encrypted before storage — see hooks below
  },
  language: {
    type: DataTypes.STRING(10),
    allowNull: false,
    defaultValue: 'en',
  },
  keywordFlagged: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    field: 'keyword_flagged',
  },
  bertFlagged: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    field: 'bert_flagged',
  },
  bertSeverity: {
    type: DataTypes.STRING(10),
    allowNull: false,
    defaultValue: 'none',
    field: 'bert_severity',
    validate: {
      isIn: [['none', 'low', 'medium', 'high']],
    },
  },
  bertConfidence: {
    type: DataTypes.FLOAT,
    allowNull: false,
    defaultValue: 0.0,
    field: 'bert_confidence',
  },
  escalated: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  detectedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    field: 'detected_at',
  },
}, {
  tableName: 'crisis_logs',
  timestamps: false,

  hooks: {
    // Encrypt message before any database write
    beforeCreate(instance) {
      if (instance.message) {
        instance.message = encryptMessage(instance.message);
      }
    },
    beforeUpdate(instance) {
      if (instance.changed('message') && instance.message) {
        instance.message = encryptMessage(instance.message);
      }
    },
  },
});

// Attach decrypt helper so callers can read messages back
CrisisLog.decryptMessage = decryptMessage;

module.exports = CrisisLog;
