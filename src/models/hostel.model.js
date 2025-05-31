const mongoose = require("mongoose");

const hostelSchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: { type: String, required: true },
    location: {
      type: {
        type: String,
        enum: ["Point"], // For MongoDB geospatial queries
        required: true,
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true,
      },
      address: String,
      city: String,
      state: String,
      country: String,
    },
    contactNumber: { type: String, required: true },
    pricePerMonth: { type: Number, required: true },
    amenities: [String],
    virtualTour: { type: String }, // URL to video
    description: { type: String }, 
    averageRating: { type: Number, default: 0 },
    totalReviews: { type: Number, default: 0 },
    feedback: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        userName: String,
        ratings: {
          type: Number,
          enum: [1, 2, 3, 4, 5],
          required: true,
        },
        comment: { type: String, required: true },
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

// Create a 2D geospatial index on the entire 'location' field (GeoJSON Point)
hostelSchema.index({ location: "2dsphere" });


const Hostel = mongoose.model("Hostel", hostelSchema);
module.exports = Hostel;