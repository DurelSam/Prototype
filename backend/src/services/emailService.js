const fs = require('fs').promises;
const path = require('path');
const imapSmtpService = require('./imapSmtpService');
const outlookService = require('./outlookService');
const User = require('../models/User');

/**
 * Service d'envoi d'emails utilisant les configurations email des utilisateurs
 * Supporte IMAP/SMTP et Outlook
 */

/**
 * Charger un template HTML depuis le système de fichiers
 * @param {string} templateName - Nom du template (sans .html)
 * @returns {Promise<string>} - Contenu HTML du template
 */
async function loadTemplate(templateName) {
  try {
    const templatePath = path.join(__dirname, '..', 'templates', 'emails', `${templateName}.html`);
    const templateContent = await fs.readFile(templatePath, 'utf-8');
    return templateContent;
  } catch (error) {
    console.error(`❌ Erreur chargement template ${templateName}:`, error.message);
    throw new Error(`Template ${templateName} introuvable`);
  }
}

/**
 * Remplacer les variables dans un template HTML
 * @param {string} template - Contenu du template
 * @param {Object} variables - Objet avec les variables à remplacer
 * @returns {string} - Template avec variables remplacées
 */
function replaceVariables(template, variables) {
  let result = template;

  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`{{${key}}}`, 'g');
    result = result.replace(regex, value || '');
  }

  return result;
}

/**
 * Envoyer un email via IMAP/SMTP
 * @param {Object} user - Utilisateur avec configuration IMAP/SMTP
 * @param {string} to - Adresse email destinataire
 * @param {string} subject - Sujet de l'email
 * @param {string} htmlContent - Contenu HTML de l'email
 */
async function sendViaImapSmtp(user, to, subject, htmlContent) {
  try {
    const smtpConfig = {
      host: user.imapSmtpConfig.smtpHost,
      port: user.imapSmtpConfig.smtpPort,
      secure: user.imapSmtpConfig.smtpPort === 465, // true pour 465, false pour 587
      auth: {
        user: user.imapSmtpConfig.emailAddress,
        pass: user.imapSmtpConfig.password,
      },
    };

    await imapSmtpService.sendEmail(smtpConfig, {
      from: user.imapSmtpConfig.emailAddress,
      to,
      subject,
      html: htmlContent,
    });

    console.log(`✅ Email envoyé via IMAP/SMTP: ${to}`);
  } catch (error) {
    console.error('❌ Erreur envoi email IMAP/SMTP:', error.message);
    throw error;
  }
}

/**
 * Envoyer un email via Outlook
 * @param {Object} user - Utilisateur avec configuration Outlook
 * @param {string} to - Adresse email destinataire
 * @param {string} subject - Sujet de l'email
 * @param {string} htmlContent - Contenu HTML de l'email
 */
async function sendViaOutlook(user, to, subject, htmlContent) {
  try {
    await outlookService.sendEmail(user, {
      to,
      subject,
      body: htmlContent,
      bodyType: 'HTML',
    });

    console.log(`✅ Email envoyé via Outlook: ${to}`);
  } catch (error) {
    console.error('❌ Erreur envoi email Outlook:', error.message);
    throw error;
  }
}

/**
 * Envoyer un email en utilisant la configuration de l'expéditeur
 * @param {string} senderUserId - ID de l'utilisateur expéditeur
 * @param {string} to - Adresse email destinataire
 * @param {string} subject - Sujet de l'email
 * @param {string} htmlContent - Contenu HTML de l'email
 */
async function sendEmail(senderUserId, to, subject, htmlContent) {
  try {
    // Récupérer l'utilisateur expéditeur avec sa configuration email
    const sender = await User.findById(senderUserId).select('+imapSmtpConfig.password +outlookConfig.accessToken');

    if (!sender) {
      throw new Error('Utilisateur expéditeur introuvable');
    }

    // Vérifier que l'expéditeur a configuré son email
    if (!sender.hasEmailConfigured()) {
      throw new Error('L\'expéditeur n\'a pas configuré son email');
    }

    // Envoyer selon le provider actif
    if (sender.activeEmailProvider === 'imap_smtp') {
      await sendViaImapSmtp(sender, to, subject, htmlContent);
    } else if (sender.activeEmailProvider === 'outlook') {
      await sendViaOutlook(sender, to, subject, htmlContent);
    } else {
      throw new Error('Provider email non supporté');
    }

    return {
      success: true,
      message: 'Email envoyé avec succès',
    };

  } catch (error) {
    console.error('❌ Erreur envoi email:', error.message);
    throw error;
  }
}

