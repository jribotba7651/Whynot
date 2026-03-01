// Middleware de rate limiting
// Protege contra abuso y ataques de fuerza bruta
const rateLimit = require('express-rate-limit');

// Límite general para la API — 100 requests por minuto
const generalLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 100,
  message: {
    error: 'Too many requests. Try again in a minute.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Límite estricto para autenticación — 5 intentos por minuto
const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: {
    error: 'Too many authentication attempts. Wait a minute.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Límite para creación de sesiones — 10 por minuto
const sessionLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: {
    error: 'Too many sessions created. Wait a minute.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

module.exports = { generalLimiter, authLimiter, sessionLimiter };
