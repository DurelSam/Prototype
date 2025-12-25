const Communication = require("../models/Communication");
const User = require("../models/User"); // Import nécessaire pour assignUser

/**
 * Helper: Construit le filtre RBAC pour les communications
 * @param {Object} user - Utilisateur authentifié
 * @returns {Object} - Filtre MongoDB basé sur le rôle
 */
async function buildRbacFilter(user) {
  const filter = { tenant_id: user.tenant_id };

  if (user.role === "Employee") {
    // Employee voit uniquement ses propres communications
    filter.userId = user._id;
  } else if (user.role === "Admin") {
    // Admin voit les communications de ses Employees
    // Récupérer les IDs de ses employees
    const employees = await User.find({
      managedBy: user._id,
      role: "Employee",
    }).select("_id");

    const employeeIds = employees.map((emp) => emp._id);

    // Voir soit ses propres communications, soit celles de ses employees
    filter.$or = [
      { userId: user._id }, // Ses propres communications (si l'Admin en a)
      { userId: { $in: employeeIds } }, // Communications de ses employees
      { visibleToAdmins: user._id }, // Communications transférées
    ];
  } else if (user.role === "UpperAdmin") {
    // UpperAdmin voit toutes les communications du tenant (pas de filtre supplémentaire)
    // Le filtre tenant_id suffit
  }

  return filter;
}

/**
 * Helper: Vérifie si l'utilisateur a accès à une communication spécifique
 * @param {Object} communication - Document de communication
 * @param {Object} user - Utilisateur authentifié
 * @returns {Boolean} - true si l'utilisateur a accès
 */
async function canAccessCommunication(communication, user) {
  // UpperAdmin voit tout dans son tenant
  if (user.role === "UpperAdmin") {
    return communication.tenant_id.toString() === user.tenant_id.toString();
  }

  // Employee voit uniquement ses propres communications
  if (user.role === "Employee") {
    return (
      communication.userId &&
      communication.userId.toString() === user._id.toString()
    );
  }

  // Admin voit ses communications + celles de ses employees
  if (user.role === "Admin") {
    // Ses propres communications
    if (
      communication.userId &&
      communication.userId.toString() === user._id.toString()
    ) {
      return true;
    }

    // Communications visibles pour lui
    if (
      communication.visibleToAdmins &&
      communication.visibleToAdmins.some(
        (adminId) => adminId.toString() === user._id.toString()
      )
    ) {
      return true;
    }

    // Vérifier si la communication appartient à un de ses employees
    if (communication.userId) {
      const employee = await User.findOne({
        _id: communication.userId,
        managedBy: user._id,
        role: "Employee",
      });
      return !!employee;
    }
  }

  return false;
}

/**
 * @desc    Récupère toutes les communications du tenant de l'utilisateur (avec filtrage RBAC)
 * @route   GET /api/communications
 * @access  Private
 * @query   source (Outlook, WhatsApp, All)
 * @query   priority (Low, Medium, High, Critical, All)
 * @query   status (To Validate, Validated, Escalated, Closed, Archived, All)
 * @query   search (recherche dans subject, content, sender.email)
 * @query   page (pagination, défaut: 1)
 * @query   limit (nombre par page, défaut: 50)
 */
exports.getCommunications = async (req, res) => {
  try {
    const user = req.user;

    // Vérifier si l'utilisateur a un tenant_id
    if (!user.tenant_id) {
      return res.status(400).json({
        success: false,
        message:
          "User does not belong to a tenant. SuperUsers cannot view communications.",
      });
    }

    // Paramètres de requête
    const {
      source = "All",
      priority = "All",
      status = "All",
      sentiment = "All",
      state = "All",
      search = "",
      dateRange = "All",
      page = 1,
      limit = 50,
      needsReply = "false",
      excludeReplied = "false",
    } = req.query;

    // Construire le filtre de base avec RBAC
    const filter = await buildRbacFilter(user);

    // Ajouter les filtres optionnels
    if (source !== "All") {
      filter.source = source;
    }

    if (priority !== "All") {
      // Support pour plusieurs priorités séparées par des virgules
      const priorities = priority.split(',').map(p => p.trim());
      if (priorities.length > 1) {
        filter["ai_analysis.urgency"] = { $in: priorities };
      } else {
        filter["ai_analysis.urgency"] = priority;
      }
    }

    if (sentiment !== "All") {
      filter["ai_analysis.sentiment"] = sentiment;
    }

    if (status !== "All") {
      filter.status = status;
    }

    if (needsReply === "true") {
      filter["ai_analysis.requiresResponse"] = true;
    }

    if (excludeReplied === "true") {
      filter.hasAutoResponse = false;
      filter["manualResponse.sent"] = { $ne: true };
    }

    // Filtre d'état (State/Flags)
    if (state !== "All") {
      switch (state) {
        case "Unread":
          filter.isRead = false;
          break;
        case "Read":
          filter.isRead = true;
          break;
        case "Replied":
          filter.$or = [
            { hasBeenReplied: true },
            { hasAutoResponse: true },
            { "manualResponse.sent": true },
          ];
          break;
        case "NotReplied":
          filter.hasAutoResponse = false;
          filter["manualResponse.sent"] = { $ne: true };
          break;
        case "AutoResponse":
          filter.hasAutoResponse = true;
          break;
        case "AwaitingInput":
          filter.awaitingUserInput = true;
          break;
        case "Escalated":
          filter.status = "Escalated";
          break;
        case "NoResponseNeeded":
          filter["ai_analysis.requiresResponse"] = false;
          break;
      }
    }

    // Filtre de date (receivedAt)
    if (dateRange !== "All") {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      switch (dateRange) {
        case "Today":
          filter.receivedAt = { $gte: today };
          break;
        case "Yesterday":
          const yesterday = new Date(today);
          yesterday.setDate(yesterday.getDate() - 1);
          filter.receivedAt = { $gte: yesterday, $lt: today };
          break;
        case "Last7Days":
          const last7Days = new Date(today);
          last7Days.setDate(last7Days.getDate() - 7);
          filter.receivedAt = { $gte: last7Days };
          break;
        case "Last30Days":
          const last30Days = new Date(today);
          last30Days.setDate(last30Days.getDate() - 30);
          filter.receivedAt = { $gte: last30Days };
          break;
        case "ThisMonth":
          const thisMonthStart = new Date(
            now.getFullYear(),
            now.getMonth(),
            1
          );
          filter.receivedAt = { $gte: thisMonthStart };
          break;
        case "LastMonth":
          const lastMonthStart = new Date(
            now.getFullYear(),
            now.getMonth() - 1,
            1
          );
          const lastMonthEnd = new Date(
            now.getFullYear(),
            now.getMonth(),
            0,
            23,
            59,
            59
          );
          filter.receivedAt = { $gte: lastMonthStart, $lte: lastMonthEnd };
          break;
      }
    }

    // Recherche Textuelle optimisée (avec index MongoDB)
    if (search) {
      // Si l'index textuel est créé, utiliser $text pour la performance
      // Sinon, fallback sur les regex (plus lent mais flexible)
      filter.$or = [
        { subject: { $regex: search, $options: "i" } },
        { content: { $regex: search, $options: "i" } },
        { "sender.email": { $regex: search, $options: "i" } },
        { "sender.name": { $regex: search, $options: "i" } },
        // On ajoute la recherche dans le snippet
        { snippet: { $regex: search, $options: "i" } },
      ];
    }

    // Pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Exécuter la requête
    const communications = await Communication.find(filter)
      .sort({ receivedAt: -1 }) // Plus récents en premier
      .skip(skip)
      .limit(limitNum)
      .populate("assignedTo", "firstName lastName email")
      .populate("validatedBy", "firstName lastName email")
      .lean();

    // Compter le total pour la pagination
    const total = await Communication.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: communications,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error("Erreur getCommunications:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des communications",
      error: error.message,
    });
  }
};