/**
 * Envoyer un email de bienvenue à un nouvel Admin
 * @param {string} senderUserId - ID de l'UpperAdmin qui a créé l'Admin
 * @param {Object} adminData - Données de l'Admin créé
 * @param {string} temporaryPassword - Mot de passe temporaire généré
 */
async function sendAdminWelcomeEmail(senderUserId, adminData, temporaryPassword) {
  try {
    // Charger le template
    const template = await loadTemplate('admin-welcome');

    // Préparer les variables
    const variables = {
      adminFirstName: adminData.firstName || 'Admin',
      adminLastName: adminData.lastName || '',
      adminEmail: adminData.email,
      temporaryPassword: temporaryPassword,
      loginUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
      companyName: adminData.tenant_id?.companyName || 'Votre entreprise',
      currentYear: new Date().getFullYear(),
    };

    // Remplacer les variables
    const htmlContent = replaceVariables(template, variables);

    // Envoyer l'email
    await sendEmail(
      senderUserId,
      adminData.email,
      'Bienvenue - Votre compte Administrateur a été créé',
      htmlContent
    );

    console.log(`✅ Email de bienvenue Admin envoyé à: ${adminData.email}`);

  } catch (error) {
    console.error('❌ Erreur envoi email bienvenue Admin:', error.message);
    // Ne pas lancer d'erreur pour ne pas bloquer la création de l'utilisateur
    // L'admin peut toujours demander un renvoi d'email
  }
}

/**
 * Envoyer un email de bienvenue à un nouvel Employee
 * @param {string} senderUserId - ID de l'Admin qui a créé l'Employee
 * @param {Object} employeeData - Données de l'Employee créé
 * @param {string} temporaryPassword - Mot de passe temporaire généré
 */
async function sendEmployeeWelcomeEmail(senderUserId, employeeData, temporaryPassword) {
  try {
    // Charger le template
    const template = await loadTemplate('employee-welcome');

    // Préparer les variables
    const variables = {
      employeeFirstName: employeeData.firstName || 'Employee',
      employeeLastName: employeeData.lastName || '',
      employeeEmail: employeeData.email,
      temporaryPassword: temporaryPassword,
      loginUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
      companyName: employeeData.tenant_id?.companyName || 'Votre entreprise',
      currentYear: new Date().getFullYear(),
    };

    // Remplacer les variables
    const htmlContent = replaceVariables(template, variables);

    // Envoyer l'email
    await sendEmail(
      senderUserId,
      employeeData.email,
      'Bienvenue - Votre compte Employé a été créé',
      htmlContent
    );

    console.log(`✅ Email de bienvenue Employee envoyé à: ${employeeData.email}`);

  } catch (error) {
    console.error('❌ Erreur envoi email bienvenue Employee:', error.message);
    // Ne pas lancer d'erreur pour ne pas bloquer la création de l'utilisateur
  }
}

/**
 * Envoyer un email de notification de transfert à un Employee
 * @param {string} senderUserId - ID de l'UpperAdmin qui a effectué le transfert
 * @param {Object} employeeData - Données de l'Employee transféré
 * @param {Object} oldAdmin - Ancien Admin
 * @param {Object} newAdmin - Nouveau Admin
 */
async function sendEmployeeTransferEmail(senderUserId, employeeData, oldAdmin, newAdmin) {
  try {
    // Charger le template
    const template = await loadTemplate('employee-transfer');

    // Préparer les variables
    const variables = {
      employeeFirstName: employeeData.firstName || 'Employee',
      employeeLastName: employeeData.lastName || '',
      oldAdminName: `${oldAdmin.firstName} ${oldAdmin.lastName}`.trim() || oldAdmin.email,
      newAdminName: `${newAdmin.firstName} ${newAdmin.lastName}`.trim() || newAdmin.email,
      newAdminEmail: newAdmin.email,
      loginUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
      companyName: employeeData.tenant_id?.companyName || 'Votre entreprise',
      currentYear: new Date().getFullYear(),
    };

    // Remplacer les variables
    const htmlContent = replaceVariables(template, variables);

    // Envoyer l'email
    await sendEmail(
      senderUserId,
      employeeData.email,
      'Notification - Changement de gestionnaire',
      htmlContent
    );

    console.log(`✅ Email de transfert envoyé à: ${employeeData.email}`);

  } catch (error) {
    console.error('❌ Erreur envoi email transfert Employee:', error.message);
    // Ne pas lancer d'erreur pour ne pas bloquer le transfert
  }
}

module.exports = {
  sendEmail,
  sendAdminWelcomeEmail,
  sendEmployeeWelcomeEmail,
  sendEmployeeTransferEmail,
  loadTemplate,
  replaceVariables,
};
