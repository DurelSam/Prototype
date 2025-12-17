const fs = require('fs').promises;
const path = require('path');
const nodemailer = require('nodemailer');

/**
 * System email sending service (transactional)
 * Used for: email verification, password reset, system notifications
 *
 * Unlike emailService.js which uses user email configurations,
 * this service uses a single system SMTP configuration defined in .env
 */

/**
 * Create Nodemailer transporter with system SMTP configuration
 * @returns {Object} Configured Nodemailer transporter
 */
function createTransporter() {
  // Check that environment variables are defined
  if (!process.env.SYSTEM_SMTP_HOST || !process.env.SYSTEM_SMTP_USER || !process.env.SYSTEM_SMTP_PASS) {
    throw new Error('System SMTP configuration missing in .env (SYSTEM_SMTP_HOST, SYSTEM_SMTP_USER, SYSTEM_SMTP_PASS)');
  }

  const config = {
    host: process.env.SYSTEM_SMTP_HOST,
    port: parseInt(process.env.SYSTEM_SMTP_PORT) || 587,
    secure: process.env.SYSTEM_SMTP_SECURE === 'true', // true pour port 465, false pour autres ports
    auth: {
      user: process.env.SYSTEM_SMTP_USER,
      pass: process.env.SYSTEM_SMTP_PASS,
    },
    tls: {
      rejectUnauthorized: false, // Accept self-signed certificates (for development)
    },
  };

  console.log(`📧 Configuration SMTP système: ${config.host}:${config.port} (${config.auth.user})`);

  return nodemailer.createTransport(config);
}

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
 * Send system email
 * @param {string} to - Recipient email address
 * @param {string} subject - Email subject
 * @param {string} htmlContent - HTML email content
 * @returns {Promise<Object>} - Send result
 */
async function sendSystemEmail(to, subject, htmlContent) {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: `"${process.env.SYSTEM_EMAIL_FROM_NAME || 'Communications Platform'}" <${process.env.SYSTEM_EMAIL_FROM || process.env.SYSTEM_SMTP_USER}>`,
      to,
      subject,
      html: htmlContent,
    };

    const info = await transporter.sendMail(mailOptions);

    console.log(`✅ System email sent: ${subject} -> ${to} [${info.messageId}]`);

    return {
      success: true,
      messageId: info.messageId,
      message: 'Email sent successfully',
    };

  } catch (error) {
    console.error(`❌ Error sending system email: ${error.message}`);
    throw error;
  }
}

/**
 * Send verification email to new user
 * @param {Object} userData - User data
 * @param {string} userData.email - User email
 * @param {string} userData.firstName - User first name
 * @param {string} userData.lastName - User last name
 * @param {string} userData.companyName - Company name
 * @param {string} verificationToken - Verification token
 * @returns {Promise<Object>} - Send result
 */
async function sendVerificationEmail(userData, verificationToken) {
  try {
    // Load template
    const template = await loadTemplate('email-verification');

    // Build verification URL
    const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email/${verificationToken}`;

    // Prepare variables
    const variables = {
      firstName: userData.firstName || 'User',
      lastName: userData.lastName || '',
      companyName: userData.companyName || 'Your Company',
      verificationUrl,
      currentYear: new Date().getFullYear(),
    };

    // Replace variables
    const htmlContent = replaceVariables(template, variables);

    // Send email
    await sendSystemEmail(
      userData.email,
      'Verify Your Email Address',
      htmlContent
    );

    console.log(`✅ Verification email sent to: ${userData.email}`);

    return {
      success: true,
      message: 'Verification email sent',
    };

  } catch (error) {
    console.error('❌ Error sending verification email:', error.message);
    throw error;
  }
}

/**
 * Send password reset email
 * @param {Object} userData - User data
 * @param {string} userData.email - User email
 * @param {string} userData.firstName - User first name
 * @param {string} userData.lastName - User last name
 * @param {string} resetToken - Reset token
 * @returns {Promise<Object>} - Send result
 */
async function sendPasswordResetEmail(userData, resetToken) {
  try {
    // Load template
    const template = await loadTemplate('password-reset');

    // Build reset URL
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password/${resetToken}`;

    // Prepare variables
    const variables = {
      firstName: userData.firstName || 'User',
      lastName: userData.lastName || '',
      resetUrl,
      currentYear: new Date().getFullYear(),
    };

    // Replace variables
    const htmlContent = replaceVariables(template, variables);

    // Send email
    await sendSystemEmail(
      userData.email,
      'Password Reset Request',
      htmlContent
    );

    console.log(`✅ Password reset email sent to: ${userData.email}`);

    return {
      success: true,
      message: 'Password reset email sent',
    };

  } catch (error) {
    console.error('❌ Error sending password reset email:', error.message);
    throw error;
  }
}

/**
 * Test system SMTP configuration
 * Utility function to verify that email sending works
 * @returns {Promise<boolean>} - true if connection succeeds
 */
async function testSmtpConnection() {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    console.log('✅ System SMTP configuration valid');
    return true;
  } catch (error) {
    console.error('❌ Error in system SMTP configuration:', error.message);
    return false;
  }
}

module.exports = {
  sendVerificationEmail,
  sendPasswordResetEmail,
  testSmtpConnection,
  loadTemplate,
  replaceVariables,
};
