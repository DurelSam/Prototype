const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Options pour MongoDB Local
    const options = {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    };

    // Connexion à MongoDB Local
    const conn = await mongoose.connect(process.env.MONGODB_URI, options);

    console.log(`\n${'='.repeat(50)}`);
    console.log(`✅ MongoDB Local connecté avec succès!`);
    console.log(`📡 Host: ${conn.connection.host}`);
    console.log(`📦 Base de données: ${conn.connection.name}`);
    console.log(`🔒 État: ${conn.connection.readyState === 1 ? 'Connecté' : 'Déconnecté'}`);
    console.log(`${'='.repeat(50)}\n`);

    // Gestion des événements de connexion
    mongoose.connection.on('error', (err) => {
      console.error('❌ Erreur MongoDB:', err.message);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️  MongoDB Local déconnecté');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('🔄 MongoDB Local reconnecté');
    });

    // Gestion de la fermeture propre
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('MongoDB déconnecté suite à l\'arrêt de l\'application');
      process.exit(0);
    });

  } catch (error) {
    console.error('\n❌ Erreur de connexion MongoDB Local:');
    console.error('Message:', error.message);

    // Messages d'aide selon le type d'erreur
    if (error.message.includes('ECONNREFUSED')) {
      console.error('\n💡 Conseil: Assurez-vous que MongoDB est démarré localement');
      console.error('   Commande: mongod --dbpath "C:\\data\\db"');
    } else if (error.message.includes('authentication')) {
      console.error('\n💡 Conseil: Vérifiez votre configuration d\'authentification MongoDB');
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
