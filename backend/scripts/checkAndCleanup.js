require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/User');
const Tenant = require('../src/models/Tenant');
const Communication = require('../src/models/Communication');
const connectDB = require('../src/config/database');

const checkAndCleanup = async () => {
  try {
    await connectDB();

    console.log("\n🔍 Analyse des données existantes...");

    // 1. Chercher le tenant "Di"
    const diTenant = await Tenant.findOne({ companyName: "Di" });
    if (diTenant) {
      console.log(`✅ Tenant 'Di' trouvé (ID: ${diTenant._id})`);
    } else {
      console.log("❌ Tenant 'Di' NON trouvé.");
    }

    // 2. Chercher l'utilisateur durelzanfack@gmail.com
    const users = await User.find({ email: "durelzanfack@gmail.com" }).populate('tenant_id');
    console.log(`🔎 ${users.length} utilisateur(s) trouvé(s) avec l'email durelzanfack@gmail.com :`);
    
    users.forEach(u => {
      console.log(`   - ID: ${u._id}, Role: ${u.role}, Tenant: ${u.tenant_id?.companyName} (${u.tenant_id?._id})`);
    });

    // 3. Nettoyage du faux tenant "Durel Corp" et de ses données
    const durelCorp = await Tenant.findOne({ companyName: "Durel Corp" });
    if (durelCorp) {
      console.log(`\n🗑️ Suppression du tenant 'Durel Corp' (${durelCorp._id}) et de ses données...`);
      
      // Supprimer les communications liées
      const deletedComms = await Communication.deleteMany({ tenant_id: durelCorp._id });
      console.log(`   - ${deletedComms.deletedCount} communications supprimées.`);

      // Supprimer les utilisateurs liés (sauf s'ils sont liés à d'autres tenants, mais email unique donc ok)
      const deletedUsers = await User.deleteMany({ tenant_id: durelCorp._id });
      console.log(`   - ${deletedUsers.deletedCount} utilisateurs supprimés.`);

      // Supprimer le tenant
      await Tenant.findByIdAndDelete(durelCorp._id);
      console.log("   - Tenant 'Durel Corp' supprimé.");
    } else {
      console.log("\nℹ️ Pas de tenant 'Durel Corp' à nettoyer.");
    }

    process.exit(0);
  } catch (error) {
    console.error("❌ Erreur:", error);
    process.exit(1);
  }
};

checkAndCleanup();