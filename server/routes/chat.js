// Rutas de chat (Fase 2)
// Endpoints REST para conversaciones y mensajes (respaldo de WebSocket)
const express = require('express');
const router = express.Router();
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const { verifyToken } = require('../middleware/auth');

// GET /api/conversations — Lista de conversaciones del usuario
// Ordenadas por último mensaje (más reciente primero)
router.get('/', verifyToken, async (req, res) => {
  try {
    const conversations = await Conversation.find({
      participants: req.userId,
      isActive: true
    })
      .populate('participants', 'displayName profile isOnline isProfileComplete')
      .sort({ 'lastMessage.timestamp': -1 })
      .limit(50)
      .lean();

    // Contar mensajes no leídos por conversación
    const conversationsWithUnread = await Promise.all(
      conversations.map(async (conv) => {
        const unreadCount = await Message.countDocuments({
          conversation: conv._id,
          sender: { $ne: req.userId },
          read: false
        });

        // Obtener el otro participante
        const otherParticipant = conv.participants.find(
          p => p._id.toString() !== req.userId.toString()
        );

        return {
          id: conv._id,
          otherUser: otherParticipant ? {
            id: otherParticipant._id,
            displayName: otherParticipant.profile?.displayName || otherParticipant.displayName,
            isOnline: otherParticipant.isOnline,
            avatar: otherParticipant.profile?.avatar,
            isProfileComplete: otherParticipant.isProfileComplete
          } : null,
          lastMessage: conv.lastMessage,
          unreadCount,
          updatedAt: conv.updatedAt
        };
      })
    );

    res.json({ conversations: conversationsWithUnread });
  } catch (error) {
    console.error('[Chat] Error obteniendo conversaciones:', error.message);
    res.status(500).json({ error: 'Error fetching conversations' });
  }
});

// GET /api/conversations/:id/messages — Mensajes con paginación cursor-based
// Usa ?before=CURSOR&limit=20 para paginación
router.get('/:id/messages', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { before, limit = 20 } = req.query;

    // Verificar que el usuario es participante de la conversación
    const conversation = await Conversation.findOne({
      _id: id,
      participants: req.userId
    });

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    // Query con paginación basada en cursor (createdAt del último mensaje visto)
    const query = { conversation: id };
    if (before) {
      query.createdAt = { $lt: new Date(before) };
    }

    const messages = await Message.find(query)
      .sort({ createdAt: -1 })
      .limit(Math.min(parseInt(limit), 50))
      .populate('sender', 'displayName profile')
      .lean();

    // Invertir para orden cronológico
    messages.reverse();

    res.json({
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
      hasMore: messages.length === parseInt(limit)
    });
  } catch (error) {
    console.error('[Chat] Error obteniendo mensajes:', error.message);
    res.status(500).json({ error: 'Error fetching messages' });
  }
});

module.exports = router;
