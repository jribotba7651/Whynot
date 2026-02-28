// Modelo de Mensaje (Fase 2)
// Almacena mensajes individuales dentro de conversaciones
const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  // Referencia a la conversación
  conversation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation',
    required: true
  },
  // Quién envió el mensaje
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Contenido del mensaje (máximo 500 caracteres)
  text: {
    type: String,
    required: true,
    maxlength: 500
  },
  // Si el mensaje fue leído por el destinatario
  read: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Índice compuesto para paginación eficiente de mensajes
messageSchema.index({ conversation: 1, createdAt: -1 });

module.exports = mongoose.model('Message', messageSchema);
