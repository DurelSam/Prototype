/**
 * Script de test pour SmarterMail IMAP
 * Test avec différentes méthodes d'authentification
 */

const Imap = require('node-imap');
const nodemailer = require('nodemailer');

// Configuration
const CONFIG = {
  email: 'sam@imperiumsolution.com.my',
  password: 'Malaysia@999',
  imapHost: 'mail.imperiumsolution.com.my',
  imapPort: 993,
  smtpHost: 'mail.imperiumsolution.com.my',
  smtpPort: 587,
};

console.log('🧪 TEST SMARTERMAIL - Démarrage...\n');
console.log('Configuration:');
console.log('  Email:', CONFIG.email);
console.log('  IMAP:', CONFIG.imapHost + ':' + CONFIG.imapPort);
console.log('  SMTP:', CONFIG.smtpHost + ':' + CONFIG.smtpPort);
console.log('  Password:', CONFIG.password.replace(/./g, '*'));
console.log('\n' + '='.repeat(70) + '\n');

/**
 * Test 1: IMAP avec username simple (sam)
 */
async function test1_ImapUsernameSimple() {
  console.log('📌 TEST 1: IMAP avec username "sam"');

  return new Promise((resolve, reject) => {
    const imap = new Imap({
      user: 'sam',
      password: CONFIG.password,
      host: CONFIG.imapHost,
      port: CONFIG.imapPort,
      tls: true,
      tlsOptions: {
        rejectUnauthorized: false,
        minVersion: 'TLSv1',
        maxVersion: 'TLSv1.3'
      },
      connTimeout: 15000,
      authTimeout: 15000,
      debug: console.log // Full debug
    });

    imap.once('ready', () => {
      console.log('✅ TEST 1 RÉUSSI: Connexion avec "sam"\n');
      imap.end();
      resolve(true);
    });

    imap.once('error', (err) => {
      console.error('❌ TEST 1 ÉCHOUÉ:', err.message);
      console.error('   Source:', err.source);
      console.error('');
      resolve(false);
    });

    imap.connect();
  });
}

/**
 * Test 2: IMAP avec email complet
 */
async function test2_ImapEmailComplet() {
  console.log('📌 TEST 2: IMAP avec email complet "sam@imperium.com.my"');

  return new Promise((resolve, reject) => {
    const imap = new Imap({
      user: CONFIG.email,
      password: CONFIG.password,
      host: CONFIG.imapHost,
      port: CONFIG.imapPort,
      tls: true,
      tlsOptions: {
        rejectUnauthorized: false,
        minVersion: 'TLSv1',
        maxVersion: 'TLSv1.3'
      },
      connTimeout: 15000,
      authTimeout: 15000,
      debug: console.log
    });

    imap.once('ready', () => {
      console.log('✅ TEST 2 RÉUSSI: Connexion avec email complet\n');
      imap.end();
      resolve(true);
    });

    imap.once('error', (err) => {
      console.error('❌ TEST 2 ÉCHOUÉ:', err.message);
      console.error('   Source:', err.source);
      console.error('');
      resolve(false);
    });

    imap.connect();
  });
}

/**
 * Test 3: IMAP port non-SSL (143) avec STARTTLS
 */
async function test3_ImapStartTLS() {
  console.log('📌 TEST 3: IMAP port 143 avec STARTTLS');

  return new Promise((resolve, reject) => {
    const imap = new Imap({
      user: CONFIG.email,
      password: CONFIG.password,
      host: CONFIG.imapHost,
      port: 143, // Port non-SSL
      tls: false,
      autotls: 'always', // Force STARTTLS
      tlsOptions: {
        rejectUnauthorized: false
      },
      connTimeout: 15000,
      authTimeout: 15000,
      debug: console.log
    });

    imap.once('ready', () => {
      console.log('✅ TEST 3 RÉUSSI: Connexion STARTTLS\n');
      imap.end();
      resolve(true);
    });

    imap.once('error', (err) => {
      console.error('❌ TEST 3 ÉCHOUÉ:', err.message);
      console.error('');
      resolve(false);
    });

    imap.connect();
  });
}