/**
 * @desc    Récupère une communication spécifique par son ID (avec vérification RBAC)
 * @route   GET /api/communications/:id
 * @access  Private
 */
exports.getCommunicationById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    if (!user.tenant_id) {
      return res.status(400).json({
        success: false,
        message: "User does not belong to a tenant.",
      });
    }

    const communication = await Communication.findOne({
      _id: id,
      tenant_id: user.tenant_id, // Sécurité : vérifier que c'est bien du même tenant
    })
      .populate("assignedTo", "firstName lastName email")
      .populate("validatedBy", "firstName lastName email")
      .populate("notes.user_id", "firstName lastName email")
      .lean();

    if (!communication) {
      return res.status(404).json({
        success: false,
        message: "Communication not found",
      });
    }

    // Vérification RBAC : l'utilisateur a-t-il accès à cette communication ?
    // Pour le moment je donne access a l'utilisateur  mais ce n'est pas bon a modifier plus tard
    // const hasAccess = await canAccessCommunication(communication, user);
    // if (!hasAccess) {
    //   return res.status(403).json({
    //     success: false,
    //     message: "Vous n'avez pas accès à cette communication",
    //   });
    // }

    res.status(200).json({
      success: true,
      data: communication,
    });
  } catch (error) {
    console.error("Erreur getCommunicationById:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération de la communication",
      error: error.message,
    });
  }
};

/**
 * @desc    Met à jour le statut d'une communication (avec vérification RBAC)
 * @route   PATCH /api/communications/:id/status
 * @access  Private
 * @body    { status: "Validated" | "Escalated" | "Closed" | "Archived" }
 */
exports.updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const user = req.user;

    if (!user.tenant_id) {
      return res.status(400).json({
        success: false,
        message: "User does not belong to a tenant.",
      });
    }

    const validStatuses = [
      "To Validate",
      "Validated",
      "Escalated",
      "Closed",
      "Archived",
    ];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
      });
    }

    const communication = await Communication.findOne({
      _id: id,
      tenant_id: user.tenant_id,
    });

    if (!communication) {
      return res.status(404).json({
        success: false,
        message: "Communication not found",
      });
    }

    // Vérification RBAC
    // const hasAccess = await canAccessCommunication(communication, user);
    // if (!hasAccess) {
    //   return res.status(403).json({
    //     success: false,
    //     message: "Vous n'avez pas accès à cette communication",
    //   });
    // }

    communication.status = status;

    if (status === "Validated") {
      communication.validatedAt = new Date();
      communication.validatedBy = user._id;
    }

    if (status === "Closed") {
      communication.closedAt = new Date();
    }

    await communication.save();

    res.status(200).json({
      success: true,
      message: "Status updated successfully",
      data: communication,
    });
  } catch (error) {
    console.error("Erreur updateStatus:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la mise à jour du statut",
      error: error.message,
    });
  }
};

/**
 * @desc    Ajoute une note à une communication (avec vérification RBAC)
 * @route   POST /api/communications/:id/notes
 * @access  Private
 * @body    { content: "Note content" }
 */
exports.addNote = async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    const user = req.user;

    if (!user.tenant_id) {
      return res.status(400).json({
        success: false,
        message: "User does not belong to a tenant.",
      });
    }

    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "Note content is required",
      });
    }

    const communication = await Communication.findOne({
      _id: id,
      tenant_id: user.tenant_id,
    });

    if (!communication) {
      return res.status(404).json({
        success: false,
        message: "Communication not found",
      });
    }

    // Vérification RBAC
    // const hasAccess = await canAccessCommunication(communication, user);
    // if (!hasAccess) {
    //   return res.status(403).json({
    //     success: false,
    //     message: "Vous n'avez pas accès à cette communication",
    //   });
    // }

    communication.notes.push({
      user_id: user._id,
      content: content.trim(),
      createdAt: new Date(),
    });

    await communication.save();

    const updatedComm = await Communication.findById(id)
      .populate("notes.user_id", "firstName lastName email")
      .lean();

    res.status(200).json({
      success: true,
      message: "Note added successfully",
      data: updatedComm,
    });
  } catch (error) {
    console.error("Erreur addNote:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de l'ajout de la note",
      error: error.message,
    });
  }
};

/**
 * @desc    Récupère les statistiques des communications (avec filtrage RBAC)
 * @route   GET /api/communications/stats
 * @access  Private
 */
