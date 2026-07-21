const mongoose = require('mongoose');

const CounterSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 }
});
const Counter = mongoose.model('Counter', CounterSchema);

const OrderSchema = new mongoose.Schema({
  orderNumber: { type: Number, unique: true },
  offer: { type: mongoose.Schema.Types.ObjectId, ref: 'Offer', required: true },
  buyer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  quantity: { type: Number, default: 1 },
  totalPrice: { type: Number, required: true },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'completed', 'cancelled'],
    default: 'pending'
  },
  moneroSubaddress: { type: String, default: null },
  moneroAddressIndex: { type: Number, default: null },
  moneroPaymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'confirmed', 'expired'],
    default: 'pending'
  },
  moneroPaymentTxid: { type: String, default: null },
  createdAt: { type: Date, default: Date.now }
});

// Genera orderNumber in modo incrementale
OrderSchema.pre('save', async function(next) {
  if (this.isNew) {
    try {
      const counter = await Counter.findByIdAndUpdate(
        'orderNumber',
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
      );
      this.orderNumber = counter.seq;
    } catch (err) {
      return next(err);
    }
  }
  next();
});

module.exports = mongoose.model('Order', OrderSchema);
