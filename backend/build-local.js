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
    let superUser;

    if (existingSuperUser) {
      console.log(
        `⚠️ Un SuperUser (${existingSuperUser.email}) existe déjà. Création sautée.`
      );
      superUser = existingSuperUser;
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

      superUser = await User.create({
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

    // ÉTAPE 4.5: Créer des Tenants et Utilisateurs de démonstration
    console.log("\n" + "=".repeat(70));
    console.log("ÉTAPE 4.5/5: CRÉATION DES DONNÉES DE DÉMONSTRATION");
    console.log("=".repeat(70));

    const existingTenants = await Tenant.countDocuments();

    if (existingTenants > 0) {
      console.log(
        `⚠️ Des tenants existent déjà (${existingTenants}). Données de démo sautées.`
      );
    } else {
      console.log("📦 Création des tenants de démonstration...\n");

      // Définir les données de démonstration
      const demoData = [
        {
          tenant: {
            companyName: "Acme Corporation",
            subscriptionStatus: "Active",
            settings: { language: "en", slaHours: 24 },
          },
          upperAdmin: {
            firstName: "John",
            lastName: "Doe",
            email: "john.doe@acme.com",
            password: "password123",
          },
          users: [
            {
              firstName: "Alice",
              lastName: "Manager",
              email: "alice@acme.com",
              password: "password123",
              role: "Admin",
            },
            {
              firstName: "Bob",
              lastName: "Employee",
              email: "bob@acme.com",
              password: "password123",
              role: "Employee",
            },
          ],
        },
        {
          tenant: {
            companyName: "TechStart Inc",
            subscriptionStatus: "Trial",
            settings: { language: "en", slaHours: 48 },
          },
          upperAdmin: {
            firstName: "Sarah",
            lastName: "Williams",
            email: "sarah.williams@techstart.com",
            password: "password123",
          },
          users: [
            {
              firstName: "Mike",
              lastName: "Developer",
              email: "mike@techstart.com",
              password: "password123",
              role: "Employee",
            },
          ],
        },
        {
          tenant: {
            companyName: "Global Services Ltd",
            subscriptionStatus: "Active",
            settings: { language: "fr", slaHours: 12 },
          },
          upperAdmin: {
            firstName: "Marie",
            lastName: "Dubois",
            email: "marie.dubois@globalservices.com",
            password: "password123",
          },
          users: [
            {
              firstName: "Pierre",
              lastName: "Martin",
              email: "pierre@globalservices.com",
              password: "password123",
              role: "Admin",
            },
            {
              firstName: "Sophie",
              lastName: "Bernard",
              email: "sophie@globalservices.com",
              password: "password123",
              role: "Employee",
            },
          ],
        },
      ];

      // Créer les tenants et leurs utilisateurs
      for (const data of demoData) {
        // 1. Créer le tenant
        const tenant = await Tenant.create(data.tenant);
        console.log(`✅ Tenant créé: ${tenant.companyName} (ID: ${tenant._id})`);

        // 2. Créer l'UpperAdmin
        const upperAdminPassword = await bcrypt.hash(data.upperAdmin.password, 10);
        const upperAdmin = await User.create({
          firstName: data.upperAdmin.firstName,
          lastName: data.upperAdmin.lastName,
          email: data.upperAdmin.email,
          password: upperAdminPassword,
          role: "UpperAdmin",
          tenant_id: tenant._id,
          isActive: true,
        });
        console.log(
          `   👤 UpperAdmin: ${upperAdmin.firstName} ${upperAdmin.lastName} (${upperAdmin.email})`
        );

        // 3. Créer les utilisateurs supplémentaires
        for (const userData of data.users) {
          const userPassword = await bcrypt.hash(userData.password, 10);
          const user = await User.create({
            firstName: userData.firstName,
            lastName: userData.lastName,
            email: userData.email,
            password: userPassword,
            role: userData.role,
            tenant_id: tenant._id,
            isActive: true,
          });
          console.log(
            `   👤 ${user.role}: ${user.firstName} ${user.lastName} (${user.email})`
          );
        }

        // 4. Créer quelques communications de test pour ce tenant
        const sampleCommunications = [
          {
            subject: "Quarterly Business Review Meeting",
            content:
              "Hi team, let's schedule our quarterly review for next week. Please confirm your availability.",
            snippet: "Let's schedule our quarterly review for next week...",
            sender: { name: "Client A", email: "client.a@example.com" },
            source: "Outlook",
            externalId: `demo-${tenant._id}-001`,
            status: "To Validate",
            ai_analysis: {
              urgency: "Medium",
              sentiment: "Neutral",
            },
            tenant_id: tenant._id,
            receivedAt: new Date(),
            slaDueDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // +24h
          },
          {
            subject: "Urgent: Server Downtime",
            content:
              "Our main server experienced downtime this morning. Please investigate immediately.",
            snippet: "Our main server experienced downtime this morning...",
            sender: { name: "IT Support", email: "it@example.com" },
            source: "Outlook",
            externalId: `demo-${tenant._id}-002`,
            status: "Escalated",
            ai_analysis: {
              urgency: "High",
              sentiment: "Negative",
            },
            tenant_id: tenant._id,
            receivedAt: new Date(),
            slaDueDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // +24h
          },
          {
            subject: "New Project Proposal",
            content:
              "I have a new project proposal that I'd like to discuss. When can we meet?",
            snippet: "I have a new project proposal that I'd like to discuss...",
            sender: { name: "Client B", email: "client.b@example.com" },
            source: "Outlook",
            externalId: `demo-${tenant._id}-003`,
            status: "Closed",
            ai_analysis: {
              urgency: "Low",
              sentiment: "Positive",
            },
            tenant_id: tenant._id,
            receivedAt: new Date(),
            slaDueDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // +24h
            closedAt: new Date(),
          },
        ];

        for (const comm of sampleCommunications) {
          await Communication.create(comm);
        }
        console.log(`   📧 ${sampleCommunications.length} communications de test créées\n`);
      }

      console.log("✅ Toutes les données de démonstration ont été créées!");
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
