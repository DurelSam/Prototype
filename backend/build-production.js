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
 *   npm run build              (exécute sans confirmation en production)
 */

require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

// Import des modèles
const User = require("./src/models/User");
const Tenant = require("./src/models/Tenant");
const Communication = require("./src/models/Communication");
const Notification = require("./src/models/Notification");

// Fonction principale
async function buildDatabase() {
  try {
    console.log("\n" + "=".repeat(70));
    console.log("🏗️  BUILD/INITIALISATION DE LA BASE DE DONNÉES PRODUCTION");
    console.log("=".repeat(70));
    console.log(
      "\n⚠️  ATTENTION: Ce script va SUPPRIMER TOUTE la base de données!\n"
    );

    // Vérifier que nous sommes bien en mode production
    const isProduction =
      process.env.NODE_ENV === "production" || process.env.MONGO_USER;

    console.log(
      `🌍 Mode détecté: ${isProduction ? "PRODUCTION" : "DÉVELOPPEMENT"}`
    );

    // Construction de l'URI MongoDB
    const mongoUri =
      process.env.MONGODB_URI ||
      `mongodb://${process.env.MONGO_USER}:${encodeURIComponent(
        process.env.MONGO_PASS
      )}@${process.env.MONGO_HOST}:27017/${
        process.env.MONGO_DB
      }?authSource=admin`;

    console.log(`📡 Connexion à: ${process.env.MONGO_HOST || "localhost"}`);
    console.log(
      `📦 Base de données: ${process.env.MONGO_DB || mongoose.connection.name}`
    );

    // Pour la production sur Render, on n'exige pas de confirmation
    // mais on vérifie certaines conditions de sécurité
    if (isProduction) {
      console.log(
        "\n⚡ Mode PRODUCTION - Vérification des variables d'environnement..."
      );

      // Vérifications de sécurité en production
      if (!process.env.MONGO_HOST || !process.env.MONGO_DB) {
        throw new Error(
          "Variables d'environnement MongoDB manquantes en production"
        );
      }

      // Si c'est vraiment la production, on attend 3 secondes pour donner
      // une chance d'annuler (dans un terminal) mais sans interaction
      console.log(
        "⚠️  Démarrage de la réinitialisation de la base de données dans 5 secondes..."
      );
      await new Promise((resolve) => setTimeout(resolve, 5000));
    } else {
      // En développement, on peut avoir un délai plus court
      console.log("\n🔧 Mode DÉVELOPPEMENT - Réinitialisation immédiate");
    }

    console.log("\n📡 Connexion à MongoDB...");
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });
    console.log("✅ Connecté à MongoDB: " + mongoose.connection.name);

    // ÉTAPE 1: Supprimer la base de données
    console.log("\n" + "=".repeat(70));
    console.log("ÉTAPE 1/5: SUPPRESSION DE LA BASE DE DONNÉES");
    console.log("=".repeat(70));

    await mongoose.connection.dropDatabase();
    console.log("✅ Base de données supprimée complètement");

    // ÉTAPE 2: Créer les collections
    console.log("\n" + "=".repeat(70));
    console.log("ÉTAPE 2/5: CRÉATION DES COLLECTIONS");
    console.log("=".repeat(70));

    const collections = ["users", "tenants", "communications", "notifications"];

    for (const collectionName of collections) {
      await mongoose.connection.createCollection(collectionName);
      console.log(`✅ Collection créée: ${collectionName}`);
    }

    // ÉTAPE 3: Créer les index
    console.log("\n" + "=".repeat(70));
    console.log("ÉTAPE 3/5: CRÉATION DES INDEX");
    console.log("=".repeat(70));

    await User.createIndexes();
    console.log("✅ Index créés pour: users");

    await Tenant.createIndexes();
    console.log("✅ Index créés pour: tenants");

    await Communication.createIndexes();
    console.log("✅ Index créés pour: communications");

    await Notification.createIndexes();
    console.log("✅ Index créés pour: notifications");

    // ÉTAPE 4: Créer le SuperUser
    console.log("\n" + "=".repeat(70));
    console.log("ÉTAPE 4/5: CRÉATION DU SUPERUSER");
    console.log("=".repeat(70));

    const superUserData = {
      email: "durelsam157@gmail.com",
      password: "thursday",
      role: "SuperUser",
      firstName: "Super",
      lastName: "Admin",
      isActive: true,
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

    console.log("✅ SuperUser créé avec succès!");
    console.log(`   ID: ${superUser._id}`);
    console.log(`   Email: ${superUser.email}`);
    console.log(`   Role: ${superUser.role}`);

    // ÉTAPE 5: Vérification finale
    console.log("\n" + "=".repeat(70));
    console.log("ÉTAPE 5/5: VÉRIFICATION FINALE");
    console.log("=".repeat(70));

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
    const superUserCheck = await User.findOne({ role: "SuperUser" });
    if (superUserCheck) {
      console.log("\n✅ SuperUser vérifié: " + superUserCheck.email);
    }

    // Résumé final
    console.log("\n" + "=".repeat(70));
    console.log("🎉 BUILD TERMINÉ AVEC SUCCÈS!");
    console.log("=".repeat(70));
    console.log("\n📋 Résumé:");
    console.log("   ✅ Base de données réinitialisée");
    console.log("   ✅ Collections créées: " + collections.join(", "));
    console.log("   ✅ Index créés et optimisés");
    console.log("   ✅ SuperUser créé et opérationnel");
    console.log("\n🔐 Credentials SuperUser:");
    console.log("   Email: durelsam157@gmail.com");
    console.log("   Password: thursday");
    console.log(
      "\n⚠️  IMPORTANT: Changez le mot de passe du SuperUser en production!"
    );
    console.log("\n" + "=".repeat(70) + "\n");

    // Fermer la connexion
    await mongoose.connection.close();
    console.log("👋 Connexion fermée proprement.\n");

    process.exit(0);
  } catch (error) {
    console.error("\n❌ ERREUR lors du build de la base de données:");
    console.error("Message:", error.message);
    console.error("Stack:", error.stack);

    // Messages d'aide
    if (
      error.message.includes("authentication") ||
      error.message.includes("Authentication")
    ) {
      console.error("\n💡 Conseil: Vérifiez vos credentials MongoDB");
      console.error(
        "   - MONGO_USER: " + (process.env.MONGO_USER ? "✅" : "❌")
      );
      console.error(
        "   - MONGO_PASS: " + (process.env.MONGO_PASS ? "✅" : "❌")
      );
      console.error("   - MONGO_HOST: " + (process.env.MONGO_HOST || "❌"));
      console.error("   - MONGO_DB: " + (process.env.MONGO_DB || "❌"));
    } else if (error.message.includes("ECONNREFUSED")) {
      console.error("\n💡 Conseil: MongoDB est inaccessible");
      console.error(
        "   Vérifiez que le serveur MongoDB est démarré et accessible"
      );
    }

    console.error("\n");
    process.exit(1);
  }
}

// Exécuter le build
console.log("\n🚀 Démarrage du script de build...\n");
buildDatabase();
