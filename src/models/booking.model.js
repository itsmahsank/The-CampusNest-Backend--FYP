const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    hostelId: { type: mongoose.Schema.Types.ObjectId, ref: "Hostel", required: true },
    firstName: String,
    lastName: String,
    email: String,
    phone: String,
    //roomType: String,
    moveInDate: Date,
    //lengthOfStay: String,
    //occupants: Number,
    message: String,
    isPaid: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Booking", bookingSchema);

