// Configuración de variables de entorno
// Carga las variables desde .env y exporta valores con defaults seguros
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

module.exports = {
  PORT: process.env.PORT || 3001,
  NODE_ENV: process.env.NODE_ENV || 'development',
  JWT_SECRET: process.env.JWT_SECRET || 'dev-secret-change-in-production',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '24h',
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/geosocial',
  DEFAULT_RADIUS_KM: parseInt(process.env.DEFAULT_RADIUS_KM) || 5,
  LOCATION_UPDATE_INTERVAL_MS: parseInt(process.env.LOCATION_UPDATE_INTERVAL_MS) || 10000,
  // Radio de la Tierra en kilómetros (para cálculos geoespaciales)
  EARTH_RADIUS_KM: 6371
};
