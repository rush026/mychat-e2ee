import { useState, useRef, useEffect } from 'react';
import { Search, UserPlus, X, Check, Clock, XCircle, Shield } from 'lucide-react';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Button from '../ui/Button';
import Avatar from '../ui/Avatar';
import Badge from '../ui/Badge';
import { useFriendStore } from '../../store/friendStore';
import { userService } from '../../services/user.service';
import { useToastStore } from '../../store/uiStore';

export default function FriendManager({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('add'); // 'add' | 'requests'
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeout = useRef(null);
  
  const { 
    receivedRequests, 
    sentRequests, 
    friends,
    sendRequest, 
    acceptRequest, 
    rejectRequest, 
    cancelRequest 
  } = useFriendStore();
  const toast = useToastStore();

  useEffect(() => {
    if (searchQuery.length >= 3) {
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
      searchTimeout.current = setTimeout(async () => {
        setIsSearching(true);
        try {
          const { data } = await userService.searchUsers(searchQuery);
          setSearchResults(data.data.users);
        } catch (error) {
          console.error('Search failed', error);
        } finally {
          setIsSearching(false);
        }
      }, 400);
    } else {
      setSearchResults([]);
    }
    return () => clearTimeout(searchTimeout.current);
  }, [searchQuery]);

  // Clean up when closed
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
      setSearchResults([]);
      setActiveTab('add');
    }
  }, [isOpen]);

  const handleSendRequest = async (userId) => {
    try {
      await sendRequest(userId);
      toast.success('Friend request sent');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send request');
    }
  };

  const getFriendshipStatus = (userId) => {
    if (friends.some(f => f._id === userId)) return 'friend';
    if (sentRequests.some(r => r.receiver._id === userId)) return 'sent';
    if (receivedRequests.some(r => r.sender._id === userId)) return 'received';
    return 'none';
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Manage Friends" size="lg">
      <div className="flex gap-4 border-b border-surface-700 pb-4 mb-4">
        <button
          onClick={() => setActiveTab('add')}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
            activeTab === 'add' ? 'bg-primary-500/20 text-primary-400' : 'text-slate-400 hover:text-white'
          }`}
        >
          Add Friends
        </button>
        <button
          onClick={() => setActiveTab('requests')}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors relative ${
            activeTab === 'requests' ? 'bg-primary-500/20 text-primary-400' : 'text-slate-400 hover:text-white'
          }`}
        >
          Requests
          {receivedRequests.length > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-danger-500 text-[10px] text-white">
              {receivedRequests.length}
            </span>
          )}
        </button>
      </div>

      <div className="min-h-[300px] max-h-[400px] overflow-y-auto">
        {activeTab === 'add' && (
          <div className="space-y-4">
            <Input
              placeholder="Search by username..."
              icon={Search}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
            />
            
            <div className="space-y-2 mt-4">
              {isSearching ? (
                <div className="text-center text-sm text-slate-500 py-4">Searching...</div>
              ) : searchResults.length > 0 ? (
                searchResults.map(user => {
                  const status = getFriendshipStatus(user._id);
                  return (
                    <div key={user._id} className="flex items-center justify-between p-3 glass rounded-xl">
                      <div className="flex items-center gap-3">
                        <Avatar src={user.avatar} name={user.displayName} />
                        <div>
                          <div className="font-medium text-sm text-white">{user.displayName}</div>
                          <div className="text-xs text-slate-400">@{user.username}</div>
                        </div>
                      </div>
                      
                      {status === 'none' && (
                        <Button size="sm" onClick={() => handleSendRequest(user._id)}>
                          <UserPlus className="w-4 h-4 mr-1" /> Add
                        </Button>
                      )}
                      {status === 'friend' && <Badge variant="success">Friend</Badge>}
                      {status === 'sent' && <Badge variant="warning">Request Sent</Badge>}
                      {status === 'received' && <Badge variant="primary">Request Received</Badge>}
                    </div>
                  );
                })
              ) : searchQuery.length >= 3 ? (
                <div className="text-center text-sm text-slate-500 py-4">No users found</div>
              ) : (
                <div className="text-center text-sm text-slate-500 py-8 flex flex-col items-center">
                  <Shield className="w-12 h-12 text-surface-600 mb-3" />
                  <p>Search for friends by username to start secure messaging.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'requests' && (
          <div className="space-y-6">
            {/* Received Requests */}
            <div>
              <h3 className="text-sm font-medium text-slate-300 mb-3">Received Requests ({receivedRequests.length})</h3>
              {receivedRequests.length === 0 ? (
                <p className="text-xs text-slate-500 italic">No pending requests received.</p>
              ) : (
                <div className="space-y-2">
                  {receivedRequests.map(req => (
                    <div key={req._id} className="flex items-center justify-between p-3 glass rounded-xl border border-primary-500/20">
                      <div className="flex items-center gap-3">
                        <Avatar src={req.sender.avatar} name={req.sender.displayName} />
                        <div>
                          <div className="font-medium text-sm text-white">{req.sender.displayName}</div>
                          <div className="text-xs text-slate-400">@{req.sender.username}</div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="primary" onClick={() => acceptRequest(req._id)}>
                          <Check className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="secondary" onClick={() => rejectRequest(req._id)}>
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Sent Requests */}
            <div>
              <h3 className="text-sm font-medium text-slate-300 mb-3 mt-6">Sent Requests ({sentRequests.length})</h3>
              {sentRequests.length === 0 ? (
                <p className="text-xs text-slate-500 italic">No pending requests sent.</p>
              ) : (
                <div className="space-y-2">
                  {sentRequests.map(req => (
                    <div key={req._id} className="flex items-center justify-between p-3 glass rounded-xl">
                      <div className="flex items-center gap-3">
                        <Avatar src={req.receiver.avatar} name={req.receiver.displayName} />
                        <div>
                          <div className="font-medium text-sm text-white">{req.receiver.displayName}</div>
                          <div className="text-xs text-slate-400">@{req.receiver.username}</div>
                        </div>
                      </div>
                      <Button size="sm" variant="ghost" className="text-danger-400 hover:text-danger-300 hover:bg-danger-500/10" onClick={() => cancelRequest(req._id)}>
                        Cancel
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