/**
 * Test 4: SMTP avec nodemailer
 */
async function test4_SMTP() {
  console.log('📌 TEST 4: SMTP avec nodemailer');

  try {
    const transporter = nodemailer.createTransport({
      host: CONFIG.smtpHost,
      port: CONFIG.smtpPort,
      secure: false, // STARTTLS
      auth: {
        user: CONFIG.email,
        pass: CONFIG.password,
      },
      tls: {
        rejectUnauthorized: false
      },
      debug: true,
      logger: true
    });

    await transporter.verify();
    console.log('✅ TEST 4 RÉUSSI: SMTP fonctionne\n');
    return true;
  } catch (err) {
    console.error('❌ TEST 4 ÉCHOUÉ:', err.message);
    console.error('');
    return false;
  }
}

/**
 * Test 5: IMAP sans TLS (pour debug uniquement)
 */
async function test5_ImapNoTLS() {
  console.log('📌 TEST 5: IMAP port 143 SANS TLS (debug uniquement)');

  return new Promise((resolve, reject) => {
    const imap = new Imap({
      user: CONFIG.email,
      password: CONFIG.password,
      host: CONFIG.imapHost,
      port: 143,
      tls: false,
      connTimeout: 15000,
      authTimeout: 15000,
      debug: console.log
    });

    imap.once('ready', () => {
      console.log('✅ TEST 5 RÉUSSI: Connexion sans TLS\n');
      imap.end();
      resolve(true);
    });

    imap.once('error', (err) => {
      console.error('❌ TEST 5 ÉCHOUÉ:', err.message);
      console.error('');
      resolve(false);
    });

    imap.connect();
  });
}

/**
 * Exécuter tous les tests
 */
async function runAllTests() {
  const results = {
    test1: false,
    test2: false,
    test3: false,
    test4: false,
    test5: false,
  };

  try {
    // Test 1
    results.test1 = await test1_ImapUsernameSimple();
    await sleep(2000);

    // Test 2
    results.test2 = await test2_ImapEmailComplet();
    await sleep(2000);

    // Test 3
    results.test3 = await test3_ImapStartTLS();
    await sleep(2000);

    // Test 4
    results.test4 = await test4_SMTP();
    await sleep(2000);

    // Test 5
    results.test5 = await test5_ImapNoTLS();

    // Résumé
    console.log('\n' + '='.repeat(70));
    console.log('📊 RÉSUMÉ DES TESTS');
    console.log('='.repeat(70));
    console.log('TEST 1 (IMAP username simple):', results.test1 ? '✅ RÉUSSI' : '❌ ÉCHOUÉ');
    console.log('TEST 2 (IMAP email complet):', results.test2 ? '✅ RÉUSSI' : '❌ ÉCHOUÉ');
    console.log('TEST 3 (IMAP STARTTLS):', results.test3 ? '✅ RÉUSSI' : '❌ ÉCHOUÉ');
    console.log('TEST 4 (SMTP):', results.test4 ? '✅ RÉUSSI' : '❌ ÉCHOUÉ');
    console.log('TEST 5 (IMAP no TLS):', results.test5 ? '✅ RÉUSSI' : '❌ ÉCHOUÉ');
    console.log('='.repeat(70) + '\n');

    // Recommandation
    if (results.test1) {
      console.log('🎯 RECOMMANDATION: Utiliser username "sam" (sans @domain)');
    } else if (results.test2) {
      console.log('🎯 RECOMMANDATION: Utiliser email complet "sam@imperium.com.my"');
    } else if (results.test3) {
      console.log('🎯 RECOMMANDATION: Utiliser port 143 avec STARTTLS');
    } else {
      console.log('⚠️  AUCUN TEST RÉUSSI - Vérifier:');
      console.log('   1. Credentials corrects dans le webmail');
      console.log('   2. IMAP activé pour ce compte');
      console.log('   3. Firewall/restrictions IP');
      console.log('   4. Caractères spéciaux dans le mot de passe');
    }

    process.exit(0);
  } catch (err) {
    console.error('❌ ERREUR GLOBALE:', err);
    process.exit(1);
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Lancer les tests
runAllTests();
