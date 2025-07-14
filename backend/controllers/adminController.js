const AdminSettings = require("../models/AdminSettings");
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const fs = require("fs");
const path = require("path");

// @desc    Get admin settings
// @route   GET /api/admin/settings
exports.getSettings = async (req, res) => {
  try {
    const userId = req.user.id;

    let settings = await AdminSettings.findOne({ userId }).populate(
      "userId",
      "fullName email"
    );

    if (!settings) {
      // Create default settings if none exist
      settings = new AdminSettings({
        userId,
      });
      await settings.save();
      await settings.populate("userId", "fullName email");
    }

    res.status(200).json({
      success: true,
      data: settings,
    });
  } catch (err) {
    res.status(500).json({ error: "Server error", details: err.message });
  }
};

// @desc    Update admin settings
// @route   PUT /api/admin/settings
exports.updateSettings = async (req, res) => {
  try {
    const userId = req.user.id;
    const { notifications, preferences } = req.body;

    let settings = await AdminSettings.findOne({ userId });

    if (!settings) {
      settings = new AdminSettings({ userId });
    }

    // Update notifications if provided
    if (notifications) {
      settings.notifications = {
        ...settings.notifications,
        ...notifications,
      };
    }

    // Update preferences if provided
    if (preferences) {
      settings.preferences = {
        ...settings.preferences,
        ...preferences,
      };
    }

    settings.lastUpdated = new Date();
    await settings.save();

    await settings.populate("userId", "fullName email");

    res.status(200).json({
      success: true,
      message: "Settings updated successfully",
      data: settings,
    });
  } catch (err) {
    res.status(500).json({ error: "Server error", details: err.message });
  }
};

// @desc    Upload profile picture
// @route   POST /api/admin/upload-photo
exports.uploadProfilePicture = async (req, res) => {
  try {
    const userId = req.user.id;

    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/gif"];
    if (!allowedTypes.includes(req.file.mimetype)) {
      return res.status(400).json({
        error: "Invalid file type. Only JPEG, PNG, and GIF are allowed",
      });
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (req.file.size > maxSize) {
      return res
        .status(400)
        .json({ error: "File size too large. Maximum size is 5MB" });
    }

    let settings = await AdminSettings.findOne({ userId });

    if (!settings) {
      settings = new AdminSettings({ userId });
    }

    // Delete old profile picture if exists
    if (settings.profilePicture) {
      const oldPicturePath = path.join(
        __dirname,
        "..",
        "uploads",
        path.basename(settings.profilePicture)
      );
      if (fs.existsSync(oldPicturePath)) {
        fs.unlinkSync(oldPicturePath);
      }
    }

    // Save new profile picture path
    const pictureUrl = `/uploads/${req.file.filename}`;
    settings.profilePicture = pictureUrl;
    settings.lastUpdated = new Date();

    await settings.save();

    res.status(200).json({
      success: true,
      message: "Profile picture uploaded successfully",
      data: {
        profilePicture: pictureUrl,
      },
    });
  } catch (err) {
    res.status(500).json({ error: "Server error", details: err.message });
  }
};

// @desc    Change admin password
// @route   PUT /api/admin/change-password
exports.changePassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res
        .status(400)
        .json({ error: "Current password and new password are required" });
    }

    if (newPassword.length < 6) {
      return res
        .status(400)
        .json({ error: "New password must be at least 6 characters long" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ error: "Current password is incorrect" });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (err) {
    res.status(500).json({ error: "Server error", details: err.message });
  }
};

// @desc    Update admin email
// @route   PUT /api/admin/update-email
exports.updateEmail = async (req, res) => {
  try {
    const userId = req.user.id;
    const { newEmail, password } = req.body;

    if (!newEmail || !password) {
      return res
        .status(400)
        .json({ error: "New email and password are required" });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      return res.status(400).json({ error: "Invalid email format" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Verify password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: "Password is incorrect" });
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email: newEmail });
    if (existingUser && existingUser._id.toString() !== userId) {
      return res.status(409).json({ error: "Email already in use" });
    }

    // Update email
    user.email = newEmail;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Email updated successfully",
      data: {
        email: newEmail,
      },
    });
  } catch (err) {
    res.status(500).json({ error: "Server error", details: err.message });
  }
};

