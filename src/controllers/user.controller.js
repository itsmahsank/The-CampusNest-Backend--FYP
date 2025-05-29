// const bcrypt = require("bcrypt.js");
const jwt = require("jsonwebtoken");
const { check, validationResult } = require("express-validator");
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const User = require("../models/user.model");

// Nodemailer Configuration
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Register User
const registerUser = async (req, res) => {
  try {
  
    console.log(req.body);
    const {
      firstName,
      lastName,
      email,
      password,
      mobileNo,
      gender,
      userType,
      address,
    } = req.body;
    if(firstName === "" || lastName === "" || email === "" || password === "" || mobileNo === "" || gender === "" || userType === "" || address === ""){
      return res.status(400).json({ message: "All fields are required" });
    }
    // Check if user already exists
    let existedUser = await User.findOne({ email });
    if (existedUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Generate verification token & expiration time
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const verificationTokenExpires = Date.now() + 3600000; // 1 hour expiry

    const user = new User({
      firstName,
      lastName,
      email,
      password, // Password will be hashed by the schema's pre-save middleware
      mobileNo,
      gender,
      userType,
      address,
      isVerified: false,
      verificationToken,
      verificationTokenExpires,
    });
// need to add when frontend is ready   

     // Send verification email
     const verificationLink = `${process.env.CLIENT_URL}/verify-email/${verificationToken}`;
     console.log("Verification Link:", verificationLink);


     const mailOptions = {
       from: process.env.EMAIL_USER,
       to: email,
       subject: "Verify Your Email - Campus-Nest",
       html: `<h2>Welcome to Campus-Nest</h2>
                    <p>Click the link below to verify your email:</p>
                    <a href="${verificationLink}">${verificationLink}</a>
                    <p>This link will expire in 1 hour.</p>`,
     };

   
    try {
      await transporter.sendMail(mailOptions);
      await user.save();
    } catch (emailErr) {
      console.error("Email send failed:", emailErr);
      return res.status(500).json({ message: "Failed to send verification email" });
    }
    

    res
      .status(200)
      .json({ message: "Verification email sent. Please check your inbox." });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Server error" });
  }
};

// Verify Email
const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;
    const user = await User.findOne({ verificationToken: token });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    if (user.verificationTokenExpires < Date.now()) {
      return res.status(400).json({
        message: "Verification link has expired. Please register again.",
      });
    }

    user.isVerified = true;
    user.verificationToken = null;
    user.verificationTokenExpires = null;
    await user.save();

    res
      .status(200)
      .json({ message: "Email verified successfully! You can now log in." });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Server error" });
  }
};

// Login User
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (email === "" || password === "") {
      return res.status(400).json({ message: "All fields are required" });
    }

    const userexist = await User.findOne({ email });
    if (!userexist) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    if (!userexist.isVerified) {
      return res.status(400).json({ message: "Please verify your email first" });
    }

    if (userexist.password !== password) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const accessToken = userexist.generateAccessToken(); // ✅
    const refreshToken = userexist.generateRefreshToken();
    
    userexist.refreshToken = refreshToken;
    await userexist.save();
    

    res.json({ accessToken, refreshToken, message: "Login successful" });

  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
};


// Forgot Password
const forgotPassword = async (req, res) => {
  try {
    
    const { email } = req.body;
    if (!email || email.trim() === "") {
      return res.status(400).json({ message: "Email is required" });
    }
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        errors: [
          {
            field: "email",
            message: "No account found with this email address",
          },
        ],
      });
    }

    // Generate verification code
    const verificationCode = Math.floor(
      100000 + Math.random() * 900000
    ).toString();
    const resetToken = crypto
      .createHash("sha256")
      .update(verificationCode)
      .digest("hex");

    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 1800000; // 30 minutes
    await user.save();

    // Send email
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: "Password Reset Verification Code",
      text: `Your verification code is: ${verificationCode}\n\nThis code will expire in 30 minutes.\n\nPassword Requirements:\n- Minimum 8 characters`,
    };

    await transporter.sendMail(mailOptions);
    res.json({ message: "Verification code sent to email" });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      errors: [
        {
          field: "server",
          message: "Server error occurred while processing your request",
        },
      ],
    });
  }
};

// Verify Reset Code
const verifyResetCode = async (req, res) => {
  try {

    const { email, code } = req.body;
    if(email === "" || code === ""){
      return res.status(400).json({ message: "All fields are required" });
    }
    const resetToken = crypto.createHash("sha256").update(code).digest("hex");

    const user = await User.findOne({
      email,
      resetPasswordToken: resetToken,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        errors: [
          {
            field: "code",
            message: "Invalid or expired verification code",
          },
        ],
      });
    }

    res.json({ message: "Code verified successfully" });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      errors: [
        {
          field: "server",
          message: "Server error occurred while verifying code",
        },
      ],
    });
  }
};

// Reset Password
const resetPassword = async (req, res) => {
  try {
    
    const { email, code, password } = req.body;
    if(email === "" || code === "" || password === ""){
      return res.status(400).json({ message: "All fields are required" });
    }
    const resetToken = crypto.createHash("sha256").update(code).digest("hex");

    const user = await User.findOne({
      email,
      resetPasswordToken: resetToken,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        errors: [
          {
            field: "code",
            message: "Invalid or expired verification code",
          },
        ],
      });
    }

    user.password = password; 
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({ message: "Password reset successful" });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      errors: [
        {
          field: "server",
          message: "Server error occurred while resetting password",
        },
      ],
    });
  }
};

// Get User Profile
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      errors: [
        {
          field: "server",
          message: "Server error occurred while fetching profile",
        },
      ],
    });
  }
};

module.exports = {
  registerUser,
  verifyEmail,
  loginUser,
  forgotPassword,
  verifyResetCode,
  resetPassword,
  getUserProfile,
};
