
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const connectDB = require('../src/config/database');
const Communication = require('../src/models/Communication');
const User = require('../src/models/User');

const debugPrecise = async () => {
  try {
    await connectDB();
    console.log('✅ Connecté à MongoDB');

    // 1. Récupérer l'utilisateur
    const email = 'durelzanfack@gmail.com';
    const user = await User.findOne({ email });

    if (!user) {
      console.log('❌ Utilisateur introuvable !');
      process.exit(1);
    }
    console.log(`👤 Utilisateur trouvé: ${user.firstName} ${user.lastName} (${user.role})`);
    console.log(`   ID: ${user._id}`);
    console.log(`   Tenant ID: ${user.tenant_id}`);

    // 2. Construire le filtre de base (UpperAdmin = Tenant ID)
    let filter = { tenant_id: user.tenant_id };
    console.log('🔍 Filtre de base (RBAC UpperAdmin):', filter);

    // 3. Compter TOTAL pour ce filtre
    const total = await Communication.countDocuments(filter);
    console.log(`📊 Total communications pour ce tenant: ${total}`);

    // 4. Analyser les status
    const statusStats = await Communication.aggregate([
      { $match: filter },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    console.log('📊 Status Breakdown:', statusStats);

    // 5. Analyser les sources (Attention à la casse !)
    const sourceStats = await Communication.aggregate([
      { $match: filter },
      { $group: { _id: '$source', count: { $sum: 1 } } }
    ]);
    console.log('📊 Source Breakdown:', sourceStats);

    // 6. Test du filtre "Processed" exact
    const processedFilter = {
      ...filter,
      $or: [
        { hasBeenReplied: true },
        { status: { $in: ['Validated', 'Closed', 'Archived'] } },
      ],
      source: { $ne: 'whatsapp' }
    };
    
    console.log('🔍 Filtre Processed Final:', JSON.stringify(processedFilter, null, 2));

    const processedCount = await Communication.countDocuments(processedFilter);
    console.log(`❌ RÉSULTAT FINAL (Emails Processed): ${processedCount}`);

    // 7. Si 0, essayons de voir pourquoi
    if (processedCount === 0) {
        console.log('⚠️  Analyse des échecs :');
        
        // Est-ce à cause de la source ?
        const processedWithoutSource = await Communication.countDocuments({
            ...filter,
             $or: [
                { hasBeenReplied: true },
                { status: { $in: ['Validated', 'Closed', 'Archived'] } },
            ]
        });
        console.log(`   -> Sans filtre source: ${processedWithoutSource}`);

        // Est-ce à cause du status ?
        const validStatusCount = await Communication.countDocuments({
             ...filter,
             status: { $in: ['Validated', 'Closed', 'Archived'] } 
        });
        console.log(`   -> Juste Status Validated/Closed/Archived: ${validStatusCount}`);
        
        const repliedCount = await Communication.countDocuments({
             ...filter,
             hasBeenReplied: true
        });
        console.log(`   -> Juste hasBeenReplied=true: ${repliedCount}`);
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
};

debugPrecise();
