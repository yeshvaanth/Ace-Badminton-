const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    court: { type: mongoose.Schema.Types.ObjectId, ref: 'Court', required: true },
    date: { type: String, required: true }, // "YYYY-MM-DD"
    slotTimes: { type: [String], required: true }, // e.g. ["07:00"] or ["07:00","08:00"]
    durationHours: { type: Number, required: true, enum: [1, 2] },
    totalPrice: { type: Number, required: true },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'cancelled', 'expired'],
      default: 'pending',
    },
    razorpayOrderId: { type: String },
    razorpayPaymentId: { type: String },
  },
  { timestamps: true }
);

bookingSchema.index({ court: 1, date: 1, slotTimes: 1 }, { unique: true });

module.exports = mongoose.model('Booking', bookingSchema);