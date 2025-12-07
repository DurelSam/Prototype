const Communication = require("../models/Communication");
const User = require("../models/User"); // Import nécessaire pour assignUser

/**
 * @desc    Récupère toutes les communications du tenant de l'utilisateur
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

    // Construire le filtre de base (toujours filtrer par tenant)
    const filter = { tenant_id: user.tenant_id };

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
 * @desc    Récupère une communication spécifique par son ID
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
 * @desc    Met à jour le statut d'une communication
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
 * @desc    Ajoute une note à une communication
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
 * @desc    Récupère les statistiques des communications
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

    const filter = { tenant_id: user.tenant_id };

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
 * @desc    Marquer une communication comme Lue / Non lue
 * @route   PATCH /api/communications/:id/read
 * @access  Private
 */
exports.markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const { isRead } = req.body; // true ou false
    const user = req.user;

    const communication = await Communication.findOneAndUpdate(
      { _id: id, tenant_id: user.tenant_id },
      { isRead: isRead },
      { new: true }
    );

    if (!communication) {
      return res
        .status(404)
        .json({ success: false, message: "Communication not found" });
    }

    res.status(200).json({ success: true, data: communication });
  } catch (error) {
    console.error("Erreur markAsRead:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Assigner un ticket à un utilisateur
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
        return res
          .status(400)
          .json({
            success: false,
            message: "Utilisateur cible introuvable dans ce tenant",
          });
      }
    }

    const communication = await Communication.findOneAndUpdate(
      { _id: id, tenant_id: user.tenant_id },
      { assignedTo: userId }, // Si null, ça désassigne
      { new: true }
    ).populate("assignedTo", "firstName lastName email");

    if (!communication) {
      return res
        .status(404)
        .json({ success: false, message: "Communication not found" });
    }

    res
      .status(200)
      .json({
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
 * @desc    Déclencher manuellement l'analyse IA
 * @route   POST /api/communications/:id/analyze
 * @access  Private
 */
exports.triggerAiAnalysis = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    const communication = await Communication.findOne({
      _id: id,
      tenant_id: user.tenant_id,
    });
    if (!communication) {
      return res
        .status(404)
        .json({ success: false, message: "Communication not found" });
    }

    // TODO: Connecter ici le service IA réel plus tard
    // Pour l'instant, on simule une mise à jour
    communication.ai_analysis = {
      summary: "Résumé généré à la demande (Simulation)",
      sentiment: "Neutral",
      urgency: "Medium",
      processedAt: new Date(),
    };

    await communication.save();

    res
      .status(200)
      .json({
        success: true,
        message: "Analyse IA relancée",
        data: communication,
      });
  } catch (error) {
    console.error("Erreur triggerAiAnalysis:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
