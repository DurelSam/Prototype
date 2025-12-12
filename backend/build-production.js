/**
 * Script de BUILD/INITIALISATION de la Base de Données (Adapté à Render - Connexion Interne)
 *
 * Ce script est configuré pour se connecter au service MongoDB en tant que Service Privé Render,
 * ce qui signifie qu'il n'utilise PAS d'identifiants d'authentification pour la connexion.
 *
 * ⚠️ ATTENTION: Nécessite les variables d'environnement MONGO_DB, SUPERUSER_EMAIL, et SUPERUSER_PASS.
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

// CONFIGURATION MONGODB : Utilisation de l'hôte et du port fournis par Render (sans authentification)
// Possibilité de configurer via variables d'environnement ou fallback sur valeurs par défaut
const INTERNAL_HOST = process.env.MONGO_HOST || "mongodb-o9gm"; // Le nom d'hôte interne du service MongoDB
const PORT = process.env.MONGO_PORT || "27017";
const TARGET_DB_NAME = process.env.MONGO_DB; // Nom de la DB applicative, doit être dans les secrets Render

// Construction de l'URI SANS AUTHENTIFICATION
const mongoUri = `mongodb://${INTERNAL_HOST}:${PORT}/${TARGET_DB_NAME}`;

// Variables de contrôle de l'environnement
const isProduction = process.env.NODE_ENV === "production";
const ALLOW_DB_RESET = process.env.ALLOW_DB_RESET === "YES_I_CONFIRM";

// Fonction principale
async function buildDatabase() {
  try {
    console.log("\n" + "=".repeat(70));
    console.log(
      "🏗️  SCRIPT D'INITIALISATION DE LA BASE DE DONNÉES (MODE PRODUCTION)"
    );
    console.log("=".repeat(70));

    // ----------------------------------------------------
    // VÉRIFICATIONS DE SÉCURITÉ ET D'ENVIRONNEMENT
    // ----------------------------------------------------

    console.log(
      `🌍 Mode détecté: ${isProduction ? "PRODUCTION" : "DÉVELOPPEMENT"}`
    );
    console.log(`📡 Hôte MongoDB utilisé: ${INTERNAL_HOST}:${PORT}`);
    console.log(`📦 Base de données ciblée: ${TARGET_DB_NAME}`);

    // 1. Vérification des variables d'environnement
    if (!TARGET_DB_NAME) {
      throw new Error(
        "La variable d'environnement MONGO_DB est manquante. Connexion impossible."
      );
    }
    console.log("✅ Nom de la DB trouvé.");

    if (!SUPERUSER_EMAIL || !SUPERUSER_PASS) {
      throw new Error(
        "Les variables SUPERUSER_EMAIL et SUPERUSER_PASS sont manquantes. Création du SuperUser impossible."
      );
    }
    console.log("✅ Identifiants SuperUser trouvés.");

    // 2. VÉROUILLAGE CRITIQUE EN PRODUCTION
    if (isProduction && !ALLOW_DB_RESET) {
      throw new Error(
        "\n\n🚨 BLOCAGE SÉCURITÉ : La suppression de la base de données est interdite en mode PRODUCTION..."
      );
    }

    if (ALLOW_DB_RESET) {
      console.log(
        "\n⚠️  AVERTISSEMENT: La réinitialisation est autorisée. Destruction des données dans 3 secondes..."
      );
      await new Promise((resolve) => setTimeout(resolve, 3000));
    } else {
      console.log("\n🔧 Initialisation sans réinitialisation.");
    }

    // ----------------------------------------------------
    // CONNEXION ET OPÉRATIONS
    // ----------------------------------------------------

    console.log("\n📡 Connexion à MongoDB (sans authentification)...");
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

    // ÉTAPE 2 & 3: CRÉATION DES COLLECTIONS ET INDEX
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
      if (ALLOW_DB_RESET) {
        // Tentative de suppression explicite après le dropDatabase() pour plus de robustesse
        try {
          await mongoose.connection.dropCollection(name);
          console.log(
            `🧹 Collection précédente supprimée explicitement : ${name}`
          );
        } catch (e) {
          // Code 26 signifie que la collection n'existait pas (erreur acceptable)
          if (e.code !== 26) {
            console.warn(
              `Avertissement : Erreur lors de la suppression de ${name} : ${e.message}`
            );
          }
        }
      }

      // Utilise Model.init() qui est plus robuste que createCollection()
      await model.init();
      console.log(`✅ Collection créée/vérifiée: ${name}`);
      await model.createIndexes();
      console.log(`✅ Index créés pour: ${name}`);
    }

    // ÉTAPE 4: Créer le SuperUser
    console.log("\n" + "=".repeat(70));
    console.log("ÉTAPE 4/5: CRÉATION DU SUPERUSER");
    console.log("=".repeat(70));

    const existingSuperUser = await User.findOne({ role: "SuperUser" });

    if (existingSuperUser) {
      console.log(
        `⚠️ Un SuperUser (${existingSuperUser.email}) existe déjà. Création sautée.`
      );
    } else {
      const superUserData = {
        email: SUPERUSER_EMAIL,
        password: SUPERUSER_PASS,
        role: "SuperUser",
        firstName: "Super",
        lastName: "Admin",
        isActive: true,
      };

      console.log(`👤 Création du SuperUser: ${superUserData.email}`);

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(superUserData.password, salt);

      const superUser = await User.create({
        email: superUserData.email,
        password: hashedPassword,
        role: superUserData.role,
        firstName: superUserData.firstName,
        lastName: superUserData.lastName,
        isActive: superUserData.isActive,
      });

      console.log("✅ SuperUser créé avec succès!");
      console.log(`   ID: ${superUser._id}`);
      console.log(`   Email: ${superUser.email}`);
      console.log(`   Role: ${superUser.role}`);
    }

    // ÉTAPE 5: Vérification finale
    console.log("\n" + "=".repeat(70));
    console.log("ÉTAPE 5/5: VÉRIFICATION FINALE");
    console.log("=".repeat(70));

    const userCount = await User.countDocuments();
    const tenantCount = await Tenant.countDocuments();
    const communicationCount = await Communication.countDocuments();
    const notificationCount = await Notification.countDocuments();

    console.log(`📊 Statistiques de la base de données:`);
    console.log(`   - Users: ${userCount}`);
    console.log(`   - Tenants: ${tenantCount}`);
    console.log(`   - Communications: ${communicationCount}`);
    console.log(`   - Notifications: ${notificationCount}`);

    console.log("\n" + "=".repeat(70));
    console.log("🎉 BUILD PRODUCTION TERMINÉ AVEC SUCCÈS!");
    console.log("=".repeat(70));

    console.log("\n🔐 Credentials SuperUser (depuis vos secrets Render):");
    console.log("   Email: " + SUPERUSER_EMAIL);
    console.log("   Mot de passe : [CONFIDENTIEL - NON AFFICHÉ]");

    // Fermer la connexion
    await mongoose.connection.close();
    console.log("\n👋 Connexion fermée proprement.\n");

    process.exit(0);
  } catch (error) {
    console.error("\n❌ ERREUR lors du build de la base de données:");
    console.error("Message:", error.message);

    if (
      error.message.includes("ECONNREFUSED") ||
      error.message.includes("ENOTFOUND")
    ) {
      console.error(
        "\n💡 Conseil: MongoDB est inaccessible. Vérifiez que l'hôte interne est correct. L'hôte utilisé est " +
          INTERNAL_HOST
      );
    } else if (error.message.includes("manquante")) {
      console.error(
        "\n💡 Conseil: Variables d'environnement manquantes. Vérifiez MONGO_DB, SUPERUSER_EMAIL ou SUPERUSER_PASS."
      );
    }

    if (process.env.NODE_ENV !== "production") {
      console.error("\n📋 Stack trace:");
      console.error(error.stack);
    }

    console.error("\n");
    process.exit(1);
  }
}

// Exécuter le build
console.log("\n🚀 Démarrage du script de build production...\n");
buildDatabase();
