const { Hostel } = require('../models/hostel.model'); // Ensure correct path to your model

const searchHostels = async (req, res) => {
  try {
    const {
      latitude,
      longitude,
      radius,
      priceMin,
      priceMax,
      amenities,
      sortBy,
      sortOrder
    } = req.body;

    console.log('Search Request Body:', req.body); // Debug incoming request

    // Validate required fields
    if (!latitude || !longitude || !radius) {
      return res.status(400).json({ error: 'Latitude, longitude, and radius are required.' });
    }

    // Build the query for geospatial search
    const query = {
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(longitude), parseFloat(latitude)],
          },
          $maxDistance: parseFloat(radius) * 1000, // Convert km to meters
        },
      },
    };

    // Add price range filter if provided
    if (priceMin || priceMax) {
      query.pricePerMonth = {};
      if (priceMin) query.pricePerMonth.$gte = Number(priceMin);
      if (priceMax) query.pricePerMonth.$lte = Number(priceMax);
    }

    // Add amenities filter if provided
    let parsedAmenities = [];
    if (amenities) {
      try {
        parsedAmenities = Array.isArray(amenities)
          ? amenities
          : JSON.parse(amenities);

        if (parsedAmenities.length > 0) {
          query.amenities = { $all: parsedAmenities };
        }
      } catch (err) {
        return res.status(400).json({ error: 'Invalid amenities format. Should be an array or JSON string.' });
      }
    }

    // Prepare sorting options
    const sortOptions = {};
    if (sortBy) {
      const validSortFields = ['pricePerMonth', 'averageRating'];
      if (!validSortFields.includes(sortBy)) {
        return res.status(400).json({ error: "Invalid sort field. Use 'pricePerMonth' or 'averageRating'." });
      }
      const order = sortOrder === 'desc' ? -1 : 1;
      sortOptions[sortBy] = order;
    }

    console.log('MongoDB Query:', JSON.stringify(query)); // Debug the MongoDB query

    // Perform the search with sorting
    const hostels = await Hostel.find(query).sort(sortOptions).lean();

    res.status(200).json({
      success: true,
      data: hostels,
    });
  } catch (error) {
    console.error('Error searching hostels:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
};

module.exports = {
  searchHostels,
};
