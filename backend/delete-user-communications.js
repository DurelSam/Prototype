const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/prototypedb')
  .then(async () => {
    console.log('✅ Connexion MongoDB\n');

    // Trouver l'utilisateur
    const user = await mongoose.connection.db.collection('users').findOne({
      email: 'durelzanfack@gmail.com'
    });

    if (!user) {
      console.error('❌ Utilisateur non trouvé');
      process.exit(1);
    }

    console.log('👤 Utilisateur trouvé:');
    console.log('   Email:', user.email);
    console.log('   ID:', user._id);
    console.log('   Role:', user.role);
    console.log('');

    // Compter les communications avant suppression
    const countBefore = await mongoose.connection.db.collection('communications').countDocuments({
      userId: user._id
    });

    console.log(`📊 Communications trouvées: ${countBefore}`);
    console.log('');

    if (countBefore === 0) {
      console.log('ℹ️  Aucune communication à supprimer');
      process.exit(0);
    }

    // Supprimer toutes les communications
    const result = await mongoose.connection.db.collection('communications').deleteMany({
      userId: user._id
    });

    console.log('🗑️  SUPPRESSION EFFECTUÉE');
    console.log('   Communications supprimées:', result.deletedCount);
    console.log('');
    console.log('✅ Base de données nettoyée pour', user.email);
    console.log('');

    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Erreur:', err.message);
    process.exit(1);
  });
