// Script de test pour l'inscription UpperAdmin
const axios = require('axios');

const API_URL = 'http://localhost:5000/api/auth';

async function testRegisterUpperAdmin() {
  console.log('\n📝 Test: Inscription UpperAdmin\n');

  try {
    // Test 1: Inscription avec tous les champs
    console.log('Test 1: Inscription UpperAdmin avec tous les champs...');
    const response = await axios.post(`${API_URL}/register`, {
      companyName: 'Test Company RBAC',
      email: 'owner@testcompanyrbac.com',
      password: 'Test123456',
      firstName: 'John',
      lastName: 'Doe',
    });

    console.log('✅ Inscription réussie !');
    console.log('Response:', JSON.stringify(response.data, null, 2));

    // Récupérer le token de vérification de la réponse (en dev uniquement)
    const verificationUrl = response.data.data.verificationUrl;
    if (verificationUrl) {
      const token = verificationUrl.split('/').pop();
      console.log('\n📧 Token de vérification:', token);

      // Test 2: Vérifier l'email
      console.log('\nTest 2: Vérification de l\'email...');
      const verifyResponse = await axios.get(`${API_URL}/verify-email/${token}`);
      console.log('✅ Email vérifié !');
      console.log('Response:', JSON.stringify(verifyResponse.data, null, 2));

      // Test 3: Tester le login SANS configuration email (devrait échouer)
      console.log('\nTest 3: Tentative de connexion sans configuration email...');
      try {
        const loginResponse = await axios.post(`${API_URL}/login`, {
          email: 'owner@testcompanyrbac.com',
          password: 'Test123456',
        });
        console.log('⚠️  Login réussi (ne devrait pas !)', loginResponse.data);
      } catch (error) {
        if (error.response && error.response.status === 403) {
          console.log('✅ Login bloqué correctement (email non configuré)');
          console.log('Message:', error.response.data.message);
          console.log('Flags:', {
            requiresEmailConfiguration: error.response.data.requiresEmailConfiguration,
          });
        } else {
          throw error;
        }
      }
    }

  } catch (error) {
    if (error.response) {
      console.error('❌ Erreur:', error.response.data);
    } else {
      console.error('❌ Erreur:', error.message);
    }
  }
}

async function testDuplicateEmail() {
  console.log('\n📝 Test: Tentative d\'inscription avec email existant\n');

  try {
    const response = await axios.post(`${API_URL}/register`, {
      companyName: 'Another Company',
      email: 'owner@testcompanyrbac.com', // Email déjà utilisé
      password: 'Test123456',
      firstName: 'Jane',
      lastName: 'Smith',
    });

    console.log('⚠️  Inscription réussie (ne devrait pas !)', response.data);
  } catch (error) {
    if (error.response && error.response.status === 400) {
      console.log('✅ Inscription refusée correctement');
      console.log('Message:', error.response.data.message);
    } else {
      console.error('❌ Erreur inattendue:', error.message);
    }
  }
}

async function runTests() {
  console.log('\n' + '='.repeat(60));
  console.log('🧪 TESTS RBAC - INSCRIPTION UPPER ADMIN');
  console.log('='.repeat(60));

  await testRegisterUpperAdmin();
  await testDuplicateEmail();

  console.log('\n' + '='.repeat(60));
  console.log('✅ Tous les tests terminés !');
  console.log('='.repeat(60) + '\n');
}

runTests();
