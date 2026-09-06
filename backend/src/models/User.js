import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, 'Username is required'],
      unique: true,
      trim: true,
      minlength: [3, 'Username must be at least 3 characters'],
      maxlength: [30, 'Username must be at most 30 characters'],
      match: [/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'],
    },
    normalizedUsername: {
      type: String,
      unique: true,
      lowercase: true,
      index: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    passwordHash: {
      type: String,
      required: [true, 'Password is required'],
      select: false, // Never return in queries by default
    },
    displayName: {
      type: String,
      trim: true,
      maxlength: [50, 'Display name must be at most 50 characters'],
      default: '',
    },
    avatar: {
      type: String,
      default: '',
    },
    bio: {
      type: String,
      maxlength: [200, 'Bio must be at most 200 characters'],
      default: '',
    },
    // E2EE: Public key in JWK format — stored server-side for key exchange.
    // The corresponding private key is NEVER sent to the server.
    publicKey: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    // Key version counter — incremented on key rotation.
    // Allows recipients to know which key version was used to encrypt a message.
    keyVersion: {
      type: Number,
      default: 0,
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationToken: {
      type: String,
      select: false,
    },
    emailVerificationExpires: {
      type: Date,
      select: false,
    },
    passwordResetToken: {
      type: String,
      select: false,
    },
    passwordResetExpires: {
      type: Date,
      select: false,
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    isOnline: {
      type: Boolean,
      default: false,
    },
    lastSeen: {
      type: Date,
      default: Date.now,
    },
    blockedUsers: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    }],
  },
  {
    timestamps: true,
  }
);

// Pre-save hook: normalize username and hash password if modified
userSchema.pre('save', async function (next) {
  // Always keep normalizedUsername in sync
  if (this.isModified('username')) {
    this.normalizedUsername = this.username.toLowerCase();
  }

  // Set displayName to username if not provided
  if (!this.displayName) {
    this.displayName = this.username;
  }

  // Hash password only if it was modified
  if (this.isModified('passwordHash')) {
    // SECURITY: bcrypt with cost factor 12.
    // This provides ~300ms hash time, balancing security vs. UX.
    this.passwordHash = await bcrypt.hash(this.passwordHash, 12);
  }

  next();
});

/**
 * Compare a plaintext password with the stored hash.
 * @param {string} candidatePassword
 * @returns {Promise<boolean>}
 */
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

/**
 * Check if a user is blocked by this user.
 * @param {string} userId
 * @returns {boolean}
 */
userSchema.methods.hasBlocked = function (userId) {
  return this.blockedUsers.some((id) => id.toString() === userId.toString());
};

// Additional indexes (normalizedUsername and email already indexed via schema field options)
userSchema.index({ isOnline: 1 });
userSchema.index({ createdAt: -1 });

const User = mongoose.model('User', userSchema);

export default User;
