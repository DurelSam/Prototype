// Script de test pour la création d'Admin par UpperAdmin
const axios = require('axios');
const User = require('./src/models/User');
const Tenant = require('./src/models/Tenant');
const mongoose = require('mongoose');
require('dotenv').config();

const API_URL = 'http://localhost:5000/api';

// Variables globales pour stocker les tokens et IDs
let upperAdminToken = null;
let upperAdminId = null;
let tenantId = null;
let createdAdminId = null;

// Fonction pour se connecter à MongoDB
async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/prototypedb');
    console.log('✅ Connecté à MongoDB');
  } catch (error) {
    console.error('❌ Erreur connexion MongoDB:', error.message);
    process.exit(1);
  }
}

// Fonction pour nettoyer les données de test
async function cleanup() {
  try {
    console.log('\n🧹 Nettoyage des données de test...');

    // Supprimer le tenant de test
    const testTenant = await Tenant.findOne({ companyName: 'Test Company Admin Creation' });
    if (testTenant) {
      await User.deleteMany({ tenant_id: testTenant._id });
      await Tenant.deleteOne({ _id: testTenant._id });
      console.log('✅ Données de test supprimées');
    } else {
      console.log('ℹ️  Aucune donnée de test à supprimer');
    }
  } catch (error) {
    console.error('⚠️  Erreur lors du nettoyage:', error.message);
  }
}

// Test 1: Créer un UpperAdmin
async function test1_CreateUpperAdmin() {
  console.log('\n📝 Test 1: Création UpperAdmin\n');

  try {
    const response = await axios.post(`${API_URL}/auth/register`, {
      companyName: 'Test Company Admin Creation',
      email: 'upperadmin@testadmincreation.com',
      password: 'Test123456',
      firstName: 'Upper',
      lastName: 'Admin',
    });

    console.log('✅ UpperAdmin créé avec succès');

    // Extraire le token de vérification
    const verificationUrl = response.data.data.verificationUrl;
    const token = verificationUrl.split('/').pop();

    // Vérifier l'email immédiatement
    await axios.get(`${API_URL}/auth/verify-email/${token}`);
    console.log('✅ Email vérifié');

    // Récupérer l'ID de l'UpperAdmin et du Tenant depuis la DB
    const upperAdmin = await User.findOne({ email: 'upperadmin@testadmincreation.com' });
    upperAdminId = upperAdmin._id;
    tenantId = upperAdmin.tenant_id;

    console.log('ℹ️  UpperAdmin ID:', upperAdminId);
    console.log('ℹ️  Tenant ID:', tenantId);

  } catch (error) {
    console.error('❌ Erreur Test 1:', error.response?.data || error.message);
    throw error;
  }
}

// Test 2: Configurer l'email de l'UpperAdmin (simulé via DB)
async function test2_ConfigureEmail() {
  console.log('\n📝 Test 2: Configuration email UpperAdmin (via DB)\n');

  try {
    // Simuler la configuration email en modifiant directement la DB
    await User.findByIdAndUpdate(upperAdminId, {
      hasConfiguredEmail: true,
      activeEmailProvider: 'imap_smtp',
      'imapSmtpConfig.isConnected': true,
    });

    console.log('✅ Email configuré (simulé)');
  } catch (error) {
    console.error('❌ Erreur Test 2:', error.message);
    throw error;
  }
}

// Test 3: Login UpperAdmin
async function test3_LoginUpperAdmin() {
  console.log('\n📝 Test 3: Login UpperAdmin\n');

  try {
    const response = await axios.post(`${API_URL}/auth/login`, {
      email: 'upperadmin@testadmincreation.com',
      password: 'Test123456',
    });

    upperAdminToken = response.data.token;

    console.log('✅ Login réussi');
    console.log('ℹ️  Token:', upperAdminToken.substring(0, 20) + '...');
  } catch (error) {
    console.error('❌ Erreur Test 3:', error.response?.data || error.message);
    throw error;
  }
}

// Test 4: Créer un Admin
async function test4_CreateAdmin() {
  console.log('\n📝 Test 4: Création Admin par UpperAdmin\n');

  try {
    const response = await axios.post(
      `${API_URL}/users/admins`,
      {
        email: 'admin@testadmincreation.com',
        firstName: 'Test',
        lastName: 'Admin',
      },
      {
        headers: {
          Authorization: `Bearer ${upperAdminToken}`,
        },
      }
    );

    createdAdminId = response.data.data.admin._id;

    console.log('✅ Admin créé avec succès');
    console.log('📧 Email:', response.data.data.admin.email);
    console.log('🔑 Mot de passe temporaire:', response.data.data.temporaryPassword);
    console.log('ℹ️  Admin ID:', createdAdminId);
  } catch (error) {
    console.error('❌ Erreur Test 4:', error.response?.data || error.message);
    throw error;
  }
}

// Test 5: Récupérer la liste des Admins
async function test5_GetAdmins() {
  console.log('\n📝 Test 5: Récupération liste Admins\n');

  try {
    const response = await axios.get(`${API_URL}/users/admins`, {
      headers: {
        Authorization: `Bearer ${upperAdminToken}`,
      },
    });

    console.log('✅ Liste récupérée');
    console.log('📊 Nombre d\'Admins:', response.data.data.length);
    console.log('👥 Admins:', response.data.data.map(a => `${a.firstName} ${a.lastName} (${a.email})`));
  } catch (error) {
    console.error('❌ Erreur Test 5:', error.response?.data || error.message);
    throw error;
  }
}

