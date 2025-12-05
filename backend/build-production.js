/**
 * Script de BUILD/INITIALISATION de la Base de Données (Sécurisé Render)
 *
 * ⚠️  ATTENTION: Ce script va SUPPRIMER TOUTE la base de données si ALLOW_DB_RESET est défini !
 *
 * Ce script va :
 * 1. Se connecter à MongoDB en utilisant MONGO_URI.
 * 2. Procéder à la réinitialisation si l'environnement le permet.
 * 3. Recréer les collections et les index.
 * 4. Créer le SuperUser avec des secrets d'environnement.
 */

require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

// Import des modèles
const User = require("./src/models/User");
const Tenant = require("./src/models/Tenant");
const Communication = require("./src/models/Communication");
const Notification = require("./src/models/Notification");

// Récupération des secrets requis
const SUPERUSER_EMAIL = process.env.SUPERUSER_EMAIL;
const SUPERUSER_PASS = process.env.SUPERUSER_PASS;
const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;

// Variables de contrôle de l'environnement
const isProduction = process.env.NODE_ENV === "production";
const ALLOW_DB_RESET = process.env.ALLOW_DB_RESET === "YES_I_CONFIRM"; // ⚠️ VERROU DE SÉCURITÉ

// Fonction principale
async function buildDatabase() {
  try {
    console.log("\n" + "=".repeat(70));
    console.log("🏗️  SCRIPT D'INITIALISATION DE LA BASE DE DONNÉES");
    console.log("=".repeat(70));

    // ----------------------------------------------------
    // VÉRIFICATIONS DE SÉCURITÉ ET D'ENVIRONNEMENT
    // ----------------------------------------------------

    console.log(
      `🌍 Mode détecté: ${isProduction ? "PRODUCTION" : "DÉVELOPPEMENT"}`
    );

    // 1. Vérification de l'URI de Connexion
    if (!mongoUri) {
      throw new Error(
        "La variable MONGODB_URI ou MONGO_URI est manquante. Connexion impossible."
      );
    }
    console.log("✅ URI de connexion trouvée.");

    // 2. Vérification des identifiants SuperUser
    if (!SUPERUSER_EMAIL || !SUPERUSER_PASS) {
      throw new Error(
        "Les variables SUPERUSER_EMAIL et SUPERUSER_PASS sont manquantes. Création du SuperUser impossible."
      );
    }
    console.log("✅ Identifiants SuperUser trouvés.");

    // 3. VÉROUILLAGE CRITIQUE EN PRODUCTION
    if (isProduction && !ALLOW_DB_RESET) {
      throw new Error(
        "\n\n🚨 BLOCAGE SÉCURITÉ : La suppression de la base de données est interdite en mode PRODUCTION." +
          "\n   Pour autoriser la réinitialisation (perte de données !), vous DEVEZ définir" +
          "\n   la variable d'environnement ALLOW_DB_RESET = 'YES_I_CONFIRM' sur Render." +
          "\n\n"
      );
    }

    if (ALLOW_DB_RESET) {
      console.log(
        "\n⚠️  AVERTISSEMENT: La réinitialisation est autorisée (ALLOW_DB_RESET = 'YES_I_CONFIRM')."
      );
      console.log(
        "    Toutes les données existantes seront détruites dans 3 secondes..."
      );
      await new Promise((resolve) => setTimeout(resolve, 3000)); // Attente symbolique
    } else {
      console.log(
        "\n🔧 Initialisation sans réinitialisation (ajout de collections/index si manquants)."
      );
    }

    // ----------------------------------------------------
    // CONNEXION ET OPÉRATIONS
    // ----------------------------------------------------

    console.log("\n📡 Connexion à MongoDB...");
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });
    console.log("✅ Connecté à MongoDB: " + mongoose.connection.name);

    // ÉTAPE 1: Supprimer la base de données (si autorisation donnée)
    if (ALLOW_DB_RESET) {
      console.log("\n" + "=".repeat(70));
      console.log("ÉTAPE 1/5: SUPPRESSION DE LA BASE DE DONNÉES (AUTORISÉE)");
      console.log("=".repeat(70));

      await mongoose.connection.dropDatabase();
      console.log("✅ Base de données supprimée complètement.");
    } else {
      console.log("\n" + "=".repeat(70));
      console.log("ÉTAPE 1/5: SUPPRESSION SAUTÉE (PAS D'AUTORISATION)");
      console.log("=".repeat(70));
    }

    // ÉTAPE 2 & 3: Créer les collections et les index
    console.log("\n" + "=".repeat(70));
    console.log("ÉTAPE 2 & 3/5: CRÉATION DES COLLECTIONS ET INDEX");
    console.log("=".repeat(70));

    const collections = [
      { name: "users", model: User },
      { name: "tenants", model: Tenant },
      { name: "communications", model: Communication },
      { name: "notifications", model: Notification },
    ];

    for (const { name, model } of collections) {
      // mongoose.connection.createCollection crée la collection si elle n'existe pas
      await mongoose.connection.createCollection(name);
      console.log(`✅ Collection créée/vérifiée: ${name}`);
      await model.createIndexes();
      console.log(`✅ Index créés pour: ${name}`);
    }

    // ÉTAPE 4: Créer le SuperUser
    console.log("\n" + "=".repeat(70));
    console.log("ÉTAPE 4/5: CRÉATION DU SUPERUSER");
    console.log("=".repeat(70));

    // Vérifier si un SuperUser existe déjà pour éviter le doublon en cas de non-drop
    const existingSuperUser = await User.findOne({ role: "SuperUser" });

    if (existingSuperUser) {
      console.log(
        `⚠️ Un SuperUser (${existingSuperUser.email}) existe déjà. Création sautée.`
      );
    } else {
      const superUserData = {
        email: SUPERUSER_EMAIL,
        password: SUPERUSER_PASS, // Sera hashé
        role: "SuperUser",
        firstName: "Super",
        lastName: "Admin",
        isActive: true,
      };

      console.log(`👤 Création du SuperUser: ${superUserData.email}`);

      // Hasher le mot de passe (comme avant, c'est bien)
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
      });

      console.log("✅ SuperUser créé avec succès!");
      console.log(`   ID: ${superUser._id}`);
      console.log(`   Email: ${superUser.email}`);
      console.log(`   Role: ${superUser.role}`);
    }

    // ÉTAPE 5: Vérification finale (le reste de votre logique de vérification)
    console.log("\n" + "=".repeat(70));
    console.log("ÉTAPE 5/5: VÉRIFICATION FINALE");
    console.log("=".repeat(70));

    const userCount = await User.countDocuments();
    // ... (affichage des autres comptes)

    console.log(`📊 Statistiques de la base de données:`);
    console.log(`   - Users: ${userCount}`);
    // ...

    // Résumé final
    console.log("\n" + "=".repeat(70));
    console.log("🎉 BUILD TERMINÉ AVEC SUCCÈS!");
    console.log("=".repeat(70));

    // ⚠️ Ne plus loguer le mot de passe en clair à la fin
    console.log("\n🔐 Credentials SuperUser (depuis vos secrets Render):");
    console.log("   Email: " + SUPERUSER_EMAIL);
    console.log("   Mot de passe : [CONFIDENTIEL - NON AFFICHÉ]");

    // Fermer la connexion
    await mongoose.connection.close();
    console.log("👋 Connexion fermée proprement.\n");

    process.exit(0);
  } catch (error) {
    console.error("\n❌ ERREUR lors du build de la base de données:");
    console.error("Message:", error.message);

    // Messages d'aide selon le type d'erreur
    if (error.message.includes("ECONNREFUSED")) {
      console.error("\n💡 Conseil: MongoDB est inaccessible");
      console.error(
        "   Vérifiez que le serveur MongoDB est démarré et accessible"
      );
      if (process.env.MONGO_HOST) {
        console.error("   Host configuré: " + process.env.MONGO_HOST);
      }
    } else if (
      error.message.includes("authentication") ||
      error.message.includes("Authentication")
    ) {
      console.error("\n💡 Conseil: Erreur d'authentification MongoDB");
      console.error("   Vérifiez vos credentials:");
      console.error(
        "   - MONGODB_URI: " + (process.env.MONGODB_URI ? "✅" : "❌")
      );
      console.error(
        "   - MONGO_URI: " + (process.env.MONGO_URI ? "✅" : "❌")
      );
      console.error(
        "   - MONGO_USER: " + (process.env.MONGO_USER ? "✅" : "❌")
      );
      console.error(
        "   - MONGO_PASS: " + (process.env.MONGO_PASS ? "✅" : "❌")
      );
      console.error("   - MONGO_HOST: " + (process.env.MONGO_HOST || "❌"));
      console.error("   - MONGO_DB: " + (process.env.MONGO_DB || "❌"));
    } else if (error.message.includes("ENOTFOUND")) {
      console.error("\n💡 Conseil: Hôte MongoDB introuvable");
      console.error("   Vérifiez la variable MONGO_HOST: " + process.env.MONGO_HOST);
    } else if (error.message.includes("manquante")) {
      console.error("\n💡 Conseil: Variables d'environnement manquantes");
      console.error("   Vérifiez votre configuration sur Render:");
      console.error("   1. MONGODB_URI ou MONGO_URI (obligatoire)");
      console.error("   2. SUPERUSER_EMAIL (obligatoire)");
      console.error("   3. SUPERUSER_PASS (obligatoire)");
      console.error("   4. ALLOW_DB_RESET='YES_I_CONFIRM' (pour réinitialisation)");
    }

    // Afficher la stack trace en développement uniquement
    if (process.env.NODE_ENV !== "production") {
      console.error("\n📋 Stack trace:");
      console.error(error.stack);
    }

    console.error("\n");
    process.exit(1);
  }
}

// Exécuter le build
console.log("\n🚀 Démarrage du script de build...\n");
buildDatabase();
