const mongoose = require('mongoose');
const User = require('./src/models/User');

async function listUsers() {
  try {
    await mongoose.connect('mongodb://localhost:27017/prototypedb');

    const users = await User.find({}).select('email role tenant_id outlookConfig.isConnected');

    console.log(`📊 Total utilisateurs: ${users.length}\n`);

    users.forEach((user, index) => {
      console.log(`👤 Utilisateur ${index + 1}:`);
      console.log('   Email:', user.email);
      console.log('   Role:', user.role);
      console.log('   Tenant ID:', user.tenant_id || '❌ AUCUN');
      console.log('   Outlook:', user.outlookConfig?.isConnected ? '✅ Connecté' : '❌ Non connecté');
      console.log('');
    });

    await mongoose.connection.close();
  } catch (error) {
    console.error('Erreur:', error.message);
    await mongoose.connection.close();
    process.exit(1);
  }
}

listUsers();