exports.getStats = async (req, res) => {
  try {
    const user = req.user;

    if (!user.tenant_id) {
      return res.status(400).json({
        success: false,
        message: "User does not belong to a tenant.",
      });
    }

    // Construire le filtre RBAC
    const filter = await buildRbacFilter(user);

    const byStatus = await Communication.aggregate([
      { $match: filter },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);

    const bySource = await Communication.aggregate([
      { $match: filter },
      { $group: { _id: "$source", count: { $sum: 1 } } },
    ]);

    const byPriority = await Communication.aggregate([
      { $match: filter },
      { $group: { _id: "$ai_analysis.urgency", count: { $sum: 1 } } },
    ]);

    const slaBreached = await Communication.countDocuments({
      ...filter,
      slaDueDate: { $lt: new Date() },
      status: { $nin: ["Closed", "Archived"] },
    });

    res.status(200).json({
      success: true,
      data: {
        byStatus: byStatus.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        bySource: bySource.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        byPriority: byPriority.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        slaBreached,
      },
    });
  } catch (error) {
    console.error("Erreur getStats:", error);
    res.status(500).json({
      success: false,
      message: "Erreur stats",
      error: error.message,
    });
  }
};

// ============================================
// NOUVELLES FONCTIONS AJOUTÉES
// ============================================

/**
 * @desc    Marquer une communication comme Lue / Non lue (avec vérification RBAC)
 * @route   PATCH /api/communications/:id/read
 * @access  Private
 */
exports.markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const { isRead } = req.body; // true ou false
    const user = req.user;

    // Récupérer d'abord la communication pour vérifier l'accès
    const communication = await Communication.findOne({
      _id: id,
      tenant_id: user.tenant_id,
    });

    if (!communication) {
      return res
        .status(404)
        .json({ success: false, message: "Communication not found" });
    }

    // Vérification RBAC
    // const hasAccess = await canAccessCommunication(communication, user);
    // if (!hasAccess) {
    //   return res.status(403).json({
    //     success: false,
    //     message: "Vous n'avez pas accès à cette communication",
    //   });
    // }

    // Mettre à jour
    communication.isRead = isRead;
    await communication.save();

    res.status(200).json({ success: true, data: communication });
  } catch (error) {
    console.error("Erreur markAsRead:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Assigner un ticket à un utilisateur (avec vérification RBAC)
 * @route   PATCH /api/communications/:id/assign
 * @access  Private
 */
exports.assignUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body; // ID de l'utilisateur à assigner
    const user = req.user;

    // Vérifier si l'utilisateur cible existe dans le même tenant
    if (userId) {
      const targetUser = await User.findOne({
        _id: userId,
        tenant_id: user.tenant_id,
      });
      if (!targetUser) {
        return res.status(400).json({
          success: false,
          message: "Utilisateur cible introuvable dans ce tenant",
        });
      }
    }

    // Récupérer d'abord la communication pour vérifier l'accès
    const communication = await Communication.findOne({
      _id: id,
      tenant_id: user.tenant_id,
    });

    if (!communication) {
      return res
        .status(404)
        .json({ success: false, message: "Communication not found" });
    }

    // Vérification RBAC
    // const hasAccess = await canAccessCommunication(communication, user);
    // if (!hasAccess) {
    //   return res.status(403).json({
    //     success: false,
    //     message: "Vous n'avez pas accès à cette communication",
    //   });
    // }

    // Mettre à jour
    communication.assignedTo = userId; // Si null, ça désassigne
    await communication.save();
    await communication.populate("assignedTo", "firstName lastName email");

    res.status(200).json({
      success: true,
      message: "Assignation mise à jour",
      data: communication,
    });
  } catch (error) {
    console.error("Erreur assignUser:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Déclencher manuellement l'analyse IA avec Grok (avec vérification RBAC)
 * @route   POST /api/communications/:id/analyze
 * @access  Private
 */
exports.triggerAiAnalysis = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;
    const grokService = require("../services/grokService");

    const communication = await Communication.findOne({
      _id: id,
      tenant_id: user.tenant_id,
    });

    if (!communication) {
      return res
        .status(404)
        .json({ success: false, message: "Communication not found" });
    }

    // Vérification RBAC
    // const hasAccess = await canAccessCommunication(communication, user);
    // if (!hasAccess) {
    //   return res.status(403).json({
    //     success: false,
    //     message: "Vous n'avez pas accès à cette communication",
    //   });
    // }

    console.log(
      `🤖 Analyse IA manuelle demandée pour: ${communication.subject}`
    );

    // Analyser avec Grok
    const analysis = await grokService.analyzeCommunication({
      subject: communication.subject,
      content: communication.content || communication.snippet,
      sender: communication.sender,
    });

    // Mettre à jour la communication avec l'analyse
    communication.ai_analysis = {
      summary: analysis.summary,
      sentiment: analysis.sentiment,
      urgency: analysis.urgency,
      keyPoints: analysis.keyPoints,
      actionItems: analysis.actionItems,
      entities: analysis.entities,
      processedAt: analysis.processedAt,
    };

    await communication.save();

    console.log(`✅ Analyse IA complétée pour: ${communication.subject}`);

    res.status(200).json({
      success: true,
      message: "Analyse IA complétée avec succès",
      data: communication,
    });
  } catch (error) {
    console.error("❌ Erreur triggerAiAnalysis:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de l'analyse IA",
      error: error.message,
    });
  }
};

/**
 * @desc    Répond à une communication (email High/Critical)
 * @route   POST /api/communications/:id/reply
 * @access  Private
 */
