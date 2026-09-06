import { useEffect, useState } from 'react';
import MainLayout from '../layouts/MainLayout';
import Sidebar from '../components/chat/Sidebar';
import ChatArea from '../components/chat/ChatArea';
import FriendManager from '../components/friends/FriendManager';
import { useAuthStore } from '../store/authStore';
import { initializeKeys } from '../crypto/keyManager';
import { connectSocket, disconnectSocket } from '../sockets/socketManager';
import { useChatStore } from '../store/chatStore';
import { useFriendStore } from '../store/friendStore';
import { FullPageSpinner } from '../components/ui/Spinner';

export default function ChatPage() {
  const { user, accessToken } = useAuthStore();
  const { fetchConversations, activeConversation } = useChatStore();
  const { fetchFriends, fetchReceivedRequests, fetchSentRequests } = useFriendStore();
  const [isInitializing, setIsInitializing] = useState(true);
  const [showFriendManager, setShowFriendManager] = useState(false);

  useEffect(() => {
    let mounted = true;

    const setup = async () => {
      try {
        // Initialize E2EE keys
        if (user) {
          const { isNew } = await initializeKeys(user._id);
          if (isNew) {
            console.log('New E2EE keys generated and uploaded');
          }
        }

        // Connect Socket.IO
        if (accessToken) {
          connectSocket(accessToken);
        }

        // Fetch initial data
        await Promise.all([
          fetchConversations(),
          fetchFriends(),
          fetchReceivedRequests(),
          fetchSentRequests(),
        ]);
      } catch (error) {
        console.error('Error during chat initialization:', error);
      } finally {
        if (mounted) setIsInitializing(false);
      }
    };

    setup();

    return () => {
      mounted = false;
      disconnectSocket();
    };
  }, [user, accessToken, fetchConversations, fetchFriends, fetchReceivedRequests, fetchSentRequests]);

  if (isInitializing) {
    return <FullPageSpinner />;
  }

  return (
    <MainLayout>
      <Sidebar onOpenFriendManager={() => setShowFriendManager(true)} />
      
      <div className="flex-1 flex flex-col h-full bg-surface-900 border-l border-surface-700">
        {activeConversation ? (
          <ChatArea />
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="w-20 h-20 rounded-full bg-surface-800 flex items-center justify-center mx-auto mb-4 border border-surface-700">
                <span className="text-4xl">💬</span>
              </div>
              <h2 className="text-xl font-semibold text-white mb-2">MyChat</h2>
              <p className="text-sm text-slate-400 max-w-sm mx-auto">
                Select a conversation from the sidebar to start messaging.
                All messages are end-to-end encrypted.
              </p>
            </div>
          </div>
        )}
      </div>

      <FriendManager 
        isOpen={showFriendManager} 
        onClose={() => setShowFriendManager(false)} 
      />
    </MainLayout>
  );
}
