const { Hostel } = require("../models/hostel.model");

const getHostelById = async (req, res) => {
  try {
    const { id } = req.params;
    console.log("🔍 Requested hostel ID:", id);

    // Validate ID format
    if (!id || id.length !== 24) {
      console.log(" Invalid ID format");
      return res.status(400).json({ success: false, message: "Invalid hostel ID format" });
    }

    const hostel = await Hostel.findById(id);
    console.log(" Hostel found:", hostel);

    if (!hostel) {
      return res.status(404).json({ success: false, message: "Hostel not found" });
    }

    res.status(200).json({
      success: true,
      data: hostel,
    });
  } catch (error) {
    console.error(" Error fetching hostel details:", error.message);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

module.exports = { getHostelById };
