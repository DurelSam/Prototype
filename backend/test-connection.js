require('dotenv').config();
const mongoose = require('mongoose');

const testConnection = async () => {
  console.log('\n' + '='.repeat(60));
  console.log('🧪 TEST DE CONNEXION MONGODB LOCAL');
  console.log('='.repeat(60) + '\n');

  try {
    // Vérification des variables d'environnement
    if (!process.env.MONGODB_URI) {
      throw new Error('❌ MONGODB_URI n\'est pas défini dans le fichier .env');
    }

    console.log('📋 Configuration détectée:');
    console.log(`   ✓ PORT: ${process.env.PORT}`);
    console.log(`   ✓ NODE_ENV: ${process.env.NODE_ENV}`);
    console.log(`   ✓ JWT_SECRET: ${process.env.JWT_SECRET ? 'Configuré' : 'Non configuré'}`);
    console.log(`   ✓ FRONTEND_URL: ${process.env.FRONTEND_URL}`);
    console.log(`   ✓ MONGODB_URI: ${process.env.MONGODB_URI}`);
    console.log('');

    // Tentative de connexion
    console.log('⏳ Connexion à MongoDB Local...');
    console.log('   (Assurez-vous que MongoDB est démarré)');

    const startTime = Date.now();
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000
    });
    const connectionTime = Date.now() - startTime;

    console.log('\n✅ CONNEXION RÉUSSIE!');
    console.log(`   - Host: ${conn.connection.host}`);
    console.log(`   - Database: ${conn.connection.name}`);
    console.log(`   - État: ${conn.connection.readyState === 1 ? 'Connecté' : 'Déconnecté'}`);
    console.log(`   - Temps de connexion: ${connectionTime}ms`);
    console.log('');

    // Test des modèles
    console.log('📦 Vérification des modèles Mongoose...');
    const models = require('./src/models');
    console.log(`   ✓ Tenant (${Object.keys(models.Tenant.schema.paths).length} champs)`);
    console.log(`   ✓ User (${Object.keys(models.User.schema.paths).length} champs)`);
    console.log(`   ✓ Communication (${Object.keys(models.Communication.schema.paths).length} champs)`);
    console.log(`   ✓ Notification (${Object.keys(models.Notification.schema.paths).length} champs)`);
    console.log('');

    // Test d'écriture/lecture (optionnel)
    console.log('🔬 Test rapide d\'écriture/lecture...');
    const testData = {
      companyName: 'Test-Company-' + Date.now(),
      subscriptionStatus: 'Trial'
    };

    const testTenant = await models.Tenant.create(testData);
    console.log(`   ✓ Création: Document créé avec ID ${testTenant._id}`);

    const foundTenant = await models.Tenant.findById(testTenant._id);
    console.log(`   ✓ Lecture: Document trouvé (${foundTenant.companyName})`);

    await models.Tenant.deleteOne({ _id: testTenant._id });
    console.log(`   ✓ Suppression: Document supprimé`);
    console.log('');

    // Fermeture de la connexion
    await mongoose.connection.close();
    console.log('🔌 Connexion fermée proprement');
    console.log('');

    console.log('='.repeat(60));
    console.log('🎉 TOUS LES TESTS SONT PASSÉS AVEC SUCCÈS!');
    console.log('='.repeat(60));
    console.log('');
    console.log('👉 Prochaines étapes:');
    console.log('   1. Lancer l\'application: npm run dev');
    console.log('   2. Backend sera sur: http://localhost:5000');
    console.log('   3. Frontend sera sur: http://localhost:3000');
    console.log('');

    process.exit(0);
  } catch (error) {
    console.error('\n' + '='.repeat(60));
    console.error('❌ ÉCHEC DU TEST DE CONNEXION');
    console.error('='.repeat(60));
    console.error('\nErreur:', error.message);
    console.log('\n💡 Conseils de dépannage:');

    if (error.message.includes('ECONNREFUSED')) {
      console.log('   ⚠️  MongoDB n\'est pas démarré:');
      console.log('   1. Ouvrez un terminal en tant qu\'administrateur');
      console.log('   2. Exécutez: mongod --dbpath "C:\\data\\db"');
      console.log('   3. Relancez ce test');
    } else if (error.message.includes('authentication') || error.message.includes('auth')) {
      console.log('   ⚠️  Problème d\'authentification:');
      console.log('   1. Vérifiez votre configuration d\'authentification MongoDB');
      console.log('   2. MongoDB local ne nécessite généralement pas d\'authentification');
    } else {
      console.log('   1. Vérifiez que MongoDB est installé');
      console.log('   2. Vérifiez que le répertoire C:\\data\\db existe');
      console.log('   3. Vérifiez que MONGODB_URI dans .env est: mongodb://localhost:27017/saas-communications');
    }

    console.log('\n📖 Installation MongoDB: https://www.mongodb.com/try/download/community');
    console.log('');
    process.exit(1);
  }
};

testConnection();
