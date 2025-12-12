/**
 * Email Routes
 *
 * Routes pour la gestion des configurations email (IMAP/SMTP)
 */

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const emailController = require('../controllers/emailController');

// Toutes les routes sont protégées
router.use(protect);

// ========== ROUTES PROVIDER CONFIGS ==========

// Obtenir les configurations de providers disponibles
router.get('/providers', emailController.getProviderConfigs);

// ========== ROUTES IMAP/SMTP ==========

// Tester une connexion IMAP/SMTP (sans sauvegarder)
router.post('/imap-smtp/test', emailController.testConnection);

// Configurer IMAP/SMTP pour l'utilisateur
router.post('/imap-smtp/configure', emailController.configureImapSmtp);

// Déconnecter IMAP/SMTP
router.delete('/imap-smtp/disconnect', emailController.disconnectImapSmtp);

// ========== ROUTES GÉNÉRALES ==========

// Obtenir le statut de la configuration email (Outlook + IMAP/SMTP)
router.get('/status', emailController.getEmailStatus);

// Synchroniser manuellement les emails
router.post('/sync', emailController.syncEmails);

// Envoyer un email via SMTP
router.post('/send', emailController.sendEmailViaSmtp);

module.exports = router;
