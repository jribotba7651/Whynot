// Utilidades geoespaciales
// Funciones helper para cálculos de distancia y queries MongoDB
const { EARTH_RADIUS_KM } = require('../config/env');

// Convierte kilómetros a radianes (para $centerSphere de MongoDB)
const kmToRadians = (km) => {
  return km / EARTH_RADIUS_KM;
};

// Calcula la distancia entre dos puntos usando la fórmula de Haversine
// Retorna distancia en kilómetros
const haversineDistance = (lat1, lon1, lat2, lon2) => {
  const toRad = (deg) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS_KM * c;
};

// Construye query de MongoDB para buscar usuarios cercanos
// Usa $geoWithin con $centerSphere para búsqueda por radio
const buildNearbyQuery = (longitude, latitude, radiusKm) => {
  return {
    location: {
      $geoWithin: {
        $centerSphere: [
          [longitude, latitude],
          kmToRadians(radiusKm)
        ]
      }
    }
  };
};

module.exports = { kmToRadians, haversineDistance, buildNearbyQuery };
