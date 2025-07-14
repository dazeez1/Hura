const User = require("../models/User");
const jwt = require("jsonwebtoken");
const { validationResult } = require("express-validator");
const crypto = require("crypto");
const nodemailer = require("nodemailer");

// Helper: Generate JWT
function generateToken(user) {
  return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
}

// @desc    User/Admin Sign Up
// @route   POST /api/auth/signup
exports.signup = async (req, res) => {
  try {
    const { fullName, email, password, role } = req.body;
    // Basic validation
    if (!fullName || !email || !password) {
      return res.status(400).json({ error: "All fields are required." });
    }
    if (role && !["user", "admin"].includes(role)) {
      return res.status(400).json({ error: "Invalid role." });
    }
    // Check for existing user
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ error: "Email already in use." });
    }
    // Create user
    const user = new User({
      fullName,
      email,
      password,
      role: role || "user",
    });
    await user.save();
    // Generate JWT
    const token = generateToken(user);
    res.status(201).json({
      message: "User registered successfully.",
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
      },
      token,
    });
  } catch (err) {
    res.status(500).json({ error: "Server error", details: err.message });
  }
};

// @desc    User/Admin Login
// @route   POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res
        .status(400)
        .json({ error: "Email and password are required." });
    }
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials." });
    }
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid credentials." });
    }

    // Create login session
    const userAgent = req.headers["user-agent"] || "Unknown";
    const ipAddress = req.ip || req.connection.remoteAddress;
    const sessionId = crypto.randomBytes(16).toString("hex");

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );
    res.status(200).json({
      message: "Login successful.",
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
      },
      token,
      sessionId,
    });
  } catch (err) {
    res.status(500).json({ error: "Server error", details: err.message });
  }
};

// @desc    Initiate Password Reset
// @route   POST /api/auth/password-reset
exports.initiatePasswordReset = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: "Email is required." });
    }
    // Find user by email
    const user = await User.findOne({ email });
    if (user) {
      // Generate a secure reset token
      const resetToken = crypto.randomBytes(32).toString("hex");
      // Set token and expiry (1 hour)
      user.passwordResetToken = resetToken;
      user.passwordResetExpires = Date.now() + 3600000;
      await user.save();

      // Create reset URL (now points to frontend with token as query param)
      const resetUrl = `${process.env.CLIENT_URL}/frontend/src/html/auth/reset-password.html?token=${resetToken}`;

      // Set up nodemailer transporter
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });

      // Email content
      const mailOptions = {
        from: `Hura <${process.env.EMAIL_USER}>`,
        to: user.email,
        subject: "Password Reset Request",
        html: `<p>You requested a password reset for your Hura account.</p>
               <p>Click <a href="${resetUrl}">here</a> to reset your password. This link is valid for 1 hour.</p>`,
      };

      // Send the email
      await transporter.sendMail(mailOptions);
    }
    // Always respond with a generic message for security
    res
      .status(200)
      .json({ message: "If that email exists, a reset link has been sent." });
  } catch (err) {
    res.status(500).json({ error: "Server error", details: err.message });
  }
};

// @desc    Complete Password Reset
// @route   POST /api/auth/password-reset/:token
exports.completePasswordReset = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;
    if (!password) {
      return res.status(400).json({ error: "New password is required." });
    }
    // Find user by reset token and check expiry
    const user = await User.findOne({
      passwordResetToken: token,
      passwordResetExpires: { $gt: Date.now() },
    });
    if (!user) {
      return res.status(400).json({ error: "Invalid or expired reset token." });
    }
    // Set new password (will be hashed by pre-save hook)
    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();
    res.status(200).json({ message: "Password has been reset successfully." });
  } catch (err) {
    res.status(500).json({ error: "Server error", details: err.message });
  }
};
