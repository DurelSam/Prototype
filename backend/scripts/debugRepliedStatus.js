require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../src/config/database');
const User = require('../src/models/User');
const Communication = require('../src/models/Communication');

(async () => {
  try {
    await connectDB();
    const email = 'durelzanfack@gmail.com';
    const user = await User.findOne({ email }).select('_id tenant_id email');
    if (!user) {
      console.log('Utilisateur non trouvé:', email);
      process.exit(0);
    }
    const base = { tenant_id: user.tenant_id };
    const replied = await Communication.countDocuments({
      ...base,
      $or: [{ hasBeenReplied: true }, { hasAutoResponse: true }, { 'manualResponse.sent': true }],
    });
    const notReplied = await Communication.countDocuments({
      ...base,
      hasAutoResponse: false,
      'manualResponse.sent': { $ne: true },
    });
    const total = await Communication.countDocuments(base);
    console.log('Tenant:', user.tenant_id.toString());
    console.log('Total communications:', total);
    console.log('Replied or AutoResponse:', replied);
    console.log('Not replied:', notReplied);
    // Show a few IDs to verify
    const sample = await Communication.find({
      ...base,
      $or: [{ hasBeenReplied: true }, { hasAutoResponse: true }, { 'manualResponse.sent': true }],
    }).select('_id subject hasAutoResponse hasBeenReplied manualResponse.sent source').limit(5).lean();
    console.log('Sample replied:', sample);
    process.exit(0);
  } catch (e) {
    console.error('Erreur debug:', e);
    process.exit(1);
  }
})();
