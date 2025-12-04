require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./src/config/database");

const app = express();

// Connexion à la base de données
connectDB();

// Middlewares
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Route de test du serveur
app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    message: "Serveur SaaS Multi-tenant opérationnel",
    timestamp: new Date().toISOString(),
  });
});

// Route de test de la connexion MongoDB
app.get("/api/test-db", async (req, res) => {
  const mongoose = require("mongoose");

  try {
    // Vérifier l'état de la connexion
    const dbState = mongoose.connection.readyState;
    const states = {
      0: "Déconnecté",
      1: "Connecté",
      2: "En cours de connexion",
      3: "En cours de déconnexion",
    };

    if (dbState !== 1) {
      return res.status(503).json({
        success: false,
        message: "Base de données non connectée",
        state: states[dbState],
      });
    }

    // Test rapide d'écriture/lecture
    const models = require("./src/models");
    const testData = {
      companyName: "Test-DB-Check-" + Date.now(),
      subscriptionStatus: "Trial",
    };

    const startTime = Date.now();
    const testDoc = await models.Tenant.create(testData);
    const foundDoc = await models.Tenant.findById(testDoc._id);
    await models.Tenant.deleteOne({ _id: testDoc._id });
    const responseTime = Date.now() - startTime;

    res.status(200).json({
      success: true,
      message: "Connexion MongoDB Local réussie",
      database: {
        host: mongoose.connection.host,
        name: mongoose.connection.name,
        state: states[dbState],
        collections: Object.keys(mongoose.connection.collections).length,
      },
      test: {
        created: !!testDoc,
        read: !!foundDoc,
        deleted: true,
        responseTime: `${responseTime}ms`,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Erreur test DB:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors du test de la base de données",
      error: error.message,
    });
  }
});

// Routes API
app.use('/api/auth', require('./src/routes/authRoutes'));
// app.use('/api/tenants', require('./src/routes/tenantRoutes'));
// app.use('/api/communications', require('./src/routes/communicationRoutes'));

// Gestion des erreurs 404
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route non trouvée",
  });
});

// Gestion globale des erreurs
app.use((err, req, res, next) => {
  console.error("Erreur:", err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Erreur serveur interne",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Serveur démarré sur le port ${PORT}`);
  console.log(`📡 Environnement: ${process.env.NODE_ENV}`);
  console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL}`);
});

module.exports = app;
