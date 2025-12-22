require('dotenv').config();
const mongoose = require('mongoose');

async function dropLocalDb() {
  const uri = 'mongodb://localhost:27017/prototypedb_local';
  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 15000,
      family: 4,
    });
    console.log(`✅ Connecté à ${conn.connection.name} sur ${conn.connection.host}`);
    await mongoose.connection.dropDatabase();
    console.log('🗑️  Base de données prototypedb_local supprimée avec succès');
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('❌ Échec suppression prototypedb_local:', err.message);
    process.exit(1);
  }
}

dropLocalDb();
