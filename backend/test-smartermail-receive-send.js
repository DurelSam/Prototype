/**
 * Test de réception et envoi d'emails avec SmarterMail
 * - Récupérer les derniers emails (IMAP)
 * - Envoyer un email de test (SMTP)
 */

const Imap = require('node-imap');
const { simpleParser } = require('mailparser');
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

console.log('🧪 TEST SMARTERMAIL - Réception et Envoi\n');
console.log('Configuration:');
console.log('  Email:', CONFIG.email);
console.log('  IMAP:', CONFIG.imapHost + ':' + CONFIG.imapPort);
console.log('  SMTP:', CONFIG.smtpHost + ':' + CONFIG.smtpPort);
console.log('\n' + '='.repeat(70) + '\n');

/**
 * TEST 1: Récupérer les derniers emails de INBOX
 */
async function testReceiveEmails() {
  console.log('📌 TEST 1: RÉCUPÉRATION DES EMAILS (INBOX)');
  console.log('Connexion IMAP...\n');

  return new Promise((resolve, reject) => {
    const imap = new Imap({
      user: CONFIG.email, // Format full email (testé et validé)
      password: CONFIG.password,
      host: CONFIG.imapHost,
      port: CONFIG.imapPort,
      tls: true,
      tlsOptions: {
        rejectUnauthorized: false,
        minVersion: 'TLSv1',
        maxVersion: 'TLSv1.3'
      },
      connTimeout: 20000,
      authTimeout: 20000,
    });

    imap.once('ready', () => {
      console.log('✅ Connexion IMAP réussie!\n');

      // Ouvrir la boîte INBOX
      imap.openBox('INBOX', false, (err, box) => {
        if (err) {
          console.error('❌ Erreur ouverture INBOX:', err.message);
          imap.end();
          return reject(err);
        }

        console.log(`📬 INBOX ouverte: ${box.messages.total} messages au total\n`);

        if (box.messages.total === 0) {
          console.log('📭 Aucun email dans INBOX');
          imap.end();
          return resolve([]);
        }

        // Récupérer les 5 derniers emails
        const fetchCount = Math.min(5, box.messages.total);
        const startSeq = Math.max(1, box.messages.total - fetchCount + 1);
        const endSeq = box.messages.total;

        console.log(`📧 Récupération des ${fetchCount} derniers emails (${startSeq}:${endSeq})...\n`);

        const fetch = imap.seq.fetch(`${startSeq}:${endSeq}`, {
          bodies: '',
          struct: true,
        });

        const emails = [];

        fetch.on('message', (msg, seqno) => {
          msg.on('body', (stream) => {
            simpleParser(stream, (err, parsed) => {
              if (err) {
                console.error('❌ Erreur parsing email:', err);
                return;
              }

              const emailData = {
                seqno: seqno,
                from: parsed.from?.text || 'Unknown',
                to: parsed.to?.text || 'Unknown',
                subject: parsed.subject || '(No Subject)',
                date: parsed.date || new Date(),
                snippet: (parsed.text || parsed.html || '').substring(0, 150) + '...',
              };

              emails.push(emailData);

              console.log(`📨 Email #${seqno}:`);
              console.log(`   De: ${emailData.from}`);
              console.log(`   À: ${emailData.to}`);
              console.log(`   Sujet: ${emailData.subject}`);
              console.log(`   Date: ${emailData.date}`);
              console.log(`   Aperçu: ${emailData.snippet}`);
              console.log('');
            });
          });
        });

        fetch.once('error', (err) => {
          console.error('❌ Erreur fetch:', err);
          imap.end();
          reject(err);
        });

        fetch.once('end', () => {
          console.log(`✅ ${emails.length} emails récupérés avec succès!\n`);
          imap.end();
          resolve(emails);
        });
      });
    });

    imap.once('error', (err) => {
      console.error('❌ Erreur IMAP:', err.message);
      reject(err);
    });

    imap.connect();
  });
}

/**
 * TEST 2: Envoyer un email de test
 */
