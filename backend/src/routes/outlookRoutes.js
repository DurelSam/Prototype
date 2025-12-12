const express = require("express");
const router = express.Router();
const {
  getAuthUrl,
  handleCallback,
  disconnectOutlook,
  getStatus,
  getStats,
  getEmails,
  getEmailById,
  syncEmails,
} = require("../controllers/outlookController");
const { protect } = require("../middleware/authMiddleware");

// ============================================
// ROUTES OAUTH2 - CONNEXION OUTLOOK
// ============================================

/**
 * @route   GET /api/outlook/url
 * @desc    Génère l'URL d'autorisation OAuth2 pour connecter Outlook
 * @access  Private (utilisateur doit être authentifié)
 */
router.get("/url", protect, getAuthUrl);

/**
 * @route   GET /api/outlook/callback
 * @desc    Callback OAuth2 - Reçoit le code d'autorisation de Microsoft
 * @access  Public (callback Microsoft, pas de protection nécessaire)
 */
router.get("/callback", handleCallback);

/**
 * @route   DELETE /api/auth/outlook/disconnect
 * @desc    Déconnecte le compte Outlook (supprime les tokens)
 * @access  Private
 */
router.delete("/disconnect", protect, disconnectOutlook);

/**
 * @route   GET /api/outlook/status
 * @desc    Récupère le statut de connexion Outlook (connecté/déconnecté)
 * @access  Private
 */
router.get("/status", protect, getStatus);

/**
 * @route   GET /api/outlook/stats
 * @desc    Récupère les statistiques Outlook (messages count, last sync)
 * @access  Private
 */
router.get("/stats", protect, getStats);

// ============================================
// ROUTES EMAILS - GESTION DES EMAILS OUTLOOK
// ============================================

/**
 * @route   GET /api/outlook/emails
 * @desc    Récupère les emails Outlook de l'utilisateur
 * @access  Private
 * @query   top (nombre d'emails, défaut: 50)
 * @query   skip (pagination, défaut: 0)
 * @query   filter (filtre OData, ex: "isRead eq false")
 */
router.get("/emails", protect, getEmails);

/**
 * @route   GET /api/outlook/emails/:messageId
 * @desc    Récupère un email spécifique par son ID
 * @access  Private
 */
router.get("/emails/:messageId", protect, getEmailById);

/**
 * @route   POST /api/outlook/sync
 * @desc    Force la synchronisation des emails Outlook
 * @access  Private
 */
router.post("/sync", protect, syncEmails);

module.exports = router;
