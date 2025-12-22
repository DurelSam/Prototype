
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Communication = require('../src/models/Communication');
const connectDB = require('../src/config/database');

const resetQuestions = async () => {
  try {
    await connectDB();
    console.log('✅ Connecté à MongoDB');

    // Critères : Emails en attente de réponse assistée
    const filter = {
      // awaitingUserInput: true, // Optionnel : on peut viser plus large
      'aiGeneratedQuestions.0': { $exists: true } // Emails qui ont des questions
    };

    console.log('🔄 Recherche des emails avec questions existantes...');
    
    const result = await Communication.updateMany(
      filter,
      { 
        $set: { aiGeneratedQuestions: [] }, // Vider le tableau
        // $unset: { aiGeneratedQuestions: 1 } // Alternative : supprimer le champ
      }
    );

    console.log(`✅ Réinitialisation terminée.`);
    console.log(`📊 ${result.modifiedCount} emails mis à jour (questions effacées).`);
    console.log(`ℹ️  Au prochain clic sur "Continuer", les questions seront régénérées.`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
};

resetQuestions();