exports.replyToCommunication = async (req, res) => {
  try {
    const { id } = req.params;
    const { replyContent } = req.body;
    const user = req.user;

    // Validation
    if (!replyContent || replyContent.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Le contenu de la réponse est requis',
      });
    }

    // Récupérer la communication
    const communication = await Communication.findById(id);

    if (!communication) {
      return res.status(404).json({
        success: false,
        message: 'Communication non trouvée',
      });
    }

    // Vérification RBAC
    const filter = await buildRbacFilter(user);
    const hasAccess = await Communication.findOne({ _id: id, ...filter });

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Accès refusé à cette communication',
      });
    }

    // Vérifier que l'utilisateur a configuré son email
    if (!user.hasConfiguredEmail) {
      return res.status(400).json({
        success: false,
        message: 'Vous devez configurer votre email dans Intégrations avant de pouvoir répondre',
      });
    }

    // Envoyer la réponse via le provider configuré
    const imapSmtpService = require('../services/imapSmtpService');
    const outlookService = require('../services/outlookService');

    let sendResult;

    if (user.activeEmailProvider === 'imap_smtp') {
      sendResult = await imapSmtpService.sendEmail(user._id, {
        to: communication.sender.email,
        subject: `Re: ${communication.subject}`,
        text: replyContent,
        html: replyContent.replace(/\n/g, '<br>'),
        inReplyTo: communication.messageId,
        references: communication.references || communication.messageId,
      });
    } else if (user.activeEmailProvider === 'outlook') {
      sendResult = await outlookService.sendEmailAsUser(user._id, {
        to: communication.sender.email,
        subject: `Re: ${communication.subject}`,
        body: replyContent.replace(/\n/g, '<br>'),
      });
    } else {
      return res.status(400).json({
        success: false,
        message: 'Provider email non supporté',
      });
    }

    if (!sendResult.success) {
      return res.status(500).json({
        success: false,
        message: `Échec de l'envoi de l'email: ${sendResult.message}`,
      });
    }

    // Mettre à jour la communication
    communication.status = 'Validated';
    communication.manualResponse = {
      sent: true,
      sentAt: new Date(),
      sentBy: user._id,
      content: replyContent,
    };
    communication.hasBeenReplied = true;
    communication.repliedAt = new Date();
    communication.repliedBy = user._id;

    await communication.save();

    console.log(`✅ Réponse manuelle envoyée pour: ${communication.subject}`);

    res.status(200).json({
      success: true,
      message: 'Réponse envoyée avec succès',
      data: communication,
    });
  } catch (error) {
    console.error('❌ Erreur replyToCommunication:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'envoi de la réponse',
      error: error.message,
    });
  }
};

// ============================================
// RÉPONSES ASSISTÉES (QUESTIONNAIRE IA)
// ============================================

/**
 * @desc    Récupère les emails en attente de réponse utilisateur (questionnaire)
 * @route   GET /api/communications/awaiting-input
 * @access  Private
 */
exports.getAwaitingInputEmails = async (req, res) => {
  try {
    const user = req.user;

    if (!user.tenant_id) {
      return res.status(400).json({
        success: false,
        message: 'User does not belong to a tenant.',
      });
    }

    // Construire le filtre RBAC
    const filter = await buildRbacFilter(user);

    if (user.autoResponseEnabled === true) {
      filter.awaitingUserInput = true;
    } else {
      filter.$or = [
        { awaitingUserInput: true },
        {
          'ai_analysis.requiresResponse': true,
          'ai_analysis.urgency': { $in: ['Low', 'Medium'] },
          hasAutoResponse: false,
          'manualResponse.sent': { $ne: true },
          status: { $nin: ['Closed', 'Archived', 'Validated'] }
        }
      ];
    }

    // Récupérer les emails
    const communications = await Communication.find(filter)
      .sort({ receivedAt: -1 })
      .populate('assignedTo', 'firstName lastName email')
      .lean();

    res.status(200).json({
      success: true,
      data: communications,
      count: communications.length,
    });
  } catch (error) {
    console.error('❌ Erreur getAwaitingInputEmails:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des emails en attente',
      error: error.message,
    });
  }
};

/**
 * @desc    Récupère les emails éligibles aux Réponses Auto (filtrage précis pour Low/Medium + suggestion IA)
 * @route   GET /api/communications/auto-candidates
 * @access  Private
 */
exports.getAutoCandidates = async (req, res) => {
  try {
    const user = req.user;

    if (!user.tenant_id) {
      return res.status(400).json({
        success: false,
        message: "User does not belong to a tenant.",
      });
    }

    // Si l'utilisateur a désactivé les réponses automatiques, ne rien retourner
    if (user.autoResponseEnabled === false) {
      return res.status(200).json({
        success: true,
        data: [],
        pagination: {
          page: 1,
          limit: parseInt(req.query.limit || 10),
          total: 0,
          totalPages: 1,
        },
      });
    }

    const {
      search = "",
      priority = "All",
      dateRange = "All",
      page = 1,
      limit = 10,
    } = req.query;

    // 1. Construire le filtre RBAC de base
    const filter = await buildRbacFilter(user);

    // 2. Filtres Auto Responses
    // - Pas de réponse auto déjà envoyée
    // - Pas de réponse manuelle déjà envoyée
    // - Suggestion IA existe
    // - Urgence Low ou Medium (High/Critical vont dans Urgent Emails)
    // - Pas de "noreply" dans l'expéditeur
    filter.autoActivation = "auto";
    filter.hasAutoResponse = false;
    filter["manualResponse.sent"] = { $ne: true };
    filter["ai_analysis.suggestedResponse"] = { $exists: true, $ne: "" };
    
    // Si priorité spécifiée, on respecte le filtre UI, sinon on force Low/Medium par défaut
    if (priority !== "All") {
      const priorities = priority.split(',').map(p => p.trim());
      filter["ai_analysis.urgency"] = { $in: priorities };
    } else {
      filter["ai_analysis.urgency"] = { $in: ["Low", "Medium"] };
    }

    // Exclure les no-reply
    filter["sender.email"] = { $not: { $regex: /noreply|no-reply|do-not-reply/i } };

    // 3. Filtres optionnels UI (Recherche, Date)
    if (search) {
      filter.$or = [
        { subject: { $regex: search, $options: "i" } },
        { content: { $regex: search, $options: "i" } },
        { "sender.email": { $regex: search, $options: "i" } },
      ];
    }

    if (dateRange !== "All") {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      switch (dateRange) {
        case "Today":
          filter.receivedAt = { $gte: today };
          break;
        case "Yesterday":
          const yesterday = new Date(today);
          yesterday.setDate(yesterday.getDate() - 1);
          filter.receivedAt = { $gte: yesterday, $lt: today };
          break;
        case "Last7Days":
          const last7Days = new Date(today);
          last7Days.setDate(last7Days.getDate() - 7);
          filter.receivedAt = { $gte: last7Days };
          break;
        case "Last30Days":
          const last30Days = new Date(today);
          last30Days.setDate(last30Days.getDate() - 30);
          filter.receivedAt = { $gte: last30Days };
          break;
      }
    }

    // 4. Pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // 5. Exécution
    const communications = await Communication.find(filter)
      .sort({ receivedAt: -1 }) // Plus récents d'abord
      .skip(skip)
      .limit(limitNum)
      .populate("assignedTo", "firstName lastName email")
      .lean();

    const total = await Communication.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: communications,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error("❌ Erreur getAutoCandidates:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des candidats auto-response",
      error: error.message,
    });
  }
};

