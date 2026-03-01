// Broadcast side panel (Phase 6.4)
// Shows active broadcasts and allows sending new ones
import { useState, useEffect, useCallback } from 'react';
import useSocket from '../../hooks/useSocket';
import { useAuth } from '../../context/AuthContext';
import { getNearbyBroadcasts } from '../../services/api';
import BroadcastCard from './BroadcastCard';
import BroadcastInput from './BroadcastInput';

const BroadcastFeed = ({ isOpen, onClose, location, vanillaMode }) => {
  const { user, isAnonymous } = useAuth();
  const { socket } = useSocket();
  const [broadcasts, setBroadcasts] = useState([]);
  const [lastSentAt, setLastSentAt] = useState(null);

  useEffect(() => {
    if (!isOpen || !location) return;
    getNearbyBroadcasts(location.latitude, location.longitude)
      .then(data => setBroadcasts(data.broadcasts || []))
      .catch(() => {});
  }, [isOpen, location]);

  useEffect(() => {
    if (!socket) return;

    const onNewBroadcast = (data) => {
      setBroadcasts(prev => [data, ...prev]);
    };

    const onExpired = (data) => {
      setBroadcasts(prev => prev.filter(b => b.id !== data.id));
    };

    socket.on('broadcast:new', onNewBroadcast);
    socket.on('broadcast:expired', onExpired);

    if (user?.id) {
      socket.emit('broadcast:register', { userId: user.id });
    }

    return () => {
      socket.off('broadcast:new', onNewBroadcast);
      socket.off('broadcast:expired', onExpired);
    };
  }, [socket, user?.id]);

  useEffect(() => {
    const interval = setInterval(() => {
      setBroadcasts(prev => prev.filter(b => new Date(b.expiresAt).getTime() > Date.now()));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleSend = useCallback(async (message) => {
    if (!socket || !user?.id) return;
    socket.emit('broadcast:send', { userId: user.id, message });
    setLastSentAt(new Date());
  }, [socket, user?.id]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex animate-slide-right">
      {/* Side panel */}
      <div className="w-80 max-w-[85vw] bg-dark-300 h-full flex flex-col border-r border-dark-100 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-dark-100">
          <h3 className="font-semibold text-sm">Area updates</h3>
          <span className="text-xs text-gray-500">{broadcasts.length} active</span>
        </div>

        {/* Input */}
        <div className="px-3 py-3 border-b border-dark-100">
          <BroadcastInput
            onSend={handleSend}
            isRegistered={!isAnonymous}
            lastSentAt={lastSentAt}
          />
        </div>

        {/* Feed */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
          {broadcasts.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-8">
              No updates in your area right now
            </p>
          ) : (
            broadcasts.map((b) => (
              <BroadcastCard key={b.id} broadcast={b} vanillaMode={vanillaMode} />
            ))
          )}
        </div>
      </div>

      {/* Overlay to close */}
      <div className="flex-1" onClick={onClose} />
    </div>
  );
};

export default BroadcastFeed;
