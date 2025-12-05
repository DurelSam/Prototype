const mongoose = require("mongoose");

// CORRECTION CLÉ : Définition des variables pour simplifier la construction.
const USER = process.env.MONGO_USER;
const PASS = process.env.MONGO_PASS;
const HOST = process.env.MONGO_HOST;
const DB_NAME = process.env.MONGO_DB;

const connectDB = async () => {
  try {
    let mongoUri;
    let isUsingAuth; // Variable pour le log

    // -----------------------------------------------------------
    // LOGIQUE DE CONSTRUCTION DE L'URI (Adaptée à Render/Local)
    // -----------------------------------------------------------
    if (process.env.MONGODB_URI) {
      // Priorité 1: URI complète définie directement (cas général)
      mongoUri = process.env.MONGODB_URI;
      isUsingAuth = mongoUri.includes("@");
    } else if (!USER || !PASS) {
      // Priorité 2: Stratégie Render/Interne (Pas d'utilisateur/mot de passe)
      // Ceci gère les cas où MONGO_USER/MONGO_PASS ont été "delete" dans server.js
      if (!HOST || !DB_NAME) {
        throw new Error(
          "Les variables MONGO_HOST et MONGO_DB sont manquantes pour la connexion sans authentification."
        );
      }
      mongoUri = `mongodb://${HOST}:27017/${DB_NAME}`;
      isUsingAuth = false;
    } else {
      // Priorité 3: Stratégie avec Authentification (Local ou Externe)
      // Utilise MONGO_USER/MONGO_PASS si elles sont présentes
      mongoUri = `mongodb://${USER}:${encodeURIComponent(
        PASS
      )}@${HOST}:27017/${DB_NAME}?authSource=admin`;
      isUsingAuth = true;
    } // Options de connexion MongoDB

    const options = {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    }; // Connexion à MongoDB

    const conn = await mongoose.connect(mongoUri, options);

    console.log(`\n${"=".repeat(50)}`);
    console.log(`✅ MongoDB connecté avec succès!`);
    console.log(
      `🌍 Mode: ${
        isUsingAuth ? "AUTHENTIFIÉ" : "NON-AUTHENTIFIÉ (Interne/Local)"
      }`
    );
    console.log(`📡 Host: ${conn.connection.host}`);
    console.log(`📦 Base de données: ${conn.connection.name}`);
    console.log(
      `🔒 État: ${conn.connection.readyState === 1 ? "Connecté" : "Déconnecté"}`
    );
    console.log(`${"=".repeat(50)}\n`); // Gestion des événements de connexion

    // ... (Reste inchangé) ...
    mongoose.connection.on("error", (err) => {
      console.error("❌ Erreur MongoDB:", err.message);
    });

    mongoose.connection.on("disconnected", () => {
      console.warn(
        `⚠️  MongoDB déconnecté (${isUsingAuth ? "Auth" : "No Auth"})`
      );
    });

    mongoose.connection.on("reconnected", () => {
      console.log(
        `🔄 MongoDB reconnecté (${isUsingAuth ? "Auth" : "No Auth"})`
      );
    }); // Gestion de la fermeture propre

    process.on("SIGINT", async () => {
      await mongoose.connection.close();
      console.log("MongoDB déconnecté suite à l'arrêt de l'application");
      process.exit(0);
    });
  } catch (error) {
    console.error("\n❌ Erreur de connexion MongoDB:");
    console.error("Message:", error.message); // Messages d'aide mis à jour pour être plus génériques

    if (error.message.includes("ECONNREFUSED")) {
      console.error(
        "\n💡 Conseil: Le serveur MongoDB est inaccessible (Host/Port/Firewall)."
      );
      console.error("   Hôte configuré: " + HOST);
    } else if (
      error.message.includes("authentication") ||
      error.message.includes("Authentication")
    ) {
      console.error(
        "\n💡 Conseil: Erreur d'authentification. Vérifiez les identifiants ou le paramètre ?authSource."
      );
      console.error(
        "   Mode de connexion: " +
          (isUsingAuth ? "Authentifié" : "Non-Authentifié (inattendu)")
      );
    } else if (error.message.includes("ENOTFOUND")) {
      console.error(
        "\n💡 Conseil: Hôte MongoDB introuvable (Problème de DNS/Nom de service)."
      );
      console.error("   Hôte configuré: " + HOST);
    }

    console.error("\n");
    process.exit(1);
  }
};

// ... (Reste inchangé) ...
module.exports = connectDB;