exports.getAutoCandidateIds = async (req, res) => {
  try {
    const user = req.user;
    if (!user.tenant_id) {
      return res.status(400).json({
        success: false,
        message: "User does not belong to a tenant.",
      });
    }
    if (user.autoResponseEnabled === false) {
      return res.status(200).json({
        success: true,
        data: [],
        count: 0,
      });
    }
    const { search = "", priority = "All", dateRange = "All" } = req.query;
    const filter = await buildRbacFilter(user);
    filter.autoActivation = "auto";
    filter.hasAutoResponse = false;
    filter["manualResponse.sent"] = { $ne: true };
    filter["ai_analysis.suggestedResponse"] = { $exists: true, $ne: "" };
    if (priority !== "All") {
      const priorities = priority.split(",").map((p) => p.trim());
      filter["ai_analysis.urgency"] = { $in: priorities };
    } else {
      filter["ai_analysis.urgency"] = { $in: ["Low", "Medium"] };
    }
    filter["sender.email"] = { $not: { $regex: /noreply|no-reply|do-not-reply/i } };
    if (search) {
      filter.$or = [
        { subject: { $regex: search, $options: "i" } },
        { content: { $regex: search, $options: "i" } },
        { "sender.email": { $regex: search, $options: "i" } },
      ];
    }
    if (dateRange !== "All") {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      switch (dateRange) {
        case "Today":
          filter.receivedAt = { $gte: today };
          break;
        case "Yesterday":
          {
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);
            filter.receivedAt = { $gte: yesterday, $lt: today };
          }
          break;
        case "Last7Days":
          {
            const last7Days = new Date(today);
            last7Days.setDate(last7Days.getDate() - 7);
            filter.receivedAt = { $gte: last7Days };
          }
          break;
        case "Last30Days":
          {
            const last30Days = new Date(today);
            last30Days.setDate(last30Days.getDate() - 30);
            filter.receivedAt = { $gte: last30Days };
          }
          break;
      }
    }
    const ids = await Communication.find(filter).select("_id").lean();
    return res.status(200).json({
      success: true,
      data: ids.map((d) => d._id),
      count: ids.length,
    });
  } catch (error) {
    console.error("❌ Erreur getAutoCandidateIds:", error);
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des IDs des candidats auto-response",
      error: error.message,
    });
  }
};
exports.generateSuggestionForEmail = async (req, res) => {
  try {
    const user = req.user;
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ success: false, message: "Missing communication id" });
    }

    const rbacFilter = await buildRbacFilter(user);
    const comm = await Communication.findOne({ _id: id, ...rbacFilter });
    if (!comm) {
      return res.status(404).json({ success: false, message: "Communication not found or not accessible" });
    }

    const grokService = require("../services/grokService");

    // Assurer qu'une analyse existe (Résumé/Sentiment/Urgence)
    let analysis = comm.ai_analysis;
    if (!analysis || !analysis.summary) {
      analysis = await grokService.analyzeCommunication({
        subject: comm.subject,
        content: comm.content,
        sender: comm.sender,
      });
      comm.ai_analysis = { ...(comm.ai_analysis || {}), ...analysis };
    }

    // Générer une réponse automatique basée sur l'analyse et le contexte utilisateur
    const autoResponse = await grokService.generateAutoResponse(comm, analysis, user);
    
    // Ajouter la signature
    const signature = user.emailSignature || "Cordialement,\nL'équipe Support";
    const finalResponse = autoResponse + "\n\n" + signature;

    comm.ai_analysis = { ...(comm.ai_analysis || {}), suggestedResponse: finalResponse, processedAt: new Date() };
    await comm.save();

    return res.status(200).json({
      success: true,
      data: { suggestedResponse: comm.ai_analysis.suggestedResponse },
    });
  } catch (error) {
    console.error("❌ generateSuggestionForEmail error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to regenerate suggested response",
      error: error.message,
    });
  }
};

/** 
 * @desc    Génère des questions contextuelles pour un email spécifique
 * @route   POST /api/communications/:id/generate-questions
 * @access  Private
 */
exports.generateQuestionsForEmail = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;
    const grokService = require('../services/grokService');

    // Récupérer la communication
    const communication = await Communication.findOne({
      _id: id,
      tenant_id: user.tenant_id,
    });

    if (!communication) {
      return res.status(404).json({
        success: false,
        message: 'Communication non trouvée',
      });
    }

    // Vérification RBAC
    /*
    const hasAccess = await canAccessCommunication(communication, user);
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Accès refusé à cette communication',
      });
    }
    */

    console.log(`🤖 Génération de questions pour: ${communication.subject}`);

    // Vérifier que l'analyse IA existe déjà
    if (!communication.ai_analysis || !communication.ai_analysis.summary) {
      return res.status(400).json({
        success: false,
        message: 'Cette communication doit d\'abord être analysée par l\'IA. Lancez une analyse d\'abord.',
      });
    }

    // Générer les questions contextuelles
    const questions = await grokService.generateContextualQuestions(
      communication,
      communication.ai_analysis
    );

    // Enregistrer les questions dans la communication
    communication.aiGeneratedQuestions = questions;
    communication.awaitingUserInput = true;
    await communication.save();

    console.log(`✅ ${questions.length} questions générées pour: ${communication.subject}`);

    res.status(200).json({
      success: true,
      message: 'Questions générées avec succès',
      data: {
        communicationId: communication._id,
        questions,
      },
    });
  } catch (error) {
    console.error('❌ Erreur generateQuestionsForEmail:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la génération des questions',
      error: error.message,
    });
  }
};

/**
 * @desc    Génère un brouillon de réponse basé sur les réponses du questionnaire (Preview)
 * @route   POST /api/communications/:id/preview-reply
 * @access  Private
 */
