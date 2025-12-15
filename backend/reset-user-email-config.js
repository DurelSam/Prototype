const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/prototypedb')
  .then(async () => {
    console.log('✅ Connexion MongoDB\n');

    // Réinitialiser le flag hasConfiguredEmail pour l'utilisateur
    const result = await mongoose.connection.db.collection('users').updateOne(
      { email: 'durelzanfack@gmail.com' },
      {
        $set: {
          hasConfiguredEmail: false
        }
      }
    );

    console.log('📝 Réinitialisation du flag hasConfiguredEmail');
    console.log('   Matched:', result.matchedCount);
    console.log('   Modified:', result.modifiedCount);
    console.log('\n✅ Votre compte a été réinitialisé.');
    console.log('👉 Veuillez reconfigurer votre email sur /integrations\n');

    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Erreur:', err.message);
    process.exit(1);
  });
