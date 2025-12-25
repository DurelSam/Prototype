const mongoose = require("mongoose");

const communicationSchema = new mongoose.Schema(
  {
    tenant_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: [true, "L'ID du tenant est requis"],
      index: true,
    },

    // Utilisateur propriétaire de cette communication
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "L'ID de l'utilisateur est requis"],
      index: true,
    },

    // Pour faciliter les requêtes Admin
    // Si communication appartient à un Employee, stocker son managedBy
    visibleToAdmins: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: [],
    }],

    source: {
      type: String,
      enum: ["outlook", "whatsapp", "gmail", "imap_smtp"],
      set: (v) => v && v.toLowerCase(),
      required: [true, "La source est requise"],
    },

    externalId: {
      type: String,
      required: [true, "L'ID externe est requis"],
      trim: true,
    },

    // --- AJOUT : Statut de lecture (Plus rapide à filtrer ici que dans metadata) ---
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },

    sender: {
      name: { type: String, default: "" },
      email: { type: String, default: "" },
      phone: { type: String, default: "" },
    },

    recipient: {
      name: { type: String, default: "" },
      email: { type: String, default: "" },
      phone: { type: String, default: "" },
    },

    subject: {
      type: String,
      default: "",
      trim: true,
    },

    // --- AJOUT : Aperçu court (Pour l'affichage en liste rapide sans charger tout le HTML) ---
    snippet: {
      type: String,
      default: "",
    },

    content: {
      type: String,
      required: [true, "Le contenu est requis"],
      trim: true,
    },

    attachments: [
      {
        url: { type: String, default: "" }, // plus required
        type: { type: String, default: "unknown" },
        filename: { type: String, default: "" },
        size: { type: Number, default: 0 },
        analysis: { type: String, default: "" },
      },
    ],

    ai_analysis: {
      summary: { type: String, default: "" },
      sentiment: {
        type: String,
        enum: ["Positive", "Neutral", "Negative", "Pending"],
        default: "Pending",
      },
      suggestedAction: { type: String, default: "" },
      category: { type: String, default: "General" },
      urgency: {
        type: String,
        enum: ["Low", "Medium", "High", "Critical"],
        default: "Medium",
      },
      requiresResponse: {
        type: Boolean,
        default: false,
      },
      responseReason: { type: String, default: "" },
      processedAt: { type: Date, default: null },
      suggestedResponse: { type: String, default: "" }, // Nouveau champ pour le brouillon
    },

    autoActivation: {
      type: String,
      enum: ["auto", "assisted", "never"],
      default: "assisted",
      index: true,
    },

    // Réponse automatique IA (pour Low/Medium)
    hasAutoResponse: {
      type: Boolean,
      default: false,
    },
    autoResponseSentAt: {
      type: Date,
      default: null,
    },
    autoResponseContent: {
      type: String,
      default: "",
    },

    // Réponse manuelle (pour High/Critical)
    manualResponse: {
      sent: {
        type: Boolean,
        default: false,
      },
      sentAt: {
        type: Date,
        default: null,
      },
      sentBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },
      content: {
        type: String,
        default: "",
      },
    },

    // Réponse automatique assistée par questionnaire contextuel
    awaitingUserInput: {
      type: Boolean,
      default: false,
      index: true, // Pour filtrer rapidement les emails en attente
    },
    aiGeneratedQuestions: [
      {
        question: { type: String, required: true },
        type: {
          type: String,
          enum: ["checkbox", "radio", "text", "select"],
          default: "checkbox",
        },
        options: [{ type: String }], // Options pour checkbox/radio/select
        required: { type: Boolean, default: false },
      },
    ],
    userResponseContext: {
      type: mongoose.Schema.Types.Mixed, // Stocke les réponses de l'utilisateur
      default: null,
    },
    assistedResponseGeneratedAt: {
      type: Date,
      default: null,
    },

    // Flag global : email a reçu une réponse (manuelle ou auto)
    hasBeenReplied: {
      type: Boolean,
      default: false,
      index: true,
    },
    repliedAt: {
      type: Date,
      default: null,
    },
    repliedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    status: {
      type: String,
      enum: ["To Validate", "Validated", "Escalated", "Closed", "Archived"],
      default: "To Validate",
    },

    // --- AJOUT : Flag d'escalade (pour garder le statut original lors du transfert) ---
    isEscalated: {
      type: Boolean,
      default: false,
      index: true,
    },

    // --- AJOUT : Historique d'escalade (Signature/Traçabilité) ---
    escalationHistory: [
      {
        responsibleUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        role: String,
        escalatedAt: { type: Date, default: Date.now },
        reason: String,
        signature: String // Nom complet ou identifiant lisible
      }
    ],

    // --- AJOUT : Timer pour SLA (Démarre à la synchro, Reset à l'escalade) ---
    slaStartTime: {
      type: Date,
      default: Date.now,
      required: true,
      index: true
    },

    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    receivedAt: {
      type: Date,
      default: Date.now,
      required: true,
    },

    slaDueDate: {
      type: Date,
      required: true,
    },

    validatedAt: { type: Date, default: null },
    validatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    closedAt: { type: Date, default: null },

    notes: [
      {
        user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        content: { type: String, required: true },
        createdAt: { type: Date, default: Date.now },
      },
    ],

    metadata: {
      type: Map,
      of: String,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// --- AJOUT MAJEUR : Index Textuel pour la recherche ---
// Permet de faire : Communication.find({ $text: { $search: "motCle" } })
communicationSchema.index({
  subject: "text",
  content: "text",
  snippet: "text",
  "ai_analysis.summary": "text",
  "sender.name": "text",
  "sender.email": "text",
});

// Index composés existants
communicationSchema.index({ tenant_id: 1, status: 1 });
communicationSchema.index({ tenant_id: 1, receivedAt: -1 });
communicationSchema.index({ slaDueDate: 1, status: 1 });
communicationSchema.index({ source: 1 });
communicationSchema.index({ externalId: 1 });
communicationSchema.index({ "ai_analysis.sentiment": 1 });
communicationSchema.index({ "ai_analysis.urgency": 1 });
communicationSchema.index({ visibleToAdmins: 1 }); // Index pour filtrage Admin

// Middleware SLA
communicationSchema.pre("save", function (next) {
  if (this.isNew && !this.slaDueDate) {
    const slaHours = 24;
    this.slaDueDate = new Date(
      this.receivedAt.getTime() + slaHours * 60 * 60 * 1000
    );
  }
  next();
});

// Middleware pour remplir visibleToAdmins automatiquement
communicationSchema.pre('save', async function (next) {
  if (this.isNew) {
    const User = mongoose.model('User');
    const user = await User.findById(this.userId);

    if (user && user.role === 'Employee' && user.managedBy) {
      this.visibleToAdmins = [user.managedBy];
    }
  }
  next();
});

// Méthodes inchangées...
communicationSchema.methods.isSLABreached = function () {
  return (
    Date.now() > this.slaDueDate &&
    this.status !== "Closed" &&
    this.status !== "Archived"
  );
};

communicationSchema.methods.getTimeUntilSLA = function () {
  const now = Date.now();
  const diff = this.slaDueDate - now;
  if (diff < 0) return { breached: true, hoursRemaining: 0 };
  const hoursRemaining = Math.floor(diff / (1000 * 60 * 60));
  return { breached: false, hoursRemaining };
};

communicationSchema.methods.markAsValidated = function (userId) {
  this.status = "Validated";
  this.validatedAt = Date.now();
  this.validatedBy = userId;
  return this.save();
};

communicationSchema.methods.markAsEscalated = function () {
  this.status = "Escalated";
  return this.save();
};

communicationSchema.methods.close = function () {
  this.status = "Closed";
  this.closedAt = Date.now();
  return this.save();
};

const Communication = mongoose.model("Communication", communicationSchema);
module.exports = Communication;
