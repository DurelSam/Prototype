
require('dotenv').config();
const mongoose = require('mongoose');

// Modèle minimal
const CommunicationSchema = new mongoose.Schema({}, { strict: false });
const Communication = mongoose.model('Communication', CommunicationSchema);

async function reanalyzeUrgentEmailsLocally() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/prototypedb');
    console.log('Connected to MongoDB');

    // Récupérer TOUS les emails pour réappliquer une logique saine
    const allComms = await Communication.find({});
    console.log(`Processing ${allComms.length} emails...`);

    for (const comm of allComms) {
      const subject = (comm.subject || '').toLowerCase();
      const content = (comm.content || comm.snippet || '').toLowerCase();
      const sender = (comm.sender?.email || '').toLowerCase();

      let urgency = 'Medium';
      let requiresResponse = false;

      // 1. Détection Urgence
      if (subject.includes('urgent') || subject.includes('critical') || subject.includes('security alert') || subject.includes('failed')) {
        urgency = 'Critical';
      } else if (subject.includes('important') || subject.includes('action needed') || subject.includes('attention')) {
        urgency = 'High';
      } else if (subject.includes('newsletter') || subject.includes('promotion') || subject.includes('deal')) {
        urgency = 'Low';
      }

      // 2. Détection Réponse Requise
      const isAuto = sender.includes('no-reply') || sender.includes('noreply') || sender.includes('newsletter') || sender.includes('alert') || sender.includes('notification');
      
      if (!isAuto && (urgency === 'High' || urgency === 'Critical')) {
        requiresResponse = true;
      }
      
      if (subject.includes('?')) {
        requiresResponse = true;
      }

      // Force update pour les tests
      if (urgency === 'Critical' || urgency === 'High') {
         // Si c'est urgent, on suppose qu'il faut regarder, donc needsReply=true pour le filtre UI
         // Sauf si c'est vraiment une notif système pure
         if (!sender.includes('noreply')) {
             requiresResponse = true;
         }
      }

      // Update DB
      if (comm.ai_analysis) {
        comm.ai_analysis.urgency = urgency;
        comm.ai_analysis.requiresResponse = requiresResponse;
      } else {
        comm.ai_analysis = {
            urgency,
            requiresResponse,
            sentiment: 'Neutral',
            summary: comm.snippet || 'No summary'
        };
      }

      await comm.save();
      // console.log(`Updated: ${comm.subject.substring(0,30)} -> ${urgency} / Reply: ${requiresResponse}`);
    }

    console.log('Done updating emails locally.');
    await mongoose.disconnect();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

reanalyzeUrgentEmailsLocally();