// @desc    Admin logout
// @route   POST /api/admin/logout
exports.logout = async (req, res) => {
  try {
    const userId = req.user.id;

    // End any active sessions for this user
    // await require("../models/ChatSession").updateMany(
    //   { userId, isActive: true },
    //   {
    //     isActive: false,
    //     endTime: new Date(),
    //     sessionDuration: 0, // Will be calculated by the model
    //   }
    // );

    res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (err) {
    res.status(500).json({ error: "Server error", details: err.message });
  }
};

// @desc    Get all users (admin only)
// @route   GET /api/admin/users
exports.getAllUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || "";
    const role = req.query.role || "";

    // Build query
    let query = {};

    // Search by name or email
    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    // Filter by role
    if (role) {
      query.role = role;
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Get users with pagination
    const users = await User.find(query)
      .select("-password -passwordResetToken -passwordResetExpires")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Get total count for pagination
    const totalUsers = await User.countDocuments(query);
    const totalPages = Math.ceil(totalUsers / limit);

    // Get user statistics
    const userStats = await User.aggregate([
      {
        $group: {
          _id: null,
          totalUsers: { $sum: 1 },
          adminUsers: { $sum: { $cond: [{ $eq: ["$role", "admin"] }, 1, 0] } },
          regularUsers: { $sum: { $cond: [{ $eq: ["$role", "user"] }, 1, 0] } },
        },
      },
    ]);

    const stats = userStats[0] || {
      totalUsers: 0,
      adminUsers: 0,
      regularUsers: 0,
    };

    res.status(200).json({
      success: true,
      data: {
        users,
        pagination: {
          currentPage: page,
          totalPages,
          totalUsers,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
        stats,
      },
    });
  } catch (err) {
    res.status(500).json({ error: "Server error", details: err.message });
  }
};

// @desc    Get user count for dashboard metrics
// @route   GET /api/admin/users/count
exports.getUserCount = async (req, res) => {
  try {
    const userStats = await User.aggregate([
      {
        $group: {
          _id: null,
          totalUsers: { $sum: 1 },
          adminUsers: { $sum: { $cond: [{ $eq: ["$role", "admin"] }, 1, 0] } },
          regularUsers: { $sum: { $cond: [{ $eq: ["$role", "user"] }, 1, 0] } },
        },
      },
    ]);

    const stats = userStats[0] || {
      totalUsers: 0,
      adminUsers: 0,
      regularUsers: 0,
    };

    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (err) {
    res.status(500).json({ error: "Server error", details: err.message });
  }
};

// @desc    Get user profile data (profile picture, phone, notifications)
// @route   GET /api/admin/profile
exports.getUserProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get user data
    const user = await User.findById(userId).select(
      "-password -passwordResetToken -passwordResetExpires"
    );

    // Get admin settings
    let settings = await AdminSettings.findOne({ userId });

    if (!settings) {
      // Create default settings if none exist
      settings = new AdminSettings({ userId });
      await settings.save();
    }

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id,
          fullName: user.fullName,
          email: user.email,
          phoneNumber: user.phoneNumber,
          role: user.role,
        },
        settings: {
          profilePicture: settings.profilePicture,
          phoneNumber: settings.phoneNumber,
          notifications: settings.notifications,
          preferences: settings.preferences,
        },
      },
    });
  } catch (err) {
    res.status(500).json({ error: "Server error", details: err.message });
  }
};

// @desc    Update user profile data
// @route   PUT /api/admin/profile
exports.updateUserProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { phoneNumber, notifications, preferences } = req.body;

    // Update user phone number if provided
    if (phoneNumber !== undefined) {
      await User.findByIdAndUpdate(userId, { phoneNumber });
    }

    // Get or create admin settings
    let settings = await AdminSettings.findOne({ userId });
    if (!settings) {
      settings = new AdminSettings({ userId });
    }

    // Update phone number in settings if provided
    if (phoneNumber !== undefined) {
      settings.phoneNumber = phoneNumber;
    }

    // Update notifications if provided
    if (notifications) {
      settings.notifications = {
        ...settings.notifications,
        ...notifications,
      };
    }

    // Update preferences if provided
    if (preferences) {
      settings.preferences = {
        ...settings.preferences,
        ...preferences,
      };
    }

    settings.lastUpdated = new Date();
    await settings.save();

    // Get updated user data
    const user = await User.findById(userId).select(
      "-password -passwordResetToken -passwordResetExpires"
    );

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: {
        user: {
          id: user._id,
          fullName: user.fullName,
          email: user.email,
          phoneNumber: user.phoneNumber,
          role: user.role,
        },
        settings: {
          profilePicture: settings.profilePicture,
          phoneNumber: settings.phoneNumber,
          notifications: settings.notifications,
          preferences: settings.preferences,
        },
      },
    });
  } catch (err) {
    res.status(500).json({ error: "Server error", details: err.message });
  }
};

// @desc    Upload profile picture (base64)
// @route   POST /api/admin/profile-picture
exports.uploadProfilePictureBase64 = async (req, res) => {
  try {
    const userId = req.user.id;
    const { profilePicture } = req.body;

    if (!profilePicture) {
      return res
        .status(400)
        .json({ error: "Profile picture data is required" });
    }

    // Validate base64 image
    if (!profilePicture.startsWith("data:image/")) {
      return res.status(400).json({ error: "Invalid image format" });
    }

    // Get or create admin settings
    let settings = await AdminSettings.findOne({ userId });
    if (!settings) {
      settings = new AdminSettings({ userId });
    }

    // Save profile picture (base64)
    settings.profilePicture = profilePicture;
    settings.lastUpdated = new Date();
    await settings.save();

    res.status(200).json({
      success: true,
      message: "Profile picture uploaded successfully",
      data: {
        profilePicture: profilePicture,
      },
    });
  } catch (err) {
    res.status(500).json({ error: "Server error", details: err.message });
  }
};

// @desc    Remove profile picture
// @route   DELETE /api/admin/profile-picture
exports.removeProfilePicture = async (req, res) => {
  try {
    const userId = req.user.id;

    let settings = await AdminSettings.findOne({ userId });
    if (!settings) {
      settings = new AdminSettings({ userId });
    }

    settings.profilePicture = null;
    settings.lastUpdated = new Date();
    await settings.save();

    res.status(200).json({
      success: true,
      message: "Profile picture removed successfully",
    });
  } catch (err) {
    res.status(500).json({ error: "Server error", details: err.message });
  }
};
