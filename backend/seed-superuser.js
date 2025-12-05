/**
 * Script d'initialisation du SuperUser
 *
 * Ce script crée le compte SuperUser principal qui a tous les droits sur le système.
 * Le SuperUser peut :
 * - Ajouter et valider des entreprises (tenants)
 * - Créer et gérer des UpperAdmin
 * - Avoir accès à toutes les fonctionnalités du système
 *
 * IMPORTANT: Ce script ne doit être exécuté qu'une seule fois lors de l'initialisation du système.
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('./src/models/User');

async function createSuperUser() {
  try {
    console.log('\n' + '='.repeat(60));
    console.log('🔐 INITIALISATION DU SUPERUSER');
    console.log('='.repeat(60) + '\n');

    // Connexion à MongoDB
    console.log('📡 Connexion à MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connecté à la base de données: ' + mongoose.connection.name + '\n');

    // Vérifier si un SuperUser existe déjà
    const existingSuperUser = await User.findOne({ role: 'SuperUser' });

    if (existingSuperUser) {
      console.log('⚠️  Un SuperUser existe déjà dans le système!');
      console.log(`📧 Email: ${existingSuperUser.email}`);
      console.log(`📅 Créé le: ${existingSuperUser.createdAt.toLocaleDateString('fr-FR')}`);
      console.log('\n💡 Si vous souhaitez créer un nouveau SuperUser, supprimez d\'abord l\'ancien.');

      await mongoose.connection.close();
      process.exit(0);
    }

    // Informations du SuperUser
    const superUserData = {
      email: 'durelsam157@gmail.com',
      password: 'thursday',
      role: 'SuperUser',
      firstName: 'Super',
      lastName: 'Admin',
      isActive: true
    };

    console.log('👤 Création du SuperUser...');
    console.log(`📧 Email: ${superUserData.email}`);
    console.log(`👨‍💼 Rôle: ${superUserData.role}`);
    console.log(`📛 Nom: ${superUserData.firstName} ${superUserData.lastName}\n`);

    // Hasher le mot de passe
    console.log('🔒 Hashage du mot de passe...');
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
    console.log(`🆔 ID: ${superUser._id}`);
    console.log(`📧 Email: ${superUser.email}`);
    console.log(`👨‍💼 Rôle: ${superUser.role}\n`);

    console.log('🎉 Initialisation terminée!');
    console.log('\n📝 Credentials de connexion:');
    console.log('   Email: durelsam157@gmail.com');
    console.log('   Password: thursday');
    console.log('\n⚠️  IMPORTANT: Ces credentials sont sauvegardés dans SUPERUSER_CREDENTIALS.txt');
    console.log('   Conservez ce fichier en sécurité et ne le partagez jamais!\n');

    console.log('='.repeat(60) + '\n');

    // Fermer la connexion
    await mongoose.connection.close();
    console.log('👋 Connexion fermée.\n');

    process.exit(0);

  } catch (error) {
    console.error('\n❌ Erreur lors de la création du SuperUser:');
    console.error('Message:', error.message);

    if (error.code === 11000) {
      console.error('\n💡 Un utilisateur avec cet email existe déjà.');
    }

    console.error('\n');
    process.exit(1);
  }
}

// Exécuter la création
createSuperUser();
