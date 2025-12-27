/**
 * Email Controller
 *
 * Controller pour gérer les configurations email (IMAP/SMTP)
 */

const User = require('../models/User');
const Tenant = require('../models/Tenant');
const imapSmtpService = require('../services/imapSmtpService');
const encryptionService = require('../services/encryptionService');

/**
 * Obtenir les configurations de providers disponibles
 */
exports.getProviderConfigs = async (req, res) => {
  try {
    const configs = imapSmtpService.getAllProviderConfigs();

    return res.status(200).json({
      success: true,
      data: configs,
    });
  } catch (error) {
    console.error('❌ Erreur getProviderConfigs:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des configurations',
    });
  }
};

/**
 * Tester une connexion IMAP/SMTP (sans sauvegarder)
 */
exports.testConnection = async (req, res) => {
  try {
    const { email, password, imapHost, imapPort, imapSecure, smtpHost, smtpPort, smtpSecure } = req.body;

    console.log('📧 Test de connexion IMAP/SMTP reçu:');
    console.log('  Email:', email);
    console.log('  IMAP Host:', imapHost);
    console.log('  IMAP Port:', imapPort);
    console.log('  IMAP Secure:', imapSecure);
    console.log('  SMTP Host:', smtpHost);
    console.log('  SMTP Port:', smtpPort);
    console.log('  SMTP Secure:', smtpSecure);

    // Validation
    if (!email || !password || !imapHost || !imapPort || !smtpHost || !smtpPort) {
      console.error('❌ Validation échouée - champs manquants');
      return res.status(400).json({
        success: false,
        message: 'Tous les champs sont requis',
      });
    }

    // Tester la connexion
    const result = await imapSmtpService.testConnection({
      email,
      password,
      imapHost,
      imapPort,
      imapSecure: imapSecure !== false, // Par défaut true
      smtpHost,
      smtpPort,
      smtpSecure: smtpSecure === true, // Par défaut false
    });

    if (result.success) {
      return res.status(200).json({
        success: true,
        message: 'Connexion réussie! Vous pouvez sauvegarder la configuration.',
        usernameFormat: result.usernameFormat, // Retourner le format qui a fonctionné
      });
    } else {
      return res.status(400).json({
        success: false,
        message: result.message,
      });
    }
  } catch (error) {
    console.error('❌ Erreur testConnection:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Erreur lors du test de connexion',
    });
  }
};

/**
 * Configurer IMAP/SMTP pour un utilisateur
 */
