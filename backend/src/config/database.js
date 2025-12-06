const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    let mongoUri;
    const isProduction = process.env.NODE_ENV === "production";

    // -----------------------------------------------------------
    // CONFIGURATION STRICTEMENT ALIGNÉE SUR LE SCRIPT DE BUILD
    // -----------------------------------------------------------

    if (isProduction) {
      // === STRATÉGIE RENDER (PRODUCTION) ===
      // On utilise exactement les mêmes valeurs que dans buildDatabase.js
      const INTERNAL_HOST = "mongodb-o9gm"; // Hôte interne du service MongoDB
      const PORT = "27017";
      const DB_NAME = process.env.MONGO_DB;

      if (!DB_NAME) {
        throw new Error(
          "La variable d'environnement MONGO_DB est manquante pour la production."
        );
      }

      // Construction de l'URI SANS AUTHENTIFICATION
      mongoUri = `mongodb://${INTERNAL_HOST}:${PORT}/${DB_NAME}`;

      console.log(
        `📡 Configuration Production: Utilisation de l'hôte interne ${INTERNAL_HOST}`
      );
    } else {
      // === STRATÉGIE LOCALE (DÉVELOPPEMENT) ===
      // Permet de continuer à travailler en local sans casser le dev
      // Utilise MONGODB_URI si défini, sinon localhost
      mongoUri =
        process.env.MONGODB_URI ||
        "mongodb://localhost:27017/prototypedb_local";
    }

    // Options de connexion (Avec Timeout augmenté pour la robustesse)
    const options = {
      serverSelectionTimeoutMS: 30000, // 30 secondes pour trouver le serveur
      socketTimeoutMS: 45000,
      family: 4, // Force IPv4 (souvent nécessaire sur certains réseaux internes)
    };

    // Connexion à MongoDB
    const conn = await mongoose.connect(mongoUri, options);

    console.log(`\n${"=".repeat(50)}`);
    console.log(`✅ MongoDB connecté avec succès!`);
    console.log(
      `🌍 Mode: ${
        isProduction ? "PRODUCTION (Render Interne)" : "DÉVELOPPEMENT (Local)"
      }`
    );
    console.log(`📡 Host: ${conn.connection.host}`);
    console.log(`📦 Base de données: ${conn.connection.name}`);
    console.log(
      `🔒 État: ${conn.connection.readyState === 1 ? "Connecté" : "Déconnecté"}`
    );
    console.log(`${"=".repeat(50)}\n`);

    // Gestion des événements
    mongoose.connection.on("error", (err) => {
      console.error("❌ Erreur MongoDB:", err.message);
    });

    mongoose.connection.on("disconnected", () => {
      console.warn("⚠️  MongoDB déconnecté");
    });

    mongoose.connection.on("reconnected", () => {
      console.log("🔄 MongoDB reconnecté");
    });

    // Gestion de la fermeture propre
    process.on("SIGINT", async () => {
      await mongoose.connection.close();
      console.log("MongoDB déconnecté suite à l'arrêt de l'application");
      process.exit(0);
    });
  } catch (error) {
    console.error("\n❌ Erreur CRITIQUE de connexion MongoDB:");
    console.error("Message:", error.message);

    // Conseils de débogage spécifiques
    if (error.message.includes("buffering timed out")) {
      console.error(
        "\n💡 Conseil: Timeout atteint. Le service 'mongodb-o9gm' ne répond pas."
      );
      console.error(
        "   Vérifiez que le service MongoDB est bien 'Live' dans le dashboard Render."
      );
    } else if (error.message.includes("ECONNREFUSED")) {
      console.error("\n💡 Conseil: Connexion refusée. Vérifiez le port 27017.");
    }

    console.error("\n");
    // En production, on veut que le serveur redémarre si la DB ne se connecte pas
    process.exit(1);
  }
};

// Fonction de test simple
const testConnection = async () => {
  try {
    await connectDB();
    console.log("✅ Test de connexion réussi!");
    await mongoose.connection.close();
    return true;
  } catch (error) {
    console.error("❌ Test de connexion échoué");
    return false;
  }
};

module.exports = connectDB;
module.exports.testConnection = testConnection;
