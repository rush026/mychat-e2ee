import { create } from 'zustand';
import { conversationService } from '../services/conversation.service';

export const useChatStore = create((set, get) => ({
  conversations: [],
  activeConversation: null,
  messages: {},        // { conversationId: [messages] }
  typingUsers: {},     // { conversationId: userId }
  unreadCounts: {},    // { conversationId: count }
  isLoading: false,
  hasMore: {},         // { conversationId: boolean }

  fetchConversations: async () => {
    try {
      set({ isLoading: true });
      const { data } = await conversationService.getConversations();
      set({ conversations: data.data.conversations, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      console.error('Failed to fetch conversations:', error);
    }
  },

  setActiveConversation: (conversation) => {
    set({ activeConversation: conversation });
    // Reset unread count
    if (conversation) {
      set((state) => ({
        unreadCounts: { ...state.unreadCounts, [conversation._id]: 0 },
      }));
    }
  },

  fetchMessages: async (conversationId, before = null) => {
    try {
      const params = { limit: 50 };
      if (before) params.before = before;

      const { data } = await conversationService.getMessages(conversationId, params);
      const newMessages = data.data.messages;

      set((state) => ({
        messages: {
          ...state.messages,
          [conversationId]: before
            ? [...newMessages, ...(state.messages[conversationId] || [])]
            : newMessages,
        },
        hasMore: { ...state.hasMore, [conversationId]: data.meta?.hasMore || false },
      }));

      return newMessages;
    } catch (error) {
      console.error('Failed to fetch messages:', error);
      return [];
    }
  },

  addMessage: (conversationId, message) => {
    set((state) => {
      const existing = state.messages[conversationId] || [];
      // Prevent duplicates by clientMessageId
      if (existing.some((m) => m.clientMessageId === message.clientMessageId)) {
        return state;
      }

      const updatedMessages = [...existing, message];

      // Update conversation order
      const updatedConversations = state.conversations.map((c) => {
        if (c._id === conversationId) {
          return {
            ...c,
            lastMessage: {
              senderId: message.senderId,
              createdAt: message.createdAt,
              encryptedPreview: message.encryptedPayload?.slice(0, 50),
            },
            updatedAt: message.createdAt,
          };
        }
        return c;
      }).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

      return {
        messages: { ...state.messages, [conversationId]: updatedMessages },
        conversations: updatedConversations,
      };
    });
  },

  // Update message status (delivered/read)
  updateMessageStatus: (conversationId, messageId, status, timestamp) => {
    set((state) => ({
      messages: {
        ...state.messages,
        [conversationId]: (state.messages[conversationId] || []).map((m) =>
          m._id === messageId ? { ...m, status, [`${status}At`]: timestamp } : m
        ),
      },
    }));
  },

  // Replace optimistic message with server-confirmed message
  confirmMessage: (conversationId, clientMessageId, serverMessage) => {
    set((state) => ({
      messages: {
        ...state.messages,
        [conversationId]: (state.messages[conversationId] || []).map((m) =>
          m.clientMessageId === clientMessageId ? { ...serverMessage, _decryptedContent: m._decryptedContent } : m
        ),
      },
    }));
  },

  setTypingUser: (conversationId, userId) => {
    set((state) => ({ typingUsers: { ...state.typingUsers, [conversationId]: userId } }));
  },

  clearTypingUser: (conversationId) => {
    set((state) => {
      const { [conversationId]: _, ...rest } = state.typingUsers;
      return { typingUsers: rest };
    });
  },

  incrementUnread: (conversationId) => {
    set((state) => ({
      unreadCounts: {
        ...state.unreadCounts,
        [conversationId]: (state.unreadCounts[conversationId] || 0) + 1,
      },
    }));
  },

  addConversation: (conversation) => {
    set((state) => {
      if (state.conversations.some((c) => c._id === conversation._id)) return state;
      return { conversations: [conversation, ...state.conversations] };
    });
  },

  deleteMessage: (conversationId, messageId) => {
    set((state) => ({
      messages: {
        ...state.messages,
        [conversationId]: (state.messages[conversationId] || []).filter(
          (m) => m._id !== messageId
        ),
      },
    }));
  },
}));
