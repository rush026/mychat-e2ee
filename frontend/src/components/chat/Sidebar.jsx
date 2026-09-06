import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, Search, Plus, Settings, LogOut, MessageSquare, Shield } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useChatStore } from '../../store/chatStore';
import { useFriendStore } from '../../store/friendStore';
import { clearKeys } from '../../crypto/keyManager';
import Avatar from '../ui/Avatar';
import Badge from '../ui/Badge';
import { formatDistanceToNow } from 'date-fns';
import { conversationService } from '../../services/conversation.service';
import { useToastStore } from '../../store/uiStore';

export default function Sidebar({ onOpenFriendManager }) {
  const { user, logout } = useAuthStore();
  const { conversations, activeConversation, setActiveConversation, addConversation } = useChatStore();
  const { friends, receivedRequests } = useFriendStore();
  const [activeTab, setActiveTab] = useState('chats'); // 'chats' | 'friends'
  const toast = useToastStore();

  const handleLogout = async () => {
    await clearKeys(); // Important: clear E2EE keys on logout
    logout();
  };

  const startConversation = async (friendId) => {
    try {
      const { data } = await conversationService.createConversation(friendId);
      addConversation(data.data.conversation);
      setActiveConversation(data.data.conversation);
      setActiveTab('chats');
    } catch (error) {
      toast.error('Failed to start conversation');
    }
  };

  return (
    <div className="w-80 h-full flex flex-col bg-surface-800 shrink-0">
      {/* Header */}
      <div className="p-4 border-b border-surface-700 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Avatar src={user?.avatar} name={user?.displayName || user?.username} size="sm" isOnline={true} />
          <div>
            <h2 className="text-sm font-semibold text-white truncate max-w-[120px]">
              {user?.displayName || user?.username}
            </h2>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {user?.role === 'admin' && (
            <Link 
              to="/admin"
              className="p-2 text-slate-400 hover:text-primary-400 hover:bg-primary-500/10 rounded-lg transition-colors"
              title="Admin Dashboard"
            >
              <Shield className="w-5 h-5" />
            </Link>
          )}
          <button 
            onClick={onOpenFriendManager}
            className="p-2 text-slate-400 hover:text-white hover:bg-surface-700 rounded-lg transition-colors relative"
            title="Add Friends"
          >
            <Plus className="w-5 h-5" />
            {receivedRequests.length > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-danger-500 rounded-full" />
            )}
          </button>
          <button 
            onClick={handleLogout}
            className="p-2 text-slate-400 hover:text-danger-400 hover:bg-surface-700 rounded-lg transition-colors"
            title="Log out"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex p-2 gap-1 bg-surface-900 border-b border-surface-700">
        <button
          onClick={() => setActiveTab('chats')}
          className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${
            activeTab === 'chats' 
              ? 'bg-surface-700 text-white' 
              : 'text-slate-400 hover:text-slate-200 hover:bg-surface-800'
          }`}
        >
          Chats
        </button>
        <button
          onClick={() => setActiveTab('friends')}
          className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${
            activeTab === 'friends' 
              ? 'bg-surface-700 text-white' 
              : 'text-slate-400 hover:text-slate-200 hover:bg-surface-800'
          }`}
        >
          Friends
        </button>
      </div>

      {/* Search (visual only for now) */}
      <div className="p-3 border-b border-surface-700">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input 
            type="text" 
            placeholder={`Search ${activeTab}...`} 
            className="w-full bg-surface-900 border border-surface-700 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-primary-500"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'chats' && (
          <div className="divide-y divide-surface-700/50">
            {conversations.length === 0 ? (
              <div className="p-6 text-center text-slate-500 text-sm">
                No conversations yet. Go to Friends tab to start one!
              </div>
            ) : (
              conversations.map((conv) => {
                const participant = conv.participants.find(p => p._id !== user._id);
                if (!participant) return null;
                
                const isActive = activeConversation?._id === conv._id;
                const unread = conv.unreadCount || 0;

                return (
                  <button
                    key={conv._id}
                    onClick={() => setActiveConversation(conv)}
                    className={`w-full p-3 flex items-start gap-3 transition-colors text-left hover:bg-surface-700/50 ${
                      isActive ? 'bg-surface-700' : ''
                    }`}
                  >
                    <Avatar 
                      src={participant.avatar} 
                      name={participant.displayName} 
                      isOnline={participant.isOnline} 
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline mb-0.5">
                        <h3 className="text-sm font-medium text-white truncate">
                          {participant.displayName}
                        </h3>
                        {conv.updatedAt && (
                          <span className="text-[10px] text-slate-500 shrink-0">
                            {formatDistanceToNow(new Date(conv.updatedAt), { addSuffix: true }).replace('about ', '')}
                          </span>
                        )}
                      </div>
                      <div className="flex justify-between items-center gap-2">
                        <p className={`text-xs truncate ${unread > 0 ? 'text-white font-medium' : 'text-slate-400'}`}>
                          {conv.lastMessage?.encryptedPreview ? '🔒 Encrypted message' : 'No messages yet'}
                        </p>
                        {unread > 0 && (
                          <Badge variant="primary" className="shrink-0 h-5 min-w-[20px] justify-center px-1">
                            {unread}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        )}

        {activeTab === 'friends' && (
          <div className="divide-y divide-surface-700/50">
            {friends.length === 0 ? (
              <div className="p-6 text-center text-slate-500 text-sm">
                No friends yet. Click the + button above to add some!
              </div>
            ) : (
              friends.map((friend) => (
                <div key={friend._id} className="p-3 flex items-center gap-3 hover:bg-surface-700/50 transition-colors">
                  <Avatar 
                    src={friend.avatar} 
                    name={friend.displayName} 
                    isOnline={friend.isOnline} 
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-white truncate">{friend.displayName}</h3>
                    <p className="text-xs text-slate-400 truncate">@{friend.username}</p>
                  </div>
                  <button
                    onClick={() => startConversation(friend._id)}
                    className="p-1.5 text-primary-400 hover:text-white hover:bg-primary-500 rounded-lg transition-colors"
                    title="Message"
                  >
                    <MessageSquare className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
