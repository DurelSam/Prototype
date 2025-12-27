const fs = require('fs').promises;
const path = require('path');
const imapSmtpService = require('./imapSmtpService');
const outlookService = require('./outlookService');
const User = require('../models/User');

/**
 * Email sending service using user email configurations
 * Supports IMAP/SMTP and Outlook
 */

/**
 * Load HTML template from file system
 * @param {string} templateName - Template name (without .html)
 * @returns {Promise<string>} - HTML template content
 */
async function loadTemplate(templateName) {
  try {
    const templatePath = path.join(__dirname, '..', 'templates', 'emails', `${templateName}.html`);
    const templateContent = await fs.readFile(templatePath, 'utf-8');
    return templateContent;
  } catch (error) {
    console.error(`❌ Error loading template ${templateName}:`, error.message);
    throw new Error(`Template ${templateName} not found`);
  }
}

/**
 * Replace variables in HTML template
 * @param {string} template - Template content
 * @param {Object} variables - Object with variables to replace
 * @returns {string} - Template with replaced variables
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
 * Envoyer un email via IMAP/SMTP en utilisant le service unifié
 * @param {string} userId - ID de l'utilisateur
 * @param {string} to - Adresse email destinataire
 * @param {string} subject - Sujet de l'email
 * @param {string} htmlContent - Contenu HTML de l'email
 */
async function sendViaImapSmtp(userId, to, subject, htmlContent) {
  try {
    const result = await imapSmtpService.sendEmail(userId, {
      to,
      subject,
      text: htmlContent.replace(/<[^>]*>/g, ''), // Fallback texte
      html: htmlContent,
    });

    if (!result.success) {
      throw new Error(result.message);
    }

    console.log(`✅ Email sent via IMAP/SMTP: ${to}`);
  } catch (error) {
    console.error('❌ Error sending email via IMAP/SMTP:', error.message);
    throw error;
  }
}

/**
 * Envoyer un email via Outlook en utilisant le service unifié
 * @param {string} userId - ID de l'utilisateur
 * @param {string} to - Adresse email destinataire
 * @param {string} subject - Sujet de l'email
 * @param {string} htmlContent - Contenu HTML de l'email
 */
async function sendViaOutlook(userId, to, subject, htmlContent) {
  try {
    const result = await outlookService.sendEmailAsUser(userId, {
      to,
      subject,
      body: htmlContent,
    });

    if (!result.success) {
      throw new Error(result.message);
    }

    console.log(`✅ Email sent via Outlook: ${to}`);
  } catch (error) {
    console.error('❌ Error sending email via Outlook:', error.message);
    throw error;
  }
}

/**
 * Send email using sender's configuration (unified method)
 * @param {string} senderUserId - Sender user ID
 * @param {string} to - Recipient email address
 * @param {string} subject - Email subject
 * @param {string} htmlContent - HTML email content
 */
async function sendEmail(senderUserId, to, subject, htmlContent) {
  try {
    // Get sender user to check email configuration
    const sender = await User.findById(senderUserId).select('activeEmailProvider hasConfiguredEmail');

    if (!sender) {
      throw new Error('Sender user not found');
    }

    // Verify sender has configured email
    if (!sender.hasConfiguredEmail) {
      throw new Error('Sender has not configured email');
    }

    // Send according to active provider using unified services
    if (sender.activeEmailProvider === 'imap_smtp') {
      await sendViaImapSmtp(senderUserId, to, subject, htmlContent);
    } else if (sender.activeEmailProvider === 'outlook') {
      await sendViaOutlook(senderUserId, to, subject, htmlContent);
    } else {
      throw new Error('Email provider not supported');
    }

    return {
      success: true,
      message: 'Email sent successfully',
    };

  } catch (error) {
    console.error('❌ Error sending email:', error.message);
    throw error;
  }
}

/**
 * Send welcome email to new Admin
 * @param {string} senderUserId - UpperAdmin ID who created the Admin
 * @param {Object} adminData - Created Admin data
 * @param {string} temporaryPassword - Generated temporary password
 */
async function sendAdminWelcomeEmail(senderUserId, adminData, temporaryPassword) {
  const template = await loadTemplate('admin-welcome');
  const variables = {
    adminFirstName: adminData.firstName || 'Admin',
    adminLastName: adminData.lastName || '',
    adminEmail: adminData.email,
    temporaryPassword: temporaryPassword,
    loginUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
    companyName: adminData.tenant_id?.companyName || 'Your Company',
    currentYear: new Date().getFullYear(),
  };
  const htmlContent = replaceVariables(template, variables);
  const result = await sendEmail(
    senderUserId,
    adminData.email,
    'Welcome - Your Administrator Account Has Been Created',
    htmlContent
  );
  return result;
}

/**
 * Send welcome email to new Employee
 * @param {string} senderUserId - Admin ID who created the Employee
 * @param {Object} employeeData - Created Employee data
 * @param {string} temporaryPassword - Generated temporary password
 */
async function sendEmployeeWelcomeEmail(senderUserId, employeeData, temporaryPassword) {
  const template = await loadTemplate('employee-welcome');
  const variables = {
    employeeFirstName: employeeData.firstName || 'Employee',
    employeeLastName: employeeData.lastName || '',
    employeeEmail: employeeData.email,
    temporaryPassword: temporaryPassword,
    loginUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
    companyName: employeeData.tenant_id?.companyName || 'Your Company',
    currentYear: new Date().getFullYear(),
  };
  const htmlContent = replaceVariables(template, variables);
  const result = await sendEmail(
    senderUserId,
    employeeData.email,
    'Welcome - Your Employee Account Has Been Created',
    htmlContent
  );
  return result;
}

/**
 * Send transfer notification email to Employee
 * @param {string} senderUserId - UpperAdmin ID who performed the transfer
 * @param {Object} employeeData - Transferred Employee data
 * @param {Object} oldAdmin - Previous Admin
 * @param {Object} newAdmin - New Admin
 */
async function sendEmployeeTransferEmail(senderUserId, employeeData, oldAdmin, newAdmin) {
  try {
    // Load template
    const template = await loadTemplate('employee-transfer');

    // Prepare variables
    const variables = {
      employeeFirstName: employeeData.firstName || 'Employee',
      employeeLastName: employeeData.lastName || '',
      oldAdminName: `${oldAdmin.firstName} ${oldAdmin.lastName}`.trim() || oldAdmin.email,
      newAdminName: `${newAdmin.firstName} ${newAdmin.lastName}`.trim() || newAdmin.email,
      newAdminEmail: newAdmin.email,
      loginUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
      companyName: employeeData.tenant_id?.companyName || 'Your Company',
      currentYear: new Date().getFullYear(),
    };

    // Replace variables
    const htmlContent = replaceVariables(template, variables);

    // Send email
    await sendEmail(
      senderUserId,
      employeeData.email,
      'Notification - Manager Change',
      htmlContent
    );

    console.log(`✅ Transfer email sent to: ${employeeData.email}`);

  } catch (error) {
    console.error('❌ Error sending Employee transfer email:', error.message);
    // Do not throw error to avoid blocking transfer
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
