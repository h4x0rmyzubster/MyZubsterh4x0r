const mongoose = require('mongoose');

const { Schema } = mongoose;

const paymentTransactionSchema = new Schema({
  paymentId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  feeAmount: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  netAmount: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  sellerId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  buyerId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: false,
    default: null
  },
  status: {
    type: String,
    enum: ['in_attesa', 'confermato', 'fallito', 'pending', 'confirmed', 'failed'],
    default: 'in_attesa',
    index: true
  },
  moneroAddress: {
    type: String,
    required: true
  },
  fcmToken: {
    type: String,
    default: null
  },
  notificationSentAt: {
    type: Date,
    default: null
  },
  description: {
    type: String,
    default: ''
  },
  confirmations: {
    type: Number,
    default: 0,
    min: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  confirmedAt: {
    type: Date,
    default: null
  }
}, {
  versionKey: false
});

paymentTransactionSchema.index({ sellerId: 1, createdAt: -1 });
paymentTransactionSchema.index({ buyerId: 1, createdAt: -1 });

module.exports = mongoose.models.PaymentTransaction || mongoose.model('PaymentTransaction', paymentTransactionSchema);
