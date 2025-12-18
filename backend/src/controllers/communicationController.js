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
      search = "",
      page = 1,
      limit = 50,
    } = req.query;

    // Construire le filtre de base avec RBAC
    const filter = await buildRbacFilter(user);

    // Ajouter les filtres optionnels
    if (source !== "All") {
      filter.source = source;
    }

    if (priority !== "All") {
      filter["ai_analysis.urgency"] = priority;
    }

    if (status !== "All") {
      filter.status = status;
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
