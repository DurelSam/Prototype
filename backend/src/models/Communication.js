const mongoose = require('mongoose');

const communicationSchema = new mongoose.Schema({
  tenant_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: [true, 'L\'ID du tenant est requis'],
    index: true
  },

  source: {
    type: String,
    enum: ['Outlook', 'WhatsApp'],
    required: [true, 'La source est requise']
  },

  externalId: {
    type: String,
    required: [true, 'L\'ID externe est requis'],
    trim: true
  },

  sender: {
    name: {
      type: String,
      default: ''
    },
    email: {
      type: String,
      default: ''
    },
    phone: {
      type: String,
      default: ''
    }
  },

  recipient: {
    name: {
      type: String,
      default: ''
    },
    email: {
      type: String,
      default: ''
    },
    phone: {
      type: String,
      default: ''
    }
  },

  subject: {
    type: String,
    default: '',
    trim: true
  },

  content: {
    type: String,
    required: [true, 'Le contenu est requis'],
    trim: true
  },

  attachments: [{
    url: {
      type: String,
      required: true
    },
    type: {
      type: String,
      default: 'unknown'
    },
    filename: {
      type: String,
      default: ''
    },
    size: {
      type: Number,
      default: 0
    },
    analysis: {
      type: String,
      default: ''
    }
  }],

  ai_analysis: {
    summary: {
      type: String,
      default: ''
    },
    sentiment: {
      type: String,
      enum: ['Positive', 'Neutral', 'Negative', 'Pending'],
      default: 'Pending'
    },
    suggestedAction: {
      type: String,
      default: ''
    },
    category: {
      type: String,
      default: 'General'
    },
    urgency: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Critical'],
      default: 'Medium'
    },
    processedAt: {
      type: Date,
      default: null
    }
  },

  status: {
    type: String,
    enum: ['To Validate', 'Validated', 'Escalated', 'Closed', 'Archived'],
    default: 'To Validate'
  },

  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },

  receivedAt: {
    type: Date,
    default: Date.now,
    required: true
  },

  slaDueDate: {
    type: Date,
    required: true
  },

  validatedAt: {
    type: Date,
    default: null
  },

  validatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },

  closedAt: {
    type: Date,
    default: null
  },

  notes: [{
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    content: {
      type: String,
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],

  metadata: {
    type: Map,
    of: String,
    default: {}
  }

}, {
  timestamps: true
});

// Index composés pour optimiser les recherches
// Note: tenant_id a déjà un index via "index: true" (ligne 8) utilisé par les index composés ci-dessous
communicationSchema.index({ tenant_id: 1, status: 1 });
communicationSchema.index({ tenant_id: 1, receivedAt: -1 });
communicationSchema.index({ slaDueDate: 1, status: 1 });
communicationSchema.index({ source: 1 });
communicationSchema.index({ externalId: 1 });
communicationSchema.index({ 'ai_analysis.sentiment': 1 });
communicationSchema.index({ 'ai_analysis.urgency': 1 });

// Middleware pour calculer automatiquement le SLA Due Date
communicationSchema.pre('save', function(next) {
  if (this.isNew && !this.slaDueDate) {
    // Si pas de SLA défini, on prend 24h par défaut
    const slaHours = 24;
    this.slaDueDate = new Date(this.receivedAt.getTime() + (slaHours * 60 * 60 * 1000));
  }
  next();
});

// Méthode pour vérifier si le SLA est dépassé
communicationSchema.methods.isSLABreached = function() {
  return Date.now() > this.slaDueDate && this.status !== 'Closed' && this.status !== 'Archived';
};

// Méthode pour obtenir le temps restant avant le SLA
communicationSchema.methods.getTimeUntilSLA = function() {
  const now = Date.now();
  const diff = this.slaDueDate - now;

  if (diff < 0) {
    return { breached: true, hoursRemaining: 0 };
  }

  const hoursRemaining = Math.floor(diff / (1000 * 60 * 60));
  return { breached: false, hoursRemaining };
};

// Méthode pour marquer comme validé
communicationSchema.methods.markAsValidated = function(userId) {
  this.status = 'Validated';
  this.validatedAt = Date.now();
  this.validatedBy = userId;
  return this.save();
};

// Méthode pour marquer comme escaladé
communicationSchema.methods.markAsEscalated = function() {
  this.status = 'Escalated';
  return this.save();
};

// Méthode pour fermer la communication
communicationSchema.methods.close = function() {
  this.status = 'Closed';
  this.closedAt = Date.now();
  return this.save();
};

const Communication = mongoose.model('Communication', communicationSchema);

module.exports = Communication;
