import User from '../models/User.js';
import Message from '../models/Message.js';
import Conversation from '../models/Conversation.js';
import SecurityLog from '../models/SecurityLog.js';
import ApiResponse from '../utils/ApiResponse.js';

/**
 * Get system-wide metrics and statistics.
 * Requires admin role.
 */
export const getSystemMetrics = async (req, res, next) => {
  try {
    const [
      totalUsers,
      totalConversations,
      totalMessages,
      onlineUsers,
      recentSecurityLogs,
      usersByDay
    ] = await Promise.all([
      User.countDocuments(),
      Conversation.countDocuments(),
      Message.countDocuments(),
      User.countDocuments({ isOnline: true }),
      SecurityLog.find().sort('-createdAt').limit(20).populate('userId', 'username'),
      
      // Analytics: Users joined in last 7 days
      User.aggregate([
        {
          $match: {
            createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
          }
        },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ])
    ]);

    const metrics = {
      totalUsers,
      totalConversations,
      totalMessages,
      onlineUsers,
      recentSecurityLogs,
      usersByDay
    };

    res.json(ApiResponse.success('System metrics retrieved', { metrics }));
  } catch (error) {
    next(error);
  }
};
