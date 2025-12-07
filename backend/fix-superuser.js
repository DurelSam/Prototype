const mongoose = require('mongoose');
const User = require('./src/models/User');
const Tenant = require('./src/models/Tenant');
const Communication = require('./src/models/Communication');

async function fixSuperUser() {
  try {
    await mongoose.connect('mongodb://localhost:27017/prototypedb');

    // 1. Trouver le SuperUser
    const superUser = await User.findOne({ email: 'durelsam157@gmail.com' });

    if (!superUser) {
      console.log('❌ SuperUser non trouvé');
      process.exit(1);
    }

    console.log('👤 SuperUser trouvé:', superUser.email);

    // 2. Créer un tenant pour le SuperUser
    const tenant = await Tenant.create({
      companyName: 'Administration Principale',
      subscriptionStatus: 'Active',
      subscriptionPlan: 'Enterprise'
    });

    console.log('✅ Tenant créé:', tenant._id);

    // 3. Assigner le tenant au SuperUser
    superUser.tenant_id = tenant._id;
    await superUser.save();

    console.log('✅ SuperUser mis à jour avec le tenant_id');

    // 4. Copier les communications de l'autre utilisateur vers ce tenant
    const otherUser = await User.findOne({ email: 'durelzanfack@gmail.com' });

    if (otherUser && otherUser.tenant_id) {
      const communications = await Communication.find({ tenant_id: otherUser.tenant_id });

      console.log(`\n📧 ${communications.length} communications trouvées`);
      console.log('📋 Copie des communications vers le nouveau tenant...');

      for (const comm of communications) {
        await Communication.create({
          tenant_id: tenant._id,
          source: comm.source,
          externalId: comm.externalId + '_copy', // Pour éviter les doublons
          sender: comm.sender,
          recipient: comm.recipient,
          subject: comm.subject,
          snippet: comm.snippet,
          content: comm.content,
          isRead: comm.isRead,
          attachments: comm.attachments,
          ai_analysis: comm.ai_analysis,
          status: comm.status,
          receivedAt: comm.receivedAt,
          slaDueDate: comm.slaDueDate,
          metadata: comm.metadata,
          assignedTo: superUser._id
        });
      }

      console.log(`✅ ${communications.length} communications copiées`);
    }

    await mongoose.connection.close();
    console.log('\n✅ Correction terminée! Rafraîchissez la page web.');
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    await mongoose.connection.close();
    process.exit(1);
  }
}

fixSuperUser();
