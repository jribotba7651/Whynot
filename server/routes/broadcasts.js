// Rutas de broadcasts (Fase 6.4)
// Mensajes efímeros visibles a todos en el radio
const express = require('express');
const router = express.Router();
const Broadcast = require('../models/Broadcast');
const { verifyToken } = require('../middleware/auth');
const { buildNearbyQuery } = require('../utils/geo');
const { DEFAULT_RADIUS_KM } = require('../config/env');

// GET /api/broadcasts/nearby — Broadcasts activos en el radio
router.get('/nearby', verifyToken, async (req, res) => {
  try {
    const { lat, lon } = req.query;
    if (!lat || !lon) {
      return res.status(400).json({ error: 'Coordinates required' });
    }

    const broadcasts = await Broadcast.find({
      ...buildNearbyQuery(parseFloat(lon), parseFloat(lat), DEFAULT_RADIUS_KM),
      expiresAt: { $gt: new Date() }
    })
      .populate('userId', 'displayName profile userType')
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    res.json({
      broadcasts: broadcasts.map(b => ({
        id: b._id,
        userId: b.userId._id,
        displayName: b.userId.profile?.displayName || b.userId.displayName,
        userType: b.userId.userType,
        message: b.message,
        expiresAt: b.expiresAt,
        createdAt: b.createdAt
      }))
    });
  } catch (error) {
    console.error('[Broadcasts] Error obteniendo broadcasts:', error.message);
    res.status(500).json({ error: 'Error fetching broadcasts' });
  }
});

// POST /api/broadcasts — Crear broadcast (solo usuarios registrados)
router.post('/', verifyToken, async (req, res) => {
  try {
    const user = req.user;

    if (user.accountType !== 'registered') {
      return res.status(403).json({ error: 'Create an account to send updates', code: 'NOT_REGISTERED' });
    }

    const { message } = req.body;
    if (!message || message.length > 140) {
      return res.status(400).json({ error: 'Message must be between 1 and 140 characters', code: 'TOO_LONG' });
    }

    // Rate limit: 1 broadcast cada 30 minutos
    const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000);
    const recent = await Broadcast.findOne({ userId: user._id, createdAt: { $gte: thirtyMinAgo } });
    if (recent) {
      return res.status(429).json({ error: 'You can send one broadcast every 30 minutes', code: 'RATE_LIMITED' });
    }

    const broadcast = await Broadcast.create({
      userId: user._id,
      message: message.trim(),
      location: user.location,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000) // 15 minutos
    });

    res.json({
      id: broadcast._id,
      message: broadcast.message,
      expiresAt: broadcast.expiresAt,
      createdAt: broadcast.createdAt
    });
  } catch (error) {
    console.error('[Broadcasts] Error creando broadcast:', error.message);
    res.status(500).json({ error: 'Error creating broadcast' });
  }
});

module.exports = router;
