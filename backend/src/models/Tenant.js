const mongoose = require("mongoose");

const tenantSchema = new mongoose.Schema(
  {
    companyName: {
      type: String,
      required: [true, "Le nom de l'entreprise est requis"],
      trim: true,
      unique: true,
    },

    subscriptionStatus: {
      type: String,
      enum: ["Active", "Trial", "Cancelled", "Suspended"],
      default: "Trial",
    },

    // --- NOUVEAU : Gestion des fonctionnalités (Pour activer/désactiver selon l'abonnement) ---
    features: {
      outlookIntegration: { type: Boolean, default: true },
      whatsappIntegration: { type: Boolean, default: false },
      aiAnalysis: { type: Boolean, default: true },
    },

    settings: {
      slaHours: {
        type: Number,
        default: 24,
        min: 1,
        max: 168, // 1 semaine max
      },
      language: {
        type: String,
        enum: ["fr", "en", "es"],
        default: "fr", // Langue de l'interface et des emails système
      },
      timezone: {
        type: String,
        default: "Europe/Paris",
      },
      // Plage horaire pour le SLA (Optionnel pour plus tard)
      businessHours: {
        start: { type: String, default: "09:00" },
        end: { type: String, default: "18:00" },
        weekendIncluded: { type: Boolean, default: false },
      },
    },

    // --- NOUVEAU : Configuration IA (Crucial pour ton rappel) ---
    aiConfig: {
      provider: {
        type: String,
        enum: ["openai", "azure-openai"],
        default: "openai",
      },
      model: {
        type: String,
        default: "gpt-4o-mini", // Modèle rapide et pas cher par défaut
      },
      autoSummarize: {
        type: Boolean,
        default: true, // Résumer automatiquement à la réception ?
      },
      summaryLength: {
        type: String,
        enum: ["short", "medium", "long"],
        default: "medium",
      },
      // Si tu veux permettre au client d'utiliser sa propre clé (Optionnel)
      customApiKey: {
        type: String,
        select: false,
        default: null,
      },
    },

    twilioConfig: {
      accountSid: {
        type: String,
        default: null,
      },
      authToken: {
        type: String,
        default: null,
        select: false, // Sécurité
      },
      phoneNumbers: [
        {
          type: String,
          trim: true,
        },
      ],
    },

    // Configuration Microsoft (Optionnel : si tu veux restreindre le tenant Azure de l'entreprise)
    microsoftConfig: {
      tenantId: { type: String, default: null }, // ID de l'organisation Azure AD
      isRestricted: { type: Boolean, default: false }, // Restreindre aux emails de ce domaine uniquement
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    createdAt: {
      type: Date,
      default: Date.now,
    },

    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Index pour optimiser les recherches
tenantSchema.index({ subscriptionStatus: 1 });
tenantSchema.index({ isActive: 1 });

// Middleware pour mettre à jour updatedAt
tenantSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

// Méthode pour vérifier si l'abonnement est actif
tenantSchema.methods.isSubscriptionActive = function () {
  return (
    this.subscriptionStatus === "Active" || this.subscriptionStatus === "Trial"
  );
};

// Méthode pour vérifier si une feature est activée
tenantSchema.methods.hasFeature = function (featureName) {
  return (
    this.isSubscriptionActive() &&
    this.features &&
    this.features[featureName] === true
  );
};

const Tenant = mongoose.model("Tenant", tenantSchema);

module.exports = Tenant;
