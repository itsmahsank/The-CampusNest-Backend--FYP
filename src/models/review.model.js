
const reviewSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    hostelId: { type: mongoose.Schema.Types.ObjectId, ref: "Hostel", required: true },
    userName: String,
    recommended: { type: String, enum: ["yes", "no"], required: true },
    ratings: { type: Number, enum: [1, 2, 3, 4, 5], required: true },
    comment: String,
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const Review = mongoose.model("Review", reviewSchema);
module.exports = { Review };
