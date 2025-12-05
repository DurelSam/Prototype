const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Construction de l'URI MongoDB
    // Priorité 1: MONGODB_URI (si définie directement)
    // Priorité 2: Construction avec MONGO_USER, MONGO_PASS, MONGO_HOST, MONGO_DB
    const mongoUri = process.env.MONGODB_URI ||
      `mongodb://${process.env.MONGO_USER}:${encodeURIComponent(process.env.MONGO_PASS)}@${process.env.MONGO_HOST}:27017/${process.env.MONGO_DB}?authSource=admin`;

    // Options de connexion MongoDB
    const options = {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    };

    // Détection du mode (local ou production)
    const isProduction = process.env.NODE_ENV === 'production' || process.env.MONGO_USER;

    // Connexion à MongoDB
    const conn = await mongoose.connect(mongoUri, options);

    console.log(`\n${'='.repeat(50)}`);
    console.log(`✅ MongoDB connecté avec succès!`);
    console.log(`🌍 Mode: ${isProduction ? 'PRODUCTION (Authentification)' : 'DÉVELOPPEMENT (Local)'}`);
    console.log(`📡 Host: ${conn.connection.host}`);
    console.log(`📦 Base de données: ${conn.connection.name}`);
    console.log(`🔒 État: ${conn.connection.readyState === 1 ? 'Connecté' : 'Déconnecté'}`);
    console.log(`${'='.repeat(50)}\n`);

    // Gestion des événements de connexion
    mongoose.connection.on('error', (err) => {
      console.error('❌ Erreur MongoDB:', err.message);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn(`⚠️  MongoDB déconnecté (${isProduction ? 'Production' : 'Local'})`);
    });

    mongoose.connection.on('reconnected', () => {
      console.log(`🔄 MongoDB reconnecté (${isProduction ? 'Production' : 'Local'})`);
    });

    // Gestion de la fermeture propre
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('MongoDB déconnecté suite à l\'arrêt de l\'application');
      process.exit(0);
    });

  } catch (error) {
    console.error('\n❌ Erreur de connexion MongoDB:');
    console.error('Message:', error.message);

    // Messages d'aide selon le type d'erreur
    if (error.message.includes('ECONNREFUSED')) {
      console.error('\n💡 Conseil: MongoDB est inaccessible');
      if (!isProduction) {
        console.error('   Mode Local: Démarrez MongoDB avec: mongod --dbpath "C:\\data\\db"');
      } else {
        console.error('   Mode Production: Vérifiez que le serveur MongoDB est accessible');
        console.error('   Host configuré: ' + process.env.MONGO_HOST);
      }
    } else if (error.message.includes('authentication') || error.message.includes('Authentication')) {
      console.error('\n💡 Conseil: Erreur d\'authentification MongoDB');
      console.error('   Vérifiez vos credentials:');
      console.error('   - MONGO_USER: ' + (process.env.MONGO_USER ? '✅ Défini' : '❌ Manquant'));
      console.error('   - MONGO_PASS: ' + (process.env.MONGO_PASS ? '✅ Défini' : '❌ Manquant'));
      console.error('   - MONGO_HOST: ' + (process.env.MONGO_HOST || '❌ Manquant'));
      console.error('   - MONGO_DB: ' + (process.env.MONGO_DB || '❌ Manquant'));
    } else if (error.message.includes('ENOTFOUND')) {
      console.error('\n💡 Conseil: Hôte MongoDB introuvable');
      console.error('   Vérifiez la variable MONGO_HOST: ' + process.env.MONGO_HOST);
    }

    console.error('\n');
    process.exit(1);
  }
};

// Fonction pour tester la connexion (utilisée pour les tests rapides)
const testConnection = async () => {
  try {
    await connectDB();
    console.log('✅ Test de connexion réussi!');
    await mongoose.connection.close();
    console.log('🔌 Connexion fermée proprement');
    return true;
  } catch (error) {
    console.error('❌ Test de connexion échoué');
    return false;
  }
};

module.exports = connectDB;
module.exports.testConnection = testConnection;
