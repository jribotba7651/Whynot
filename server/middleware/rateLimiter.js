// Middleware de rate limiting
// Protege contra abuso y ataques de fuerza bruta
const rateLimit = require('express-rate-limit');

// Límite general para la API — 100 requests por minuto
const generalLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 100,
  message: {
    error: 'Demasiadas solicitudes. Intenta de nuevo en un minuto.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Límite estricto para autenticación — 5 intentos por minuto
const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: {
    error: 'Demasiados intentos de autenticación. Espera un minuto.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Límite para creación de sesiones — 10 por minuto
const sessionLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: {
    error: 'Demasiadas sesiones creadas. Espera un minuto.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

module.exports = { generalLimiter, authLimiter, sessionLimiter };