async function testSendEmail() {
  console.log('\n' + '='.repeat(70) + '\n');
  console.log('📌 TEST 2: ENVOI D\'UN EMAIL DE TEST');
  console.log('Connexion SMTP...\n');

  try {
    // Créer le transporteur SMTP
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
      debug: false, // Mettre à true pour voir les logs SMTP
      logger: false
    });

    // Vérifier la connexion SMTP
    await transporter.verify();
    console.log('✅ Connexion SMTP vérifiée!\n');

    // Préparer l'email de test (envoi à soi-même)
    const mailOptions = {
      from: `"Sam Test" <${CONFIG.email}>`,
      to: CONFIG.email, // Envoi à soi-même pour faciliter le test
      subject: `[TEST] Email de test SmarterMail - ${new Date().toLocaleString()}`,
      text: `Ceci est un email de test envoyé depuis le script de test Node.js.\n\nDate: ${new Date().toISOString()}\n\nSi vous recevez cet email, l'envoi SMTP fonctionne parfaitement! ✅`,
      html: `
        <h2>✅ Test d'envoi SMTP SmarterMail</h2>
        <p>Ceci est un email de test envoyé depuis le script de test Node.js.</p>
        <p><strong>Date:</strong> ${new Date().toISOString()}</p>
        <hr>
        <p>Si vous recevez cet email, l'envoi SMTP fonctionne parfaitement! ✅</p>
        <p><em>Envoyé depuis: ${CONFIG.email}</em></p>
      `,
    };

    console.log('📤 Envoi de l\'email de test...');
    console.log(`   De: ${mailOptions.from}`);
    console.log(`   À: ${mailOptions.to}`);
    console.log(`   Sujet: ${mailOptions.subject}\n`);

    // Envoyer l'email
    const info = await transporter.sendMail(mailOptions);

    console.log('✅ Email envoyé avec succès!');
    console.log(`   Message ID: ${info.messageId}`);
    console.log(`   Réponse: ${info.response}\n`);

    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error) {
    console.error('❌ Erreur envoi email:', error.message);
    throw error;
  }
}

/**
 * Exécuter tous les tests
 */
async function runTests() {
  const results = {
    receive: false,
    send: false,
  };

  try {
    // Test 1: Réception
    await testReceiveEmails();
    results.receive = true;

    // Pause de 2 secondes
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Test 2: Envoi
    await testSendEmail();
    results.send = true;

    // Résumé
    console.log('\n' + '='.repeat(70));
    console.log('📊 RÉSUMÉ DES TESTS');
    console.log('='.repeat(70));
    console.log('TEST 1 (Réception IMAP):', results.receive ? '✅ RÉUSSI' : '❌ ÉCHOUÉ');
    console.log('TEST 2 (Envoi SMTP):', results.send ? '✅ RÉUSSI' : '❌ ÉCHOUÉ');
    console.log('='.repeat(70) + '\n');

    if (results.receive && results.send) {
      console.log('🎉 TOUS LES TESTS RÉUSSIS!');
      console.log('✅ Vous pouvez maintenant utiliser cette configuration dans l\'application MERN.\n');
      console.log('💡 NOTE: Vérifiez votre boîte INBOX pour voir l\'email de test envoyé.');
    } else {
      console.log('⚠️  CERTAINS TESTS ONT ÉCHOUÉ - Vérifiez les erreurs ci-dessus.');
    }

    process.exit(0);
  } catch (error) {
    console.error('\n❌ ERREUR GLOBALE:', error.message);
    console.log('\n' + '='.repeat(70));
    console.log('📊 RÉSUMÉ DES TESTS');
    console.log('='.repeat(70));
    console.log('TEST 1 (Réception IMAP):', results.receive ? '✅ RÉUSSI' : '❌ ÉCHOUÉ');
    console.log('TEST 2 (Envoi SMTP):', results.send ? '✅ RÉUSSI' : '❌ ÉCHOUÉ');
    console.log('='.repeat(70) + '\n');
    process.exit(1);
  }
}

// Lancer les tests
console.log('🚀 Démarrage des tests de réception et envoi...\n');
runTests();
