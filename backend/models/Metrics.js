const mongoose = require("mongoose");

const MetricsSchema = new mongoose.Schema(
  {
    sessionId: {
      type: String,
      required: true,
      unique: true,
    },
    userId: {
      type: String,
      default: null,
    },
    date: {
      type: Date,
      required: true,
    },
    startTime: {
      type: Date,
      default: Date.now,
    },
    endTime: {
      type: Date,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    sessionDuration: {
      type: Number,
      default: 0,
    },
    userAgent: {
      type: String,
      default: "Unknown",
    },
    ipAddress: {
      type: String,
      default: "Unknown",
    },
    sessionType: {
      type: String,
      default: "chatbot",
      required: true,
    },
    // Daily aggregated metrics
    totalSessions: {
      type: Number,
      default: 0,
    },
    activeSessions: {
      type: Number,
      default: 0,
    },
    totalMessages: {
      type: Number,
      default: 0,
    },
    userMessages: {
      type: Number,
      default: 0,
    },
    botMessages: {
      type: Number,
      default: 0,
    },
    averageResponseTime: {
      type: Number,
      default: 0,
    },
    averageSessionDuration: {
      type: Number,
      default: 0,
    },
    // Intent tracking
    topIntents: [
      {
        intent: String,
        count: Number,
      },
    ],
    // Language tracking
    languages: [
      {
        language: String,
        count: Number,
      },
    ],
    // File uploads
    fileUploads: {
      type: Number,
      default: 0,
    },
    // Error tracking
    errors: {
      type: Number,
      default: 0,
    },
    // User engagement
    returningUsers: {
      type: Number,
      default: 0,
    },
    newUsers: {
      type: Number,
      default: 0,
    },
    // Hourly breakdown for real-time metrics
    hourlyData: [
      {
        hour: Number,
        sessions: Number,
        messages: Number,
        activeUsers: Number,
      },
    ],
    // Message log for the session
    messages: {
      type: [
        {
          role: String,
          content: String,
          hasFile: Boolean,
          fileType: String,
          intent: String,
          language: String,
          responseTime: Number,
          timestamp: { type: Date, default: Date.now },
        },
      ],
      default: [],
    },
  },
  { timestamps: true }
);

// Index for efficient queries
MetricsSchema.index({ date: -1 });

module.exports = mongoose.model("Metrics", MetricsSchema);