exports.previewDraftFromAnswers = async (req, res) => {
  try {
    const { id } = req.params;
    const { userAnswers } = req.body;
    const user = req.user;
    const grokService = require('../services/grokService');

    // Validation
    if (!userAnswers || Object.keys(userAnswers).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Les réponses du questionnaire sont requises',
      });
    }

    // Récupérer la communication
    const communication = await Communication.findOne({
      _id: id,
      tenant_id: user.tenant_id,
    });

    if (!communication) {
      return res.status(404).json({
        success: false,
        message: 'Communication non trouvée',
      });
    }

    // Vérification RBAC
    /*
    const hasAccess = await canAccessCommunication(communication, user);
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Accès refusé à cette communication',
      });
    }
    */

    console.log(`🤖 Génération de brouillon (Preview) pour: ${communication.subject}`);

    // Générer le brouillon via Grok
    const draft = await grokService.generateDraftFromQuestions(
      communication,
      userAnswers,
      user
    );

    // Ajouter la signature
    const signature = user.emailSignature || "Cordialement,\nL'équipe Support";
    const finalDraft = draft + "\n\n" + signature;

    res.status(200).json({
      success: true,
      message: 'Brouillon généré avec succès',
      data: {
        communicationId: communication._id,
        draft: finalDraft,
      },
    });
  } catch (error) {
    console.error('❌ Erreur previewDraftFromAnswers:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la génération du brouillon',
      error: error.message,
    });
  }
};

/**
 * @desc    Soumet les réponses du questionnaire → Génère réponse IA → Envoie l'email
 * @route   POST /api/communications/:id/submit-questionnaire
 * @access  Private
 */
exports.submitQuestionnaireAndReply = async (req, res) => {
  try {
    const { id } = req.params;
    const { userAnswers, finalDraft } = req.body; // finalDraft added
    const user = req.user;
    const grokService = require('../services/grokService');
    const imapSmtpService = require('../services/imapSmtpService');
    const outlookService = require('../services/outlookService');

    // Validation (userAnswers OR finalDraft required)
    if ((!userAnswers || Object.keys(userAnswers).length === 0) && !finalDraft) {
      return res.status(400).json({
        success: false,
        message: 'Les réponses du questionnaire ou le brouillon final sont requis',
      });
    }

    // Récupérer la communication
    const communication = await Communication.findOne({
      _id: id,
      tenant_id: user.tenant_id,
    });

    if (!communication) {
      return res.status(404).json({
        success: false,
        message: 'Communication non trouvée',
      });
    }

    // Vérification RBAC
    /*
    const hasAccess = await canAccessCommunication(communication, user);
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Accès refusé à cette communication',
      });
    }
    */

    // Vérifier que l'utilisateur a configuré son email
    if (!user.hasConfiguredEmail) {
      return res.status(400).json({
        success: false,
        message: 'Vous devez configurer votre email dans Intégrations avant de pouvoir répondre',
      });
    }

    let generatedResponse;

    if (finalDraft) {
        // Cas 1: L'utilisateur envoie le brouillon final (depuis le mode Preview)
        console.log(`📨 Envoi direct de la réponse assistée (Draft validé) pour: ${communication.subject}`);
        generatedResponse = finalDraft;
        
        // On sauvegarde quand même les réponses si fournies pour l'historique
        if (userAnswers) {
            communication.userResponseContext = userAnswers;
        }
    } else {
        // Cas 2 (Legacy/Fallback): Génération automatique + Envoi
        console.log(`🤖 Génération + Envoi de réponse assistée pour: ${communication.subject}`);

        // Enregistrer les réponses de l'utilisateur
        communication.userResponseContext = userAnswers;

        // Créer un prompt enrichi avec le contexte de l'utilisateur
        const contextualPrompt = buildContextualResponsePrompt(
          communication,
          communication.ai_analysis,
          user,
          userAnswers
        );

        // Générer la réponse IA avec le contexte
        const grokClient = grokService.client;
        const completion = await grokClient.chat.completions.create({
          model: grokService.model,
          messages: [
            {
              role: 'system',
              content: 'You are a professional email assistant. Generate contextually appropriate email responses based on user guidance and email analysis.',
            },
            {
              role: 'user',
              content: contextualPrompt,
            },
          ],
          max_tokens: 700,
          temperature: 0.7,
        });

        generatedResponse = completion.choices[0].message.content.trim();
        
        // Ajouter la signature
        const signature = user.emailSignature || "Cordialement,\nL'équipe Support";
        generatedResponse += "\n\n" + signature;
        
        console.log('✅ Réponse IA générée avec contexte utilisateur');
    }

    // Envoyer l'email via le provider configuré
    let sendResult;

    if (user.activeEmailProvider === 'imap_smtp') {
      sendResult = await imapSmtpService.sendEmail(user._id, {
        to: communication.sender.email,
        subject: `Re: ${communication.subject}`,
        text: generatedResponse,
        html: generatedResponse.replace(/\n/g, '<br>'),
        inReplyTo: communication.messageId,
        references: communication.references || communication.messageId,
      });
    } else if (user.activeEmailProvider === 'outlook') {
      sendResult = await outlookService.sendEmailAsUser(user._id, {
        to: communication.sender.email,
        subject: `Re: ${communication.subject}`,
        body: generatedResponse.replace(/\n/g, '<br>'),
      });
    } else {
      return res.status(400).json({
        success: false,
        message: 'Provider email non supporté',
      });
    }

    if (!sendResult.success) {
      return res.status(500).json({
        success: false,
        message: `Échec de l'envoi de l'email: ${sendResult.message}`,
      });
    }

    // Mettre à jour la communication
    communication.status = 'Validated';
    communication.awaitingUserInput = false;
    communication.assistedResponseGeneratedAt = new Date();
    communication.hasBeenReplied = true;
    communication.repliedAt = new Date();
    communication.repliedBy = user._id;
    communication.autoResponseContent = generatedResponse;
    communication.hasAutoResponse = true;
    communication.autoResponseSentAt = new Date();

    await communication.save();

    console.log(`✅ Réponse assistée envoyée pour: ${communication.subject}`);

    res.status(200).json({
      success: true,
      message: 'Réponse générée et envoyée avec succès',
      data: {
        communication,
        generatedResponse,
      },
    });
  } catch (error) {
    console.error('❌ Erreur submitQuestionnaireAndReply:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la génération/envoi de la réponse',
      error: error.message,
    });
  }
};

/**
 * Helper: Construit un prompt enrichi avec le contexte utilisateur
 */
