import mongoose from 'mongoose';

const conversationSchema = new mongoose.Schema(
  {
    participants: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    }],
    // Track key versions per participant for E2EE key management
    participantKeyVersions: [{
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      keyVersion: {
        type: Number,
        default: 1,
      },
    }],
    lastMessage: {
      senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      // NOTE: This preview is encrypted — it is NOT plaintext.
      // The client encrypts a preview snippet before sending.
      encryptedPreview: { type: String, default: '' },
      createdAt: { type: Date },
    },
    // Per-user soft deletion tracking
    deletedFor: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    }],
  },
  {
    timestamps: true,
  }
);

// Index for finding conversations by participant
conversationSchema.index({ participants: 1 });
conversationSchema.index({ updatedAt: -1 });

/**
 * Static: find or create a 1-to-1 conversation between two users.
 */
conversationSchema.statics.findOrCreate = async function (userIdA, userIdB) {
  const participants = [userIdA, userIdB].sort((a, b) => a.toString().localeCompare(b.toString()));

  let conversation = await this.findOne({
    participants: { $all: participants, $size: 2 },
  });

  if (!conversation) {
    conversation = await this.create({ participants });
  }

  return conversation;
};

const Conversation = mongoose.model('Conversation', conversationSchema);

export default Conversation;
