import { useEffect, useRef, useState } from 'react';
import { useChatStore } from '../../store/chatStore';
import { useAuthStore } from '../../store/authStore';
import { Shield, Loader2, ArrowLeft } from 'lucide-react';
import Avatar from '../ui/Avatar';
import Badge from '../ui/Badge';
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';
import { encryptForConversation, decryptFromConversation } from '../../crypto/keyManager';
import { sendMessage, markAsRead, joinConversation, leaveConversation } from '../../sockets/socketManager';
import { format } from 'date-fns';

export default function ChatArea() {
  const { user } = useAuthStore();
  const { 
    activeConversation, 
    setActiveConversation,
    messages, 
    fetchMessages, 
    typingUsers, 
    hasMore,
    addMessage,
    updateMessageStatus
  } = useChatStore();

  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [decryptionStatuses, setDecryptionStatuses] = useState({}); // { msgId: 'success' | 'error' }
  const scrollRef = useRef(null);
  
  const conversationMessages = messages[activeConversation?._id] || [];
  const peer = activeConversation?.participants.find(p => p._id !== user._id);
  const typingUserId = typingUsers[activeConversation?._id];
  const isTyping = typingUserId && typingUserId !== user._id;

  // 1. Join room and fetch initial messages
  useEffect(() => {
    let mounted = true;
    if (!activeConversation) return;

    const initConversation = async () => {
      setIsInitialLoading(true);
      joinConversation(activeConversation._id);
      await fetchMessages(activeConversation._id);
      
      if (mounted) {
        setIsInitialLoading(false);
        markAsRead(activeConversation._id);
        scrollToBottom('auto');
      }
    };

    initConversation();

    return () => {
      mounted = false;
      leaveConversation(activeConversation._id);
    };
  }, [activeConversation?._id, fetchMessages]);

  // 2. Decrypt messages as they come in or are fetched
  useEffect(() => {
    if (!activeConversation || !peer?.publicKey) return;

    const decryptMessagesAsync = async () => {
      const msgsToDecrypt = conversationMessages.filter(
        m => !m._decryptedContent && !decryptionStatuses[m._id]
      );

      if (msgsToDecrypt.length === 0) return;

      const newStatuses = { ...decryptionStatuses };

      for (const msg of msgsToDecrypt) {
        try {
          // Check if it's already decrypted in memory (from optimistic update)
          if (msg._decryptedContent) continue;

          const plaintext = await decryptFromConversation(
            msg.encryptedPayload,
            msg.iv,
            activeConversation._id,
            user._id,
            peer.publicKey
          );
          
          msg._decryptedContent = plaintext;
          newStatuses[msg._id] = 'success';
        } catch (error) {
          console.error(`Decryption failed for msg ${msg._id}:`, error);
          newStatuses[msg._id] = 'error';
        }
      }

      setDecryptionStatuses(newStatuses);
    };

    decryptMessagesAsync();
  }, [conversationMessages, activeConversation, peer, user._id, decryptionStatuses]);

  // 3. Mark newly received messages as read
  useEffect(() => {
    if (!activeConversation || isInitialLoading) return;
    
    const unreadFromPeer = conversationMessages.some(
      m => m.senderId !== user._id && m.status !== 'read'
    );
    
    if (unreadFromPeer) {
      markAsRead(activeConversation._id);
    }
  }, [conversationMessages, activeConversation, isInitialLoading, user._id]);

  const scrollToBottom = (behavior = 'smooth') => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior,
      });
    }
  };

  // Scroll to bottom when new messages arrive (if already near bottom)
  useEffect(() => {
    if (!scrollRef.current || isInitialLoading) return;
    
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 150;
    
    if (isNearBottom) {
      scrollToBottom();
    }
  }, [conversationMessages.length, isInitialLoading]);

  const handleScroll = async (e) => {
    const { scrollTop } = e.target;
    if (scrollTop === 0 && hasMore[activeConversation._id] && !isLoadingMore) {
      setIsLoadingMore(true);
      const oldestMsg = conversationMessages[0];
      
      const previousScrollHeight = e.target.scrollHeight;
      
      await fetchMessages(activeConversation._id, oldestMsg.createdAt);
      
      // Restore scroll position
      setTimeout(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight - previousScrollHeight;
        }
        setIsLoadingMore(false);
      }, 0);
    }
  };

  const handleSendMessage = async (text) => {
    if (!peer?.publicKey) {
      alert("Cannot send message: Peer hasn't set up encryption keys.");
      return;
    }

    try {
      const clientMessageId = Date.now().toString() + Math.random().toString(36).substring(7);
      
      // 1. Encrypt the payload locally
      const { encryptedPayload, iv, keyVersion } = await encryptForConversation(
        text,
        activeConversation._id,
        user._id,
        peer.publicKey
      );

      // 2. Optimistic update (create local message object)
      const tempMessage = {
        _id: clientMessageId, // temporary ID
        clientMessageId,
        conversationId: activeConversation._id,
        senderId: user._id,
        encryptedPayload,
        iv,
        status: 'sending',
        createdAt: new Date().toISOString(),
        _decryptedContent: text, // Store plaintext directly for UI
      };

      addMessage(activeConversation._id, tempMessage);
      scrollToBottom();

      // 3. Send via Socket.IO
      const response = await sendMessage({
        conversationId: activeConversation._id,
        encryptedPayload,
        iv,
        keyVersion,
        clientMessageId,
      });

      // 4. Update status to sent with real server data
      if (response?.message) {
        response.message._decryptedContent = text; // Keep plaintext
        useChatStore.getState().confirmMessage(activeConversation._id, clientMessageId, response.message);
      }

    } catch (error) {
      console.error('Failed to send message:', error);
      // Could show error state on message here
    }
  };

  if (!activeConversation || !peer) return null;

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-surface-900 relative">
      {/* Header */}
      <div className="h-16 shrink-0 border-b border-surface-700 bg-surface-900/80 backdrop-blur-md flex items-center px-4 justify-between z-10">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setActiveConversation(null)}
            className="md:hidden p-2 -ml-2 text-slate-400 hover:text-white"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <Avatar src={peer.avatar} name={peer.displayName} isOnline={peer.isOnline} />
          <div>
            <h2 className="text-sm font-semibold text-white">{peer.displayName}</h2>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">
                {isTyping ? (
                  <span className="text-primary-400 animate-pulse">typing...</span>
                ) : peer.isOnline ? (
                  <span className="text-green-400">online</span>
                ) : peer.lastSeen ? (
                  `last seen ${format(new Date(peer.lastSeen), 'MMM d, HH:mm')}`
                ) : 'offline'}
              </span>
            </div>
          </div>
        </div>
        <Badge variant="encrypted" className="hidden sm:flex">
          <Shield className="w-3 h-3 mr-1" />
          E2E Encrypted
        </Badge>
      </div>

      {/* Message List */}
      <div 
        className="flex-1 overflow-y-auto p-4 space-y-2 relative scroll-smooth"
        onScroll={handleScroll}
        ref={scrollRef}
      >
        {isInitialLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-surface-900/50 z-20">
            <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
          </div>
        )}
        
        {isLoadingMore && (
          <div className="py-2 flex justify-center">
            <Loader2 className="w-5 h-5 text-slate-500 animate-spin" />
          </div>
        )}

        {!isInitialLoading && conversationMessages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-4">
            <Shield className="w-12 h-12 text-surface-600" />
            <div className="text-center">
              <p className="text-sm font-medium text-white mb-1">End-to-End Encrypted</p>
              <p className="text-xs max-w-xs mx-auto leading-relaxed">
                Messages to this chat and calls are secured with end-to-end encryption. 
                Nobody outside of this chat, not even MyChat, can read or listen to them.
              </p>
            </div>
          </div>
        )}

        {conversationMessages.map((msg, index) => {
          const isOwn = msg.senderId === user._id;
          const showDate = index === 0 || !isSameDay(new Date(msg.createdAt), new Date(conversationMessages[index - 1].createdAt));
          
          return (
            <div key={msg._id || msg.clientMessageId}>
              {showDate && (
                <div className="flex justify-center my-6">
                  <span className="text-[10px] font-medium px-3 py-1 rounded-full bg-surface-800 text-slate-400 border border-surface-700">
                    {format(new Date(msg.createdAt), 'MMMM d, yyyy')}
                  </span>
                </div>
              )}
              <MessageBubble 
                message={msg} 
                isOwn={isOwn} 
                isDecrypted={!!msg._decryptedContent}
                isError={decryptionStatuses[msg._id] === 'error'}
              />
            </div>
          );
        })}
        
        {isTyping && (
          <div className="flex w-full justify-start mb-2">
            <div className="bg-surface-800 rounded-2xl px-4 py-3 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-slate-500 animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-2 h-2 rounded-full bg-slate-500 animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-2 h-2 rounded-full bg-slate-500 animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <MessageInput 
        onSendMessage={handleSendMessage} 
        conversationId={activeConversation._id} 
        disabled={isInitialLoading}
      />
    </div>
  );
}
