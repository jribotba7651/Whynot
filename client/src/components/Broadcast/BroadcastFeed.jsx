// Panel lateral de broadcasts (Fase 6.4)
// Muestra broadcasts activos y permite enviar nuevos
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

  // Cargar broadcasts existentes al abrir
  useEffect(() => {
    if (!isOpen || !location) return;
    getNearbyBroadcasts(location.latitude, location.longitude)
      .then(data => setBroadcasts(data.broadcasts || []))
      .catch(() => {});
  }, [isOpen, location]);

  // Escuchar nuevos broadcasts por socket
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

    // Registrar para broadcasts
    if (user?.id) {
      socket.emit('broadcast:register', { userId: user.id });
    }

    return () => {
      socket.off('broadcast:new', onNewBroadcast);
      socket.off('broadcast:expired', onExpired);
    };
  }, [socket, user?.id]);

  // Limpiar broadcasts expirados localmente
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
      {/* Panel lateral */}
      <div className="w-80 max-w-[85vw] bg-dark-300 h-full flex flex-col border-r border-dark-100 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-dark-100">
          <h3 className="font-semibold text-sm">Updates del área</h3>
          <span className="text-xs text-gray-500">{broadcasts.length} activos</span>
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
              No hay updates en tu área ahora mismo
            </p>
          ) : (
            broadcasts.map((b) => (
              <BroadcastCard key={b.id} broadcast={b} vanillaMode={vanillaMode} />
            ))
          )}
        </div>
      </div>

      {/* Overlay para cerrar */}
      <div className="flex-1" onClick={onClose} />
    </div>
  );
};

export default BroadcastFeed;
