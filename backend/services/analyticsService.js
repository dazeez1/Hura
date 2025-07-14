const Metrics = require("../models/Metrics");
const redis = require("redis");

class AnalyticsService {
  constructor() {
    this.redisClient = redis.createClient({
      url: process.env.REDIS_URL || "redis://localhost:6379",
    });
    this.redisClient.connect().catch(console.error);
  }

  // Real-time metrics calculation
  async getRealTimeMetrics() {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    try {
      // Get active sessions
      const activeSessions = await Metrics.countDocuments({
        isActive: true,
        sessionType: "chatbot",
        startTime: { $gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) },
      });

      // Get sessions started in last hour
      const recentSessions = await Metrics.countDocuments({
        sessionType: "chatbot",
        startTime: { $gte: oneHourAgo },
      });

      // Get messages in last hour
      const recentMessages = await Metrics.aggregate([
        {
          $match: {
            sessionType: "chatbot",
            "messages.timestamp": { $gte: oneHourAgo },
          },
        },
        {
          $project: {
            messageCount: {
              $size: {
                $filter: {
                  input: "$messages",
                  cond: { $gte: ["$$this.timestamp", oneHourAgo] },
                },
              },
            },
          },
        },
        {
          $group: {
            _id: null,
            totalMessages: { $sum: "$messageCount" },
          },
        },
      ]);

      // Get top intents from today
      const topIntents = await Metrics.aggregate([
        {
          $match: {
            sessionType: "chatbot",
            startTime: { $gte: today },
            "messages.intent": { $exists: true, $ne: null },
          },
        },
        { $unwind: "$messages" },
        {
          $match: {
            "messages.intent": { $exists: true, $ne: null },
          },
        },
        {
          $group: {
            _id: "$messages.intent",
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
        { $limit: 5 },
      ]);

      // Get average response time
      const avgResponseTime = await Metrics.aggregate([
        {
          $match: {
            sessionType: "chatbot",
            startTime: { $gte: today },
            "messages.responseTime": { $exists: true, $ne: null },
          },
        },
        { $unwind: "$messages" },
        {
          $match: {
            "messages.responseTime": { $exists: true, $ne: null },
          },
        },
        {
          $group: {
            _id: null,
            avgResponseTime: { $avg: "$messages.responseTime" },
          },
        },
      ]);

      // Get language distribution
      const languageDistribution = await Metrics.aggregate([
        {
          $match: {
            sessionType: "chatbot",
            startTime: { $gte: today },
            "messages.language": { $exists: true, $ne: null },
          },
        },
        { $unwind: "$messages" },
        {
          $match: {
            "messages.language": { $exists: true, $ne: null },
          },
        },
        {
          $group: {
            _id: "$messages.language",
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
      ]);

      // Calculate session change percentage
      const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
      const yesterdaySessions = await Metrics.countDocuments({
        sessionType: "chatbot",
        startTime: { $gte: yesterday, $lt: today },
      });

      const todaySessions = await Metrics.countDocuments({
        sessionType: "chatbot",
        startTime: { $gte: today },
      });

      const sessionsChange =
        yesterdaySessions > 0
          ? Math.round(
              ((todaySessions - yesterdaySessions) / yesterdaySessions) * 100
            )
          : 0;

      // System performance metrics
      const systemMetrics = await this.getSystemMetrics();

      return {
        activeSessions,
        sessionsChange,
        topIntent: topIntents[0]?._id || "Travel Planning",
        nlpDrift: this.calculateNlpDrift(topIntents),
        translationAccuracy: this.calculateTranslationAccuracy(),
        accuracyChange: -2, // Simulated for now
        totalMessages: recentMessages[0]?.totalMessages || 0,
        averageResponseTime: Math.round(
          avgResponseTime[0]?.avgResponseTime || 0
        ),
        topIntents: topIntents.map((item) => ({
          intent: item._id,
          count: item.count,
        })),
        languageDistribution: languageDistribution.map((item) => ({
          language: item._id,
          count: item.count,
        })),
        systemMetrics,
      };
    } catch (error) {
      console.error("Error calculating real-time metrics:", error);
      throw error;
    }
  }

  // Enhanced historical analytics
  async getHistoricalAnalytics(days = 30) {
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);

    try {
      // Daily metrics with more granular data
      const dailyMetrics = await Metrics.aggregate([
        {
          $match: {
            sessionType: "chatbot",
            startTime: { $gte: startDate, $lte: endDate },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m-%d", date: "$startTime" },
            },
            sessions: { $sum: 1 },
            messages: { $sum: "$totalMessages" },
            avgResponseTime: { $avg: "$averageResponseTime" },
            avgSessionDuration: { $avg: "$sessionDuration" },
            uniqueUsers: { $addToSet: "$userId" },
          },
        },
        {
          $project: {
            date: "$_id",
            sessions: 1,
            messages: 1,
            avgResponseTime: { $round: ["$avgResponseTime", 2] },
            avgSessionDuration: { $round: ["$avgSessionDuration", 2] },
            uniqueUsers: { $size: "$uniqueUsers" },
          },
        },
        { $sort: { date: 1 } },
      ]);

      // Hourly breakdown for the last 7 days
      const hourlyMetrics = await Metrics.aggregate([
        {
          $match: {
            sessionType: "chatbot",
            startTime: {
              $gte: new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000),
            },
          },
        },
        {
          $group: {
            _id: {
              hour: { $hour: "$startTime" },
              day: {
                $dateToString: { format: "%Y-%m-%d", date: "$startTime" },
              },
            },
            sessions: { $sum: 1 },
            messages: { $sum: "$totalMessages" },
          },
        },
        { $sort: { "_id.day": 1, "_id.hour": 1 } },
      ]);

      // Intent trends over time
      const intentTrends = await Metrics.aggregate([
        {
          $match: {
            sessionType: "chatbot",
            startTime: { $gte: startDate, $lte: endDate },
            "messages.intent": { $exists: true, $ne: null },
          },
        },
        { $unwind: "$messages" },
        {
          $match: {
            "messages.intent": { $exists: true, $ne: null },
          },
        },
        {
          $group: {
            _id: {
              intent: "$messages.intent",
              date: {
                $dateToString: { format: "%Y-%m-%d", date: "$startTime" },
              },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { "_id.date": 1 } },
      ]);

      // User engagement metrics
      const userEngagement = await Metrics.aggregate([
        {
          $match: {
            sessionType: "chatbot",
            startTime: { $gte: startDate, $lte: endDate },
          },
        },
        {
          $group: {
            _id: "$userId",
            totalSessions: { $sum: 1 },
            totalMessages: { $sum: "$totalMessages" },
            avgSessionDuration: { $avg: "$sessionDuration" },
            lastSession: { $max: "$startTime" },
          },
        },
        {
          $group: {
            _id: null,
            totalUsers: { $sum: 1 },
            avgSessionsPerUser: { $avg: "$totalSessions" },
            avgMessagesPerUser: { $avg: "$totalMessages" },
            avgSessionDuration: { $avg: "$avgSessionDuration" },
            returningUsers: {
              $sum: {
                $cond: [{ $gt: ["$totalSessions", 1] }, 1, 0],
              },
            },
          },
        },
      ]);

      return {
        dailyMetrics,
        hourlyMetrics,
        intentTrends,
        userEngagement: userEngagement[0] || {
          totalUsers: 0,
          avgSessionsPerUser: 0,
          avgMessagesPerUser: 0,
          avgSessionDuration: 0,
          returningUsers: 0,
        },
      };
    } catch (error) {
      console.error("Error calculating historical analytics:", error);
      throw error;
    }
  }

  // System monitoring metrics
  async getSystemMetrics() {
    try {
      // Memory usage
      const memUsage = process.memoryUsage();

      // CPU usage (simplified)
      const startUsage = process.cpuUsage();
      await new Promise((resolve) => setTimeout(resolve, 100));
      const endUsage = process.cpuUsage(startUsage);

      // Database connection status
      const dbStatus =
        mongoose.connection.readyState === 1 ? "connected" : "disconnected";

      // Redis connection status
      const redisStatus = this.redisClient.isReady
        ? "connected"
        : "disconnected";

      return {
        memory: {
          used: Math.round(memUsage.heapUsed / 1024 / 1024),
          total: Math.round(memUsage.heapTotal / 1024 / 1024),
          external: Math.round(memUsage.external / 1024 / 1024),
        },
        cpu: {
          user: Math.round(endUsage.user / 1000),
          system: Math.round(endUsage.system / 1000),
        },
        database: dbStatus,
        redis: redisStatus,
        uptime: Math.round(process.uptime()),
        timestamp: new Date(),
      };
    } catch (error) {
      console.error("Error getting system metrics:", error);
      return {
        memory: { used: 0, total: 0, external: 0 },
        cpu: { user: 0, system: 0 },
        database: "unknown",
        redis: "unknown",
        uptime: 0,
        timestamp: new Date(),
      };
    }
  }

  // Calculate NLP drift based on intent distribution changes
  calculateNlpDrift(topIntents) {
    if (!topIntents || topIntents.length === 0) return "Normal";

    // Simple drift detection based on intent distribution
    const totalIntents = topIntents.reduce((sum, item) => sum + item.count, 0);
    const topIntentPercentage = (topIntents[0]?.count / totalIntents) * 100;

    if (topIntentPercentage > 80) return "High Drift";
    if (topIntentPercentage > 60) return "Medium Drift";
    return "Normal";
  }

  // Calculate translation accuracy (simulated)
  calculateTranslationAccuracy() {
    // In a real implementation, this would analyze actual translation quality
    return Math.floor(Math.random() * 10) + 90; // 90-99%
  }

  // Cache metrics in Redis for faster access
  async cacheMetrics(key, data, ttl = 300) {
    try {
      await this.redisClient.setEx(key, ttl, JSON.stringify(data));
    } catch (error) {
      console.error("Error caching metrics:", error);
    }
  }

  // Get cached metrics
  async getCachedMetrics(key) {
    try {
      const cached = await this.redisClient.get(key);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.error("Error getting cached metrics:", error);
      return null;
    }
  }
}

module.exports = new AnalyticsService();
