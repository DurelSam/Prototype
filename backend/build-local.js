/**
 * Script de BUILD/INITIALISATION de la Base de Données (LOCAL)
 *
 * Ce script initialise complètement la base de données MongoDB en local avec:
 * - Création des collections
 * - Création des index
 * - Création du SuperUser
 *
 * ⚠️ ATTENTION: Utilise MONGODB_URI depuis le fichier .env local
 */

require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

// Import des modèles
const User = require("./src/models/User");
const Tenant = require("./src/models/Tenant");
const Communication = require("./src/models/Communication");
const Notification = require("./src/models/Notification");

// Récupération des configurations locales
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/prototypedb";
const SUPERUSER_EMAIL = process.env.SUPERUSER_EMAIL || "durelsam157@gmail.com";
const SUPERUSER_PASS = process.env.SUPERUSER_PASS || "thursday";

// Variables de contrôle de l'environnement
const isProduction = process.env.NODE_ENV === "production";
const ALLOW_DB_RESET = process.env.ALLOW_DB_RESET === "YES_I_CONFIRM";

// Fonction principale
async function buildDatabase() {
  try {
    console.log("\n" + "=".repeat(70));
    console.log(
      "🏗️  SCRIPT D'INITIALISATION DE LA BASE DE DONNÉES (MODE LOCAL)"
    );
    console.log("=".repeat(70));

    // ----------------------------------------------------
    // VÉRIFICATIONS DE SÉCURITÉ ET D'ENVIRONNEMENT
    // ----------------------------------------------------

    console.log(
      `🌍 Mode détecté: ${isProduction ? "PRODUCTION" : "DÉVELOPPEMENT"}`
    );
    console.log(`📡 URI MongoDB: ${MONGODB_URI}`);

    // 1. Vérification de l'URI MongoDB
    if (!MONGODB_URI) {
      throw new Error(
        "La variable d'environnement MONGODB_URI est manquante. Connexion impossible."
      );
    }
    console.log("✅ URI MongoDB trouvée.");

    if (!SUPERUSER_EMAIL || !SUPERUSER_PASS) {
      console.warn(
        "⚠️  Credentials SuperUser non trouvés, utilisation des valeurs par défaut."
      );
    }
    console.log("✅ Credentials SuperUser configurés.");

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

    console.log("\n📡 Connexion à MongoDB local...");
    await mongoose.connect(MONGODB_URI, {
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
    console.log("🎉 BUILD LOCAL TERMINÉ AVEC SUCCÈS!");
    console.log("=".repeat(70));

    console.log("\n🔐 Credentials SuperUser:");
    console.log("   Email: " + SUPERUSER_EMAIL);
    console.log("   Mot de passe : " + SUPERUSER_PASS);
    console.log("\n💡 Vous pouvez maintenant démarrer l'application avec: npm run dev");

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
        "\n💡 Conseil: MongoDB est inaccessible. Vérifiez que MongoDB est bien démarré en local."
      );
      console.error("\n📝 Solutions possibles:");
      console.error("   1. Démarrer MongoDB manuellement:");
      console.error('      mongod --dbpath "C:\\data\\db"');
      console.error("   2. Ou démarrer le service MongoDB:");
      console.error("      net start MongoDB");
      console.error("   3. Ou installer MongoDB si ce n'est pas déjà fait:");
      console.error("      https://www.mongodb.com/try/download/community");
    } else if (error.message.includes("manquante")) {
      console.error(
        "\n💡 Conseil: Variables d'environnement manquantes. Vérifiez votre fichier .env"
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
console.log("\n🚀 Démarrage du script de build local...\n");
buildDatabase();
