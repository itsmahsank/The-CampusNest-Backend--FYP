const { Hostel } = require('../models/hostel.model');
const { uploadOnCloudinary } = require('../utils/cloudinary');

const registerHostel = async (req, res) => {
  try {
    const { name, location, contactNumber, pricePerMonth, amenities, description } = req.body;

    if (!name || !location || !contactNumber || !pricePerMonth || !amenities) {
      return res.status(400).json({ error: 'All fields are required.' });
    }

    const parsedLocation = JSON.parse(location);
    const parsedAmenities = JSON.parse(amenities);

    // Validate coordinates
    if (!parsedLocation.latitude || !parsedLocation.longitude) {
      return res.status(400).json({ error: 'Latitude and longitude are required.' });
    }

    let virtualTourUrl = null;
    if (req.file) {
      virtualTourUrl = await uploadOnCloudinary(req.file.path);
      if (!virtualTourUrl) {
        return res.status(500).json({ error: 'Video upload failed.' });
      }
    }

    const newHostel = new Hostel({
      ownerId: req.user.id,
      name,
      location: {
        type: 'Point',
        coordinates: [parsedLocation.longitude, parsedLocation.latitude], // MongoDB expects [longitude, latitude]
        address: parsedLocation.address,
        city: parsedLocation.city,
        state: parsedLocation.state,
        country: parsedLocation.country,
      },
      contactNumber,
      pricePerMonth,
      amenities: parsedAmenities,
      virtualTour: virtualTourUrl,
      description,
    });

    await newHostel.save();
    res.status(201).json({ message: 'Hostel registered successfully', hostel: newHostel });
  } catch (err) {
    console.error('Hostel registration error:', err.message);
    res.status(500).json({ error: 'Something went wrong' });
  }
};

module.exports = {
  registerHostel,
};