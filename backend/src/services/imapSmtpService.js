/**
 * IMAP/SMTP Service
 *
 * Service pour gérer les connexions IMAP/SMTP (Gmail, Yahoo, etc.)
 * - Tester les connexions
 * - Récupérer les emails
 * - Envoyer des emails
 */

const Imap = require('node-imap');
const { simpleParser } = require('mailparser');
const nodemailer = require('nodemailer');
const encryptionService = require('./encryptionService');
const User = require('../models/User');
const Communication = require('../models/Communication');

/**
 * Configurations pré-définies pour les providers populaires
 */
const PROVIDER_CONFIGS = {
  gmail: {
    name: 'Gmail',
    imapHost: 'imap.gmail.com',
    imapPort: 993,
    imapSecure: true,
    smtpHost: 'smtp.gmail.com',
    smtpPort: 587,
    smtpSecure: false,
    requiresAppPassword: true,
    setupGuideUrl: 'https://support.google.com/accounts/answer/185833',
  },
  yahoo: {
    name: 'Yahoo Mail',
    imapHost: 'imap.mail.yahoo.com',
    imapPort: 993,
    imapSecure: true,
    smtpHost: 'smtp.mail.yahoo.com',
    smtpPort: 587,
    smtpSecure: false,
    requiresAppPassword: true,
    setupGuideUrl: 'https://help.yahoo.com/kb/generate-third-party-passwords-sln15241.html',
  },
  outlook_imap: {
    name: 'Outlook (IMAP)',
    imapHost: 'outlook.office365.com',
    imapPort: 993,
    imapSecure: true,
    smtpHost: 'smtp.office365.com',
    smtpPort: 587,
    smtpSecure: false,
    requiresAppPassword: false,
  },
  protonmail: {
    name: 'ProtonMail',
    imapHost: '127.0.0.1', // Nécessite ProtonMail Bridge en local
    imapPort: 1143,
    imapSecure: false,
    smtpHost: '127.0.0.1',
    smtpPort: 1025,
    smtpSecure: false,
    requiresBridge: true,
    setupGuideUrl: 'https://protonmail.com/bridge',
  },
};

/**
 * Obtenir la configuration d'un provider
 */
exports.getProviderConfig = (providerName) => {
  return PROVIDER_CONFIGS[providerName] || null;
};

/**
 * Obtenir toutes les configurations de providers
 */
exports.getAllProviderConfigs = () => {
  return PROVIDER_CONFIGS;
};

/**
 * Tester la connexion IMAP/SMTP
 * @param {Object} config - Configuration IMAP/SMTP
 * @returns {Promise<Object>} Résultat du test
 */
exports.testConnection = async (config) => {
  const { email, password, imapHost, imapPort, imapSecure, smtpHost, smtpPort, smtpSecure } = config;

  try {
    // Test IMAP (réception)
    await new Promise((resolve, reject) => {
      const imap = new Imap({
        user: email,
        password: password,
        host: imapHost,
        port: imapPort,
        tls: imapSecure,
        tlsOptions: { rejectUnauthorized: false },
        connTimeout: 10000, // 10 secondes
        authTimeout: 10000,
      });

      imap.once('ready', () => {
        imap.end();
        resolve();
      });

      imap.once('error', (err) => {
        reject(new Error(`IMAP Error: ${err.message}`));
      });

      imap.connect();
    });

    // Test SMTP (envoi)
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpSecure,
      auth: {
        user: email,
        pass: password,
      },
      tls: {
        rejectUnauthorized: false, // Accepter les certificats auto-signés
      },
    });

    await transporter.verify();

    return {
      success: true,
      message: 'Connexion IMAP/SMTP réussie',
    };
  } catch (error) {
    console.error('❌ Erreur test de connexion IMAP/SMTP:', error);
    return {
      success: false,
      message: error.message || 'Échec de la connexion',
    };
  }
};

