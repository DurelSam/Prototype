const express = require("express");
const router = express.Router();
const {
  getCommunications,
  getCommunicationById,
  updateStatus,
  addNote,
  getStats,
  markAsRead, // <--- NOUVEAU
  assignUser, // <--- NOUVEAU
  triggerAiAnalysis, // <--- NOUVEAU
} = require("../controllers/communicationController");
const { protect } = require("../middleware/authMiddleware");

// ============================================
// ROUTES COMMUNICATIONS
// ============================================

/**
 * @route   GET /api/communications/stats
 * @desc    Récupère les statistiques (KPIs)
 * @access  Private
 * ⚠️ IMPORTANT : Doit rester AVANT la route /:id
 */
router.get("/stats", protect, getStats);

/**
 * @route   GET /api/communications
 * @desc    Liste les communications avec filtres (Search, Pagination, Source...)
 * @access  Private
 */
router.get("/", protect, getCommunications);

/**
 * @route   GET /api/communications/:id
 * @desc    Détail d'une communication
 * @access  Private
 */
router.get("/:id", protect, getCommunicationById);

/**
 * @route   PATCH /api/communications/:id/status
 * @desc    Workflow: Changer le statut (Validated, Closed...)
 * @access  Private
 */
router.patch("/:id/status", protect, updateStatus);

/**
 * @route   PATCH /api/communications/:id/read
 * @desc    UX: Marquer comme lu / non lu (isRead)
 * @access  Private
 * @body    { isRead: true }
 */
router.patch("/:id/read", protect, markAsRead);

/**
 * @route   PATCH /api/communications/:id/assign
 * @desc    Assigner le ticket à un utilisateur
 * @access  Private
 * @body    { userId: "ID_MONGO" }
 */
router.patch("/:id/assign", protect, assignUser);

/**
 * @route   POST /api/communications/:id/analyze
 * @desc    IA: Forcer une nouvelle analyse (Résumé, Sentiment)
 * @access  Private
 */
router.post("/:id/analyze", protect, triggerAiAnalysis);

/**
 * @route   POST /api/communications/:id/notes
 * @desc    Ajouter une note interne
 * @access  Private
 */
router.post("/:id/notes", protect, addNote);

module.exports = router;
