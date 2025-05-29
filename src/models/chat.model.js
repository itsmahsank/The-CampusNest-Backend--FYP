
const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  receiverId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  message: String,
  timestamp: { type: Date, default: Date.now },
});



const chatSchema = new mongoose.Schema({
  roomId: String, // format: userId_hostelOwnerId
  messages: [messageSchema],
});

module.exports = mongoose.model("Chat", chatSchema);

