// Rutas de vibes (Fase 6.5)
// Sistema de reputación positiva entre usuarios
const express = require('express');
const router = express.Router();
const Vibe = require('../models/Vibe');
const User = require('../models/User');
const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const { verifyToken } = require('../middleware/auth');

// POST /api/vibes — Dar vibe positiva a un usuario
router.post('/', verifyToken, async (req, res) => {
  try {
    const { toUserId } = req.body;
    const fromUser = req.user;

    if (!toUserId || toUserId === fromUser._id.toString()) {
      return res.status(400).json({ error: 'ID de usuario inválido' });
    }

    // Solo usuarios registrados pueden dar vibes
    if (fromUser.accountType !== 'registered') {
      return res.status(403).json({ error: 'Crea una cuenta para dar vibes' });
    }

    const toUser = await User.findById(toUserId);
    if (!toUser || toUser.accountType !== 'registered') {
      return res.status(400).json({ error: 'El usuario debe tener cuenta para recibir vibes' });
    }

    // Verificar que existe conversación con al menos 10 mensajes
    const conversation = await Conversation.findOne({
      participants: { $all: [fromUser._id, toUserId] },
      isActive: true
    });

    if (!conversation) {
      return res.status(400).json({ error: 'Debes tener una conversación con este usuario' });
    }

    const messageCount = await Message.countDocuments({ conversation: conversation._id });
    if (messageCount < 10) {
      return res.status(400).json({ error: 'Necesitas al menos 10 mensajes en la conversación para dar una vibe' });
    }

    // Crear la vibe
    await Vibe.create({ fromUserId: fromUser._id, toUserId });

    // Incrementar el vibeCount del receptor
    const updated = await User.findByIdAndUpdate(toUserId, { $inc: { vibeCount: 1 } }, { new: true });

    res.json({ success: true, newVibeCount: updated.vibeCount });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Ya le diste vibe a este usuario' });
    }
    console.error('[Vibes] Error dando vibe:', error.message);
    res.status(500).json({ error: 'Error dando vibe' });
  }
});

// GET /api/vibes/:userId — Obtener vibeCount de un usuario
router.get('/:userId', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select('vibeCount').lean();
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json({ vibeCount: user.vibeCount || 0 });
  } catch (error) {
    res.status(500).json({ error: 'Error obteniendo vibes' });
  }
});

// GET /api/vibes/check/:userId — Verificar si ya di vibe a este usuario
router.get('/check/:userId', verifyToken, async (req, res) => {
  try {
    const existing = await Vibe.findOne({ fromUserId: req.userId, toUserId: req.params.userId });

    // También verificar requisito de 10 mensajes
    const conversation = await Conversation.findOne({
      participants: { $all: [req.userId, req.params.userId] },
      isActive: true
    });
    let messageCount = 0;
    if (conversation) {
      messageCount = await Message.countDocuments({ conversation: conversation._id });
    }

    res.json({
      hasGivenVibe: !!existing,
      canGiveVibe: !existing && messageCount >= 10 && req.user.accountType === 'registered',
      messageCount
    });
  } catch (error) {
    res.status(500).json({ error: 'Error verificando vibes' });
  }
});

module.exports = router;
