// Conexión a MongoDB Atlas
// Usa mongoose para conectarse y manejar reconexión automática
const mongoose = require('mongoose');
const { MONGODB_URI, NODE_ENV } = require('./env');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(MONGODB_URI);
    console.log(`[DB] MongoDB conectado: ${conn.connection.host}`);
  } catch (error) {
    console.error(`[DB] Error de conexión: ${error.message}`);
    // En producción, reintentar; en desarrollo, salir
    if (NODE_ENV === 'production') {
      setTimeout(connectDB, 5000);
    } else {
      process.exit(1);
    }
  }
};

// Eventos de conexión para monitoreo
mongoose.connection.on('disconnected', () => {
  console.warn('[DB] MongoDB desconectado');
});

mongoose.connection.on('error', (err) => {
  console.error(`[DB] Error de MongoDB: ${err.message}`);
});

module.exports = connectDB;
