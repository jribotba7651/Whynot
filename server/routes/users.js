// Rutas de usuarios
// Endpoints para buscar usuarios cercanos, perfiles, onboarding, reportes y bloqueos
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Report = require('../models/Report');
const Block = require('../models/Block');
const { verifyToken } = require('../middleware/auth');
const { buildNearbyQuery, haversineDistance, randomizeLocation } = require('../utils/geo');
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

    // Obtener lista de usuarios bloqueados por el usuario actual
    const blocks = await Block.find({ blockerId: req.userId }).select('blockedUserId').lean();
    const blockedIds = blocks.map(b => b.blockedUserId);

    // También obtener quién me bloqueó a mí
    const blockedByOthers = await Block.find({ blockedUserId: req.userId }).select('blockerId').lean();
    const blockedByIds = blockedByOthers.map(b => b.blockerId);

    const excludeIds = [req.userId, ...blockedIds, ...blockedByIds];

    const query = {
      ...buildNearbyQuery(longitude, latitude, radiusKm),
      _id: { $nin: excludeIds },
      isOnline: true,
      lastSeen: { $gte: staleThreshold },
      isDeleted: { $ne: true },
      isShadowBanned: { $ne: true }
    };

    const nearbyUsers = await User.find(query)
      .select('displayName location lastSeen profile isProfileComplete userType seekingTypes onboardingComplete privacyRadius vibeCount')
      .limit(100)
      .lean();

    // Calcular distancia y aplicar randomización de ubicación
    const usersWithDistance = nearbyUsers.map(user => {
      const realLat = user.location.coordinates[1];
      const realLon = user.location.coordinates[0];
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
          bio: user.profile?.bio,
          age: user.profile?.showAge ? user.profile?.age : undefined,
          showDistance: user.profile?.showDistance
        } : null,
        isProfileComplete: user.isProfileComplete,
        userType: user.userType,
        seekingTypes: user.seekingTypes,
        vibeCount: user.vibeCount || 0
      };
    });

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
    }).select('displayName profile isProfileComplete location lastSeen isOnline userType seekingTypes vibeCount').lean();

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
      } : null,
      userType: user.userType,
      seekingTypes: user.seekingTypes,
      vibeCount: user.vibeCount || 0
    });
  } catch (error) {
    console.error('[Users] Error obteniendo perfil:', error.message);
    res.status(500).json({ error: 'Error obteniendo perfil' });
  }
});

// PUT /api/profile — Actualizar perfil del usuario autenticado (Fase 3)
router.put('/profile', verifyToken, async (req, res) => {
  try {
    const { displayName, age, bio, lookingFor, interests, showAge, showDistance, userType, seekingTypes, privacyRadius, vanillaMode } = req.body;

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

    // Actualizar campos de Fase 5/6 si se envían
    if (userType !== undefined) {
      const validUserTypes = ['man', 'woman', 'couple_mf', 'couple_mm', 'couple_ff'];
      if (validUserTypes.includes(userType)) user.userType = userType;
    }
    if (seekingTypes !== undefined) {
      const validSeeking = ['men', 'women', 'couples', 'anyone'];
      if (Array.isArray(seekingTypes) && seekingTypes.every(s => validSeeking.includes(s))) {
        user.seekingTypes = seekingTypes;
      }
    }
    if (privacyRadius !== undefined) {
      const radius = parseInt(privacyRadius);
      if (radius >= 50 && radius <= 1000) user.privacyRadius = radius;
    }
    if (vanillaMode !== undefined) user.vanillaMode = vanillaMode;

    // Marcar perfil como completo si tiene nombre y edad
    user.isProfileComplete = !!(user.profile.displayName && user.profile.age);
    user.markModified('profile');
    await user.save();

    res.json({
      message: 'Perfil actualizado',
      profile: user.profile,
      isProfileComplete: user.isProfileComplete,
      userType: user.userType,
      seekingTypes: user.seekingTypes,
      privacyRadius: user.privacyRadius,
      vanillaMode: user.vanillaMode
    });
  } catch (error) {
    console.error('[Users] Error actualizando perfil:', error.message);
    res.status(500).json({ error: 'Error actualizando perfil' });
  }
});

