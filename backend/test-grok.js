/**
 * Script de Test pour Grok AI
 * Teste la connexion et l'analyse d'un email test
 */

require('dotenv').config();
const grokService = require('./src/services/grokService');

async function testGrok() {
  console.log('\n🧪 ========== TEST GROK AI ==========\n');

  // Test 1: Connexion
  console.log('📡 Test 1: Vérification de la connexion à Grok...');
  const connectionOk = await grokService.testConnection();

  if (!connectionOk) {
    console.error('❌ Connexion échouée. Vérifiez vos credentials Grok.');
    process.exit(1);
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // Test 2: Analyse d'un email test
  console.log('📧 Test 2: Analyse d\'un email test...\n');

  const testEmail = {
    subject: 'Urgent: Production Server Down',
    content: `Hi Team,

Our production server in the US-EAST region has been down for the past 30 minutes. This is affecting all our customers.

We need to:
1. Investigate the root cause immediately
2. Restore service as soon as possible
3. Prepare a communication for affected customers

Please join the war room on Zoom ASAP.

Thanks,
John from DevOps`,
    sender: {
      name: 'John Smith',
      email: 'john.smith@company.com'
    }
  };

  const analysis = await grokService.analyzeCommunication(testEmail);

  console.log('📊 Résultats de l\'analyse:\n');
  console.log('📝 Summary:', analysis.summary);
  console.log('😊 Sentiment:', analysis.sentiment);
  console.log('🚨 Urgency:', analysis.urgency);
  console.log('🔑 Key Points:', analysis.keyPoints);
  console.log('✅ Action Items:', analysis.actionItems);
  console.log('🏷️  Entities:', analysis.entities);
  console.log('⏰ Processed At:', analysis.processedAt);

  console.log('\n' + '='.repeat(50));
  console.log('✅ Tests Grok terminés avec succès!');
  console.log('='.repeat(50) + '\n');

  process.exit(0);
}

// Exécuter les tests
testGrok().catch((error) => {
  console.error('\n❌ Erreur lors des tests:', error.message);
  console.error(error);
  process.exit(1);
});
