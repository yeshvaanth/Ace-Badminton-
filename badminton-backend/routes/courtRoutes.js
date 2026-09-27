const express = require('express');
const router = express.Router();
const { createCourt, getCourts } = require('../controllers/courtController');
const { protect, authorize } = require('../middleware/auth');

router.get('/', getCourts);
router.post('/', protect, authorize('admin'), createCourt);

module.exports = router;