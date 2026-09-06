import { io } from 'socket.io-client';
import { EVENTS } from './events.js';
import { useChatStore } from '../store/chatStore.js';
import { useAuthStore } from '../store/authStore.js';

let socket = null;

/**
 * Initialize Socket.IO connection with JWT auth.
 */
export const connectSocket = (accessToken) => {
  if (socket?.connected) return socket;

  socket = io({
    auth: { token: accessToken },
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
  });

  socket.on(EVENTS.CONNECT, () => {
    console.log('Socket connected:', socket.id);
  });

  socket.on(EVENTS.CONNECT_ERROR, (err) => {
    console.error('Socket connection error:', err.message);
    if (err.message === 'Authentication failed') {
      // Token may be expired — try refreshing
      const authStore = useAuthStore.getState();
      authStore.checkAuth().then(() => {
        const newToken = useAuthStore.getState().accessToken;
        if (newToken && socket) {
          socket.auth = { token: newToken };
          socket.connect();
        }
      });
    }
  });

  // Listen for incoming messages
  socket.on(EVENTS.MESSAGE_NEW, ({ message, conversationId }) => {
    useChatStore.getState().addMessage(conversationId, message);

    // Auto-acknowledge delivery
    socket.emit(EVENTS.MESSAGE_DELIVERED, {
      conversationId,
      messageId: message._id,
    });

    // Increment unread if not the active conversation
    const activeConv = useChatStore.getState().activeConversation;
    if (!activeConv || activeConv._id !== conversationId) {
      useChatStore.getState().incrementUnread(conversationId);
    }
  });

  // Delivery receipts
  socket.on(EVENTS.MESSAGE_DELIVERED, ({ conversationId, messageId, deliveredAt }) => {
    useChatStore.getState().updateMessageStatus(conversationId, messageId, 'delivered', deliveredAt);
  });

  // Read receipts
  socket.on(EVENTS.MESSAGE_READ, ({ conversationId, readAt }) => {
    const messages = useChatStore.getState().messages[conversationId] || [];
    const myUserId = useAuthStore.getState().user?._id;
    messages.forEach((msg) => {
      if (msg.senderId === myUserId && msg.status !== 'read') {
        useChatStore.getState().updateMessageStatus(conversationId, msg._id, 'read', readAt);
      }
    });
  });

  // Typing indicators
  socket.on(EVENTS.TYPING_START, ({ conversationId, userId }) => {
    useChatStore.getState().setTypingUser(conversationId, userId);
  });

  socket.on(EVENTS.TYPING_STOP, ({ conversationId }) => {
    useChatStore.getState().clearTypingUser(conversationId);
  });

  // User presence
  socket.on(EVENTS.USER_ONLINE, ({ userId }) => {
    // Update friend list online status if needed
    console.log('User online:', userId);
  });

  socket.on(EVENTS.USER_OFFLINE, ({ userId, lastSeen }) => {
    console.log('User offline:', userId, lastSeen);
  });

  return socket;
};

/**
 * Get the current socket instance.
 */
export const getSocket = () => socket;

/**
 * Disconnect the socket.
 */
export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

/**
 * Join a conversation room.
 */
export const joinConversation = (conversationId) => {
  socket?.emit(EVENTS.CONVERSATION_JOIN, conversationId);
};

/**
 * Leave a conversation room.
 */
export const leaveConversation = (conversationId) => {
  socket?.emit(EVENTS.CONVERSATION_LEAVE, conversationId);
};

/**
 * Send an encrypted message via socket.
 */
export const sendMessage = (data) => {
  return new Promise((resolve, reject) => {
    if (!socket?.connected) {
      reject(new Error('Socket not connected'));
      return;
    }

    socket.emit(EVENTS.MESSAGE_SEND, data, (response) => {
      if (response.error) {
        reject(new Error(response.error));
      } else {
        resolve(response);
      }
    });
  });
};

/**
 * Send typing start event.
 */
export const sendTypingStart = (conversationId) => {
  socket?.emit(EVENTS.TYPING_START, { conversationId });
};

/**
 * Send typing stop event.
 */
export const sendTypingStop = (conversationId) => {
  socket?.emit(EVENTS.TYPING_STOP, { conversationId });
};

/**
 * Mark messages as read.
 */
export const markAsRead = (conversationId) => {
  socket?.emit(EVENTS.MESSAGE_READ, { conversationId });
};
