/**
 * Script de BUILD/INITIALISATION de la Base de Données Production
 *
 * ⚠️  ATTENTION: Ce script va SUPPRIMER TOUTE la base de données et la recréer !
 *
 * Ce script va :
 * 1. Se connecter à MongoDB (Production)
 * 2. Supprimer TOUTE la base de données
 * 3. Recréer toutes les collections
 * 4. Créer le SuperUser
 * 5. Créer les index nécessaires
 *
 * Usage:
 *   npm run build              (nécessite confirmation)
 *   npm run build -- --force   (force sans confirmation)
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const readline = require('readline');

// Import des modèles
const User = require('./src/models/User');
const Tenant = require('./src/models/Tenant');
const Communication = require('./src/models/Communication');
const Notification = require('./src/models/Notification');

// Interface pour la confirmation
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Fonction pour demander confirmation
function askConfirmation(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y');
    });
  });
}

// Fonction principale
async function buildDatabase() {
  try {
    console.log('\n' + '='.repeat(70));
    console.log('🏗️  BUILD/INITIALISATION DE LA BASE DE DONNÉES PRODUCTION');
    console.log('='.repeat(70));
    console.log('\n⚠️  ATTENTION: Ce script va SUPPRIMER TOUTE la base de données!\n');

    // Vérifier que nous sommes bien en mode production
    const isProduction = process.env.NODE_ENV === 'production' || process.env.MONGO_USER;

    console.log(`🌍 Mode détecté: ${isProduction ? 'PRODUCTION' : 'DÉVELOPPEMENT'}`);

    // Construction de l'URI MongoDB
    const mongoUri = process.env.MONGODB_URI ||
      `mongodb://${process.env.MONGO_USER}:${encodeURIComponent(process.env.MONGO_PASS)}@${process.env.MONGO_HOST}:27017/${process.env.MONGO_DB}?authSource=admin`;

    console.log(`📡 Connexion à: ${process.env.MONGO_HOST || 'localhost'}`);
    console.log(`📦 Base de données: ${process.env.MONGO_DB || mongoose.connection.name}`);

    // Vérifier si --force est passé en argument
    const forceMode = process.argv.includes('--force');

    if (!forceMode) {
      console.log('\n⚠️  Cette opération est IRRÉVERSIBLE!\n');
      const confirmed = await askConfirmation('Êtes-vous sûr de vouloir continuer? (yes/no): ');

      if (!confirmed) {
        console.log('\n❌ Opération annulée par l\'utilisateur.');
        rl.close();
        process.exit(0);
      }
    } else {
      console.log('\n⚡ Mode FORCE activé - Pas de confirmation demandée\n');
    }

    console.log('\n📡 Connexion à MongoDB...');
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });
    console.log('✅ Connecté à MongoDB: ' + mongoose.connection.name);

    // ÉTAPE 1: Supprimer la base de données
    console.log('\n' + '='.repeat(70));
    console.log('ÉTAPE 1/5: SUPPRESSION DE LA BASE DE DONNÉES');
    console.log('='.repeat(70));

    await mongoose.connection.dropDatabase();
    console.log('✅ Base de données supprimée complètement');

    // ÉTAPE 2: Créer les collections
    console.log('\n' + '='.repeat(70));
    console.log('ÉTAPE 2/5: CRÉATION DES COLLECTIONS');
    console.log('='.repeat(70));

    // Les collections seront créées automatiquement lors de la première insertion
    // Mais nous pouvons les créer explicitement pour confirmation
    const collections = ['users', 'tenants', 'communications', 'notifications'];

    for (const collectionName of collections) {
      await mongoose.connection.createCollection(collectionName);
      console.log(`✅ Collection créée: ${collectionName}`);
    }

    // ÉTAPE 3: Créer les index
    console.log('\n' + '='.repeat(70));
    console.log('ÉTAPE 3/5: CRÉATION DES INDEX');
    console.log('='.repeat(70));

    // Les index sont créés automatiquement par les modèles Mongoose
    // Forcer la création
    await User.createIndexes();
    console.log('✅ Index créés pour: users');

    await Tenant.createIndexes();
    console.log('✅ Index créés pour: tenants');

    await Communication.createIndexes();
    console.log('✅ Index créés pour: communications');

    await Notification.createIndexes();
    console.log('✅ Index créés pour: notifications');

    // ÉTAPE 4: Créer le SuperUser
    console.log('\n' + '='.repeat(70));
    console.log('ÉTAPE 4/5: CRÉATION DU SUPERUSER');
    console.log('='.repeat(70));

    const superUserData = {
      email: 'durelsam157@gmail.com',
      password: 'thursday',
      role: 'SuperUser',
      firstName: 'Super',
      lastName: 'Admin',
      isActive: true
    };

    console.log(`👤 Création du SuperUser: ${superUserData.email}`);

    // Hasher le mot de passe
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(superUserData.password, salt);

    // Créer le SuperUser
    const superUser = await User.create({
      email: superUserData.email,
      password: hashedPassword,
      role: superUserData.role,
      firstName: superUserData.firstName,
      lastName: superUserData.lastName,
      isActive: superUserData.isActive,
      // Pas de tenant_id pour le SuperUser
    });

    console.log('✅ SuperUser créé avec succès!');
    console.log(`   ID: ${superUser._id}`);
    console.log(`   Email: ${superUser.email}`);
    console.log(`   Role: ${superUser.role}`);

    // ÉTAPE 5: Vérification finale
    console.log('\n' + '='.repeat(70));
    console.log('ÉTAPE 5/5: VÉRIFICATION FINALE');
    console.log('='.repeat(70));

    // Compter les documents
    const userCount = await User.countDocuments();
    const tenantCount = await Tenant.countDocuments();
    const commCount = await Communication.countDocuments();
    const notifCount = await Notification.countDocuments();

    console.log(`📊 Statistiques de la base de données:`);
    console.log(`   - Users: ${userCount}`);
    console.log(`   - Tenants: ${tenantCount}`);
    console.log(`   - Communications: ${commCount}`);
    console.log(`   - Notifications: ${notifCount}`);

    // Vérifier le SuperUser
    const superUserCheck = await User.findOne({ role: 'SuperUser' });
    if (superUserCheck) {
      console.log('\n✅ SuperUser vérifié: ' + superUserCheck.email);
    }

    // Résumé final
    console.log('\n' + '='.repeat(70));
    console.log('🎉 BUILD TERMINÉ AVEC SUCCÈS!');
    console.log('='.repeat(70));
    console.log('\n📋 Résumé:');
    console.log('   ✅ Base de données réinitialisée');
    console.log('   ✅ Collections créées: ' + collections.join(', '));
    console.log('   ✅ Index créés et optimisés');
    console.log('   ✅ SuperUser créé et opérationnel');
    console.log('\n🔐 Credentials SuperUser:');
    console.log('   Email: durelsam157@gmail.com');
    console.log('   Password: thursday');
    console.log('\n⚠️  IMPORTANT: Changez le mot de passe du SuperUser en production!');
    console.log('\n' + '='.repeat(70) + '\n');

    // Fermer la connexion
    await mongoose.connection.close();
    console.log('👋 Connexion fermée proprement.\n');

    rl.close();
    process.exit(0);

  } catch (error) {
    console.error('\n❌ ERREUR lors du build de la base de données:');
    console.error('Message:', error.message);
    console.error('Stack:', error.stack);

    // Messages d'aide
    if (error.message.includes('authentication') || error.message.includes('Authentication')) {
      console.error('\n💡 Conseil: Vérifiez vos credentials MongoDB');
      console.error('   - MONGO_USER: ' + (process.env.MONGO_USER ? '✅' : '❌'));
      console.error('   - MONGO_PASS: ' + (process.env.MONGO_PASS ? '✅' : '❌'));
      console.error('   - MONGO_HOST: ' + (process.env.MONGO_HOST || '❌'));
      console.error('   - MONGO_DB: ' + (process.env.MONGO_DB || '❌'));
    } else if (error.message.includes('ECONNREFUSED')) {
      console.error('\n💡 Conseil: MongoDB est inaccessible');
      console.error('   Vérifiez que le serveur MongoDB est démarré et accessible');
    }

    console.error('\n');
    rl.close();
    process.exit(1);
  }
}

// Exécuter le build
console.log('\n🚀 Démarrage du script de build...\n');
buildDatabase();
