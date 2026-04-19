const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const ScreeningResult = sequelize.define('ScreeningResult', {
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
  type: {
    type: DataTypes.ENUM('PHQ9', 'GAD7', 'GHQ12'),
    allowNull: false,
  },
  score: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  severity: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'minimal',
  },
  answers: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: [],
  },
  completedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    field: 'completed_at',
  },
}, {
  tableName: 'screening_results',
  timestamps: false,
});

module.exports = ScreeningResult;