exports.configureImapSmtp = async (req, res) => {
  try {
    const userId = req.user._id;
    const {
      email,
      password,
      providerName,
      imapHost,
      imapPort,
      imapSecure,
      smtpHost,
      smtpPort,
      smtpSecure,
      foldersToSync,
      enableAiAnalysis,
      usernameFormat, // Format username qui a fonctionné au test
    } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email et mot de passe requis',
      });
    }

    // Si providerName est fourni, utiliser la config prédéfinie
    let config = {
      email,
      password,
      imapHost,
      imapPort: imapPort || 993,
      imapSecure: imapSecure !== false,
      smtpHost,
      smtpPort: smtpPort || 587,
      smtpSecure: smtpSecure === true,
      providerName: providerName || 'custom',
    };

    // Si provider connu, merger avec config prédéfinie
    // IMPORTANT: Les valeurs de l'utilisateur ont la PRIORITÉ sur le preset
    if (providerName && providerName !== 'custom') {
      const providerConfig = imapSmtpService.getProviderConfig(providerName);
      if (providerConfig) {
        config = {
          ...config,
          // Utiliser les valeurs de l'utilisateur si présentes, sinon fallback sur le preset
          imapHost: config.imapHost || providerConfig.imapHost,
          imapPort: config.imapPort || providerConfig.imapPort,
          imapSecure: config.imapSecure !== undefined ? config.imapSecure : providerConfig.imapSecure,
          smtpHost: config.smtpHost || providerConfig.smtpHost,
          smtpPort: config.smtpPort || providerConfig.smtpPort,
          smtpSecure: config.smtpSecure !== undefined ? config.smtpSecure : providerConfig.smtpSecure,
        };
      }
    }

    // Tester la connexion avant de sauvegarder
    console.log('🧪 Configuration finale pour le test:');
    console.log('  IMAP Host:', config.imapHost);
    console.log('  IMAP Port:', config.imapPort);
    console.log('  IMAP Secure:', config.imapSecure);
    console.log('  SMTP Host:', config.smtpHost);
    console.log('  SMTP Port:', config.smtpPort);
    console.log('  SMTP Secure:', config.smtpSecure);

    const testResult = await imapSmtpService.testConnection(config);

    if (!testResult.success) {
      console.error('❌ Test de connexion échoué:', testResult.message);
      return res.status(400).json({
        success: false,
        message: `Test de connexion échoué: ${testResult.message}`,
      });
    }

    console.log('✅ Test de connexion réussi!');

    // Chiffrer le mot de passe
    const encryptedPassword = encryptionService.encrypt(password);

    // Sauvegarder la configuration dans User
    const user = await User.findByIdAndUpdate(
      userId,
      {
        'imapSmtpConfig.email': email,
        'imapSmtpConfig.password': encryptedPassword,
        'imapSmtpConfig.imapHost': config.imapHost,
        'imapSmtpConfig.imapPort': config.imapPort,
        'imapSmtpConfig.imapSecure': config.imapSecure,
        'imapSmtpConfig.smtpHost': config.smtpHost,
        'imapSmtpConfig.smtpPort': config.smtpPort,
        'imapSmtpConfig.smtpSecure': config.smtpSecure,
        'imapSmtpConfig.providerName': config.providerName,
        'imapSmtpConfig.foldersToSync': foldersToSync || ['INBOX', 'Sent'],
        'imapSmtpConfig.enableAiAnalysis': enableAiAnalysis !== false,
        'imapSmtpConfig.usernameFormat': usernameFormat || 'full', // Sauvegarder le format qui a fonctionné
        'imapSmtpConfig.isConnected': true,
        'imapSmtpConfig.lastSyncDate': null,
        activeEmailProvider: 'imap_smtp',
        hasConfiguredEmail: true, // ✅ FIX: Marquer l'email comme configuré
      },
      { new: true }
    );

    // Lancer la première synchronisation
    console.log('🔄 Lancement de la synchronisation initiale...');
    imapSmtpService.syncAllFolders(userId).catch((err) => {
      console.error('❌ Erreur synchronisation initiale:', err);
    });

    return res.status(200).json({
      success: true,
      message: 'Configuration IMAP/SMTP sauvegardée avec succès! Synchronisation en cours...',
      data: {
        email: user.imapSmtpConfig.email,
        providerName: user.imapSmtpConfig.providerName,
        isConnected: user.imapSmtpConfig.isConnected,
        foldersToSync: user.imapSmtpConfig.foldersToSync,
      },
    });
  } catch (error) {
    console.error('❌ Erreur configureImapSmtp:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Erreur lors de la configuration IMAP/SMTP',
    });
  }
};

/**
 * Déconnecter IMAP/SMTP
 */
exports.disconnectImapSmtp = async (req, res) => {
  try {
    const userId = req.user._id;

    await User.findByIdAndUpdate(userId, {
      'imapSmtpConfig.email': null,
      'imapSmtpConfig.password': null,
      'imapSmtpConfig.imapHost': null,
      'imapSmtpConfig.imapPort': 993,
      'imapSmtpConfig.imapSecure': true,
      'imapSmtpConfig.smtpHost': null,
      'imapSmtpConfig.smtpPort': 587,
      'imapSmtpConfig.smtpSecure': false,
      'imapSmtpConfig.providerName': 'custom',
      'imapSmtpConfig.foldersToSync': ['INBOX', 'Sent'],
      'imapSmtpConfig.enableAiAnalysis': true,
      'imapSmtpConfig.isConnected': false,
      'imapSmtpConfig.lastSyncDate': null,
      activeEmailProvider: null,
      hasConfiguredEmail: false, // ✅ FIX: Marquer l'email comme NON configuré
    });

    return res.status(200).json({
      success: true,
      message: 'IMAP/SMTP déconnecté avec succès',
    });
  } catch (error) {
    console.error('❌ Erreur disconnectImapSmtp:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la déconnexion',
    });
  }
};

/**
 * Obtenir le statut de la configuration email
 */
exports.getEmailStatus = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé',
      });
    }

    let companyHistoryStartDate = null;

    if (user.tenant_id) {
      const tenant = await Tenant.findById(user.tenant_id).select('emailHistoryStartDate');
      companyHistoryStartDate = tenant?.emailHistoryStartDate || null;
    }

    const status = {
      activeProvider: user.activeEmailProvider,
      outlook: {
        isConnected: user.outlookConfig?.isConnected || false,
        email: user.outlookConfig?.linkedEmail || null,
        lastSyncDate: user.outlookConfig?.lastSyncDate || null,
      },
      imapSmtp: {
        isConnected: user.imapSmtpConfig?.isConnected || false,
        email: user.imapSmtpConfig?.email || null,
        providerName: user.imapSmtpConfig?.providerName || null,
        lastSyncDate: user.imapSmtpConfig?.lastSyncDate || null,
        foldersToSync: user.imapSmtpConfig?.foldersToSync || [],
        enableAiAnalysis: user.imapSmtpConfig?.enableAiAnalysis || false,
      },
      companyHistoryStartDate,
    };

    return res.status(200).json({
      success: true,
      data: status,
    });
  } catch (error) {
    console.error('❌ Erreur getEmailStatus:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du statut',
    });
  }
};

