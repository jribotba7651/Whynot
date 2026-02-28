// Hook personalizado para el sistema de chat (Fase 2)
// Maneja mensajes, typing indicators, y notificaciones
import { useState, useEffect, useCallback, useRef } from 'react';
import useSocket from './useSocket';
import { useAuth } from '../context/AuthContext';

const useChat = () => {
  const { socket } = useSocket();
  const { user } = useAuth();

  // Estado del chat
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [unreadTotal, setUnreadTotal] = useState(0);
  const [typingUsers, setTypingUsers] = useState({});
  const [loadingMessages, setLoadingMessages] = useState(false);

  // Ref para debounce del typing
  const typingTimeoutRef = useRef(null);

  // Escuchar eventos de chat
  useEffect(() => {
    if (!socket) return;

    // Nuevo mensaje recibido
    const onNewMessage = (data) => {
      // Si es de la conversación activa, agregar a la lista
      if (data.conversationId === activeConversation) {
        setMessages(prev => [...prev, data]);
        // Marcar como leído si estamos en la conversación
        socket.emit('chat:read', {
          conversationId: data.conversationId,
          userId: user?.id
        });
      }
    };

    // Notificación de mensaje (cuando no estamos en la conversación)
    const onNotification = (data) => {
      // Actualizar contador de no leídos
      setUnreadTotal(prev => prev + 1);

      // Actualizar lista de conversaciones
      setConversations(prev => {
        const updated = [...prev];
        const idx = updated.findIndex(c => c.id === data.conversationId);
        if (idx !== -1) {
          updated[idx] = {
            ...updated[idx],
            lastMessage: data.message,
            unreadCount: (updated[idx].unreadCount || 0) + 1
          };
          // Mover al inicio
          const [conv] = updated.splice(idx, 1);
          updated.unshift(conv);
        }
        return updated;
      });
    };

    // Indicador de escritura
    const onTyping = (data) => {
      setTypingUsers(prev => ({
        ...prev,
        [data.conversationId]: data.isTyping ? data.userId : null
      }));
    };

    // Mensajes marcados como leídos
    const onRead = (data) => {
      if (data.conversationId === activeConversation) {
        setMessages(prev =>
          prev.map(m => ({ ...m, read: true }))
        );
      }
    };

    // Resultado del historial
    const onHistory = (data) => {
      setLoadingMessages(false);
      if (data.conversationId === activeConversation) {
        setMessages(prev => [...data.messages, ...prev]);
      }
    };

    socket.on('chat:newMessage', onNewMessage);
    socket.on('chat:notification', onNotification);
    socket.on('chat:userTyping', onTyping);
    socket.on('chat:messagesRead', onRead);
    socket.on('chat:historyResult', onHistory);

    return () => {
      socket.off('chat:newMessage', onNewMessage);
      socket.off('chat:notification', onNotification);
      socket.off('chat:userTyping', onTyping);
      socket.off('chat:messagesRead', onRead);
      socket.off('chat:historyResult', onHistory);
    };
  }, [socket, activeConversation, user?.id]);

  // Iniciar conversación con otro usuario
  const initiateChat = useCallback((targetUserId) => {
    if (!socket || !user?.id) return;

    socket.emit('chat:initiate', {
      userId: user.id,
      targetUserId
    });

    // Escuchar respuesta
    const onInitiated = (data) => {
      setActiveConversation(data.conversationId);
      setMessages([]);
      socket.emit('chat:join', { conversationId: data.conversationId });
      // Cargar historial
      socket.emit('chat:history', {
        conversationId: data.conversationId,
        userId: user.id
      });
      socket.off('chat:initiated', onInitiated);
    };

    socket.on('chat:initiated', onInitiated);
  }, [socket, user?.id]);

  // Enviar mensaje
  const sendMessage = useCallback((text) => {
    if (!socket || !activeConversation || !user?.id || !text.trim()) return;

    if (text.length > 500) {
      return; // Límite de 500 caracteres
    }

    socket.emit('chat:message', {
      conversationId: activeConversation,
      userId: user.id,
      text: text.trim()
    });
  }, [socket, activeConversation, user?.id]);

  // Enviar indicador de escritura (con debounce de 300ms)
  const sendTyping = useCallback((isTyping) => {
    if (!socket || !activeConversation || !user?.id) return;

    // Limpiar timeout anterior
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    socket.emit('chat:typing', {
      conversationId: activeConversation,
      userId: user.id,
      isTyping
    });

    // Auto-stop después de 3 segundos
    if (isTyping) {
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit('chat:typing', {
          conversationId: activeConversation,
          userId: user.id,
          isTyping: false
        });
      }, 3000);
    }
  }, [socket, activeConversation, user?.id]);

  // Cargar más mensajes (scroll infinito)
  const loadMoreMessages = useCallback(() => {
    if (!socket || !activeConversation || !user?.id || loadingMessages) return;

    const oldestMessage = messages[0];
    if (!oldestMessage) return;

    setLoadingMessages(true);
    socket.emit('chat:history', {
      conversationId: activeConversation,
      userId: user.id,
      before: oldestMessage.createdAt,
      limit: 20
    });
  }, [socket, activeConversation, user?.id, messages, loadingMessages]);

  // Abrir conversación existente
  const openConversation = useCallback((conversationId) => {
    if (!socket || !user?.id) return;

    setActiveConversation(conversationId);
    setMessages([]);
    socket.emit('chat:join', { conversationId });
    socket.emit('chat:read', { conversationId, userId: user.id });
    socket.emit('chat:history', {
      conversationId,
      userId: user.id
    });

    // Resetear unread de esta conversación
    setConversations(prev =>
      prev.map(c => c.id === conversationId ? { ...c, unreadCount: 0 } : c)
    );
  }, [socket, user?.id]);

  // Cerrar conversación activa
  const closeChat = useCallback(() => {
    setActiveConversation(null);
    setMessages([]);
  }, []);

  return {
    activeConversation,
    messages,
    conversations,
    setConversations,
    unreadTotal,
    setUnreadTotal,
    typingUsers,
    loadingMessages,
    initiateChat,
    sendMessage,
    sendTyping,
    loadMoreMessages,
    openConversation,
    closeChat
  };
};

export default useChat;
