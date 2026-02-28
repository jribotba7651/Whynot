// Lista de conversaciones activas
// Muestra todas las conversaciones del usuario con preview del último mensaje
import { useEffect } from 'react';
import { getConversations } from '../../services/api';

// Formatear hora del último mensaje
const formatLastTime = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);

  if (diffMins < 1) return 'Ahora';
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  return date.toLocaleDateString('es', { day: 'numeric', month: 'short' });
};

const ChatList = ({ isOpen, onClose, onSelectConversation, conversations, setConversations, unreadTotal }) => {

  // Cargar conversaciones al abrir
  useEffect(() => {
    if (!isOpen) return;

    const loadConversations = async () => {
      try {
        const data = await getConversations();
        setConversations(data.conversations || []);
      } catch (err) {
        console.error('[ChatList] Error cargando conversaciones:', err.message);
      }
    };

    loadConversations();
  }, [isOpen, setConversations]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-40 animate-slide-up flex flex-col">
      {/* Overlay */}
      <div className="flex-shrink-0 h-16 md:h-32" onClick={onClose} />

      {/* Panel */}
      <div className="flex-1 bg-dark-300 rounded-t-2xl flex flex-col overflow-hidden border-t border-dark-100">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-dark-100">
          <h2 className="font-semibold text-lg">Mensajes</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-dark-200 flex items-center justify-center hover:bg-dark-100 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Lista de conversaciones */}
        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-500 text-sm text-center px-4">
                No tienes conversaciones aún.<br />
                Toca un pin en el mapa para empezar a chatear.
              </p>
            </div>
          ) : (
            conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => onSelectConversation(conv)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-dark-200 transition-colors border-b border-dark-100/50"
              >
                {/* Avatar */}
                <div className="relative flex-shrink-0">
                  <div className="w-12 h-12 rounded-full bg-primary-600/80 flex items-center justify-center text-lg font-bold">
                    {conv.otherUser?.displayName?.[0]?.toUpperCase() || '?'}
                  </div>
                  {/* Indicador online */}
                  {conv.otherUser?.isOnline && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-dark-300" />
                  )}
                </div>

                {/* Info de la conversación */}
                <div className="flex-1 min-w-0 text-left">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-sm truncate">
                      {conv.otherUser?.displayName || 'Usuario'}
                    </p>
                    <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                      {formatLastTime(conv.lastMessage?.timestamp)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-0.5">
                    <p className="text-xs text-gray-400 truncate">
                      {conv.lastMessage?.text || 'Sin mensajes'}
                    </p>
                    {conv.unreadCount > 0 && (
                      <span className="bg-primary-500 text-white text-xs rounded-full min-w-[20px] h-5 flex items-center justify-center px-1 flex-shrink-0 ml-2">
                        {conv.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatList;
