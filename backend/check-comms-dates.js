const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/prototypedb')
  .then(async () => {
    console.log('✅ Connecté à MongoDB\n');

    // Récupérer les 5 premières communications (plus anciennes)
    const oldest = await mongoose.connection.db.collection('communications').find({
      source: 'imap_smtp'
    }).sort({ createdAt: 1 }).limit(5).toArray();

    console.log('📅 FIRST 5 COMMUNICATIONS (OLDEST):');
    oldest.forEach((c, i) => {
      console.log(`${i+1}. Created: ${c.createdAt}`);
      console.log(`   Subject: ${c.subject?.substring(0, 60) || '(No subject)'}`);
    });

    console.log('\n');

    // Récupérer les 5 dernières communications (plus récentes)
    const newest = await mongoose.connection.db.collection('communications').find({
      source: 'imap_smtp'
    }).sort({ createdAt: -1 }).limit(5).toArray();

    console.log('📅 LAST 5 COMMUNICATIONS (NEWEST):');
    newest.forEach((c, i) => {
      console.log(`${i+1}. Created: ${c.createdAt}`);
      console.log(`   Subject: ${c.subject?.substring(0, 60) || '(No subject)'}`);
    });

    console.log('\n');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Erreur:', err.message);
    process.exit(1);
  });
