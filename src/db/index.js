const mongoose = require("mongoose");
const { DB_NAME } = require("../constants.js");

const connectDB = async () => {
  try {
    const connectionInstance = await mongoose.connect(
      `${process.env.MONGODB_URI}/${DB_NAME}`
    );
    console.log(
      `Connected to MongoDB Atlas  Successfully,${connectionInstance.connection.host}`
    );
  } catch (err) {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  }
};

module.exports = { connectDB };