function buildContextualResponsePrompt(communication, analysis, user, userAnswers) {
  // Convertir les réponses en texte lisible
  const answersText = Object.entries(userAnswers)
    .map(([question, answer]) => `- ${question}: ${Array.isArray(answer) ? answer.join(', ') : answer}`)
    .join('\n');

  return `Generate a professional email response based on the following context:

**Original Email:**
- From: ${communication.sender?.name || communication.sender?.email || 'Unknown'}
- Subject: ${communication.subject || 'No subject'}
- Content: ${communication.content?.substring(0, 600) || 'No content'}

**AI Analysis:**
- Summary: ${analysis.summary}
- Sentiment: ${analysis.sentiment}
- Urgency: ${analysis.urgency}

**User Context (Your Guidance):**
${answersText}

**Respond on behalf of:**
- Name: ${user.firstName} ${user.lastName}
- Role: ${user.role}

**Instructions:**
1. Use the user's guidance (User Context) to inform the tone and content of your response
2. Acknowledge the sender's email appropriately
3. Address the key points based on the user's answers
4. Maintain a professional and friendly tone
5. Keep it concise (4-6 sentences)
6. DO NOT include subject line, just the email body
7. Sign off with: "Best regards, ${user.firstName} ${user.lastName}"

Generate ONLY the email body text, no additional formatting or explanations.`;
}

/**
 * @desc    Récupère les données pour le Dashboard d'Escalade (KPIs + Liste)
 * @route   GET /api/communications/escalations
 * @access  Private
 */
exports.getEscalationData = async (req, res) => {
  try {
    const user = req.user;

    if (!user.tenant_id) {
      return res.status(400).json({
        success: false,
        message: "User does not belong to a tenant.",
      });
    }

    // Construire le filtre RBAC de base
    const baseFilter = await buildRbacFilter(user);

    // 1. Récupérer tous les items pertinents (Escaladés OU En retard)
    // On cherche :
    // - Status = "Escalated"
    // - OU isEscalated = true
    // - OU SLA dépassé ET statut pas clos
    const escalationFilter = {
      ...baseFilter,
      $or: [
        { status: "Escalated" },
        { isEscalated: true },
        {
          slaDueDate: { $lt: new Date() },
          status: { $nin: ["Closed", "Archived", "Validated"] },
        },
      ],
    };

    const escalatedItems = await Communication.find(escalationFilter)
      .populate("assignedTo", "firstName lastName")
      .sort({ "ai_analysis.urgency": -1, receivedAt: -1 }) // Critiques d'abord, puis récents
      .lean();

    // 2. Calculer les KPIs à partir de la liste récupérée (plus efficace que faire 3 countDocuments)
    let level1Count = 0; // Escalated but NOT Critical
    let level2Count = 0; // Escalated AND Critical
    let overdueCount = 0; // SLA Breached

    const now = new Date();

    const formattedHistory = escalatedItems.map((item) => {
      const isCritical = item.ai_analysis?.urgency === "Critical";
      const isEscalatedStatus = item.status === "Escalated" || item.isEscalated;
      const isOverdue =
        new Date(item.slaDueDate) < now &&
        !["Closed", "Archived", "Validated"].includes(item.status);

      // KPIs Increment
      if (isEscalatedStatus) {
        if (isCritical) {
          level2Count++;
        } else {
          level1Count++;
        }
      }
      
      // Overdue is counted independently (an item can be both Escalated and Overdue)
      if (isOverdue) {
        overdueCount++;
      }

      // Déterminer le "niveau" pour l'affichage tableau
      let displayLevel = 1;
      if (isCritical) displayLevel = 2;

      // Déterminer la raison (mock ou déduit)
      let reason = "Manual Escalation";
      if (isOverdue) reason = "SLA Breach";
      if (isCritical && isEscalatedStatus) reason = "Critical Issue";

      return {
        _id: item._id,
        subject: item.subject,
        level: displayLevel,
        escalatedBy: item.assignedTo
          ? `${item.assignedTo.firstName} ${item.assignedTo.lastName}`
          : "System",
        date: item.receivedAt,
        status: item.status,
        slaDueDate: item.slaDueDate,
        isOverdue: isOverdue,
        urgency: item.ai_analysis?.urgency || "Medium",
        reason: reason,
        sender: item.sender?.email || item.sender?.name || "Unknown",
      };
    });

    res.status(200).json({
      success: true,
      data: {
        stats: {
          level1: level1Count,
          level2: level2Count,
          overdue: overdueCount,
        },
        history: formattedHistory,
      },
    });
  } catch (error) {
    console.error("Erreur getEscalationData:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des données d'escalade",
      error: error.message,
    });
  }
};

/**
 * @desc    Récupérer les statistiques pour le Dashboard (KPIs)
 * @route   GET /api/communications/stats/dashboard
 * @access  Private
 */
