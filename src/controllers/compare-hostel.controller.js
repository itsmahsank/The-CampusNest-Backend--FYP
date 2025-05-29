const { Hostel } = require('../models/hostel.model');

const compareHostels = async (req, res) => {
  try {
    const { hostelIds } = req.body;

    if (!Array.isArray(hostelIds) || hostelIds.length < 2) {
      return res.status(400).json({ message: 'Please select at least two hostels for comparison.' });
    }

    const hostels = await Hostel.find({ _id: { $in: hostelIds } });

    if (!hostels || hostels.length === 0) {
      return res.status(404).json({ message: 'No hostels found for comparison.' });
    }

    res.status(200).json({
      success: true,
      data: hostels,
    });
  } catch (error) {
    console.error('Error comparing hostels:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

module.exports = {
  compareHostels,
};