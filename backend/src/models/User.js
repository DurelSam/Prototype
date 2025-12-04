const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  tenant_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: [true, 'L\'ID du tenant est requis'],
    index: true
  },

  email: {
    type: String,
    required: [true, 'L\'email est requis'],
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Email invalide']
  },

  password: {
    type: String,
    required: [true, 'Le mot de passe est requis'],
    minlength: [6, 'Le mot de passe doit contenir au moins 6 caractères'],
    select: false // Ne pas retourner le mot de passe par défaut
  },

  role: {
    type: String,
    enum: ['Admin', 'Manager', 'Employee'],
    default: 'Employee'
  },

  firstName: {
    type: String,
    trim: true,
    default: ''
  },

  lastName: {
    type: String,
    trim: true,
    default: ''
  },

  outlookConfig: {
    accessToken: {
      type: String,
      default: null,
      select: false
    },
    refreshToken: {
      type: String,
      default: null,
      select: false
    },
    expiry: {
      type: Date,
      default: null
    },
    isConnected: {
      type: Boolean,
      default: false
    }
  },

  isActive: {
    type: Boolean,
    default: true
  },

  lastLogin: {
    type: Date,
    default: null
  },

  createdAt: {
    type: Date,
    default: Date.now
  },

  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index composé pour garantir l'unicité de l'email par tenant
userSchema.index({ email: 1, tenant_id: 1 }, { unique: true });

// Index pour les recherches fréquentes
userSchema.index({ role: 1 });
userSchema.index({ isActive: 1 });

// Middleware pour mettre à jour updatedAt
userSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Méthode pour obtenir le nom complet
userSchema.methods.getFullName = function() {
  if (this.firstName && this.lastName) {
    return `${this.firstName} ${this.lastName}`;
  }
  return this.email;
};

// Méthode pour vérifier si l'utilisateur est admin
userSchema.methods.isAdmin = function() {
  return this.role === 'Admin';
};

// Méthode pour vérifier si l'utilisateur est manager
userSchema.methods.isManager = function() {
  return this.role === 'Manager' || this.role === 'Admin';
};

// Méthode pour vérifier si Outlook est connecté
userSchema.methods.hasOutlookConnected = function() {
  return this.outlookConfig && this.outlookConfig.isConnected;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
