const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const CrisisEvent = sequelize.define('CrisisEvent', {
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
  },
  language: {
    type: DataTypes.STRING(10),
    allowNull: false,
    defaultValue: 'en',
  },
  detectedKeywords: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: [],
    field: 'detected_keywords',
  },
  detectedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    field: 'detected_at',
  },
}, {
  tableName: 'crisis_events',
  timestamps: false,
});

module.exports = CrisisEvent;