// PUT /api/users/onboarding — Guardar selecciones de "Soy/Busco" (Fase 5.1)
router.put('/onboarding', verifyToken, async (req, res) => {
  try {
    const { userType, seekingTypes } = req.body;

    const validUserTypes = ['man', 'woman', 'couple_mf', 'couple_mm', 'couple_ff'];
    if (!userType || !validUserTypes.includes(userType)) {
      return res.status(400).json({ error: 'Tipo de usuario inválido' });
    }

    const validSeekingTypes = ['men', 'women', 'couples', 'anyone'];
    if (!seekingTypes || !Array.isArray(seekingTypes) || seekingTypes.length === 0) {
      return res.status(400).json({ error: 'Debes seleccionar al menos un tipo de búsqueda' });
    }
    if (!seekingTypes.every(s => validSeekingTypes.includes(s))) {
      return res.status(400).json({ error: 'Tipo de búsqueda inválido' });
    }

    const user = req.user;
    user.userType = userType;
    user.seekingTypes = seekingTypes;
    user.onboardingComplete = true;
    await user.save();

    res.json({
      message: 'Onboarding completado',
      userType: user.userType,
      seekingTypes: user.seekingTypes,
      onboardingComplete: true
    });
  } catch (error) {
    console.error('[Users] Error guardando onboarding:', error.message);
    res.status(500).json({ error: 'Error guardando onboarding' });
  }
});

// --- Fase 6.2: Reportes ---

// POST /api/users/reports — Reportar un usuario
router.post('/reports', verifyToken, async (req, res) => {
  try {
    const { reportedUserId, reason, details } = req.body;

    const validReasons = ['contenido_inapropiado', 'acoso', 'perfil_falso', 'menor_de_edad', 'otro'];
    if (!reportedUserId || !reason || !validReasons.includes(reason)) {
      return res.status(400).json({ error: 'Datos de reporte inválidos' });
    }

    if (reportedUserId === req.userId.toString()) {
      return res.status(400).json({ error: 'No puedes reportarte a ti mismo' });
    }

    // Verificar que no haya un reporte duplicado
    const existing = await Report.findOne({ reporterId: req.userId, reportedUserId });
    if (existing) {
      return res.status(400).json({ error: 'Ya has reportado a este usuario' });
    }

    // Crear el reporte
    await Report.create({
      reporterId: req.userId,
      reportedUserId,
      reason,
      details: reason === 'otro' ? details?.substring(0, 500) : undefined
    });

    // Incrementar contador y aplicar shadow-ban si tiene 5+ reportes
    const reported = await User.findByIdAndUpdate(
      reportedUserId,
      { $inc: { reportCount: 1 } },
      { new: true }
    );

    if (reported && reported.reportCount >= 5 && !reported.isShadowBanned) {
      reported.isShadowBanned = true;
      await reported.save();
      console.log(`[Reports] Shadow-ban aplicado a usuario ${reportedUserId} (${reported.reportCount} reportes)`);
    }

    res.json({ message: 'Reporte enviado. Gracias por ayudarnos a mantener la comunidad segura.' });
  } catch (error) {
    console.error('[Users] Error creando reporte:', error.message);
    res.status(500).json({ error: 'Error enviando reporte' });
  }
});

// --- Fase 6.2: Bloqueos ---

// POST /api/users/blocks — Bloquear un usuario
router.post('/blocks', verifyToken, async (req, res) => {
  try {
    const { blockedUserId } = req.body;

    if (!blockedUserId || blockedUserId === req.userId.toString()) {
      return res.status(400).json({ error: 'ID de usuario inválido' });
    }

    await Block.create({ blockerId: req.userId, blockedUserId });
    res.json({ message: 'Usuario bloqueado' });
  } catch (error) {
    if (error.code === 11000) {
      return res.json({ message: 'Usuario ya bloqueado' });
    }
    console.error('[Users] Error bloqueando usuario:', error.message);
    res.status(500).json({ error: 'Error bloqueando usuario' });
  }
});

// DELETE /api/users/blocks/:blockedUserId — Desbloquear un usuario
router.delete('/blocks/:blockedUserId', verifyToken, async (req, res) => {
  try {
    await Block.deleteOne({ blockerId: req.userId, blockedUserId: req.params.blockedUserId });
    res.json({ message: 'Usuario desbloqueado' });
  } catch (error) {
    console.error('[Users] Error desbloqueando:', error.message);
    res.status(500).json({ error: 'Error desbloqueando usuario' });
  }
});

// GET /api/users/blocks — Lista de usuarios bloqueados
router.get('/blocks', verifyToken, async (req, res) => {
  try {
    const blocks = await Block.find({ blockerId: req.userId })
      .populate('blockedUserId', 'displayName profile')
      .lean();

    res.json({
      blocks: blocks.map(b => ({
        id: b.blockedUserId._id,
        displayName: b.blockedUserId.profile?.displayName || b.blockedUserId.displayName,
        avatar: b.blockedUserId.profile?.avatar,
        blockedAt: b.createdAt
      }))
    });
  } catch (error) {
    console.error('[Users] Error obteniendo bloqueados:', error.message);
    res.status(500).json({ error: 'Error obteniendo lista de bloqueados' });
  }
});

module.exports = router;
