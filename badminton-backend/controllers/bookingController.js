const Booking = require('../models/Booking');
const Court = require('../models/Court');

const { createOrder, verifySignature, simulatePayment } = require('../utils/paymentGateway');

exports.createBooking = async (req, res) => {
  try {
    const { courtId, date, startTime, durationHours } = req.body;

    if (durationHours !== 1 && durationHours !== 2) {
      return res.status(400).json({ message: 'durationHours must be 1 or 2' });
    }

    const court = await Court.findById(courtId);
    if (!court || !court.isActive) {
      return res.status(404).json({ message: 'Court not found or inactive' });
    }

    // Build slotTimes: "07:00" + 2 hours -> ["07:00", "08:00"]
    const [hour] = startTime.split(':').map(Number);
    const slotTimes = [];
    for (let i = 0; i < durationHours; i++) {
      const slotHour = hour + i;
      slotTimes.push(`${String(slotHour).padStart(2, '0')}:00`);
    }

    // Check if any of these slots are already taken
    const conflict = await Booking.findOne({
      court: courtId,
      date,
      status: { $in: ['pending', 'confirmed'] },
      slotTimes: { $in: slotTimes },
    });

    if (conflict) {
      return res.status(409).json({ message: 'One or more of these slots is already booked' });
    }

    const totalPrice = court.pricePerHour * durationHours;

    const booking = await Booking.create({
      user: req.user.id,
      court: courtId,
      date,
      slotTimes,
      durationHours,
      totalPrice,
      status: 'pending',
    });

    res.status(201).json({ booking });
  } catch (err) {
    res.status(500).json({ message: 'Failed to create booking', error: err.message });
  }
};

// controllers/bookingController.js — add these two, alongside your existing exports

exports.getMyBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user.id })
      .populate('court', 'name location')
      .sort({ createdAt: -1 });

    res.json({ bookings });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch bookings', error: err.message });
  }
};

const OPEN_HOUR = 6;
const CLOSE_HOUR = 22;

exports.getAvailability = async (req, res) => {
  try {
    const { courtId, date } = req.query;

    if (!courtId || !date) {
      return res.status(400).json({ message: 'courtId and date are required' });
    }

    const bookings = await Booking.find({
      court: courtId,
      date,
      status: { $in: ['pending', 'confirmed'] },
    });

    const takenSlots = new Set();
    bookings.forEach((b) => b.slotTimes.forEach((t) => takenSlots.add(t)));

    const slots = [];
    for (let hour = OPEN_HOUR; hour < CLOSE_HOUR; hour++) {
      const time = `${String(hour).padStart(2, '0')}:00`;
      slots.push({
        time,
        status: takenSlots.has(time) ? 'booked' : 'open',
      });
    }

    res.json({ courtId, date, slots });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch availability', error: err.message });
  }
};


exports.mockPay = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    const { paymentId, signature } = simulatePayment(booking.razorpayOrderId);
    res.json({ paymentId, signature });
  } catch (err) {
    res.status(500).json({ message: 'Mock payment failed', error: err.message });
  }
};



exports.createPaymentOrder = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'This booking does not belong to you' });
    }

    if (booking.status !== 'pending') {
      return res.status(400).json({ message: `Cannot pay for a booking with status "${booking.status}"` });
    }

    const order = createOrder({
      amount: booking.totalPrice * 100, // paise, matches Razorpay's convention
      currency: 'INR',
      receipt: booking._id.toString(),
    });

    booking.razorpayOrderId = order.id;
    await booking.save();

    res.status(200).json({ booking, order });
  } catch (err) {
    res.status(500).json({ message: 'Failed to create payment order', error: err.message });
  }
};

exports.verifyPayment = async (req, res) => {
  try {
    const { paymentId, signature } = req.body;
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    const isValid = verifySignature({
      orderId: booking.razorpayOrderId,
      paymentId,
      signature,
    });

    if (!isValid) {
      booking.status = 'cancelled';
      await booking.save();
      return res.status(400).json({ message: 'Payment verification failed' });
    }

    booking.status = 'confirmed';
    booking.razorpayPaymentId = paymentId;
    await booking.save();

    res.status(200).json({ message: 'Payment verified, booking confirmed', booking });
  } catch (err) {
    res.status(500).json({ message: 'Payment verification failed', error: err.message });
  }
};