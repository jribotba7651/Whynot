// Middleware de autenticación JWT
// Verifica tokens para rutas protegidas
// Maneja ambos tipos: anónimo (temporal) y registrado (persistente)
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/env');
const User = require('../models/User');

// Middleware principal — verifica JWT en header Authorization
const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token de acceso requerido' });
    }

    const token = authHeader.split(' ')[1];

    try {
      const decoded = jwt.verify(token, JWT_SECRET);

      // Buscar usuario en la DB para confirmar que existe
      const user = await User.findById(decoded.userId);
      if (!user || user.isDeleted) {
        return res.status(401).json({ error: 'Usuario no encontrado o eliminado' });
      }

      // Adjuntar usuario al request
      req.user = user;
      req.userId = decoded.userId;
      next();
    } catch (jwtError) {
      if (jwtError.name === 'TokenExpiredError') {
        return res.status(401).json({ error: 'Token expirado', code: 'TOKEN_EXPIRED' });
      }
      return res.status(401).json({ error: 'Token inválido' });
    }
  } catch (error) {
    console.error('[Auth] Error en middleware:', error.message);
    return res.status(500).json({ error: 'Error interno de autenticación' });
  }
};

// Middleware opcional — no bloquea si no hay token, pero adjunta usuario si existe
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, JWT_SECRET);
      const user = await User.findById(decoded.userId);
      if (user && !user.isDeleted) {
        req.user = user;
        req.userId = decoded.userId;
      }
    }
  } catch {
    // Token inválido o expirado — continuar sin autenticación
  }
  next();
};

// Generar JWT para un usuario
const generateToken = (userId, expiresIn) => {
  return jwt.sign({ userId }, JWT_SECRET, {
    expiresIn: expiresIn || '24h'
  });
};

// Generar refresh token (Fase 4)
const generateRefreshToken = (userId) => {
  return jwt.sign({ userId, type: 'refresh' }, JWT_SECRET, {
    expiresIn: '30d'
  });
};

module.exports = { verifyToken, optionalAuth, generateToken, generateRefreshToken };
