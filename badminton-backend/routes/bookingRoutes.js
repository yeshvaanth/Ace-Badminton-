const express = require('express');
const router = express.Router();
const {
  createBooking,
  createPaymentOrder,
  verifyPayment,
  getMyBookings,
  getAvailability,
  mockPay,
} = require('../controllers/bookingController');
const { protect } = require('../middleware/auth');

router.get('/availability', getAvailability);
router.get('/my', protect, getMyBookings);
router.post('/', protect, createBooking);
router.post('/:id/pay', protect, createPaymentOrder);
router.post('/:id/verify', protect, verifyPayment);
router.post('/:id/mock-pay', protect, mockPay);

module.exports = router;