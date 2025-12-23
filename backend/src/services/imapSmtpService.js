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
const grokService = require('./grokService');
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
  smartermail: {
    name: 'SmarterMail',
    imapHost: '', // À remplir par l'utilisateur
    imapPort: 993,
    imapSecure: true,
    smtpHost: '', // À remplir par l'utilisateur
    smtpPort: 587,
    smtpSecure: false,
    requiresAppPassword: false,
    setupGuideUrl: 'https://www.smartertools.com/smartermail',
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
  const { email, password, imapHost, imapPort, imapSecure, smtpHost, smtpPort, smtpSecure, usernameFormat } = config;

  try {
    console.log(`🔍 Test IMAP: ${email} sur ${imapHost}:${imapPort} (TLS: ${imapSecure})`);

    // Extraire le nom d'utilisateur (partie avant @)
    const usernameOnly = email.split('@')[0];

    // Test IMAP (réception)
    let lastError = null;
    let successfulUsername = null;

    // OPTIMISATION: Si usernameFormat est déjà connu, l'utiliser directement
    let usernameFormats;
    if (usernameFormat === 'simple') {
      usernameFormats = [usernameOnly]; // Tester uniquement le format simple
      console.log('⚡ Utilisation du format connu: simple username');
    } else if (usernameFormat === 'full') {
      usernameFormats = [email]; // Tester uniquement le format full
      console.log('⚡ Utilisation du format connu: full email');
    } else {
      // Format inconnu, tester les deux
      usernameFormats = [usernameOnly, email];
      console.log('🔄 Format inconnu, test des deux formats');
    }

    for (const username of usernameFormats) {
      try {
        console.log(`🔐 Tentative avec username: "${username}"`);

        await new Promise((resolve, reject) => {
          const imap = new Imap({
            user: username,
            password: password,
            host: imapHost,
            port: imapPort,
            tls: imapSecure,
            tlsOptions: {
              rejectUnauthorized: false,
              minVersion: 'TLSv1',
              maxVersion: 'TLSv1.3'
            },
            connTimeout: 20000,
            authTimeout: 20000,
            xoauth2: false,
            autotls: 'always',
            debug: (msg) => {
              if (msg.includes('AUTH') || msg.includes('LOGIN') || msg.includes('CAPABILITY')) {
                console.log(msg);
              }
            }
          });

          let connectionReady = false;

          imap.once('ready', () => {
            connectionReady = true;
            console.log(`✅ IMAP: Connexion réussie avec username: "${username}"`);

            // Fermeture propre: attendre un peu avant de fermer
            setTimeout(() => {
              try {
                imap.end();
              } catch (e) {
                // Ignorer les erreurs de fermeture
              }
              resolve();
            }, 100);
          });

          imap.once('error', (err) => {
            // Si la connexion était déjà établie et c'est juste ECONNRESET, ignorer
            if (connectionReady && err.code === 'ECONNRESET') {
              console.log('ℹ️  Connexion fermée (ECONNRESET après ready, ignoré)');
              return; // Ne pas reject
            }

            const errorDetails = {
              message: err.message || 'Unknown error',
              code: err.code,
              source: err.source,
              textCode: err.textCode
            };
            console.error(`❌ IMAP Error avec "${username}":`, errorDetails);

            // Créer un message d'erreur plus détaillé
            let errorMessage = err.message || 'Connection failed';
            if (err.source === 'timeout') {
              errorMessage = `Connection timeout - Please check hostname and port (${imapHost}:${imapPort})`;
            } else if (err.source === 'authentication') {
              errorMessage = `Authentication failed - Please check email and password`;
            } else if (err.textCode === 'AUTHENTICATIONFAILED') {
              errorMessage = `Authentication failed for "${username}" - Invalid credentials`;
            }

            reject(new Error(errorMessage));
          });

          imap.connect();
        });

        // Si on arrive ici, la connexion a réussi, sauvegarder le format qui a fonctionné
        successfulUsername = username;
        console.log(`✅ Format de username trouvé: "${username}"`);
        break;

      } catch (err) {
        lastError = err;
        console.log(`⚠️  Échec avec "${username}", essai suivant...`);
        continue;
      }
    }

    // Si toutes les tentatives ont échoué
    if (lastError && !successfulUsername) {
      console.error('❌ Toutes les tentatives de connexion IMAP ont échoué');
      throw lastError;
    }

    console.log('🔍 Test SMTP...');
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

    // Déterminer le format de username qui a fonctionné
    const detectedUsernameFormat = successfulUsername === usernameOnly ? 'simple' : 'full';

    return {
      success: true,
      message: 'Connexion IMAP/SMTP réussie',
      usernameFormat: detectedUsernameFormat, // 'simple' ou 'full'
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

    // Essayer les deux formats de username (simple et email complet)
    const usernameOnly = config.email.split('@')[0];
    const usernameToUse = config.usernameFormat === 'simple' ? usernameOnly : config.email;

    console.log(`📧 Connexion IMAP pour sync: ${usernameToUse} sur ${config.imapHost}:${config.imapPort}`);

    // Connexion IMAP
    const imap = new Imap({
      user: usernameToUse,
      password: decryptedPassword,
      host: config.imapHost,
      port: config.imapPort,
      tls: config.imapSecure,
      tlsOptions: {
        rejectUnauthorized: false,
        minVersion: 'TLSv1',
        maxVersion: 'TLSv1.3'
      },
      xoauth2: false,
      connTimeout: 20000,
      authTimeout: 20000,
    });

    return new Promise((resolve, reject) => {
      let isClosing = false; // Flag pour ignorer les erreurs pendant la fermeture

      imap.once('ready', () => {
        imap.openBox(folder, false, async (err, box) => {
          if (err) {
            isClosing = true;
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
                    console.log('🔍 Vérification email existant pour:', parsed.messageId?.substring(0, 30));

                    // Vérifier si l'email existe déjà
                    const existingEmail = await Communication.findOne({
                      externalId: parsed.messageId,
                      tenant_id: user.tenant_id,
                    });

                    if (existingEmail) {
                      console.log('⏭️  Email déjà existant, ignoré');
                    }

                    if (!existingEmail) {
                      console.log('🆕 Nouvel email, création en cours...');
                      // Créer la communication
                      const communication = new Communication({
                        subject: parsed.subject || '(No Subject)',
                        content: parsed.text || parsed.html || '',
                        snippet: (parsed.text || parsed.html || '').substring(0, 200),
                        sender: {
                          name: parsed.from?.value[0]?.name || parsed.from?.value[0]?.address || 'Unknown',
                          email: parsed.from?.value[0]?.address || 'unknown@unknown.com',
                        },
                        source: 'imap_smtp', // Toujours utiliser 'imap_smtp' pour tous les providers IMAP/SMTP
                        externalId: parsed.messageId || `imap-${Date.now()}-${Math.random()}`,
                        status: 'To Validate',
                        receivedAt: parsed.date || new Date(),
                        slaDueDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
                        tenant_id: user.tenant_id,
                        userId: user._id, // FIX CRITIQUE: Associer l'email à l'utilisateur qui l'a synced
                        attachments: (parsed.attachments || []).map((att) => ({
                          filename: att.filename,
                          contentType: att.contentType,
                          size: att.size,
                        })),
                      });

                      // Sauvegarder d'abord
                      console.log('💾 Tentative de sauvegarde email...');
                      const savedCommunication = await communication.save();
                      emailsSaved++;
                      console.log(`✅ Email sauvegardé: ${parsed.subject?.substring(0, 40)}...`);
                      console.log(`📊 Config AI Analysis:`, {
                        enableAiAnalysis: config.enableAiAnalysis,
                        type: typeof config.enableAiAnalysis,
                        truthyCheck: !!config.enableAiAnalysis,
                      });

                      // Analyse AI si activée (en arrière-plan pour ne pas bloquer)
                      if (config.enableAiAnalysis) {
                        console.log(`🤖 [DÉBUT] Lancement analyse IA pour: ${savedCommunication._id}`);
                        console.log(`📝 Données email pour analyse:`, {
                          id: savedCommunication._id,
                          subject: parsed.subject?.substring(0, 30),
                          contentLength: (parsed.text || parsed.html || '').length,
                          sender: parsed.from?.value[0]?.address,
                        });

                        exports.analyzeEmailAsync(savedCommunication._id, {
                          subject: parsed.subject || '(No Subject)',
                          content: parsed.text || parsed.html || '',
                          sender: {
                            name: parsed.from?.value[0]?.name || 'Unknown',
                            email: parsed.from?.value[0]?.address || 'unknown@unknown.com',
                          },
                        }).catch(err => {
                          console.error('❌ Erreur analyse IA (catch):', err.message, err.stack);
                        });

                        console.log(`🤖 [FIN] Appel analyzeEmailAsync lancé`);
                      } else {
                        console.log(`⏭️  Analyse IA DÉSACTIVÉE (config.enableAiAnalysis = ${config.enableAiAnalysis})`);
                      }
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
              isClosing = true;
              imap.end();
              reject(err);
            });

            fetch.once('end', () => {
              console.log(`✅ Synchronisation ${folder} terminée`);
              isClosing = true; // On ferme intentionnellement
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
        // Ignorer ECONNRESET si on est en train de fermer intentionnellement
        if (isClosing && err.code === 'ECONNRESET') {
          console.log('ℹ️  Connexion fermée (normal)');
          return;
        }
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
        // Vérifier si le dossier n'existe pas
        if (error.message.includes('does not exist') || error.message.includes('mailbox does not exist')) {
          console.log(`⚠️  Dossier "${folder}" n'existe pas, ignoré`);
          results.push({
            success: false,
            folder,
            skipped: true,
            message: 'Dossier inexistant',
          });
        } else {
          console.error(`❌ Erreur sync dossier ${folder}:`, error.message);
          results.push({
            success: false,
            folder,
            error: error.message,
          });
        }
      }
    }

    // --- CORRECTIF : Mettre à jour la date de dernière synchronisation ---
    user.imapSmtpConfig.lastSyncDate = new Date();
    await user.save();
    console.log(`✅ Date de synchro mise à jour pour ${user.email}: ${user.imapSmtpConfig.lastSyncDate}`);

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

    // Utiliser le format de username qui a fonctionné
    const usernameOnly = config.email.split('@')[0];
    const usernameToUse = config.usernameFormat === 'simple' ? usernameOnly : config.email;

    console.log(`📧 Envoi email SMTP: ${usernameToUse}@${config.smtpHost}`);

    // Créer le transporteur SMTP
    const transporter = nodemailer.createTransport({
      host: config.smtpHost,
      port: config.smtpPort,
      secure: config.smtpSecure,
      auth: {
        user: usernameToUse,
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

/**
 * Analyse un email avec Grok de manière asynchrone (non bloquante)
 * @param {String} communicationId - ID de la communication
 * @param {Object} emailData - Données de l'email (subject, content, sender)
 */
exports.analyzeEmailAsync = async (communicationId, emailData) => {
  console.log(`🔵 [analyzeEmailAsync] APPELÉE pour ID: ${communicationId}`);
  console.log(`🔵 [analyzeEmailAsync] emailData:`, {
    subject: emailData.subject?.substring(0, 30),
    contentLength: emailData.content?.length,
    senderEmail: emailData.sender?.email,
  });

  // Exécuter en arrière-plan sans bloquer
  setImmediate(async () => {
    console.log(`🟢 [setImmediate] Démarré pour ID: ${communicationId}`);
    try {
      console.log(`🤖 [${communicationId}] Début analyse IA pour: ${emailData.subject?.substring(0, 30)}...`);
      console.log(`🔑 [${communicationId}] Appel grokService.analyzeCommunication...`);

      const analysis = await grokService.analyzeCommunication(emailData);
      console.log(`✅ [${communicationId}] grokService a retourné une analyse`);


      console.log(`📊 [${communicationId}] Analyse reçue:`, {
        sentiment: analysis.sentiment,
        urgency: analysis.urgency,
        summaryLength: analysis.summary?.length || 0,
      });

      // Mettre à jour la communication avec l'analyse
      const updated = await Communication.findByIdAndUpdate(
        communicationId,
        {
          ai_analysis: {
            summary: analysis.summary,
            sentiment: analysis.sentiment,
            urgency: analysis.urgency,
            requiresResponse: analysis.requiresResponse || false,
            responseReason: analysis.responseReason || '',
            suggestedAction: analysis.actionItems?.join('; ') || '',
            category: analysis.entities?.join(', ') || 'General',
            processedAt: new Date(),
          },
        },
        { new: true }
      );

      if (updated) {
        console.log(`✅ [${communicationId}] Analyse IA terminée et sauvegardée`);

        // Réponse automatique UNIQUEMENT si:
        // 1. Urgence Low/Medium (pas High/Critical)
        // 2. L'IA détermine qu'une réponse est attendue (requiresResponse === true)
        // 3. L'utilisateur a activé les réponses automatiques (autoResponseEnabled === true)
        const shouldAutoRespond =
          (analysis.urgency === 'Low' || analysis.urgency === 'Medium') &&
          analysis.requiresResponse === true;

        if (shouldAutoRespond) {
          console.log(`🤖 [${communicationId}] Urgence ${analysis.urgency} + requiresResponse=true - vérification paramètres utilisateur...`);
          console.log(`📝 [${communicationId}] Raison: ${analysis.responseReason}`);

          try {
            // Récupérer l'utilisateur propriétaire pour la signature
            const user = await User.findById(updated.userId);

            if (!user) {
              console.error(`⚠️  [${communicationId}] Utilisateur non trouvé pour réponse auto`);
              return;
            }

            const noReply = !!(updated.sender?.email && /noreply|no-reply|do-not-reply/i.test(updated.sender.email));
            await Communication.findByIdAndUpdate(communicationId, {
              autoActivation: noReply ? 'never' : (user.autoResponseEnabled ? 'auto' : 'assisted'),
            });

            // Générer la réponse automatique avec Grok (pour envoi ou brouillon)
            const generatedResponse = await grokService.generateAutoResponse(
              updated,
              analysis,
              user
            );

            // Vérifier si l'utilisateur a activé les réponses automatiques
            if (!user.autoResponseEnabled) {
              console.log(`⏭️  [${communicationId}] Réponse automatique désactivée - SAUVEGARDE EN BROUILLON`);
              
              // Sauvegarder comme suggestion (brouillon)
              await Communication.findByIdAndUpdate(communicationId, {
                'ai_analysis.suggestedResponse': generatedResponse,
                awaitingUserInput: true // Faire apparaître dans l'onglet Réponses Auto
              });
              
              return;
            }

            console.log(`✅ [${communicationId}] autoResponseEnabled=true - génération de la réponse...`);

            // Envoyer la réponse par email
            const sendResult = await exports.sendEmail(user._id, {
              to: updated.sender.email,
              subject: `Re: ${updated.subject}`,
              text: generatedResponse,
              html: generatedResponse.replace(/\n/g, '<br>'),
              inReplyTo: updated.externalId,
              references: updated.externalId,
            });

          if (sendResult.success) {
            // Mettre à jour la communication avec les infos de réponse auto
            await Communication.findByIdAndUpdate(communicationId, {
              hasAutoResponse: true,
              autoResponseSentAt: new Date(),
              autoResponseContent: generatedResponse,
              status: 'Validated', // Marquer comme validé car répondu automatiquement
              hasBeenReplied: true,
              repliedAt: new Date(),
              repliedBy: user._id,
            });

            console.log(`✅ [${communicationId}] Réponse automatique envoyée avec succès`);
          } else {
            console.error(`❌ [${communicationId}] Échec envoi réponse auto:`, sendResult.message);
            }
          } catch (autoResponseError) {
            console.error(`❌ [${communicationId}] Erreur réponse automatique:`, autoResponseError.message);
            // Ne pas bloquer en cas d'erreur - l'email reste sans réponse auto
          }
        } else {
          if (analysis.urgency === 'High' || analysis.urgency === 'Critical') {
            console.log(`⏭️  [${communicationId}] Urgence ${analysis.urgency} - SAUVEGARDE EN BROUILLON`);
            
            try {
              const user = await User.findById(updated.userId);
              if (user && analysis.requiresResponse) {
                // Générer un brouillon même pour les urgences élevées
                const draftResponse = await grokService.generateAutoResponse(
                  updated,
                  analysis,
                  user
                );
                
                await Communication.findByIdAndUpdate(communicationId, {
                  'ai_analysis.suggestedResponse': draftResponse,
                  awaitingUserInput: false // Ne pas mettre dans "awaitingUserInput" car c'est urgent (onglet "À Répondre")
                });
              }
            } catch (err) {
              console.error('Erreur génération brouillon High/Critical:', err);
            }
            await Communication.findByIdAndUpdate(communicationId, { autoActivation: 'never' });
          } else if (!analysis.requiresResponse) {
            console.log(`⏭️  [${communicationId}] requiresResponse=false - pas de réponse automatique`);
            console.log(`📝 [${communicationId}] Raison: ${analysis.responseReason}`);
            await Communication.findByIdAndUpdate(communicationId, { autoActivation: 'never' });
          }
        }
      } else {
        console.error(`⚠️  [${communicationId}] Communication non trouvée pour mise à jour IA`);
      }
    } catch (error) {
      console.error(`❌ [${communicationId}] Erreur analyse IA:`, {
        subject: emailData.subject,
        error: error.message,
        stack: error.stack?.split('\n')[0],
      });
      // Ne pas bloquer en cas d'erreur - l'analyse restera "pending"
    }
  });
};
