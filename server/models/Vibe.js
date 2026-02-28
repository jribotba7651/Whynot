// Modelo de Vibes (Fase 6.5)
// Sistema de reputación positiva entre usuarios
const mongoose = require('mongoose');

const vibeSchema = new mongoose.Schema({
  fromUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  toUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now }
});

// Index compuesto único: un usuario solo puede dar 1 vibe a otro
vibeSchema.index({ fromUserId: 1, toUserId: 1 }, { unique: true });

module.exports = mongoose.model('Vibe', vibeSchema);
