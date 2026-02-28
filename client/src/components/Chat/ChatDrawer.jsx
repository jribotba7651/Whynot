// Drawer de chat (bottom sheet en móvil)
// Se abre al tocar un pin o al seleccionar una conversación
// Muestra mensajes, input de texto, indicador de escritura
import { useState, useEffect, useRef, useCallback } from 'react';

// Formatear timestamp de mensajes
const formatTime = (dateStr) => {
  const date = new Date(dateStr);
  return date.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' });
};

// Agrupar mensajes por día
const getDateLabel = (dateStr) => {
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return 'Hoy';
  if (date.toDateString() === yesterday.toDateString()) return 'Ayer';
  return date.toLocaleDateString('es', { day: 'numeric', month: 'long' });
};

const ChatDrawer = ({
  isOpen,
  onClose,
  targetUser,
  messages,
  onSendMessage,
  onTyping,
  isTyping,
  onLoadMore,
  loadingMore,
  currentUserId
}) => {
  const [text, setText] = useState('');
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Auto-scroll al último mensaje
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Scroll infinito hacia arriba para historial
  const handleScroll = useCallback(() => {
    const container = messagesContainerRef.current;
    if (!container || loadingMore) return;

    // Si está cerca del top, cargar más mensajes
    if (container.scrollTop < 50) {
      onLoadMore?.();
    }
  }, [onLoadMore, loadingMore]);

  // Manejar input de texto con debounce de typing
  const handleTextChange = (e) => {
    const value = e.target.value;
    if (value.length > 500) return; // Límite de 500 caracteres

    setText(value);

    // Emitir typing con debounce
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    if (value.length > 0) {
      onTyping?.(true);
      typingTimeoutRef.current = setTimeout(() => {
        onTyping?.(false);
      }, 300);
    } else {
      onTyping?.(false);
    }
  };

  // Enviar mensaje
  const handleSend = () => {
    if (!text.trim()) return;
    onSendMessage(text.trim());
    setText('');
    onTyping?.(false);
  };

  // Enviar con Enter
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isOpen) return null;

  // Agrupar mensajes por fecha
  let lastDate = '';

  return (
    <div className="fixed inset-0 z-50 flex flex-col animate-slide-up">
      {/* Overlay oscuro */}
      <div className="flex-shrink-0 h-16 md:h-32" onClick={onClose} />

      {/* Drawer */}
      <div className="flex-1 bg-dark-300 rounded-t-2xl flex flex-col overflow-hidden border-t border-dark-100">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-dark-100">
          <div className="flex items-center gap-3">
            {/* Avatar */}
            <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-sm font-bold">
              {targetUser?.displayName?.[0]?.toUpperCase() || '?'}
            </div>
            <div>
              <p className="font-medium text-sm">{targetUser?.displayName || 'Usuario'}</p>
              <p className="text-xs text-gray-400">
                {targetUser?.isOnline ? (
                  <span className="text-green-400">En línea</span>
                ) : (
                  'Desconectado'
                )}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-dark-200 flex items-center justify-center hover:bg-dark-100 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Mensajes */}
        <div
          ref={messagesContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto px-4 py-3 space-y-2"
        >
          {/* Indicador de carga de historial */}
          {loadingMore && (
            <div className="text-center text-gray-500 text-xs py-2">
              Cargando mensajes anteriores...
            </div>
          )}

          {messages.length === 0 && (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-500 text-sm text-center">
                No hay mensajes aún.<br />
                ¡Envía el primero!
              </p>
            </div>
          )}

          {messages.map((msg, idx) => {
            const dateLabel = getDateLabel(msg.createdAt);
            const showDate = dateLabel !== lastDate;
            lastDate = dateLabel;

            const isOwn = msg.sender?.id === currentUserId;

            return (
              <div key={msg.id || idx}>
                {/* Separador de fecha */}
                {showDate && (
                  <div className="text-center text-xs text-gray-500 py-2">
                    {dateLabel}
                  </div>
                )}

                {/* Burbuja de mensaje */}
                <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm ${
                      isOwn
                        ? 'bg-primary-600 text-white rounded-br-md'
                        : 'bg-dark-100 text-gray-100 rounded-bl-md'
                    }`}
                  >
                    <p className="break-words">{msg.text}</p>
                    <p className={`text-[10px] mt-1 ${isOwn ? 'text-primary-200' : 'text-gray-500'}`}>
                      {formatTime(msg.createdAt)}
                      {isOwn && (
                        <span className="ml-1">{msg.read ? '✓✓' : '✓'}</span>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Indicador de typing */}
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-dark-100 px-3 py-2 rounded-2xl rounded-bl-md text-sm text-gray-400">
                <span className="animate-pulse">Escribiendo...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input de mensaje */}
        <div className="flex items-end gap-2 px-4 py-3 border-t border-dark-100">
          <div className="flex-1 relative">
            <textarea
              value={text}
              onChange={handleTextChange}
              onKeyDown={handleKeyDown}
              placeholder="Escribe un mensaje..."
              rows={1}
              maxLength={500}
              className="w-full bg-dark-200 text-white px-4 py-2 rounded-2xl text-sm resize-none
                         border border-dark-100 focus:border-primary-500 focus:outline-none
                         placeholder-gray-500 max-h-24"
              style={{ minHeight: '40px' }}
            />
            {text.length > 400 && (
              <span className="absolute right-3 bottom-1 text-[10px] text-gray-500">
                {text.length}/500
              </span>
            )}
          </div>
          <button
            onClick={handleSend}
            disabled={!text.trim()}
            className="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center
                       hover:bg-primary-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatDrawer;
