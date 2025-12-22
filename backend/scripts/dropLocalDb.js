require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../src/config/database');

const drop = async () => {
  try {
    await connectDB();
    const dbName = mongoose.connection.name;
    if (dbName !== 'prototypedb_local') {
      console.error(`❌ Mauvaise base sélectionnée: ${dbName}. Attendu: prototypedb_local`);
      process.exit(1);
    }
    await mongoose.connection.db.dropDatabase();
    console.log(`✅ Base de données '${dbName}' supprimée avec succès`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Échec suppression DB:', err.message);
    process.exit(1);
  }
};

drop();
