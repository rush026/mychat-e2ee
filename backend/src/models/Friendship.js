import mongoose from 'mongoose';

/**
 * Friendship model — represents an established friendship between two users.
 * user1 always holds the smaller ObjectId to prevent duplicate pairs.
 */
const friendshipSchema = new mongoose.Schema(
  {
    user1: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    user2: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Unique compound index ensures no duplicate friendships
friendshipSchema.index({ user1: 1, user2: 1 }, { unique: true });
// Index for querying friendships by either user
friendshipSchema.index({ user1: 1 });
friendshipSchema.index({ user2: 1 });

/**
 * Static: create a friendship with consistent ordering.
 * The smaller ObjectId is always stored as user1.
 */
friendshipSchema.statics.createFriendship = async function (userIdA, userIdB) {
  const [user1, user2] = [userIdA.toString(), userIdB.toString()].sort();
  return this.create({
    user1: new mongoose.Types.ObjectId(user1),
    user2: new mongoose.Types.ObjectId(user2),
  });
};

/**
 * Static: find friendship between two users (order-independent).
 */
friendshipSchema.statics.findFriendship = async function (userIdA, userIdB) {
  const [user1, user2] = [userIdA.toString(), userIdB.toString()].sort();
  return this.findOne({ user1, user2 });
};

/**
 * Static: get all friends of a user.
 */
friendshipSchema.statics.getFriends = async function (userId) {
  return this.find({
    $or: [{ user1: userId }, { user2: userId }],
  });
};

const Friendship = mongoose.model('Friendship', friendshipSchema);

export default Friendship;
