const mongoose = require('mongoose');

const tenantSchema = new mongoose.Schema({
  companyName: {
    type: String,
    required: [true, 'Le nom de l\'entreprise est requis'],
    trim: true,
    unique: true
  },

  subscriptionStatus: {
    type: String,
    enum: ['Active', 'Trial', 'Cancelled', 'Suspended'],
    default: 'Trial'
  },

  settings: {
    slaHours: {
      type: Number,
      default: 24,
      min: 1,
      max: 168 // 1 semaine max
    },
    language: {
      type: String,
      enum: ['fr', 'en', 'es'],
      default: 'fr'
    },
    timezone: {
      type: String,
      default: 'Europe/Paris'
    }
  },

  twilioConfig: {
    accountSid: {
      type: String,
      default: null
    },
    authToken: {
      type: String,
      default: null,
      select: false // Ne pas retourner par défaut pour sécurité
    },
    phoneNumbers: [{
      type: String,
      trim: true
    }]
  },

  isActive: {
    type: Boolean,
    default: true
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

// Index pour optimiser les recherches
// Note: companyName a déjà un index via "unique: true" (ligne 8)
tenantSchema.index({ subscriptionStatus: 1 });

// Middleware pour mettre à jour updatedAt
tenantSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Méthode pour vérifier si l'abonnement est actif
tenantSchema.methods.isSubscriptionActive = function() {
  return this.subscriptionStatus === 'Active' || this.subscriptionStatus === 'Trial';
};

const Tenant = mongoose.model('Tenant', tenantSchema);

module.exports = Tenant;
