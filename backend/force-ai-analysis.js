/**
 * Script pour forcer l'analyse IA Grok sur tous les emails existants
 * sans analyse IA (ou avec analyse "Pending")
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Communication = require('./src/models/Communication');
const grokService = require('./src/services/grokService');

// Connexion MongoDB
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/prototypedb';
    await mongoose.connect(mongoURI);
    console.log('✅ Connexion MongoDB réussie');
  } catch (error) {
    console.error('❌ Erreur connexion MongoDB:', error);
    process.exit(1);
  }
};

/**
 * Analyser un email avec Grok
 */
async function analyzeEmail(communication) {
  try {
    console.log(`\n🤖 Analyse de: ${communication.subject?.substring(0, 50)}...`);
    console.log(`   ID: ${communication._id}`);
    console.log(`   De: ${communication.sender?.email}`);
    console.log(`   Date: ${communication.receivedAt}`);

    const analysis = await grokService.analyzeCommunication({
      subject: communication.subject || '(No Subject)',
      content: communication.content || '',
      sender: communication.sender,
    });

    console.log(`   ✅ Analyse reçue:`, {
      sentiment: analysis.sentiment,
      urgency: analysis.urgency,
      summaryLength: analysis.summary?.length || 0,
    });

    // Mettre à jour la communication avec l'analyse
    const updated = await Communication.findByIdAndUpdate(
      communication._id,
      {
        'ai_analysis.summary': analysis.summary,
        'ai_analysis.sentiment': analysis.sentiment,
        'ai_analysis.urgency': analysis.urgency,
        'ai_analysis.suggestedAction': analysis.actionItems?.join('; ') || '',
        'ai_analysis.category': analysis.entities?.join(', ') || 'General',
        'ai_analysis.processedAt': new Date(),
      },
      { new: true }
    );

    if (updated) {
      console.log(`   ✅ Analyse sauvegardée dans la DB`);
      return { success: true, id: communication._id };
    } else {
      console.error(`   ❌ Communication non trouvée pour mise à jour`);
      return { success: false, id: communication._id, error: 'Not found' };
    }
  } catch (error) {
    console.error(`   ❌ Erreur analyse:`, error.message);
    return { success: false, id: communication._id, error: error.message };
  }
}

/**
 * Script principal
 */
async function main() {
  console.log('🚀 Démarrage du script de ré-analyse IA\n');

  await connectDB();

  // Trouver tous les emails IMAP/SMTP sans analyse IA ou avec analyse "Pending"
  const emailsToAnalyze = await Communication.find({
    source: 'imap_smtp',
    $or: [
      { 'ai_analysis.processedAt': { $exists: false } },
      { 'ai_analysis.processedAt': null },
      { 'ai_analysis.sentiment': 'Pending' },
    ],
  }).sort({ receivedAt: -1 }); // Plus récents d'abord

  console.log(`📊 ${emailsToAnalyze.length} email(s) sans analyse IA trouvé(s)\n`);

  if (emailsToAnalyze.length === 0) {
    console.log('✅ Tous les emails ont déjà une analyse IA!');
    console.log('\n💡 Pour re-forcer l\'analyse de TOUS les emails, modifiez le filtre dans le script.\n');
    process.exit(0);
  }

  // Demander confirmation
  console.log('⚠️  Ce script va analyser tous ces emails avec Grok API');
  console.log(`   Nombre d'appels API: ${emailsToAnalyze.length}`);
  console.log(`   Coût estimé: ~${(emailsToAnalyze.length * 0.01).toFixed(2)} USD (selon tarif Grok)\n`);

  // Attendre 5 secondes pour annuler si nécessaire
  console.log('⏱️  Démarrage dans 5 secondes (Ctrl+C pour annuler)...\n');
  await new Promise(resolve => setTimeout(resolve, 5000));

  console.log('🔄 Début de l\'analyse...\n');
  console.log('='.repeat(70));

  const results = {
    success: 0,
    failed: 0,
    errors: [],
  };

  // Analyser chaque email avec un délai pour éviter le rate limiting
  for (let i = 0; i < emailsToAnalyze.length; i++) {
    const email = emailsToAnalyze[i];

    console.log(`\n[${i + 1}/${emailsToAnalyze.length}]`);

    const result = await analyzeEmail(email);

    if (result.success) {
      results.success++;
    } else {
      results.failed++;
      results.errors.push({
        id: result.id,
        error: result.error,
      });
    }

    // Délai de 1.5 secondes entre chaque appel pour éviter le rate limiting
    if (i < emailsToAnalyze.length - 1) {
      console.log(`   ⏳ Pause 1.5s avant le prochain...`);
      await new Promise(resolve => setTimeout(resolve, 1500));
    }
  }

  console.log('\n' + '='.repeat(70));
  console.log('\n📊 RÉSUMÉ FINAL');
  console.log('='.repeat(70));
  console.log(`✅ Réussies: ${results.success}`);
  console.log(`❌ Échouées: ${results.failed}`);

  if (results.errors.length > 0) {
    console.log('\n❌ Erreurs détaillées:');
    results.errors.forEach((err, idx) => {
      console.log(`   ${idx + 1}. ID: ${err.id} - ${err.error}`);
    });
  }

  console.log('\n✅ Script terminé!');

  // Fermer la connexion MongoDB
  await mongoose.connection.close();
  process.exit(0);
}

// Lancer le script
main().catch((error) => {
  console.error('❌ Erreur fatale:', error);
  process.exit(1);
});
