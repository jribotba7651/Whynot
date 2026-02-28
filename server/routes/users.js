// Rutas de usuarios
// Endpoints para buscar usuarios cercanos y obtener perfiles
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { verifyToken } = require('../middleware/auth');
const { buildNearbyQuery, haversineDistance } = require('../utils/geo');
const { DEFAULT_RADIUS_KM } = require('../config/env');

// GET /api/users/nearby — Buscar usuarios cercanos por geolocalización
// Fallback/respaldo del WebSocket para obtener usuarios en un radio
router.get('/nearby', verifyToken, async (req, res) => {
  try {
    const { lat, lon, radius } = req.query;

    if (!lat || !lon) {
      return res.status(400).json({ error: 'Latitud y longitud son requeridas' });
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lon);
    const radiusKm = parseFloat(radius) || DEFAULT_RADIUS_KM;

    // Validar coordenadas
    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      return res.status(400).json({ error: 'Coordenadas inválidas' });
    }

    // Query geoespacial — usuarios cercanos que estén online
    // y que hayan actualizado ubicación en los últimos 60 segundos
    const staleThreshold = new Date(Date.now() - 60 * 1000);

    const query = {
      ...buildNearbyQuery(longitude, latitude, radiusKm),
      _id: { $ne: req.userId }, // Excluir al usuario actual
      isOnline: true,
      lastSeen: { $gte: staleThreshold },
      isDeleted: { $ne: true }
    };

    const nearbyUsers = await User.find(query)
      .select('displayName location lastSeen profile isProfileComplete')
      .limit(100)
      .lean();

    // Calcular distancia para cada usuario
    const usersWithDistance = nearbyUsers.map(user => ({
      id: user._id,
      displayName: user.profile?.displayName || user.displayName,
      location: user.location,
      lastSeen: user.lastSeen,
      distance: haversineDistance(
        latitude, longitude,
        user.location.coordinates[1], user.location.coordinates[0]
      ),
      profile: user.isProfileComplete ? {
        lookingFor: user.profile?.lookingFor,
        interests: user.profile?.interests,
        avatar: user.profile?.avatar,
        bio: user.profile?.bio,
        age: user.profile?.showAge ? user.profile?.age : undefined,
        showDistance: user.profile?.showDistance
      } : null,
      isProfileComplete: user.isProfileComplete
    }));

    // Ordenar por distancia
    usersWithDistance.sort((a, b) => a.distance - b.distance);

    res.json({ users: usersWithDistance });
  } catch (error) {
    console.error('[Users] Error buscando usuarios cercanos:', error.message);
    res.status(500).json({ error: 'Error buscando usuarios cercanos' });
  }
});

// GET /api/users/:id/profile — Obtener perfil público de un usuario (Fase 3)
router.get('/:id/profile', verifyToken, async (req, res) => {
  try {
    const user = await User.findOne({
      _id: req.params.id,
      isDeleted: { $ne: true }
    }).select('displayName profile isProfileComplete location lastSeen isOnline').lean();

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Calcular distancia si el usuario que solicita tiene ubicación
    let distance = null;
    if (req.user.location?.coordinates?.[0] && user.location?.coordinates?.[0]) {
      distance = haversineDistance(
        req.user.location.coordinates[1], req.user.location.coordinates[0],
        user.location.coordinates[1], user.location.coordinates[0]
      );
    }

    res.json({
      id: user._id,
      displayName: user.profile?.displayName || user.displayName,
      isOnline: user.isOnline,
      isProfileComplete: user.isProfileComplete,
      distance: user.profile?.showDistance !== false ? distance : null,
      profile: user.isProfileComplete ? {
        age: user.profile?.showAge ? user.profile?.age : undefined,
        bio: user.profile?.bio,
        avatar: user.profile?.avatar,
        lookingFor: user.profile?.lookingFor,
        interests: user.profile?.interests
      } : null
    });
  } catch (error) {
    console.error('[Users] Error obteniendo perfil:', error.message);
    res.status(500).json({ error: 'Error obteniendo perfil' });
  }
});

// PUT /api/profile — Actualizar perfil del usuario autenticado (Fase 3)
router.put('/profile', verifyToken, async (req, res) => {
  try {
    const { displayName, age, bio, lookingFor, interests, showAge, showDistance } = req.body;

    // Validaciones
    if (displayName && displayName.length > 30) {
      return res.status(400).json({ error: 'El nombre no puede tener más de 30 caracteres' });
    }

    if (age !== undefined && (age < 18 || age > 99)) {
      return res.status(400).json({ error: 'La edad debe estar entre 18 y 99 años' });
    }

    if (bio && bio.length > 200) {
      return res.status(400).json({ error: 'La biografía no puede tener más de 200 caracteres' });
    }

    const validLookingFor = ['amistad', 'citas', 'networking', 'lo-que-sea'];
    if (lookingFor && !validLookingFor.includes(lookingFor)) {
      return res.status(400).json({ error: 'Valor inválido para "qué buscas"' });
    }

    const validInterests = ['música', 'deportes', 'arte', 'tecnología', 'gastronomía',
      'viajes', 'gaming', 'lectura', 'fitness', 'cine'];
    if (interests) {
      if (interests.length > 5) {
        return res.status(400).json({ error: 'Máximo 5 intereses permitidos' });
      }
      if (!interests.every(i => validInterests.includes(i))) {
        return res.status(400).json({ error: 'Interés inválido detectado' });
      }
    }

    // Actualizar perfil
    const user = req.user;
    if (!user.profile) user.profile = {};

    if (displayName !== undefined) user.profile.displayName = displayName;
    if (age !== undefined) user.profile.age = age;
    if (bio !== undefined) user.profile.bio = bio;
    if (lookingFor !== undefined) user.profile.lookingFor = lookingFor;
    if (interests !== undefined) user.profile.interests = interests;
    if (showAge !== undefined) user.profile.showAge = showAge;
    if (showDistance !== undefined) user.profile.showDistance = showDistance;

    // Generar avatar basado en iniciales si tiene nombre
    if (displayName) {
      const initials = displayName.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
      user.profile.avatar = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(displayName)}&backgroundColor=3b82f6`;
    }

    // Marcar perfil como completo si tiene nombre y edad
    user.isProfileComplete = !!(user.profile.displayName && user.profile.age);
    user.markModified('profile');
    await user.save();

    res.json({
      message: 'Perfil actualizado',
      profile: user.profile,
      isProfileComplete: user.isProfileComplete
    });
  } catch (error) {
    console.error('[Users] Error actualizando perfil:', error.message);
    res.status(500).json({ error: 'Error actualizando perfil' });
  }
});

module.exports = router;
