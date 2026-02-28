// Script de limpieza manual
// Se puede ejecutar con: npm run cleanup
// Elimina usuarios anónimos expirados y sus datos asociados
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const mongoose = require('mongoose');
const { MONGODB_URI } = require('../config/env');

const runCleanup = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('[Cleanup] Conectado a MongoDB');

    const User = require('../models/User');
    const Conversation = require('../models/Conversation');
    const Message = require('../models/Message');

    const now = new Date();

    // Buscar usuarios expirados
    const expiredUsers = await User.find({
      dataRetentionDeadline: { $lte: now },
      $or: [
        { accountType: 'anonymous' },
        { isDeleted: true }
      ]
    }).select('_id');

    console.log(`[Cleanup] Usuarios expirados encontrados: ${expiredUsers.length}`);

    if (expiredUsers.length === 0) {
      console.log('[Cleanup] Nada que purgar. Saliendo.');
      process.exit(0);
    }

    const expiredIds = expiredUsers.map(u => u._id);

    const deletedMessages = await Message.deleteMany({ sender: { $in: expiredIds } });
    const deletedConversations = await Conversation.deleteMany({
      participants: { $in: expiredIds }
    });
    const deletedUsers = await User.deleteMany({ _id: { $in: expiredIds } });

    console.log(`[Cleanup] Resultados:`);
    console.log(`  - Usuarios eliminados: ${deletedUsers.deletedCount}`);
    console.log(`  - Conversaciones eliminadas: ${deletedConversations.deletedCount}`);
    console.log(`  - Mensajes eliminados: ${deletedMessages.deletedCount}`);

    process.exit(0);
  } catch (error) {
    console.error('[Cleanup] Error:', error.message);
    process.exit(1);
  }
};

runCleanup();
