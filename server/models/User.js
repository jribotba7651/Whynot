// Modelo de Usuario
// Almacena información de sesión, ubicación y perfil de cada usuario
// Incluye índice geoespacial 2dsphere para queries de proximidad
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  // Identificador de sesión para usuarios anónimos (UUID)
  sessionId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  // Nombre visible generado automáticamente ("User_XXXX")
  displayName: {
    type: String,
    default: function() {
      return `User_${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    }
  },
  // Ubicación geoespacial en formato GeoJSON
  // IMPORTANTE: MongoDB usa [longitud, latitud], NO [latitud, longitud]
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      default: [0, 0]
    }
  },
  // Última vez que el usuario fue visto activo
  lastSeen: {
    type: Date,
    default: Date.now
  },
  // Si el usuario está conectado actualmente
  isOnline: {
    type: Boolean,
    default: false
  },
  // Si el usuario es anónimo (sin cuenta registrada)
  isAnonymous: {
    type: Boolean,
    default: true
  },
  // --- Campos de Fase 3: Perfil ---
  profile: {
    displayName: { type: String, maxlength: 30 },
    age: { type: Number, min: 18, max: 99 },
    bio: { type: String, maxlength: 200 },
    avatar: { type: String, default: null },
    lookingFor: {
      type: String,
      enum: ['amistad', 'citas', 'networking', 'lo-que-sea'],
      default: 'lo-que-sea'
    },
    interests: [{
      type: String,
      enum: ['música', 'deportes', 'arte', 'tecnología', 'gastronomía',
             'viajes', 'gaming', 'lectura', 'fitness', 'cine']
    }],
    showAge: { type: Boolean, default: true },
    showDistance: { type: Boolean, default: true }
  },
  isProfileComplete: { type: Boolean, default: false },

  // --- Campos de Fase 4: Cuentas ---
  email: {
    type: String,
    unique: true,
    sparse: true // Permite múltiples nulls
  },
  password: String, // Hash bcrypt
  refreshToken: String, // Hash del refresh token
  accountType: {
    type: String,
    enum: ['anonymous', 'registered'],
    default: 'anonymous'
  },
  previousSessionIds: [String],
  lastLogin: Date,
  dataRetentionDeadline: Date, // Para anónimos: createdAt + 30 días
  isDeleted: { type: Boolean, default: false },
  deletedAt: Date
}, {
  timestamps: true // Agrega createdAt y updatedAt automáticamente
});

// Índice geoespacial para queries de proximidad ($near, $geoWithin)
userSchema.index({ location: '2dsphere' });

// Índice para limpieza de datos de usuarios anónimos
userSchema.index({ dataRetentionDeadline: 1 }, { sparse: true });

// Al crear un usuario anónimo, establecer fecha límite de retención de datos
userSchema.pre('save', function(next) {
  if (this.isNew && this.isAnonymous && !this.dataRetentionDeadline) {
    // 30 días desde la creación
    this.dataRetentionDeadline = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  }
  next();
});

// Método para obtener el nombre a mostrar (perfil tiene prioridad)
userSchema.methods.getDisplayName = function() {
  return this.profile?.displayName || this.displayName;
};

module.exports = mongoose.model('User', userSchema);
