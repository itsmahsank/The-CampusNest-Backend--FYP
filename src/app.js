const express = require("express");
const http = require("http");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const dotenv = require("dotenv");
dotenv.config();
const { Server } = require("socket.io");
const Chat = require("./models/chat.model");
const chatRoutes = require("./routes/chat.routes");
const userRouter = require("./routes/user.routes");
const searchHostelRoutes = require("./routes/search-hostel.routes.js");
const registerHostelRoutes = require("./routes/register-hostel.routes.js");
const compareHostelRoutes = require("./routes/compare-hostel.routes.js");
const bookingRoutes = require("./routes/booking.routes.js");
const feedbackRoutes = require("./routes/feedback.routes.js");
const dashboardRoutes = require("./routes/dashboard.routes.js"); // Add dashboard routes
const hostelprofileRoutes = require("./routes/hostel.routes.js");

const { connectDB } = require("./db/index.js");
const { verifyJWT } = require("./middlewares/auth.middleware.js");

const app = express();

// Middleware
app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(cookieParser());

// Routes
app.use("/api", userRouter);
app.use("/api/chats", chatRoutes);
app.use("/api", searchHostelRoutes);
app.use("/api", registerHostelRoutes);
app.use("/api", compareHostelRoutes);
app.use("/api", bookingRoutes);
app.use("/api", feedbackRoutes);
app.use("/api", dashboardRoutes);
app.use("/api/hostel-profile", hostelprofileRoutes);


// Server and Socket setup
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // Replace with your frontend domain in prod
    methods: ["GET", "POST"],
  },
});

// WebSocket Real-time Logic
io.on("connection", (socket) => {
  console.log("User connected: Alec", socket.id);

  socket.on("joinRoom", ({ roomId }) => {
    socket.join(roomId);
    console.log(`User joined room: ${roomId}`);
  });

  socket.on("sendMessage", async (data) => {
    const { roomId, senderId, receiverId, message } = data;

    // Emit message to clients
    io.to(roomId).emit("receiveMessage", data);

    // Save message to DB
    try {
      let chat = await Chat.findOne({ roomId });
      const newMessage = { senderId, receiverId, message };

      if (chat) {
        chat.messages.push(newMessage);
      } else {
        chat = new Chat({ roomId, messages: [newMessage] });
      }

      await chat.save();
      console.log("Message saved to DB");
    } catch (err) {
      console.error("Error saving message:", err);
    }
  });

  socket.on("disconnect", () => {
    console.log("User disconnected: ", socket.id);
  });
});

module.exports = server;
