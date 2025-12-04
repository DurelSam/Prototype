const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'L\'ID du destinataire est requis'],
    index: true
  },

  tenant_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: [true, 'L\'ID du tenant est requis'],
    index: true
  },

  type: {
    type: String,
    enum: ['SLA_BREACH', 'NEW_COMMUNICATION', 'URGENT_MESSAGE', 'SYSTEM_ALERT'],
    required: [true, 'Le type de notification est requis']
  },

  communication_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Communication',
    default: null
  },

  title: {
    type: String,
    required: [true, 'Le titre est requis'],
    trim: true
  },

  message: {
    type: String,
    required: [true, 'Le message est requis'],
    trim: true
  },

  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Critical'],
    default: 'Medium'
  },

  isRead: {
    type: Boolean,
    default: false,
    index: true
  },

  readAt: {
    type: Date,
    default: null
  },

  data: {
    type: Map,
    of: String,
    default: {}
  },

  createdAt: {
    type: Date,
    default: Date.now
  }

}, {
  timestamps: true
});

// Index composés pour optimiser les requêtes
notificationSchema.index({ recipient_id: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ tenant_id: 1, createdAt: -1 });
notificationSchema.index({ type: 1, isRead: 1 });

// Méthode pour marquer comme lue
notificationSchema.methods.markAsRead = function() {
  this.isRead = true;
  this.readAt = Date.now();
  return this.save();
};

// Méthode statique pour créer une notification de SLA breach
notificationSchema.statics.createSLABreachNotification = async function(communication, recipientId) {
  return this.create({
    recipient_id: recipientId,
    tenant_id: communication.tenant_id,
    type: 'SLA_BREACH',
    communication_id: communication._id,
    title: 'Dépassement de SLA',
    message: `La communication "${communication.subject || 'Sans titre'}" a dépassé le délai de ${communication.slaDueDate}`,
    priority: 'High',
    data: {
      source: communication.source,
      sender: communication.sender.email || communication.sender.phone
    }
  });
};

// Méthode statique pour créer une notification de nouveau message urgent
notificationSchema.statics.createUrgentMessageNotification = async function(communication, recipientId) {
  return this.create({
    recipient_id: recipientId,
    tenant_id: communication.tenant_id,
    type: 'URGENT_MESSAGE',
    communication_id: communication._id,
    title: 'Message urgent reçu',
    message: `Nouveau message urgent: ${communication.ai_analysis.summary || communication.content.substring(0, 100)}`,
    priority: 'Critical',
    data: {
      source: communication.source,
      urgency: communication.ai_analysis.urgency
    }
  });
};

// Méthode statique pour marquer toutes les notifications d'un utilisateur comme lues
notificationSchema.statics.markAllAsRead = async function(userId) {
  return this.updateMany(
    { recipient_id: userId, isRead: false },
    { $set: { isRead: true, readAt: new Date() } }
  );
};

// Méthode statique pour obtenir le nombre de notifications non lues
notificationSchema.statics.getUnreadCount = async function(userId) {
  return this.countDocuments({ recipient_id: userId, isRead: false });
};

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;
