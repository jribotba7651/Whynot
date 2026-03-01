// Rutas de autenticación
// Fase 1: Sesiones anónimas
// Fase 4: Registro, login, refresh token, logout
const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const { generateToken, generateRefreshToken, verifyToken } = require('../middleware/auth');
const { authLimiter, sessionLimiter } = require('../middleware/rateLimiter');
const { JWT_SECRET } = require('../config/env');

// POST /api/session — Crear sesión anónima
// Genera un usuario temporal con UUID y retorna JWT
router.post('/session', sessionLimiter, async (req, res) => {
  try {
    const sessionId = uuidv4();
    const user = new User({
      sessionId,
      isAnonymous: true,
      isOnline: true,
      lastSeen: new Date()
    });

    await user.save();

    const token = generateToken(user._id, '24h');

    res.status(201).json({
      token,
      user: {
        id: user._id,
        sessionId: user.sessionId,
        displayName: user.displayName,
        isAnonymous: true
      }
    });
  } catch (error) {
    console.error('[Auth] Error creando sesión:', error.message);
    res.status(500).json({ error: 'Error creating anonymous session' });
  }
});

// POST /api/auth/register — Registro con email y contraseña (Fase 4)
// Migra datos existentes de la sesión anónima a la cuenta nueva
router.post('/register', authLimiter, async (req, res) => {
  try {
    const { email, password, currentToken } = req.body;

    // Validaciones
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Verificar que el email no esté en uso
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({ error: 'This email is already registered' });
    }

    // Hash de la contraseña con bcrypt (12 salt rounds)
    const hashedPassword = await bcrypt.hash(password, 12);

    let user;

    // Si hay un token actual, migrar datos de la sesión anónima
    if (currentToken) {
      try {
        const decoded = jwt.verify(currentToken, JWT_SECRET);
        user = await User.findById(decoded.userId);

        if (user && user.isAnonymous) {
          // Migrar: actualizar usuario existente a registrado
          user.email = email.toLowerCase();
          user.password = hashedPassword;
          user.accountType = 'registered';
          user.isAnonymous = false;
          user.previousSessionIds.push(user.sessionId);
          user.lastLogin = new Date();
          user.dataRetentionDeadline = undefined; // Ya no se purga
          await user.save();
        }
      } catch {
        // Token inválido — crear usuario nuevo
        user = null;
      }
    }

    // Si no hubo migración, crear usuario nuevo
    if (!user) {
      user = new User({
        sessionId: uuidv4(),
        email: email.toLowerCase(),
        password: hashedPassword,
        accountType: 'registered',
        isAnonymous: false,
        isOnline: true,
        lastLogin: new Date()
      });
      await user.save();
    }

    // Generar tokens
    const token = generateToken(user._id, '7d');
    const refreshToken = generateRefreshToken(user._id);

    // Guardar hash del refresh token
    user.refreshToken = await bcrypt.hash(refreshToken, 10);
    await user.save();

    res.status(201).json({
      token,
      refreshToken,
      user: {
        id: user._id,
        email: user.email,
        displayName: user.getDisplayName(),
        accountType: 'registered',
        profile: user.profile,
        isProfileComplete: user.isProfileComplete
      }
    });
  } catch (error) {
    console.error('[Auth] Error en registro:', error.message);
    res.status(500).json({ error: 'Registration error' });
  }
});

// POST /api/auth/login — Iniciar sesión
router.post('/login', authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Buscar usuario por email
    const user = await User.findOne({
      email: email.toLowerCase(),
      isDeleted: false
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verificar contraseña
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Actualizar último login
    user.lastLogin = new Date();
    user.isOnline = true;

    // Generar tokens
    const token = generateToken(user._id, '7d');
    const refreshToken = generateRefreshToken(user._id);

    // Guardar hash del refresh token
    user.refreshToken = await bcrypt.hash(refreshToken, 10);
    await user.save();

    res.json({
      token,
      refreshToken,
      user: {
        id: user._id,
        email: user.email,
        displayName: user.getDisplayName(),
        accountType: 'registered',
        profile: user.profile,
        isProfileComplete: user.isProfileComplete
      }
    });
  } catch (error) {
    console.error('[Auth] Error en login:', error.message);
    res.status(500).json({ error: 'Login error' });
  }
});

// POST /api/auth/refresh — Renovar JWT con refresh token
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token required' });
    }

    // Verificar el refresh token
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, JWT_SECRET);
    } catch {
      return res.status(401).json({ error: 'Invalid or expired refresh token' });
    }

    if (decoded.type !== 'refresh') {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const user = await User.findById(decoded.userId);
    if (!user || user.isDeleted) {
      return res.status(401).json({ error: 'User not found' });
    }

    // Verificar que el refresh token coincide
    if (!user.refreshToken) {
      return res.status(401).json({ error: 'Session invalidated' });
    }

    const isValid = await bcrypt.compare(refreshToken, user.refreshToken);
    if (!isValid) {
      return res.status(401).json({ error: 'Refresh token mismatch' });
    }

    // Generar nuevos tokens
    const newToken = generateToken(user._id, '7d');
    const newRefreshToken = generateRefreshToken(user._id);

    user.refreshToken = await bcrypt.hash(newRefreshToken, 10);
    await user.save();

    res.json({
      token: newToken,
      refreshToken: newRefreshToken
    });
  } catch (error) {
    console.error('[Auth] Error en refresh:', error.message);
    res.status(500).json({ error: 'Error refreshing token' });
  }
});

// POST /api/auth/logout — Cerrar sesión (invalidar refresh token)
router.post('/logout', verifyToken, async (req, res) => {
  try {
    req.user.refreshToken = null;
    await req.user.save();
    res.json({ message: 'Session closed successfully' });
  } catch (error) {
    console.error('[Auth] Error en logout:', error.message);
    res.status(500).json({ error: 'Error closing session' });
  }
});

// PUT /api/auth/password — Cambiar contraseña
router.put('/password', verifyToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current and new password are required' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'New password must be at least 8 characters' });
    }

    // Verificar contraseña actual
    const isMatch = await bcrypt.compare(currentPassword, req.user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    // Hash de la nueva contraseña
    req.user.password = await bcrypt.hash(newPassword, 12);
    // Invalidar refresh token para forzar re-login en otros dispositivos
    req.user.refreshToken = null;
    await req.user.save();

    // Generar nuevo token
    const token = generateToken(req.user._id, '7d');
    const refreshToken = generateRefreshToken(req.user._id);
    req.user.refreshToken = await bcrypt.hash(refreshToken, 10);
    await req.user.save();

    res.json({
      message: 'Password updated successfully',
      token,
      refreshToken
    });
  } catch (error) {
    console.error('[Auth] Error cambiando contraseña:', error.message);
    res.status(500).json({ error: 'Error changing password' });
  }
});

// DELETE /api/auth/account — Soft delete de cuenta
router.delete('/account', verifyToken, async (req, res) => {
  try {
    req.user.isDeleted = true;
    req.user.deletedAt = new Date();
    req.user.isOnline = false;
    req.user.refreshToken = null;
    // Se purga completamente después de 7 días
    req.user.dataRetentionDeadline = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await req.user.save();

    res.json({
      message: 'Account marked for deletion. It will be permanently deleted in 7 days.'
    });
  } catch (error) {
    console.error('[Auth] Error eliminando cuenta:', error.message);
    res.status(500).json({ error: 'Error deleting account' });
  }
});

module.exports = router;
