import mongoose from 'mongoose';

/**
 * SecurityLog model — audit trail for security-relevant events.
 * Used by the admin dashboard for monitoring and abuse detection.
 * 
 * SECURITY: This log NEVER stores passwords, tokens, keys, or message content.
 */
const securityLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    action: {
      type: String,
      required: true,
      enum: [
        'login_success',
        'login_failure',
        'logout',
        'register',
        'password_reset_request',
        'password_reset_success',
        'email_verified',
        'token_refresh',
        'token_revoked',
        'account_locked',
        'key_uploaded',
        'key_rotated',
        'friend_blocked',
        'admin_action',
      ],
    },
    ipAddress: {
      type: String,
      default: '',
    },
    userAgent: {
      type: String,
      default: '',
    },
    success: {
      type: Boolean,
      default: true,
    },
    // Additional metadata — MUST NOT contain sensitive data
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for admin dashboard queries
securityLogSchema.index({ userId: 1, createdAt: -1 });
securityLogSchema.index({ action: 1, createdAt: -1 });
securityLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7776000 }); // 90 days TTL

const SecurityLog = mongoose.model('SecurityLog', securityLogSchema);

export default SecurityLog;
