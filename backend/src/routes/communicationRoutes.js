const express = require("express");
const router = express.Router();
const {
  getCommunications,
  getCommunicationById,
  updateStatus,
  addNote,
  getStats,
  getDashboardStats, // <--- NOUVEAU
  markAsRead, // <--- NOUVEAU
  assignUser, // <--- NOUVEAU
  triggerAiAnalysis, // <--- NOUVEAU
  replyToCommunication, // <--- NOUVEAU
  getAwaitingInputEmails, // <--- RÉPONSES ASSISTÉES
  getAutoCandidates, // <--- RÉPONSES AUTO (NOUVEAU)
  getAutoCandidateIds, // <--- IDS des candidats auto
  generateSuggestionForEmail, // <--- RÉGÉNÉRATION SUGGESTION
  generateQuestionsForEmail, // <--- RÉPONSES ASSISTÉES
  previewDraftFromAnswers, // <--- RÉPONSES ASSISTÉES (PREVIEW)
  submitQuestionnaireAndReply, // <--- RÉPONSES ASSISTÉES
} = require("../controllers/communicationController");
const { protect } = require("../middleware/authMiddleware");

// ============================================
// ROUTES COMMUNICATIONS
// ============================================

/**
 * @route   GET /api/communications/stats/dashboard
 * @desc    Récupère les statistiques spécifiques au Dashboard (RBAC)
 * @access  Private
 * ⚠️ IMPORTANT : Doit rester AVANT la route /:id
 */
router.get("/stats/dashboard", protect, getDashboardStats);

/**
 * @route   GET /api/communications/stats
 * @desc    Récupère les statistiques (KPIs)
 * @access  Private
 * ⚠️ IMPORTANT : Doit rester AVANT la route /:id
 */
router.get("/stats", protect, getStats);

/**
 * @route   GET /api/communications/auto-candidates
 * @desc    Récupère les emails éligibles aux Réponses Auto (Low/Medium, suggestion IA, non répondu)
 * @access  Private
 * @query   search, priority, dateRange, page, limit
 * ⚠️ IMPORTANT : Doit rester AVANT la route /:id
 */
router.get("/auto-candidates", protect, getAutoCandidates);
router.get("/auto-candidates/ids", protect, getAutoCandidateIds);

/**
 * @route   GET /api/communications/awaiting-input
 * @desc    Récupère les emails en attente de réponse utilisateur (awaitingUserInput: true)
 * @access  Private
 * ⚠️ IMPORTANT : Doit rester AVANT la route /:id
 */
router.get("/awaiting-input", protect, getAwaitingInputEmails);

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
 * @route   POST /api/communications/:id/generate-suggestion
 * @desc    IA: Régénérer la suggestion de réponse (suggestedResponse)
 * @access  Private
 */
router.post("/:id/generate-suggestion", protect, generateSuggestionForEmail);

/**
 * @route   POST /api/communications/:id/reply
 * @desc    Répondre manuellement à un email High/Critical
 * @access  Private
 * @body    { replyContent: "Message de réponse" }
 */
router.post("/:id/reply", protect, replyToCommunication);

/**
 * @route   POST /api/communications/:id/notes
 * @desc    Ajouter une note interne
 * @access  Private
 */
router.post("/:id/notes", protect, addNote);

// ============================================
// RÉPONSES ASSISTÉES (QUESTIONNAIRE IA)
// ============================================

/**
 * @route   POST /api/communications/:id/generate-questions
 * @desc    Génère des questions contextuelles IA pour un email spécifique
 * @access  Private
 */
router.post("/:id/generate-questions", protect, generateQuestionsForEmail);

/**
 * @route   POST /api/communications/:id/preview-reply
 * @desc    Génère un brouillon de réponse basé sur les réponses du questionnaire (Preview)
 * @access  Private
 */
router.post("/:id/preview-reply", protect, previewDraftFromAnswers);

/**
 * @route   POST /api/communications/:id/submit-questionnaire
 * @desc    Soumet les réponses de l'utilisateur → Génère réponse IA → Envoie l'email
 * @access  Private
 * @body    { userAnswers: {...} }
 */
router.post("/:id/submit-questionnaire", protect, submitQuestionnaireAndReply);

module.exports = router;
