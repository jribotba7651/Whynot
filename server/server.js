// Servidor principal — Express + Socket.io
// Punto de entrada de la aplicación backend
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const connectDB = require('./config/db');
const { PORT, NODE_ENV } = require('./config/env');
const { generalLimiter } = require('./middleware/rateLimiter');
const initializeSockets = require('./sockets');
const cron = require('node-cron');

// Importar rutas
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const chatRoutes = require('./routes/chat');
const broadcastRoutes = require('./routes/broadcasts');
const vibeRoutes = require('./routes/vibes');

// Inicializar Express
const app = express();
const server = http.createServer(app);

// Inicializar Socket.io con CORS configurado
const io = new Server(server, {
  cors: {
    origin: NODE_ENV === 'production'
      ? process.env.CLIENT_URL
      : ['http://localhost:5173', 'http://localhost:3000'],
    methods: ['GET', 'POST'],
    credentials: true
  },
  // Ping cada 25 segundos para detectar desconexiones
  pingInterval: 25000,
  pingTimeout: 10000
});

// Middleware global
app.use(helmet()); // Headers de seguridad
app.use(cors({
  origin: NODE_ENV === 'production'
    ? process.env.CLIENT_URL
    : ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}));
app.use(express.json({ limit: '1mb' }));
app.use(generalLimiter);

// Health check — no requiere autenticación
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: NODE_ENV
  });
});

// Rutas de la API
app.use('/api', authRoutes);           // POST /api/session, /api/auth/*
app.use('/api/auth', authRoutes);      // Rutas de autenticación (Fase 4)
app.use('/api/users', userRoutes);     // GET /api/users/nearby, perfiles
app.use('/api/conversations', chatRoutes); // Conversaciones y mensajes
app.use('/api/broadcasts', broadcastRoutes); // Broadcasts efímeros (Fase 6.4)
app.use('/api/vibes', vibeRoutes);           // Sistema de vibes (Fase 6.5)

// Ruta para actualizar perfil (alias directo)
const { verifyToken } = require('./middleware/auth');
const User = require('./models/User');

// Inicializar WebSockets
initializeSockets(io);

// Job de limpieza — corre cada 24 horas a las 3:00 AM
// Elimina usuarios anónimos expirados y sus datos asociados
cron.schedule('0 3 * * *', async () => {
  try {
    const Conversation = require('./models/Conversation');
    const Message = require('./models/Message');

    const now = new Date();

    // Buscar usuarios cuya fecha de retención ha pasado
    const expiredUsers = await User.find({
      dataRetentionDeadline: { $lte: now },
      $or: [
        { accountType: 'anonymous' },
        { isDeleted: true }
      ]
    }).select('_id');

    if (expiredUsers.length === 0) {
      console.log('[Cleanup] No hay usuarios para purgar');
      return;
    }

    const expiredIds = expiredUsers.map(u => u._id);

    // Eliminar mensajes de estos usuarios
    const deletedMessages = await Message.deleteMany({
      sender: { $in: expiredIds }
    });

    // Eliminar conversaciones donde todos los participantes son expirados
    const deletedConversations = await Conversation.deleteMany({
      participants: { $in: expiredIds }
    });

    // Eliminar los usuarios
    const deletedUsers = await User.deleteMany({
      _id: { $in: expiredIds }
    });

    console.log(`[Cleanup] Purgados: ${deletedUsers.deletedCount} usuarios, ` +
      `${deletedConversations.deletedCount} conversaciones, ` +
      `${deletedMessages.deletedCount} mensajes`);
  } catch (error) {
    console.error('[Cleanup] Error en job de limpieza:', error.message);
  }
});

// Conectar a MongoDB e iniciar servidor
const startServer = async () => {
  await connectDB();

  server.listen(PORT, () => {
    console.log(`[Server] Servidor corriendo en puerto ${PORT} (${NODE_ENV})`);
    console.log(`[Server] Health check: http://localhost:${PORT}/api/health`);
  });
};

startServer();

// Manejo de errores no capturados
process.on('unhandledRejection', (err) => {
  console.error('[Server] Error no manejado:', err.message);
});

module.exports = { app, server, io };
