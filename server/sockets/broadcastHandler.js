// Manejador de broadcasts por WebSocket (Fase 6.4)
// Mensajes efímeros visibles a todos en el radio
const Broadcast = require('../models/Broadcast');
const User = require('../models/User');
const { buildNearbyQuery, haversineDistance } = require('../utils/geo');
const { DEFAULT_RADIUS_KM } = require('../config/env');

// Mapa de userId → socketId para enviar broadcasts directos
const broadcastUserMap = new Map();

const broadcastHandler = (io, socket) => {

  // Registrar usuario para broadcasts
  socket.on('broadcast:register', (data) => {
    if (data?.userId) {
      broadcastUserMap.set(data.userId, socket.id);
    }
  });

  // broadcast:send — Enviar mensaje efímero al área
  socket.on('broadcast:send', async (data) => {
    try {
      const { userId, message } = data;

      if (!userId || !message) {
        return socket.emit('broadcast:error', { code: 'INVALID', message: 'Datos incompletos' });
      }

      // Verificar que el usuario es registrado
      const user = await User.findById(userId);
      if (!user || user.accountType !== 'registered') {
        return socket.emit('broadcast:error', {
          code: 'NOT_REGISTERED',
          message: 'Crea una cuenta para enviar updates'
        });
      }

      if (message.length > 140) {
        return socket.emit('broadcast:error', {
          code: 'TOO_LONG',
          message: 'El mensaje no puede tener más de 140 caracteres'
        });
      }

      // Rate limit: 1 cada 30 minutos
      const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000);
      const recent = await Broadcast.findOne({ userId, createdAt: { $gte: thirtyMinAgo } });
      if (recent) {
        return socket.emit('broadcast:error', {
          code: 'RATE_LIMITED',
          message: 'Puedes enviar un broadcast cada 30 minutos'
        });
      }

      // Verificar que tiene ubicación
      if (!user.location?.coordinates?.[0]) {
        return socket.emit('broadcast:error', {
          code: 'NO_LOCATION',
          message: 'Necesitas activar la ubicación'
        });
      }

      // Crear broadcast
      const broadcast = await Broadcast.create({
        userId: user._id,
        message: message.trim(),
        location: user.location,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000)
      });

      // Buscar usuarios en el radio para emitir
      const nearbyUsers = await User.find({
        ...buildNearbyQuery(
          user.location.coordinates[0],
          user.location.coordinates[1],
          DEFAULT_RADIUS_KM
        ),
        isOnline: true,
        isDeleted: { $ne: true },
        isShadowBanned: { $ne: true }
      })
        .select('_id location')
        .lean();

      const broadcastData = {
        id: broadcast._id,
        userId: user._id,
        displayName: user.profile?.displayName || user.displayName,
        userType: user.userType,
        message: broadcast.message,
        expiresAt: broadcast.expiresAt,
        createdAt: broadcast.createdAt
      };

      // Emitir a cada usuario cercano
      nearbyUsers.forEach(nearbyUser => {
        const nearbySocketId = broadcastUserMap.get(nearbyUser._id.toString());
        if (nearbySocketId) {
          const dist = haversineDistance(
            user.location.coordinates[1], user.location.coordinates[0],
            nearbyUser.location.coordinates[1], nearbyUser.location.coordinates[0]
          );
          io.to(nearbySocketId).emit('broadcast:new', { ...broadcastData, distanceKm: dist });
        }
      });

    } catch (error) {
      console.error('[Socket:Broadcast] Error enviando broadcast:', error.message);
      socket.emit('broadcast:error', { code: 'SERVER_ERROR', message: 'Error enviando broadcast' });
    }
  });

  // Cleanup al desconectarse
  socket.on('disconnect', () => {
    for (const [userId, socketId] of broadcastUserMap.entries()) {
      if (socketId === socket.id) {
        broadcastUserMap.delete(userId);
        break;
      }
    }
  });
};

module.exports = { broadcastHandler };
