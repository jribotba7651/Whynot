// Manejador de eventos de chat por WebSocket (Fase 2 + Fase 6.2 block filter)
// Gestiona conversaciones, mensajes y indicadores de escritura
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const User = require('../models/User');
const Block = require('../models/Block');

// Mapa de userId → socketId para enviar mensajes directos
const userSocketMap = new Map();

const chatHandler = (io, socket) => {

  // Registrar usuario en el mapa de sockets activos
  socket.on('chat:register', (data) => {
    if (data?.userId) {
      userSocketMap.set(data.userId, socket.id);
    }
  });

  // chat:initiate — Iniciar o recuperar conversación existente
  socket.on('chat:initiate', async (data) => {
    try {
      const { userId, targetUserId } = data;

      if (!userId || !targetUserId) {
        return socket.emit('error', { message: 'User IDs required' });
      }

      // Verificar que el target existe
      const targetUser = await User.findOne({
        _id: targetUserId,
        isDeleted: { $ne: true }
      });

      if (!targetUser) {
        return socket.emit('error', { message: 'User not found' });
      }

      // Fase 6.2: Verificar bloqueos (en ambas direcciones)
      const blockExists = await Block.findOne({
        $or: [
          { blockerId: userId, blockedUserId: targetUserId },
          { blockerId: targetUserId, blockedUserId: userId }
        ]
      });
      if (blockExists) {
        return socket.emit('error', { message: 'You cannot chat with this user' });
      }

      // Buscar conversación existente entre ambos usuarios
      let conversation = await Conversation.findOne({
        participants: { $all: [userId, targetUserId] },
        isActive: true
      });

      // Si no existe, crear nueva conversación
      if (!conversation) {
        // Verificar límite de 50 conversaciones activas
        const activeCount = await Conversation.countDocuments({
          participants: userId,
          isActive: true
        });

        if (activeCount >= 50) {
          return socket.emit('error', {
            message: 'You have reached the limit of 50 active conversations'
          });
        }

        conversation = new Conversation({
          participants: [userId, targetUserId],
          isActive: true
        });
        await conversation.save();
      }

      // Unir al socket a la sala de la conversación
      socket.join(`conversation:${conversation._id}`);

      socket.emit('chat:initiated', {
        conversationId: conversation._id,
        targetUser: {
          id: targetUser._id,
          displayName: targetUser.profile?.displayName || targetUser.displayName,
          isOnline: targetUser.isOnline,
          avatar: targetUser.profile?.avatar,
          isProfileComplete: targetUser.isProfileComplete
        }
      });
    } catch (error) {
      console.error('[Socket:Chat] Error iniciando chat:', error.message);
      socket.emit('error', { message: 'Error starting conversation' });
    }
  });

  // chat:join — Unirse a la sala de una conversación
  socket.on('chat:join', (data) => {
    if (data?.conversationId) {
      socket.join(`conversation:${data.conversationId}`);
    }
  });

  // chat:message — Enviar mensaje en una conversación
  socket.on('chat:message', async (data) => {
    try {
      const { conversationId, userId, text } = data;

      if (!conversationId || !userId || !text) {
        return socket.emit('error', { message: 'Incomplete message data' });
      }

      // Validar longitud del mensaje
      if (text.length > 500) {
        return socket.emit('error', { message: 'Message cannot exceed 500 characters' });
      }

      // Verificar que el usuario es participante
      const conversation = await Conversation.findOne({
        _id: conversationId,
        participants: userId,
        isActive: true
      });

      if (!conversation) {
        return socket.emit('error', { message: 'Conversation not found' });
      }

      // Fase 6.2: Verificar si el sender está bloqueado por el receiver
      const otherParticipant = conversation.participants.find(
        p => p.toString() !== userId
      );
      if (otherParticipant) {
        const isBlocked = await Block.findOne({
          blockerId: otherParticipant,
          blockedUserId: userId
        });
        if (isBlocked) {
          // No entregar el mensaje — silencioso para el sender
          return;
        }
      }

      // Crear y guardar el mensaje
      const message = new Message({
        conversation: conversationId,
        sender: userId,
        text: text.trim()
      });
      await message.save();

      // Actualizar último mensaje de la conversación
      conversation.lastMessage = {
        text: text.trim().substring(0, 100), // Preview truncado
        sender: userId,
        timestamp: new Date()
      };
      await conversation.save();

      // Obtener info del sender
      const sender = await User.findById(userId).select('displayName profile').lean();

      const messageData = {
        id: message._id,
        conversationId,
        text: message.text,
        sender: {
          id: userId,
          displayName: sender?.profile?.displayName || sender?.displayName
        },
        read: false,
        createdAt: message.createdAt
      };

      // Emitir mensaje a toda la sala de la conversación
      io.to(`conversation:${conversationId}`).emit('chat:newMessage', messageData);

      // Notificar al otro participante si no está en la sala
      const otherUserId = conversation.participants.find(
        p => p.toString() !== userId
      );
      if (otherUserId) {
        const otherSocketId = userSocketMap.get(otherUserId.toString());
        if (otherSocketId) {
          io.to(otherSocketId).emit('chat:notification', {
            conversationId,
            message: messageData
          });
        }
      }
    } catch (error) {
      console.error('[Socket:Chat] Error enviando mensaje:', error.message);
      socket.emit('error', { message: 'Error sending message' });
    }
  });

  // chat:typing — Indicador de "escribiendo…"
  socket.on('chat:typing', (data) => {
    const { conversationId, userId, isTyping } = data;
    if (conversationId && userId) {
      // Emitir a toda la sala excepto al que escribe
      socket.to(`conversation:${conversationId}`).emit('chat:userTyping', {
        conversationId,
        userId,
        isTyping
      });
    }
  });

  // chat:read — Marcar mensajes como leídos
  socket.on('chat:read', async (data) => {
    try {
      const { conversationId, userId } = data;

      if (!conversationId || !userId) return;

      // Marcar todos los mensajes no leídos del otro usuario como leídos
      await Message.updateMany(
        {
          conversation: conversationId,
          sender: { $ne: userId },
          read: false
        },
        { read: true }
      );

      // Notificar al otro participante
      socket.to(`conversation:${conversationId}`).emit('chat:messagesRead', {
        conversationId,
        readBy: userId
      });
    } catch (error) {
      console.error('[Socket:Chat] Error marcando como leído:', error.message);
    }
  });

  // chat:history — Solicitar historial de mensajes con paginación
  socket.on('chat:history', async (data) => {
    try {
      const { conversationId, userId, before, limit = 20 } = data;

      if (!conversationId || !userId) return;

      // Verificar que es participante
      const conversation = await Conversation.findOne({
        _id: conversationId,
        participants: userId
      });

      if (!conversation) {
        return socket.emit('error', { message: 'Conversation not found' });
      }

      const query = { conversation: conversationId };
      if (before) {
        query.createdAt = { $lt: new Date(before) };
      }

      const messages = await Message.find(query)
        .sort({ createdAt: -1 })
        .limit(Math.min(limit, 50))
        .populate('sender', 'displayName profile')
        .lean();

      messages.reverse();

      socket.emit('chat:historyResult', {
        conversationId,
        messages: messages.map(m => ({
          id: m._id,
          text: m.text,
          sender: {
            id: m.sender._id,
            displayName: m.sender.profile?.displayName || m.sender.displayName
          },
          read: m.read,
          createdAt: m.createdAt
        })),
        hasMore: messages.length === limit
      });
    } catch (error) {
      console.error('[Socket:Chat] Error obteniendo historial:', error.message);
    }
  });

  // Limpiar al desconectarse
  socket.on('disconnect', () => {
    // Buscar y eliminar usuario del mapa
    for (const [userId, socketId] of userSocketMap.entries()) {
      if (socketId === socket.id) {
        userSocketMap.delete(userId);
        break;
      }
    }
  });
};

module.exports = { chatHandler, userSocketMap };
