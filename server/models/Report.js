// Modelo de Reportes (Fase 6.2)
// Almacena reportes de usuarios por contenido inapropiado, acoso, etc.
const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  reporterId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  reportedUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  reason: {
    type: String,
    enum: ['contenido_inapropiado', 'acoso', 'perfil_falso', 'menor_de_edad', 'otro'],
    required: true
  },
  details: { type: String, maxlength: 500 },
  status: {
    type: String,
    enum: ['pending', 'reviewed', 'resolved'],
    default: 'pending'
  },
  createdAt: { type: Date, default: Date.now }
});

// Un usuario solo puede reportar al mismo usuario una vez
reportSchema.index({ reporterId: 1, reportedUserId: 1 }, { unique: true });

module.exports = mongoose.model('Report', reportSchema);
