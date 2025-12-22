const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    tenant_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: function () {
        // tenant_id n'est pas requis pour les SuperUser
        return this.role !== "SuperUser";
      },
      index: true,
    },

    email: {
      type: String,
      required: [true, "L'email est requis"],
      unique: true, // Email unique globalement
      lowercase: true,
      trim: true,
      immutable: true, // Email ne peut jamais être modifié
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, "Email invalide"],
    },

    password: {
      type: String,
      required: [true, "Le mot de passe est requis"],
      minlength: [6, "Le mot de passe doit contenir au moins 6 caractères"],
      select: false, // Ne pas retourner le mot de passe par défaut
    },

    role: {
      type: String,
      enum: ["SuperUser", "UpperAdmin", "Admin", "Employee"],
      default: "Employee",
    },

    firstName: {
      type: String,
      trim: true,
      default: "",
    },

    lastName: {
      type: String,
      trim: true,
      default: "",
    },

    // Pour les Employees : référence à l'Admin qui l'a créé
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      required: function () {
        return this.role === "Employee";
      },
    },

    // Pour les Employees : Admin qui le gère (peut être différent de createdBy)
    managedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      required: function () {
        return this.role === "Employee";
      },
    },

    // Vérification email (uniquement pour UpperAdmin)
    emailVerified: {
      type: Boolean,
      default: false,
    },

    // Token de vérification email
    emailVerificationToken: {
      type: String,
      default: null,
      select: false,
    },

    // Expiration du token de vérification
    emailVerificationExpires: {
      type: Date,
      default: null,
      select: false,
    },

    // Token de réinitialisation mot de passe
    passwordResetToken: {
      type: String,
      default: null,
      select: false,
    },

    // Expiration du token de réinitialisation
    passwordResetExpires: {
      type: Date,
      default: null,
      select: false,
    },

    // Obligation de configurer un email
    hasConfiguredEmail: {
      type: Boolean,
      default: false,
    },

    // Configuration Outlook
    outlookConfig: {
      accessToken: {
        type: String,
        default: null,
        select: false, // Sécurité : ne jamais renvoyer le token sauf demande explicite
      },
      refreshToken: {
        type: String,
        default: null,
        select: false, // Sécurité
      },
      expiry: {
        type: Date,
        default: null,
      },
      isConnected: {
        type: Boolean,
        default: false,
      },
      lastSyncDate: {
        type: Date,
        default: null,
      },
      // AJOUT IMPORTANT : Pour stocker l'email du compte Outlook connecté
      // (qui peut être différent de l'email de connexion MERN)
      linkedEmail: {
        type: String,
        default: null,
      },
    },

    // Configuration IMAP/SMTP (pour Gmail, Yahoo, etc.)
    imapSmtpConfig: {
      // Email du compte IMAP/SMTP
      email: {
        type: String,
        default: null,
      },

      // Mot de passe chiffré (AES-256)
      password: {
        type: String,
        default: null,
        select: false, // Sécurité : jamais retourner le mot de passe
      },

      // Configuration IMAP (réception)
      imapHost: {
        type: String,
        default: null,
      },
      imapPort: {
        type: Number,
        default: 993,
      },
      imapSecure: {
        type: Boolean,
        default: true, // SSL/TLS
      },

      // Configuration SMTP (envoi)
      smtpHost: {
        type: String,
        default: null,
      },
      smtpPort: {
        type: Number,
        default: 587,
      },
      smtpSecure: {
        type: Boolean,
        default: false, // STARTTLS
      },

      // Nom du provider (pour presets)
      providerName: {
        type: String,
        enum: ['gmail', 'yahoo', 'outlook_imap', 'protonmail', 'smartermail', 'custom'],
        default: 'custom',
      },

      // Dossiers à synchroniser (choisis par l'utilisateur)
      foldersToSync: {
        type: [String],
        default: ['INBOX', 'Sent'],
      },

      // Activer/Désactiver l'analyse AI Grok pour ce compte
      enableAiAnalysis: {
        type: Boolean,
        default: true,
      },

      // Format de username qui fonctionne ('simple' = juste username, 'full' = email complet)
      usernameFormat: {
        type: String,
        enum: ['simple', 'full'],
        default: 'full',
      },

      // Statut de connexion
      isConnected: {
        type: Boolean,
        default: false,
      },

      // Date de dernière synchronisation
      lastSyncDate: {
        type: Date,
        default: null,
      },

      // Date de dernière vérification de la boîte mail
      lastMailboxCheck: {
        type: Date,
        default: null,
      },
    },

    // Provider actif (pour savoir quel système d'email est actuellement utilisé)
    activeEmailProvider: {
      type: String,
      enum: ['outlook', 'imap_smtp', null],
      default: null,
    },

    // Activer/Désactiver les réponses automatiques AI (Low/Medium priority)
    autoResponseEnabled: {
      type: Boolean,
      default: false, // Désactivé par défaut pour des raisons de sécurité
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    lastLogin: {
      type: Date,
      default: null,
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

// Index pour les recherches fréquentes
// Note: tenant_id a déjà un index via "index: true" utilisé par l'index composé ci-dessous
userSchema.index({ role: 1 });
userSchema.index({ isActive: 1 });
userSchema.index({ tenant_id: 1, role: 1 });
userSchema.index({ createdBy: 1 });
userSchema.index({ managedBy: 1 });
userSchema.index({ emailVerificationToken: 1 });

// Middleware pour mettre à jour updatedAt
userSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

// Middleware de validation pour UpperAdmin unique par tenant
userSchema.pre("save", async function (next) {
  // Vérifier qu'il n'y a qu'un seul UpperAdmin par tenant
  if (this.role === "UpperAdmin" && this.tenant_id) {
    const existingUpperAdmin = await mongoose.model("User").findOne({
      tenant_id: this.tenant_id,
      role: "UpperAdmin",
      _id: { $ne: this._id }, // Exclure l'utilisateur actuel si c'est une mise à jour
    });

    if (existingUpperAdmin) {
      const error = new Error(
        "Il ne peut y avoir qu'un seul UpperAdmin par entreprise"
      );
      return next(error);
    }
  }
  next();
});

// Méthode pour obtenir le nom complet
userSchema.methods.getFullName = function () {
  if (this.firstName && this.lastName) {
    return `${this.firstName} ${this.lastName}`;
  }
  return this.email;
};

// Méthode pour vérifier si l'utilisateur est SuperUser
userSchema.methods.isSuperUser = function () {
  return this.role === "SuperUser";
};

// Méthode pour vérifier si l'utilisateur est UpperAdmin
userSchema.methods.isUpperAdmin = function () {
  return this.role === "UpperAdmin";
};

// Méthode pour vérifier si l'utilisateur est Admin
userSchema.methods.isAdmin = function () {
  return this.role === "Admin";
};

// Méthode pour vérifier si l'utilisateur a des droits d'administration
userSchema.methods.hasAdminRights = function () {
  return ["SuperUser", "UpperAdmin", "Admin"].includes(this.role);
};

// Méthode pour vérifier si Outlook est connecté
userSchema.methods.hasOutlookConnected = function () {
  return this.outlookConfig && this.outlookConfig.isConnected;
};

// Méthode pour vérifier si l'email est configuré
userSchema.methods.hasEmailConfigured = function () {
  return (
    this.hasConfiguredEmail &&
    (this.activeEmailProvider === 'outlook' || this.activeEmailProvider === 'imap_smtp')
  );
};

// Méthode pour vérifier si peut accéder à la plateforme
userSchema.methods.canAccessPlatform = function () {
  // UpperAdmin doit avoir vérifié son email
  if (this.role === 'UpperAdmin') {
    return this.emailVerified && this.hasEmailConfigured();
  }

  // Admin et Employee doivent avoir configuré leur email
  return this.hasEmailConfigured();
};

const User = mongoose.model("User", userSchema);

module.exports = User;
