
require('dotenv').config();
const mongoose = require('mongoose');

// Schéma minimal pour lire la collection
const CommunicationSchema = new mongoose.Schema({}, { strict: false });
const Communication = mongoose.model('Communication', CommunicationSchema);

async function checkData() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/prototypedb');
    console.log('Connected to MongoDB');

    const comms = await Communication.find({ 
      'ai_analysis.urgency': { $in: ['High', 'Critical'] } 
    }, { 
      'ai_analysis.urgency': 1, 
      'ai_analysis.requiresResponse': 1,
      'status': 1,
      'hasAutoResponse': 1,
      'manualResponse': 1
    }).limit(10);
    console.log('High/Critical emails:', JSON.stringify(comms, null, 2));

    await mongoose.disconnect();
  } catch (error) {
    console.error(error);
  }
}

checkData();