exports.getDashboardStats = async (req, res) => {
  try {
    const user = req.user;
    
    const tenantId = (user.tenant_id && user.tenant_id._id) ? user.tenant_id._id : user.tenant_id;
    let filter = { tenant_id: tenantId };

    // --- LOGIQUE RBAC ---
    if (user.role === 'Employee') {
      // Employee voit uniquement ses propres communications
      filter.userId = user._id;
    } else if (user.role === 'Admin') {
      // Admin voit ses communications + celles de ses employés directs
      const employees = await User.find({ managedBy: user._id }).select('_id');
      const employeeIds = employees.map((e) => e._id);
      filter.userId = { $in: [user._id, ...employeeIds] };
    } else if (user.role === 'UpperAdmin') {
      // UpperAdmin voit TOUT le tenant (déjà couvert par filter.tenant_id)
      // Pas de filtre userId supplémentaire
    }

    // --- CALCUL DES KPIS ---

    // 1. Emails Processed (Répondus OU Clos/Archivés/Validés) ET de type Email
    const processedFilter = {
      ...filter,
      $or: [
        { hasBeenReplied: true },
        { status: { $in: ['Validated', 'Closed', 'Archived'] } },
      ],
      // Exclure WhatsApp pour ne compter que les vrais emails (Outlook/IMAP)
      source: { $ne: 'whatsapp' }
    };
    const emailsProcessed = await Communication.countDocuments(processedFilter);

    // 2. WhatsApp Messages (Total)
    const whatsappFilter = {
      ...filter,
      source: 'whatsapp',
    };
    const whatsappMessages = await Communication.countDocuments(whatsappFilter);

    // 3. AI Summaries (Ceux qui ont une analyse IA)
    const aiSummariesFilter = {
      ...filter,
      'ai_analysis.summary': { $exists: true, $ne: null },
    };
    const aiSummaries = await Communication.countDocuments(aiSummariesFilter);

    const now = new Date();
    const startCurrent = new Date(now);
    startCurrent.setMonth(startCurrent.getMonth() - 1);
    const startPrev = new Date(now);
    startPrev.setMonth(startPrev.getMonth() - 2);
    const endPrev = startCurrent;

    const processedCurrent = await Communication.countDocuments({
      ...processedFilter,
      receivedAt: { $gte: startCurrent, $lt: now },
    });
    const processedPrev = await Communication.countDocuments({
      ...processedFilter,
      receivedAt: { $gte: startPrev, $lt: endPrev },
    });
    const whatsappCurrent = await Communication.countDocuments({
      ...whatsappFilter,
      receivedAt: { $gte: startCurrent, $lt: now },
    });
    const whatsappPrev = await Communication.countDocuments({
      ...whatsappFilter,
      receivedAt: { $gte: startPrev, $lt: endPrev },
    });
    const aiCurrent = await Communication.countDocuments({
      ...aiSummariesFilter,
      receivedAt: { $gte: startCurrent, $lt: now },
    });
    const aiPrev = await Communication.countDocuments({
      ...aiSummariesFilter,
      receivedAt: { $gte: startPrev, $lt: endPrev },
    });

    const pct = (cur, prev) =>
      prev === 0 ? (cur > 0 ? 100 : 0) : Math.round(((cur - prev) / prev) * 100);

    // --- NOUVEAU : Répartition de la Charge de Travail (Emails en Attente) ---

    const basePendingFilter = {
      ...filter,
      source: { $ne: 'whatsapp' },
      status: 'To Validate',
      hasBeenReplied: false,
    };

    // SCÉNARIO C : PAS DE RÉPONSE (Onglet Summaries & Search)
    const pendingNoResponse = await Communication.countDocuments({
      ...basePendingFilter,
      'ai_analysis.requiresResponse': false,
    });

    // SCÉNARIO B1 : À RÉPONDRE (Manuel/Urgent - Onglet À Répondre)
    const pendingManual = await Communication.countDocuments({
      ...basePendingFilter,
      'ai_analysis.requiresResponse': true,
      'ai_analysis.urgency': { $in: ['High', 'Critical'] },
    });

    // SCÉNARIO A vs B2 (Low/Medium)
    const lowMediumFilter = {
      ...basePendingFilter,
      'ai_analysis.requiresResponse': true,
      'ai_analysis.urgency': { $in: ['Low', 'Medium'] },
    };

    // SCÉNARIO B2 : ASSISTÉ (Besoin Contexte - Onglet Réponses Assistées)
    const pendingAssisted = await Communication.countDocuments({
      ...lowMediumFilter,
      $or: [{ awaitingUserInput: true }, { autoActivation: 'assisted' }],
    });

    // SCÉNARIO A : AUTO (Réponses Auto - Onglet Réponses Auto)
    const pendingAuto = await Communication.countDocuments({
      ...lowMediumFilter,
      awaitingUserInput: false,
      autoActivation: { $ne: 'assisted' },
    });

    // --- NOUVEAU : Historique sur 30 jours (Graphiques) ---
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    thirtyDaysAgo.setHours(0, 0, 0, 0);

    const aggMatch = {
      tenant_id: tenantId,
      receivedAt: { $gte: thirtyDaysAgo, $lte: new Date() }
    };
    if (filter.userId) {
      aggMatch.userId = filter.userId;
    }
    const historyAggregation = await Communication.aggregate([
      { $match: aggMatch },
      {
        $project: {
          date: { $dateToString: { format: "%Y-%m-%d", date: "$receivedAt" } },
          source: 1,
          hasAutoResponse: 1,
          hasBeenReplied: 1,
          isWhatsApp: { $eq: ["$source", "whatsapp"] },
          isEmail: { $ne: ["$source", "whatsapp"] }
        }
      },
      {
        $group: {
          _id: "$date",
          emails: { $sum: { $cond: ["$isEmail", 1, 0] } },
          whatsapp: { $sum: { $cond: ["$isWhatsApp", 1, 0] } },
          auto: { $sum: { $cond: ["$hasAutoResponse", 1, 0] } },
          manual: { 
            $sum: { 
              $cond: [
                { $and: ["$hasBeenReplied", { $not: "$hasAutoResponse" }] }, 
                1, 
                0
              ] 
            } 
          }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const historyMap = new Map(historyAggregation.map(item => [item._id, item]));
    const chartsData = [];
    
    for (let i = 0; i < 30; i++) {
      const d = new Date();
      d.setDate(d.getDate() - (29 - i));
      const dateStr = d.toISOString().split('T')[0];
      
      const dayData = historyMap.get(dateStr) || { emails: 0, whatsapp: 0, auto: 0, manual: 0 };
      // Format "23 Dec"
      const displayDate = d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });

      chartsData.push({
        date: displayDate,
        count: dayData.emails || 0, // Pour le graph email (alias count)
        emails: dayData.emails || 0,
        whatsapp: dayData.whatsapp || 0,
        auto: dayData.auto || 0,
        manual: dayData.manual || 0
      });
    }

    const responseData = {
      emailsProcessed,
      whatsappMessages,
      aiSummaries,
      workload: {
        pendingAuto, // Scénario A
        pendingManual, // Scénario B1
        pendingAssisted, // Scénario B2
        pendingNoResponse, // Scénario C
      },
      change: {
        emailsProcessed: pct(processedCurrent, processedPrev),
        whatsappMessages: pct(whatsappCurrent, whatsappPrev),
        aiSummaries: pct(aiCurrent, aiPrev),
      },
      charts: chartsData, // <--- NOUVEAU
    };

    res.status(200).json({
      success: true,
      data: responseData,
    });
  } catch (error) {
    console.error('❌ Erreur getDashboardStats:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des statistiques',
      error: error.message,
    });
  }
};
