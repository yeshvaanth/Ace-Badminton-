const mongoose = require('mongoose');

const courtSchema = new mongoose.Schema(
  {
    name: { type: String, required: true }, // e.g. "Court 1"
    location: { type: String },
    pricePerHour: { type: Number, required: true, default: 200 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Court', courtSchema);