/**
 * Récupérer les emails d'une boîte mail IMAP
 * @param {ObjectId} userId - ID de l'utilisateur
 * @param {String} folder - Dossier à synchroniser (INBOX, Sent, etc.)
 * @param {Number} sinceDays - Nombre de jours à synchroniser (30 par défaut)
 * @returns {Promise<Object>} Résultat de la synchronisation
 */
exports.fetchEmailsFromFolder = async (userId, folder = 'INBOX', sinceDays = 30) => {
  try {
    // Récupérer la config de l'utilisateur
    const user = await User.findById(userId).select('+imapSmtpConfig.password');

    if (!user || !user.imapSmtpConfig || !user.imapSmtpConfig.isConnected) {
      throw new Error('IMAP/SMTP non configuré pour cet utilisateur');
    }

    const config = user.imapSmtpConfig;
    const decryptedPassword = encryptionService.decrypt(config.password);

    // Connexion IMAP
    const imap = new Imap({
      user: config.email,
      password: decryptedPassword,
      host: config.imapHost,
      port: config.imapPort,
      tls: config.imapSecure,
      tlsOptions: { rejectUnauthorized: false },
    });

    return new Promise((resolve, reject) => {
      imap.once('ready', () => {
        imap.openBox(folder, false, async (err, box) => {
          if (err) {
            imap.end();
            return reject(new Error(`Impossible d'ouvrir le dossier ${folder}: ${err.message}`));
          }

          // Calculer la date de début (30 derniers jours par défaut)
          const sinceDate = new Date();
          sinceDate.setDate(sinceDate.getDate() - sinceDays);

          // Rechercher les emails depuis cette date
          const searchCriteria = [['SINCE', sinceDate]];

          imap.search(searchCriteria, async (err, results) => {
            if (err) {
              imap.end();
              return reject(new Error(`Erreur de recherche: ${err.message}`));
            }

            if (!results || results.length === 0) {
              console.log(`📭 Aucun email trouvé dans ${folder} depuis ${sinceDays} jours`);
              imap.end();
              return resolve({
                success: true,
                folder,
                emailsProcessed: 0,
                emailsSaved: 0,
              });
            }

            console.log(`📧 ${results.length} emails trouvés dans ${folder}`);

            const fetch = imap.fetch(results, {
              bodies: '',
              struct: true,
              markSeen: false,
            });

            let emailsProcessed = 0;
            let emailsSaved = 0;
            const emails = [];

            fetch.on('message', (msg) => {
              msg.on('body', (stream) => {
                simpleParser(stream, async (err, parsed) => {
                  if (err) {
                    console.error('❌ Erreur parsing email:', err);
                    return;
                  }

                  try {
                    // Vérifier si l'email existe déjà
                    const existingEmail = await Communication.findOne({
                      externalId: parsed.messageId,
                      tenant_id: user.tenant_id,
                    });

                    if (!existingEmail) {
                      // Créer la communication
                      const communication = new Communication({
                        subject: parsed.subject || '(No Subject)',
                        content: parsed.text || parsed.html || '',
                        snippet: (parsed.text || parsed.html || '').substring(0, 200),
                        sender: {
                          name: parsed.from?.value[0]?.name || parsed.from?.value[0]?.address || 'Unknown',
                          email: parsed.from?.value[0]?.address || 'unknown@unknown.com',
                        },
                        source: config.providerName ? config.providerName.charAt(0).toUpperCase() + config.providerName.slice(1) : 'IMAP/SMTP',
                        externalId: parsed.messageId || `imap-${Date.now()}-${Math.random()}`,
                        status: 'To Validate',
                        receivedAt: parsed.date || new Date(),
                        slaDueDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
                        tenant_id: user.tenant_id,
                        attachments: (parsed.attachments || []).map((att) => ({
                          filename: att.filename,
                          contentType: att.contentType,
                          size: att.size,
                        })),
                      });

                      // Analyse AI si activée
                      if (config.enableAiAnalysis) {
                        // TODO: Appeler le service Grok pour analyse AI
                        // const aiAnalysis = await grokService.analyzeEmail(communication);
                        // communication.ai_analysis = aiAnalysis;
                      }

                      await communication.save();
                      emailsSaved++;
                    }

                    emailsProcessed++;
                  } catch (saveError) {
                    console.error('❌ Erreur sauvegarde email:', saveError);
                  }
                });
              });
            });

            fetch.once('error', (err) => {
              console.error('❌ Erreur fetch:', err);
              imap.end();
              reject(err);
            });

            fetch.once('end', () => {
              console.log(`✅ Synchronisation ${folder} terminée`);
              imap.end();

              // Mettre à jour la date de dernière sync
              User.findByIdAndUpdate(userId, {
                'imapSmtpConfig.lastSyncDate': new Date(),
                'imapSmtpConfig.lastMailboxCheck': new Date(),
              }).exec();

              resolve({
                success: true,
                folder,
                emailsProcessed,
                emailsSaved,
              });
            });
          });
        });
      });

      imap.once('error', (err) => {
        console.error('❌ Erreur IMAP:', err);
        reject(new Error(`Connexion IMAP échouée: ${err.message}`));
      });

      imap.connect();
    });
  } catch (error) {
    console.error('❌ Erreur fetchEmailsFromFolder:', error);
    throw error;
  }
};

