// Manejador de eventos de geolocalización por WebSocket
// Recibe actualizaciones de ubicación y emite usuarios cercanos
const User = require('../models/User');
const { buildNearbyQuery, haversineDistance } = require('../utils/geo');
const { DEFAULT_RADIUS_KM } = require('../config/env');

// Mapa de socketId → userId para tracking rápido
const socketUserMap = new Map();

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

      // Buscar usuarios cercanos
      const staleThreshold = new Date(Date.now() - 60 * 1000); // 60 segundos

      const nearbyUsers = await User.find({
        ...buildNearbyQuery(longitude, latitude, DEFAULT_RADIUS_KM),
        _id: { $ne: userId },
        isOnline: true,
        lastSeen: { $gte: staleThreshold },
        isDeleted: { $ne: true }
      })
        .select('displayName location lastSeen profile isProfileComplete')
        .limit(100)
        .lean();

      // Calcular distancia y formatear respuesta
      const usersWithDistance = nearbyUsers.map(user => ({
        id: user._id,
        displayName: user.profile?.displayName || user.displayName,
        location: {
          latitude: user.location.coordinates[1],
          longitude: user.location.coordinates[0]
        },
        lastSeen: user.lastSeen,
        distance: haversineDistance(
          latitude, longitude,
          user.location.coordinates[1], user.location.coordinates[0]
        ),
        profile: user.isProfileComplete ? {
          lookingFor: user.profile?.lookingFor,
          interests: user.profile?.interests,
          avatar: user.profile?.avatar,
          age: user.profile?.showAge ? user.profile?.age : undefined,
          showDistance: user.profile?.showDistance
        } : null,
        isProfileComplete: user.isProfileComplete
      }));

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
        console.log(`[Socket:Location] Usuario ${userId} desconectado`);
      }
    } catch (error) {
      console.error('[Socket:Location] Error en desconexión:', error.message);
    }
  });
};

// Exportar también el mapa para uso en chatHandler
module.exports = { locationHandler, socketUserMap };
