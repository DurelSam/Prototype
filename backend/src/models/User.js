const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  tenant_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: function() {
      // tenant_id n'est pas requis pour les SuperUser
      return this.role !== 'SuperUser';
    },
    index: true
  },

  email: {
    type: String,
    required: [true, 'L\'email est requis'],
    unique: true, // Email unique globalement
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
    enum: ['SuperUser', 'UpperAdmin', 'Admin', 'Employee'],
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

// Index pour les recherches fréquentes
userSchema.index({ role: 1 });
userSchema.index({ isActive: 1 });
userSchema.index({ tenant_id: 1, role: 1 });

// Middleware pour mettre à jour updatedAt
userSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Middleware de validation pour UpperAdmin unique par tenant
userSchema.pre('save', async function(next) {
  // Vérifier qu'il n'y a qu'un seul UpperAdmin par tenant
  if (this.role === 'UpperAdmin' && this.tenant_id) {
    const existingUpperAdmin = await mongoose.model('User').findOne({
      tenant_id: this.tenant_id,
      role: 'UpperAdmin',
      _id: { $ne: this._id } // Exclure l'utilisateur actuel si c'est une mise à jour
    });

    if (existingUpperAdmin) {
      const error = new Error('Il ne peut y avoir qu\'un seul UpperAdmin par entreprise');
      return next(error);
    }
  }
  next();
});

// Méthode pour obtenir le nom complet
userSchema.methods.getFullName = function() {
  if (this.firstName && this.lastName) {
    return `${this.firstName} ${this.lastName}`;
  }
  return this.email;
};

// Méthode pour vérifier si l'utilisateur est SuperUser
userSchema.methods.isSuperUser = function() {
  return this.role === 'SuperUser';
};

// Méthode pour vérifier si l'utilisateur est UpperAdmin
userSchema.methods.isUpperAdmin = function() {
  return this.role === 'UpperAdmin';
};

// Méthode pour vérifier si l'utilisateur est Admin
userSchema.methods.isAdmin = function() {
  return this.role === 'Admin';
};

// Méthode pour vérifier si l'utilisateur a des droits d'administration
userSchema.methods.hasAdminRights = function() {
  return ['SuperUser', 'UpperAdmin', 'Admin'].includes(this.role);
};

// Méthode pour vérifier si Outlook est connecté
userSchema.methods.hasOutlookConnected = function() {
  return this.outlookConfig && this.outlookConfig.isConnected;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
