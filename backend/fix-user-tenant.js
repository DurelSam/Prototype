const mongoose = require('mongoose');
const User = require('./src/models/User');
const Tenant = require('./src/models/Tenant');

async function checkUser() {
  try {
    await mongoose.connect('mongodb://localhost:27017/prototypedb');

    const user = await User.findOne({ email: 'durelzanfack@gmail.com' });

    if (!user) {
      console.log('❌ Utilisateur non trouvé');
      process.exit(1);
    }

    console.log('👤 Utilisateur trouvé:');
    console.log('   Email:', user.email);
    console.log('   Role:', user.role);
    console.log('   Tenant ID:', user.tenant_id || 'AUCUN ❌');
    console.log('   Outlook connecté:', user.outlookConfig?.isConnected);

    if (!user.tenant_id) {
      console.log('\n⚠️  L\'utilisateur n\'a pas de tenant_id!');
      console.log('🔧 Création d\'un tenant...');

      const tenant = await Tenant.create({
        companyName: 'Mon Entreprise',
        subscriptionStatus: 'Active',
        subscriptionPlan: 'Pro'
      });

      user.tenant_id = tenant._id;
      await user.save();

      console.log('✅ Tenant créé:', tenant._id);
      console.log('✅ Utilisateur mis à jour avec le tenant_id');
    } else {
      console.log('\n✅ L\'utilisateur a déjà un tenant_id');
    }

    await mongoose.connection.close();
    console.log('\n✅ Vérification terminée');
  } catch (error) {
    console.error('Erreur:', error.message);
    await mongoose.connection.close();
    process.exit(1);
  }
}

checkUser();
