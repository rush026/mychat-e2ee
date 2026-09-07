import mongoose from 'mongoose';

/**
 * Message model.
 * 
 * SECURITY: This schema stores ONLY encrypted payloads.
 * - encryptedPayload: Base64-encoded AES-256-GCM ciphertext
 * - iv: Base64-encoded 12-byte initialization vector (unique per message)
 * - keyVersion: Which key version was used, for key rotation support
 * 
 * The server CANNOT decrypt messages. It only stores and relays ciphertext.
 * Decryption happens exclusively on the client using the Web Crypto API.
 */
const messageSchema = new mongoose.Schema(
  {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conversation',
      required: true,
      index: true,
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // Base64-encoded AES-256-GCM ciphertext — NEVER plaintext
    encryptedPayload: {
      type: String,
      required: true,
    },
    // Base64-encoded 12-byte IV used for this specific encryption
    iv: {
      type: String,
      required: true,
    },
    // Key version used for encryption — supports key rotation
    keyVersion: {
      type: Number,
      default: 1,
    },
    messageType: {
      type: String,
      enum: ['text', 'system', 'key_exchange'],
      default: 'text',
    },
    // Client-generated UUID for deduplication and optimistic UI
    clientMessageId: {
      type: String,
      required: true,
      unique: true,
    },
    status: {
      type: String,
      enum: ['sent', 'delivered', 'read'],
      default: 'sent',
    },
    // Per-user soft deletion
    deletedFor: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    }],
    deliveredAt: {
      type: Date,
      default: null,
    },
    readAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for paginated message retrieval within a conversation
messageSchema.index({ conversationId: 1, createdAt: -1 });
// Index for unread message queries
messageSchema.index({ conversationId: 1, senderId: 1, status: 1 });

const Message = mongoose.model('Message', messageSchema);

export default Message;
