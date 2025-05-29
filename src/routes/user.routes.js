const express = require("express");
const router = express.Router();
const {
  registerUser,
  verifyEmail,
  loginUser,
  forgotPassword,
  verifyResetCode,
  resetPassword,
  getUserProfile,
} = require("../controllers/user.controller");
const { verifyJWT } = require("../middlewares/auth.middleware");

// Register a new user
router.post("/register", registerUser);

// Verify email with token
router.get("/verify-email/:token", verifyEmail);

// Login user
router.post("/login", loginUser);

// Forgot password - request reset
router.post("/forgot-password", forgotPassword);

// Verify password reset code
router.post("/verify-reset-code", verifyResetCode);

// Reset password
router.post("/reset-password", resetPassword);

// Get user profile (protected route)
router.get("/profile", verifyJWT, getUserProfile);

module.exports = router;