/**
 * Synchroniser tous les dossiers configurés par l'utilisateur
 * @param {ObjectId} userId - ID de l'utilisateur
 * @returns {Promise<Object>} Résultat de la synchronisation
 */
exports.syncAllFolders = async (userId) => {
  try {
    const user = await User.findById(userId);

    if (!user || !user.imapSmtpConfig || !user.imapSmtpConfig.isConnected) {
      throw new Error('IMAP/SMTP non configuré');
    }

    const foldersToSync = user.imapSmtpConfig.foldersToSync || ['INBOX'];
    const results = [];

    for (const folder of foldersToSync) {
      try {
        const result = await exports.fetchEmailsFromFolder(userId, folder, 30);
        results.push(result);
      } catch (error) {
        console.error(`❌ Erreur sync dossier ${folder}:`, error);
        results.push({
          success: false,
          folder,
          error: error.message,
        });
      }
    }

    return {
      success: true,
      results,
    };
  } catch (error) {
    console.error('❌ Erreur syncAllFolders:', error);
    throw error;
  }
};

/**
 * Envoyer un email via SMTP
 * @param {ObjectId} userId - ID de l'utilisateur
 * @param {Object} emailData - Données de l'email
 * @returns {Promise<Object>} Résultat de l'envoi
 */
exports.sendEmail = async (userId, emailData) => {
  try {
    const { to, subject, text, html, inReplyTo, references } = emailData;

    // Récupérer la config de l'utilisateur
    const user = await User.findById(userId).select('+imapSmtpConfig.password');

    if (!user || !user.imapSmtpConfig || !user.imapSmtpConfig.isConnected) {
      throw new Error('IMAP/SMTP non configuré pour cet utilisateur');
    }

    const config = user.imapSmtpConfig;
    const decryptedPassword = encryptionService.decrypt(config.password);

    // Créer le transporteur SMTP
    const transporter = nodemailer.createTransport({
      host: config.smtpHost,
      port: config.smtpPort,
      secure: config.smtpSecure,
      auth: {
        user: config.email,
        pass: decryptedPassword,
      },
      tls: {
        rejectUnauthorized: false, // Accepter les certificats auto-signés
      },
    });

    // Préparer l'email
    const mailOptions = {
      from: `"${user.firstName} ${user.lastName}" <${config.email}>`,
      to,
      subject,
      text,
      html,
      inReplyTo,
      references,
    };

    // Envoyer l'email
    const info = await transporter.sendMail(mailOptions);

    console.log('✅ Email envoyé:', info.messageId);

    return {
      success: true,
      messageId: info.messageId,
      message: 'Email envoyé avec succès',
    };
  } catch (error) {
    console.error('❌ Erreur envoi email SMTP:', error);
    return {
      success: false,
      message: error.message || 'Échec de l\'envoi de l\'email',
    };
  }
};