// Test 6: Récupérer un Admin spécifique
async function test6_GetAdminById() {
  console.log('\n📝 Test 6: Récupération Admin par ID\n');

  try {
    const response = await axios.get(`${API_URL}/users/admins/${createdAdminId}`, {
      headers: {
        Authorization: `Bearer ${upperAdminToken}`,
      },
    });

    console.log('✅ Admin récupéré');
    console.log('👤 Nom:', response.data.data.firstName, response.data.data.lastName);
    console.log('📧 Email:', response.data.data.email);
    console.log('👔 Rôle:', response.data.data.role);
  } catch (error) {
    console.error('❌ Erreur Test 6:', error.response?.data || error.message);
    throw error;
  }
}

// Test 7: Mettre à jour l'Admin
async function test7_UpdateAdmin() {
  console.log('\n📝 Test 7: Mise à jour Admin\n');

  try {
    const response = await axios.put(
      `${API_URL}/users/admins/${createdAdminId}`,
      {
        firstName: 'Updated',
        lastName: 'Admin',
        phoneNumber: '+1234567890',
      },
      {
        headers: {
          Authorization: `Bearer ${upperAdminToken}`,
        },
      }
    );

    console.log('✅ Admin mis à jour');
    console.log('👤 Nouveau nom:', response.data.data.firstName, response.data.data.lastName);
    console.log('📞 Téléphone:', response.data.data.phoneNumber);
  } catch (error) {
    console.error('❌ Erreur Test 7:', error.response?.data || error.message);
    throw error;
  }
}

// Test 8: Essayer de créer un Admin avec email dupliqué (devrait échouer)
async function test8_DuplicateEmail() {
  console.log('\n📝 Test 8: Tentative création Admin avec email dupliqué\n');

  try {
    await axios.post(
      `${API_URL}/users/admins`,
      {
        email: 'admin@testadmincreation.com', // Email déjà utilisé
        firstName: 'Duplicate',
        lastName: 'Admin',
      },
      {
        headers: {
          Authorization: `Bearer ${upperAdminToken}`,
        },
      }
    );

    console.log('⚠️  Admin créé (ne devrait pas !)');
  } catch (error) {
    if (error.response && error.response.status === 400) {
      console.log('✅ Création refusée correctement');
      console.log('📝 Message:', error.response.data.message);
    } else {
      console.error('❌ Erreur inattendue:', error.response?.data || error.message);
    }
  }
}

// Test 9: Supprimer l'Admin
async function test9_DeleteAdmin() {
  console.log('\n📝 Test 9: Suppression Admin\n');

  try {
    const response = await axios.delete(
      `${API_URL}/users/admins/${createdAdminId}`,
      {
        headers: {
          Authorization: `Bearer ${upperAdminToken}`,
        },
        data: {
          confirmationPhrase: 'DELETE ADMIN',
        },
      }
    );

    console.log('✅ Admin supprimé');
    console.log('📝 Message:', response.data.message);
  } catch (error) {
    console.error('❌ Erreur Test 9:', error.response?.data || error.message);
    throw error;
  }
}

// Test 10: Vérifier que l'Admin n'existe plus
async function test10_VerifyDeletion() {
  console.log('\n📝 Test 10: Vérification suppression\n');

  try {
    await axios.get(`${API_URL}/users/admins/${createdAdminId}`, {
      headers: {
        Authorization: `Bearer ${upperAdminToken}`,
      },
    });

    console.log('⚠️  Admin toujours trouvé (ne devrait pas !)');
  } catch (error) {
    if (error.response && error.response.status === 404) {
      console.log('✅ Admin bien supprimé (404)');
    } else {
      console.error('❌ Erreur inattendue:', error.response?.data || error.message);
    }
  }
}

// Fonction principale
async function runTests() {
  console.log('\n' + '='.repeat(70));
  console.log('🧪 TESTS RBAC - CRÉATION ADMIN PAR UPPERADMIN');
  console.log('='.repeat(70));

  try {
    // Connexion à la DB
    await connectDB();

    // Nettoyage initial
    await cleanup();

    // Exécuter les tests
    await test1_CreateUpperAdmin();
    await test2_ConfigureEmail();
    await test3_LoginUpperAdmin();
    await test4_CreateAdmin();
    await test5_GetAdmins();
    await test6_GetAdminById();
    await test7_UpdateAdmin();
    await test8_DuplicateEmail();
    await test9_DeleteAdmin();
    await test10_VerifyDeletion();

    // Nettoyage final
    await cleanup();

    console.log('\n' + '='.repeat(70));
    console.log('✅ TOUS LES TESTS RÉUSSIS !');
    console.log('='.repeat(70) + '\n');

  } catch (error) {
    console.log('\n' + '='.repeat(70));
    console.log('❌ TESTS ÉCHOUÉS');
    console.log('='.repeat(70) + '\n');
  } finally {
    // Fermer la connexion MongoDB
    await mongoose.disconnect();
    console.log('🔌 Déconnecté de MongoDB');
    process.exit(0);
  }
}

// Exécuter les tests
runTests();
