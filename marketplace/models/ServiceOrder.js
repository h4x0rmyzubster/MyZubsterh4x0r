// models/ServiceOrder.js
const { DataTypes } = require('sequelize');
const sequelize = require('./index');

const ServiceOrder = sequelize.define('ServiceOrder', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  buyerId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'users', key: 'id' }
  },
  sellerId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'users', key: 'id' }
  },
  skillId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'skills', key: 'id' }
  },
  amount: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  currency: {
    type: DataTypes.STRING(3),
    defaultValue: 'USD'
  },
  paymentOrderId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'ID dell\'ordine in MyZubster'
  },
  moneroAddress: {
    type: DataTypes.STRING,
    allowNull: true
  },
  moneroAmount: {
    type: DataTypes.FLOAT,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('pending', 'awaiting_payment', 'paid', 'in_progress', 'completed', 'cancelled', 'disputed'),
    defaultValue: 'pending'
  },
  paymentStatus: {
    type: DataTypes.ENUM('pending', 'confirmed', 'failed'),
    defaultValue: 'pending'
  },
  txHash: {
    type: DataTypes.STRING,
    allowNull: true
  },
  confirmations: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  paidAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  requirements: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  deliveryNotes: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'service_orders',
  timestamps: true
});

module.exports = ServiceOrder;