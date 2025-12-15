const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/prototypedb')
  .then(async () => {
    console.log('✅ Connecté à MongoDB\n');

    // Compter les communications orphelines
    const orphanCount = await mongoose.connection.db.collection('communications').countDocuments({
      source: 'imap_smtp',
      $or: [
        { userId: { $exists: false } },
        { userId: null }
      ]
    });

    // Total IMAP/SMTP
    const totalImap = await mongoose.connection.db.collection('communications').countDocuments({
      source: 'imap_smtp'
    });

    // Total toutes communications
    const totalAll = await mongoose.connection.db.collection('communications').countDocuments();

    console.log('📊 STATISTIQUES:');
    console.log('─────────────────────────────────────────');
    console.log(`Total communications (toutes sources): ${totalAll}`);
    console.log(`Total IMAP/SMTP: ${totalImap}`);
    console.log(`🚨 Communications ORPHELINES (sans userId): ${orphanCount}`);
    console.log(`✅ Communications avec userId: ${totalImap - orphanCount}\n`);

    if (orphanCount > 0) {
      console.log('⚠️  PROBLÈME DÉTECTÉ:');
      console.log(`   ${orphanCount} emails sont invisibles car ils n'ont pas de userId.`);
      console.log('\n💡 SOLUTION:');
      console.log('   Option 1: Supprimer ces emails et re-synchroniser');
      console.log('   Option 2: Assigner un userId via script de migration\n');
    } else {
      console.log('✅ Aucune communication orpheline détectée!\n');
    }

    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Erreur:', err.message);
    process.exit(1);
  });
