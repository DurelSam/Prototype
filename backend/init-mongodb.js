/**
 * Script d'initialisation MongoDB Local
 *
 * Ce script:
 * 1. Teste la connexion à MongoDB local
 * 2. Crée la base de données 'prototypedb'
 * 3. Les collections seront créées automatiquement par Mongoose lors de la première insertion
 *
 * Collections qui seront créées automatiquement:
 * - tenants: Informations des entreprises
 * - users: Utilisateurs avec leurs rôles
 * - communications: Emails et messages WhatsApp
 * - aianalyses: Analyses IA des communications
 */

require('dotenv').config();
const mongoose = require('mongoose');

async function initMongoDB() {
  try {
    console.log('🔄 Connexion à MongoDB local...');
    console.log(`📍 URI: ${process.env.MONGODB_URI}`);

    // Connexion à MongoDB
    await mongoose.connect(process.env.MONGODB_URI);

    console.log('✅ Connexion réussie à MongoDB local!');
    console.log(`📦 Base de données: ${mongoose.connection.name}`);

    // Afficher les informations de connexion
    const admin = mongoose.connection.db.admin();
    const serverStatus = await admin.serverStatus();

    console.log('\n📊 Informations du serveur MongoDB:');
    console.log(`   Version: ${serverStatus.version}`);
    console.log(`   Host: ${serverStatus.host}`);
    console.log(`   Uptime: ${Math.floor(serverStatus.uptime / 60)} minutes`);

    // Lister les collections existantes
    const collections = await mongoose.connection.db.listCollections().toArray();

    console.log('\n📋 Collections existantes:');
    if (collections.length === 0) {
      console.log('   Aucune collection pour le moment.');
      console.log('   Les collections seront créées automatiquement lors de la première utilisation:');
      console.log('   - tenants (entreprises)');
      console.log('   - users (utilisateurs)');
      console.log('   - communications (emails et WhatsApp)');
      console.log('   - aianalyses (analyses IA)');
    } else {
      collections.forEach(col => {
        console.log(`   ✓ ${col.name}`);
      });
    }

    // Afficher les statistiques de la base de données
    const dbStats = await mongoose.connection.db.stats();
    console.log('\n💾 Statistiques de la base de données:');
    console.log(`   Collections: ${dbStats.collections}`);
    console.log(`   Taille des données: ${(dbStats.dataSize / 1024).toFixed(2)} KB`);
    console.log(`   Taille du stockage: ${(dbStats.storageSize / 1024).toFixed(2)} KB`);

    console.log('\n✨ MongoDB local est prêt à être utilisé!');
    console.log('🚀 Vous pouvez maintenant démarrer votre application avec: npm run dev');

    // Fermer la connexion
    await mongoose.connection.close();
    console.log('\n👋 Connexion fermée.');

  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation MongoDB:', error.message);

    if (error.message.includes('ECONNREFUSED')) {
      console.log('\n⚠️  MongoDB n\'est pas en cours d\'exécution!');
      console.log('\n📝 Solutions possibles:');
      console.log('   1. Démarrer MongoDB manuellement:');
      console.log('      mongod --dbpath "C:\\data\\db"');
      console.log('   2. Ou démarrer le service MongoDB:');
      console.log('      net start MongoDB');
      console.log('   3. Ou installer MongoDB si ce n\'est pas déjà fait:');
      console.log('      https://www.mongodb.com/try/download/community');
    }

    process.exit(1);
  }
}

// Exécuter l'initialisation
initMongoDB();
