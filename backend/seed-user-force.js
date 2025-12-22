require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');
const Tenant = require('./src/models/Tenant');
const connectDB = require('./src/config/database');

const forceCreateUser = async () => {
  try {
    await connectDB();

    const email = "durelzanfack@gmail.com";
    
    // 1. Créer ou récupérer le Tenant
    let tenant = await Tenant.findOne({ companyName: "Durel Corp" });
    if (!tenant) {
      tenant = await Tenant.create({
        companyName: "Durel Corp",
        subscriptionStatus: "Active",
        isActive: true
      });
      console.log("✅ Tenant 'Durel Corp' créé");
    }

    // 2. Vérifier si l'utilisateur existe déjà
    let user = await User.findOne({ email });
    
    if (user) {
      console.log(`ℹ️ L'utilisateur ${email} existe déjà.`);
      // S'assurer qu'il est UpperAdmin
      if (user.role !== 'UpperAdmin') {
        user.role = 'UpperAdmin';
        await user.save();
        console.log("🔄 Rôle mis à jour vers UpperAdmin");
      }
    } else {
      // 3. Créer l'utilisateur
      user = await User.create({
        email,
        password: "$2b$10$EpIxT.s.s/s.s.s.s.s.s.s.s.s.s.s.s.s.s.s.s.s.s.s.s", // Dummy hash
        role: "UpperAdmin",
        firstName: "Durel",
        lastName: "Zanfack",
        tenant_id: tenant._id,
        isActive: true,
        hasConfiguredEmail: true,
        activeEmailProvider: "outlook",
        emailVerified: true
      });
      console.log(`✅ Utilisateur ${email} créé avec succès !`);
    }

    process.exit(0);
  } catch (error) {
    console.error("❌ Erreur:", error);
    process.exit(1);
  }
};

forceCreateUser();