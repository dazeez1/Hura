const mongoose = require("mongoose");

const AdminSettingsSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    profilePicture: {
      type: String,
      default: null,
    },
    phoneNumber: {
      type: String,
      trim: true,
      default: null,
    },
    notifications: {
      allNotifications: {
        type: Boolean,
        default: true,
      },
      email: {
        type: Boolean,
        default: true,
      },
      dashboard: {
        type: Boolean,
        default: true,
      },
      system: {
        type: Boolean,
        default: true,
      },
      chat: {
        type: Boolean,
        default: true,
      },
    },
    preferences: {
      language: {
        type: String,
        enum: ["en", "fr", "rw"],
        default: "en",
      },
      timezone: {
        type: String,
        default: "Africa/Kigali",
      },
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Index for efficient queries
AdminSettingsSchema.index({ userId: 1 });

module.exports = mongoose.model("AdminSettings", AdminSettingsSchema);
