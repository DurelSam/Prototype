/**
 * Test direct de l'endpoint API /email/imap-smtp/test
 * Simule exactement ce que fait le frontend
 */

const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

async function testEndpoint() {
  console.log('🧪 Test de l\'endpoint API: POST /email/imap-smtp/test\n');

  const testData = {
    email: 'sam@imperiumsolution.com.my',
    password: 'Malaysia@999',
    imapHost: 'mail.imperiumsolution.com.my',
    imapPort: 993,
    imapSecure: true,
    smtpHost: 'mail.imperiumsolution.com.my',
    smtpPort: 587,
    smtpSecure: false,
  };

  console.log('📤 Données envoyées:');
  console.log(JSON.stringify(testData, null, 2));
  console.log('');

  try {
    console.log('⏳ Envoi de la requête...\n');

    const response = await axios.post(
      `${API_URL}/email/imap-smtp/test`,
      testData,
      {
        headers: {
          'Content-Type': 'application/json',
          // Pas de token pour ce test, on va voir si ça passe ou non
        },
        timeout: 30000, // 30 secondes
      }
    );

    console.log('✅ Réponse reçue:');
    console.log('Status:', response.status);
    console.log('Data:', JSON.stringify(response.data, null, 2));

    if (response.data.success) {
      console.log('\n🎉 TEST RÉUSSI!');
      console.log('Username Format:', response.data.usernameFormat);
    } else {
      console.log('\n❌ TEST ÉCHOUÉ');
      console.log('Message:', response.data.message);
    }

  } catch (error) {
    console.error('\n❌ ERREUR lors de la requête:');

    if (error.response) {
      // Le serveur a répondu avec un code d'erreur
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      // La requête a été envoyée mais pas de réponse
      console.error('Pas de réponse du serveur');
      console.error('Request:', error.request);
    } else {
      // Erreur lors de la configuration de la requête
      console.error('Message:', error.message);
    }
  }
}

// Lancer le test
testEndpoint();
