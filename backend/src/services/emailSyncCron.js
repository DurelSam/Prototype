/**
 * Email Sync Cron Service
 *
 * Service de synchronisation automatique des emails (Outlook + IMAP/SMTP)
 * Toutes les 5 minutes
 */

const cron = require('node-cron');
const User = require('../models/User');
const outlookSyncService = require('./outlookSyncService');
const imapSmtpService = require('./imapSmtpService');

let cronJob = null;

/**
 * Démarrer la synchronisation automatique
 * @param {Number} intervalMinutes - Intervalle en minutes (défaut: 5)
 */
exports.startEmailSyncCron = (intervalMinutes = 5) => {
  // Si un cron job est déjà en cours, le stopper d'abord
  if (cronJob) {
    cronJob.stop();
  }

  // Créer l'expression cron
  const cronExpression = `*/${intervalMinutes} * * * *`;

  console.log(`🔄 Démarrage du cron de synchronisation email (toutes les ${intervalMinutes} minutes)`);

  cronJob = cron.schedule(cronExpression, async () => {
    console.log('🔄 Cron Email Sync - Démarrage...');

    try {
      // Récupérer tous les utilisateurs avec email connecté (Outlook OU IMAP/SMTP)
      const users = await User.find({
        $or: [
          { 'outlookConfig.isConnected': true },
          { 'imapSmtpConfig.isConnected': true },
        ],
      });

      console.log(`📊 ${users.length} utilisateur(s) avec email connecté`);

      let outlookSynced = 0;
      let imapSmtpSynced = 0;
      let errors = 0;

      for (const user of users) {
        try {
          // Synchroniser selon le provider actif
          if (user.activeEmailProvider === 'outlook' && user.outlookConfig?.isConnected) {
            // Synchronisation Outlook
            await outlookSyncService.syncUserEmails(user._id);
            outlookSynced++;
            console.log(`✅ Outlook sync: ${user.email}`);
          } else if (user.activeEmailProvider === 'imap_smtp' && user.imapSmtpConfig?.isConnected) {
            // Synchronisation IMAP/SMTP
            await imapSmtpService.syncAllFolders(user._id);
            imapSmtpSynced++;
            console.log(`✅ IMAP/SMTP sync: ${user.email}`);
          }
        } catch (error) {
          errors++;
          console.error(`❌ Erreur sync pour ${user.email}:`, error.message);

          // TODO: Envoyer une notification à l'utilisateur
          // - Notification in-app
          // - Email si activé
        }
      }

      console.log(`✅ Cron Email Sync - Terminé (Outlook: ${outlookSynced}, IMAP/SMTP: ${imapSmtpSynced}, Erreurs: ${errors})`);
    } catch (error) {
      console.error('❌ Erreur dans le cron Email Sync:', error);
    }
  });

  console.log('✅ Cron Email Sync activé');
};

/**
 * Stopper la synchronisation automatique
 */
exports.stopEmailSyncCron = () => {
  if (cronJob) {
    cronJob.stop();
    console.log('⏹️  Cron Email Sync stoppé');
  }
};

/**
 * Vérifier si le cron est actif
 */
exports.isCronActive = () => {
  return cronJob !== null;
};
