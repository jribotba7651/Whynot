// Manejador de eventos de geolocalización por WebSocket
// Recibe actualizaciones de ubicación y emite usuarios cercanos
// Incluye: randomización de ubicación, filtro shadow-ban, filtro bloqueos
const User = require('../models/User');
const Block = require('../models/Block');
const { buildNearbyQuery, haversineDistance, randomizeLocation } = require('../utils/geo');
const { DEFAULT_RADIUS_KM } = require('../config/env');

// Mapa de socketId → userId para tracking rápido
const socketUserMap = new Map();

// Cache de bloqueos por usuario (se actualiza cada 30 segundos)
const blockCache = new Map();

const locationHandler = (io, socket) => {

  // location:update — El cliente envía su nueva ubicación
  // Actualiza en MongoDB y emite lista de usuarios cercanos
  socket.on('location:update', async (data) => {
    try {
      const { latitude, longitude, userId } = data;

      if (!latitude || !longitude || !userId) {
        return socket.emit('error', { message: 'Datos de ubicación incompletos' });
      }

      // Validar coordenadas
      if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
        return socket.emit('error', { message: 'Coordenadas inválidas' });
      }

      // Asociar socket con usuario
      socketUserMap.set(socket.id, userId);

      // Actualizar ubicación en MongoDB
      // IMPORTANTE: MongoDB usa [longitud, latitud]
      await User.findByIdAndUpdate(userId, {
        location: {
          type: 'Point',
          coordinates: [longitude, latitude]
        },
        lastSeen: new Date(),
        isOnline: true
      });

      // Obtener lista de bloqueos (usar cache si es reciente)
      let blockedIds = [];
      let blockedByIds = [];
      const cached = blockCache.get(userId);
      if (cached && Date.now() - cached.timestamp < 30000) {
        blockedIds = cached.blockedIds;
        blockedByIds = cached.blockedByIds;
      } else {
        const blocks = await Block.find({ blockerId: userId }).select('blockedUserId').lean();
        blockedIds = blocks.map(b => b.blockedUserId.toString());
        const blockedBy = await Block.find({ blockedUserId: userId }).select('blockerId').lean();
        blockedByIds = blockedBy.map(b => b.blockerId.toString());
        blockCache.set(userId, { blockedIds, blockedByIds, timestamp: Date.now() });
      }

      const excludeIds = [userId, ...blockedIds, ...blockedByIds];

      // Buscar usuarios cercanos
      const staleThreshold = new Date(Date.now() - 60 * 1000); // 60 segundos

      const nearbyUsers = await User.find({
        ...buildNearbyQuery(longitude, latitude, DEFAULT_RADIUS_KM),
        _id: { $nin: excludeIds },
        isOnline: true,
        lastSeen: { $gte: staleThreshold },
        isDeleted: { $ne: true },
        isShadowBanned: { $ne: true }
      })
        .select('displayName location lastSeen profile isProfileComplete userType seekingTypes onboardingComplete privacyRadius vibeCount')
        .limit(100)
        .lean();

      // Calcular distancia, formatear respuesta, y randomizar ubicación
      const usersWithDistance = nearbyUsers.map(user => {
        const realLat = user.location.coordinates[1];
        const realLon = user.location.coordinates[0];
        // Aplicar randomización — NUNCA enviar ubicación real de otro usuario
        const randomized = randomizeLocation(realLon, realLat, user.privacyRadius || 500);

        return {
          id: user._id,
          displayName: user.profile?.displayName || user.displayName,
          location: {
            latitude: randomized.latitude,
            longitude: randomized.longitude
          },
          lastSeen: user.lastSeen,
          distance: haversineDistance(latitude, longitude, realLat, realLon),
          profile: user.isProfileComplete ? {
            lookingFor: user.profile?.lookingFor,
            interests: user.profile?.interests,
            avatar: user.profile?.avatar,
            age: user.profile?.showAge ? user.profile?.age : undefined,
            showDistance: user.profile?.showDistance
          } : null,
          isProfileComplete: user.isProfileComplete,
          userType: user.userType,
          seekingTypes: user.seekingTypes,
          vibeCount: user.vibeCount || 0
        };
      });

      // Emitir usuarios cercanos al cliente
      socket.emit('users:nearby', { users: usersWithDistance });

    } catch (error) {
      console.error('[Socket:Location] Error actualizando ubicación:', error.message);
      socket.emit('error', { message: 'Error actualizando ubicación' });
    }
  });

  // user:disconnect — Marcar usuario como offline al desconectarse
  socket.on('disconnect', async () => {
    try {
      const userId = socketUserMap.get(socket.id);
      if (userId) {
        await User.findByIdAndUpdate(userId, {
          isOnline: false,
          lastSeen: new Date()
        });
        socketUserMap.delete(socket.id);
        blockCache.delete(userId);
        console.log(`[Socket:Location] Usuario ${userId} desconectado`);
      }
    } catch (error) {
      console.error('[Socket:Location] Error en desconexión:', error.message);
    }
  });
};

// Exportar también el mapa para uso en chatHandler
module.exports = { locationHandler, socketUserMap };
