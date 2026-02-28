// Modelo de Bloqueos (Fase 6.2)
// Almacena relaciones de bloqueo entre usuarios
const mongoose = require('mongoose');

const blockSchema = new mongoose.Schema({
  blockerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  blockedUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now }
});

// Index compuesto único: un usuario solo puede bloquear al mismo usuario una vez
blockSchema.index({ blockerId: 1, blockedUserId: 1 }, { unique: true });

module.exports = mongoose.model('Block', blockSchema);
