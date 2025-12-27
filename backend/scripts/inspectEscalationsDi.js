require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/User');
const Tenant = require('../src/models/Tenant');
const Communication = require('../src/models/Communication');

async function run() {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/prototypedb';
    console.log('Using URI:', uri);
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 20000, family: 4 });
    console.log('Connected DB:', mongoose.connection.name);

    const tenant = await Tenant.findOne({ companyName: /Di/i });
    console.log('Tenant Di:', tenant && { id: tenant._id, name: tenant.companyName });

    if (!tenant) {
      console.log('No tenant Di found');
      await mongoose.disconnect();
      return;
    }

    const upper = await User.findOne({
      tenant_id: tenant._id,
      email: 'durelzanfack@gmail.com',
    });
    console.log(
      'UpperAdmin:',
      upper && { id: upper._id, email: upper.email, role: upper.role }
    );

    if (!upper) {
      console.log('No such upper admin for this tenant');
      await mongoose.disconnect();
      return;
    }

    const commsToUpper = await Communication.find({
      tenant_id: tenant._id,
      userId: upper._id,
      'escalationHistory.role': 'Admin',
    })
      .select('subject userId escalationHistory slaDueDate status ai_analysis')
      .lean();

    console.log(
      '\nComms currently owned by this UpperAdmin with Admin escalation:',
      commsToUpper.length
    );
    console.log(JSON.stringify(commsToUpper, null, 2));

    const commsAnyEsc = await Communication.find({
      tenant_id: tenant._id,
      escalationHistory: { $exists: true, $not: { $size: 0 } },
    })
      .select('subject userId escalationHistory slaDueDate status ai_analysis')
      .limit(20)
      .lean();

    console.log(
      '\nSample escalated comms for tenant Di (any owner):',
      commsAnyEsc.length
    );
    console.log(JSON.stringify(commsAnyEsc, null, 2));

    await mongoose.disconnect();
  } catch (err) {
    console.error('Error inspecting DB:', err);
    try {
      await mongoose.disconnect();
    } catch (e) {}
    process.exit(1);
  }
}

run();

