const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/authMiddleware');

// ========================================
// ROUTES PUBLIQUES (non authentifiées)
// ========================================

/**
 * POST /api/auth/register
 * Inscription UpperAdmin uniquement
 * Body: { companyName, email, password, firstName, lastName }
 */
router.post('/register', authController.registerUpperAdmin);

/**
 * GET /api/auth/verify-email/:token
 * Vérification email UpperAdmin
 * Params: token
 */
router.get('/verify-email/:token', authController.verifyEmail);

/**
 * POST /api/auth/resend-verification
 * Renvoyer email de vérification
 * Body: { email }
 */
router.post('/resend-verification', authController.resendVerificationEmail);

/**
 * POST /api/auth/login
 * Connexion tous utilisateurs
 * Body: { email, password }
 */
router.post('/login', authController.login);

/**
 * POST /api/auth/forgot-password
 * Demande de réinitialisation mot de passe
 * Body: { email }
 */
router.post('/forgot-password', authController.forgotPassword);

/**
 * POST /api/auth/reset-password/:token
 * Réinitialiser mot de passe
 * Params: token
 * Body: { password }
 */
router.post('/reset-password/:token', authController.resetPassword);

// ========================================
// ROUTES PROTÉGÉES (authentifiées)
// ========================================

/**
 * GET /api/auth/me
 * Récupérer profil utilisateur connecté
 */
router.get('/me', authenticate, authController.getMe);

/**
 * PUT /api/auth/change-password
 * Changer son mot de passe
 * Body: { currentPassword, newPassword }
 */
router.put('/change-password', authenticate, authController.changePassword);

/**
 * POST /api/auth/logout
 * Déconnexion
 */
router.post('/logout', authenticate, authController.logout);

module.exports = router;
