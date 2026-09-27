const Court = require('../models/Court');

exports.createCourt = async (req, res) => {
  try {
    const { name, location, pricePerHour } = req.body;

    if (!name || !pricePerHour) {
      return res.status(400).json({ message: 'name and pricePerHour are required' });
    }

    const court = await Court.create({ name, location, pricePerHour });
    res.status(201).json({ court });
  } catch (err) {
    res.status(500).json({ message: 'Failed to create court', error: err.message });
  }
};

exports.getCourts = async (req, res) => {
  try {
    const courts = await Court.find({ isActive: true });
    res.json({ courts });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch courts', error: err.message });
  }
};