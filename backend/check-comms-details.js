const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/prototypedb')
  .then(async () => {
    console.log('✅ Connecté à MongoDB\n');

    // Récupérer toutes les communications avec leurs userId
    const comms = await mongoose.connection.db.collection('communications').find({
      source: 'imap_smtp'
    }).toArray();

    console.log(`📊 ${comms.length} communications IMAP/SMTP trouvées\n`);

    // Grouper par userId
    const byUser = {};
    for (const comm of comms) {
      const userId = comm.userId ? comm.userId.toString() : 'NULL';
      if (!byUser[userId]) {
        byUser[userId] = [];
      }
      byUser[userId].push(comm);
    }

    console.log('👥 RÉPARTITION PAR UTILISATEUR:');
    console.log('─────────────────────────────────────────');

    for (const [userId, userComms] of Object.entries(byUser)) {
      if (userId === 'NULL') {
        console.log(`⚠️  Sans userId: ${userComms.length} communications`);
      } else {
        // Récupérer le user
        const user = await mongoose.connection.db.collection('users').findOne({
          _id: new mongoose.Types.ObjectId(userId)
        });

        console.log(`\n👤 User: ${user?.email || 'Unknown'} (${user?.role || 'Unknown'})`);
        console.log(`   ID: ${userId}`);
        console.log(`   Tenant: ${user?.tenant_id || 'N/A'}`);
        console.log(`   📧 ${userComms.length} communications`);
        console.log(`   Subjects: ${userComms.slice(0, 3).map(c => c.subject?.substring(0, 40) || '(No subject)').join(', ')}...`);
      }
    }

    console.log('\n');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Erreur:', err.message);
    process.exit(1);
  });
