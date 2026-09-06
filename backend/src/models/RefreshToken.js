import mongoose from 'mongoose';

/**
 * RefreshToken model.
 * 
 * SECURITY: Tokens are stored as SHA-256 hashes, not plaintext.
 * This means a database breach does NOT expose usable refresh tokens.
 * Token rotation is enforced: each refresh invalidates the old token.
 */
const refreshTokenSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    // SHA-256 hash of the actual refresh token
    tokenHash: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    // Token family ID for rotation detection
    // If a previously-rotated token is reused, all tokens in the family are revoked
    family: {
      type: String,
      required: true,
      index: true,
    },
    userAgent: {
      type: String,
      default: '',
    },
    ipAddress: {
      type: String,
      default: '',
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 }, // MongoDB TTL: auto-delete expired tokens
    },
    isRevoked: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient token lookup
refreshTokenSchema.index({ tokenHash: 1, isRevoked: 1 });

const RefreshToken = mongoose.model('RefreshToken', refreshTokenSchema);

export default RefreshToken;
