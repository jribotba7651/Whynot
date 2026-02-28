// Modelo de Broadcasts (Fase 6.4)
// Mensajes efímeros visibles a todos en el radio (expiran en 15 min)
const mongoose = require('mongoose');

const broadcastSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  message: { type: String, required: true, maxlength: 140 },
  location: {
    type: { type: String, default: 'Point' },
    coordinates: [Number]
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expireAfterSeconds: 0 } // TTL: MongoDB auto-elimina documentos expirados
  },
  createdAt: { type: Date, default: Date.now }
});

// Índice geoespacial para queries por proximidad
broadcastSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Broadcast', broadcastSchema);
