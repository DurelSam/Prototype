const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/prototypedb')
  .then(async () => {
    const user = await mongoose.connection.db.collection('users').findOne({
      email: 'durelzanfack@gmail.com'
    });

    console.log('📊 ÉTAT DE LA SYNCHRONISATION:');
    console.log('');
    console.log('👤 User:', user.email);
    console.log('   hasConfiguredEmail:', user.hasConfiguredEmail);
    console.log('   activeEmailProvider:', user.activeEmailProvider);
    console.log('');

    if (user.imapSmtpConfig) {
      console.log('📧 IMAP/SMTP Config:');
      console.log('   Email:', user.imapSmtpConfig.email || 'NULL');
      console.log('   Provider:', user.imapSmtpConfig.providerName || 'NULL');
      console.log('   isConnected:', user.imapSmtpConfig.isConnected || false);
      console.log('   lastSyncDate:', user.imapSmtpConfig.lastSyncDate || 'Never');
    } else {
      console.log('📧 IMAP/SMTP Config: NULL');
    }

    console.log('');

    const count = await mongoose.connection.db.collection('communications').countDocuments({
      userId: user._id
    });

    console.log('📬 Communications dans la DB:', count);

    if (count > 0) {
      const sample = await mongoose.connection.db.collection('communications').find({
        userId: user._id
      }).limit(3).toArray();

      console.log('');
      console.log('📨 Exemples (3 premiers):');
      sample.forEach((c, i) => {
        console.log(`  ${i+1}. Source: ${c.source}, Subject: ${c.subject?.substring(0, 50) || '(No subject)'}`);
        console.log(`     Status: ${c.status}, Created: ${c.createdAt}`);
      });
    }

    console.log('');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Erreur:', err.message);
    process.exit(1);
  });
