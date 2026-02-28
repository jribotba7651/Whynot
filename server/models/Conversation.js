// Modelo de Conversación (Fase 2)
// Almacena conversaciones entre dos participantes
const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
  // Exactamente 2 participantes por conversación
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  // Último mensaje para preview en la lista de conversaciones
  lastMessage: {
    text: String,
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    timestamp: Date
  },
  // Si la conversación sigue activa
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Índice para buscar conversaciones de un usuario rápidamente
conversationSchema.index({ participants: 1 });
// Índice para ordenar por último mensaje
conversationSchema.index({ 'lastMessage.timestamp': -1 });

module.exports = mongoose.model('Conversation', conversationSchema);
