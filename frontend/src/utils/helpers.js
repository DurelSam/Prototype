// Utilitaires généraux

// Formater une date
export const formatDate = (date, options = {}) => {
  if (!date) return '';

  const defaultOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    ...options
  };

  return new Date(date).toLocaleDateString('fr-FR', defaultOptions);
};

// Formater une date relative (il y a X heures)
export const formatRelativeTime = (date) => {
  if (!date) return '';

  const now = new Date();
  const diffMs = now - new Date(date);
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'À l\'instant';
  if (diffMins < 60) return `Il y a ${diffMins} min`;
  if (diffHours < 24) return `Il y a ${diffHours}h`;
  if (diffDays < 7) return `Il y a ${diffDays}j`;

  return formatDate(date);
};

// Calculer le temps restant jusqu'à une date
export const getTimeRemaining = (targetDate) => {
  if (!targetDate) return null;

  const now = new Date();
  const target = new Date(targetDate);
  const diffMs = target - now;

  if (diffMs < 0) {
    return { expired: true, hours: 0, minutes: 0 };
  }

  const hours = Math.floor(diffMs / 3600000);
  const minutes = Math.floor((diffMs % 3600000) / 60000);

  return { expired: false, hours, minutes };
};

// Formater le temps restant pour le SLA
export const formatSLATime = (slaDueDate) => {
  const remaining = getTimeRemaining(slaDueDate);

  if (!remaining) return 'N/A';
  if (remaining.expired) return 'Expiré';

  if (remaining.hours > 0) {
    return `${remaining.hours}h ${remaining.minutes}min`;
  }
  return `${remaining.minutes}min`;
};

// Obtenir la couleur selon le sentiment
export const getSentimentColor = (sentiment) => {
  const colors = {
    'Positive': '#10b981',
    'Neutral': '#f59e0b',
    'Negative': '#ef4444',
    'Pending': '#6b7280'
  };
  return colors[sentiment] || colors['Pending'];
};

// Obtenir la couleur selon l'urgence
export const getUrgencyColor = (urgency) => {
  const colors = {
    'Low': '#10b981',
    'Medium': '#f59e0b',
    'High': '#ef4444',
    'Critical': '#dc2626'
  };
  return colors[urgency] || colors['Medium'];
};

// Obtenir la couleur selon le statut
export const getStatusColor = (status) => {
  const colors = {
    'To Validate': '#3b82f6',
    'Validated': '#10b981',
    'Escalated': '#ef4444',
    'Closed': '#6b7280',
    'Archived': '#9ca3af'
  };
  return colors[status] || colors['To Validate'];
};

// Tronquer le texte
export const truncateText = (text, maxLength = 100) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

// Valider un email
export const isValidEmail = (email) => {
  const regex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
  return regex.test(email);
};

// Capitaliser la première lettre
export const capitalize = (str) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

// Générer une couleur aléatoire pour un avatar
export const generateAvatarColor = (name) => {
  if (!name) return '#6b7280';

  const colors = [
    '#ef4444', '#f59e0b', '#10b981', '#3b82f6',
    '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'
  ];

  const index = name.charCodeAt(0) % colors.length;
  return colors[index];
};

// Obtenir les initiales d'un nom
export const getInitials = (name) => {
  if (!name) return '?';

  const parts = name.trim().split(' ');
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};