/**
 * Synchroniser manuellement les emails
 * Utilise Outlook Graph API ou IMAP selon le provider actif
 */
exports.syncEmails = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé',
      });
    }

    // Vérifier le provider actif
    if (!user.activeEmailProvider) {
      return res.status(400).json({
        success: false,
        message: 'Aucun service email configuré',
      });
    }

    let result;

    if (user.activeEmailProvider === 'outlook') {
      // Synchronisation via Outlook Graph API
      if (!user.outlookConfig?.isConnected) {
        return res.status(400).json({
          success: false,
          message: 'Outlook non connecté',
        });
      }

      const outlookSyncService = require('../services/outlookSyncService');
      result = await outlookSyncService.syncUserEmails(userId);

      return res.status(200).json({
        success: true,
        message: `Synchronisation Outlook terminée: ${result.created || 0} nouveaux emails`,
        data: result,
      });

    } else if (user.activeEmailProvider === 'imap_smtp') {
      // Synchronisation via IMAP
      if (!user.imapSmtpConfig?.isConnected) {
        return res.status(400).json({
          success: false,
          message: 'IMAP/SMTP non configuré',
        });
      }

      result = await imapSmtpService.syncAllFolders(userId);

      return res.status(200).json({
        success: true,
        message: 'Synchronisation IMAP/SMTP terminée',
        data: result,
      });
    } else {
      return res.status(400).json({
        success: false,
        message: 'Provider email inconnu',
      });
    }

  } catch (error) {
    console.error('❌ Erreur syncEmails:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Erreur lors de la synchronisation',
    });
  }
};

/**
 * Envoyer un email
 * Utilise Outlook Graph API ou SMTP selon le provider actif
 */
exports.sendEmailViaSmtp = async (req, res) => {
  try {
    const userId = req.user._id;
    const { to, subject, text, html, inReplyTo, references } = req.body;

    // Validation
    if (!to || !subject || (!text && !html)) {
      return res.status(400).json({
        success: false,
        message: 'Destinataire, sujet et contenu requis',
      });
    }

    const user = await User.findById(userId).select(
      'activeEmailProvider +outlookConfig.accessToken +outlookConfig.refreshToken outlookConfig.expiry'
    );

    if (!user || !user.activeEmailProvider) {
      return res.status(400).json({
        success: false,
        message: 'Aucun service email configuré',
      });
    }

    if (user.activeEmailProvider === 'outlook') {
      // Envoi via Outlook Graph API
      if (!user.outlookConfig?.isConnected) {
        return res.status(400).json({
          success: false,
          message: 'Outlook non connecté',
        });
      }

      const outlookService = require('../services/outlookService');
      let accessToken = user.outlookConfig.accessToken;

      // Vérifier si le token est expiré et le rafraîchir si nécessaire
      if (outlookService.isTokenExpired(user.outlookConfig.expiry)) {
        console.log('🔄 Access token expiré, rafraîchissement...');

        const refreshedTokens = await outlookService.refreshAccessToken(
          user.outlookConfig.refreshToken
        );
        const newExpiryDate = outlookService.calculateExpiryDate(
          refreshedTokens.expiresIn
        );

        await User.findByIdAndUpdate(userId, {
          $set: {
            'outlookConfig.accessToken': refreshedTokens.accessToken,
            'outlookConfig.refreshToken': refreshedTokens.refreshToken,
            'outlookConfig.expiry': newExpiryDate,
          },
        });

        accessToken = refreshedTokens.accessToken;
      }

      // Envoyer via Graph API
      await outlookService.sendEmail(accessToken, {
        to: Array.isArray(to) ? to : [to],
        subject,
        body: html || text,
        isHtml: !!html,
      });

      return res.status(200).json({
        success: true,
        message: 'Email envoyé via Outlook Graph API',
      });

    } else if (user.activeEmailProvider === 'imap_smtp') {
      // Envoi via SMTP
      if (!user.imapSmtpConfig?.isConnected) {
        return res.status(400).json({
          success: false,
          message: 'IMAP/SMTP non configuré',
        });
      }

      const result = await imapSmtpService.sendEmail(userId, {
        to,
        subject,
        text,
        html,
        inReplyTo,
        references,
      });

      if (result.success) {
        return res.status(200).json(result);
      } else {
        return res.status(400).json(result);
      }
    } else {
      return res.status(400).json({
        success: false,
        message: 'Provider email inconnu',
      });
    }

  } catch (error) {
    console.error('❌ Erreur sendEmail:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Erreur lors de l\'envoi de l\'email',
    });
  }
};
