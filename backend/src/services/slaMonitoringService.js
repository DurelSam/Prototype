/**
 * SLA Monitoring & Escalation Service
 *
 * Surveille les communications High/Critical non répondues après 24h
 * et les escalade automatiquement selon la hiérarchie:
 * - Employee -> Admin
 * - Admin -> UpperAdmin
 */

const cron = require('node-cron');
const Communication = require('../models/Communication');
const User = require('../models/User');
const Notification = require('../models/Notification');

let cronJob = null;

/**
 * Escalader une communication Employee vers son Admin
 */
async function escalateEmployeeToAdmin(communication) {
  try {
    // Récupérer l'Employee propriétaire
    const employee = await User.findById(communication.userId);

    if (!employee || !employee.managedBy) {
      console.log(`⚠️  Communication ${communication._id}: Employee n'a pas de manager`);
      return;
    }

    // Récupérer l'Admin
    const admin = await User.findById(employee.managedBy);

    if (!admin) {
      console.log(`⚠️  Communication ${communication._id}: Admin introuvable`);
      return;
    }

    // Marquer comme escaladée
    communication.status = 'Escalated';

    // Ajouter l'Admin dans visibleToAdmins s'il n'y est pas déjà
    if (!communication.visibleToAdmins.includes(admin._id)) {
      communication.visibleToAdmins.push(admin._id);
    }

    await communication.save();

    // Créer une notification pour l'Admin
    await Notification.create({
      tenant_id: communication.tenant_id,
      userId: admin._id,
      type: 'sla_breach',
      title: 'Email escaladé - SLA dépassé',
      message: `L'email "${communication.subject}" de ${employee.firstName} ${employee.lastName} a dépassé le délai de 24h et vous a été escaladé.`,
      relatedEntityType: 'Communication',
      relatedEntityId: communication._id,
      priority: communication.ai_analysis.urgency,
      isRead: false,
    });

    console.log(`✅ Escalation Employee->Admin: ${communication.subject} -> ${admin.email}`);
  } catch (error) {
    console.error(`❌ Erreur escalation Employee->Admin:`, error);
  }
}

/**
 * Escalader une communication Admin vers UpperAdmin
 */
async function escalateAdminToUpperAdmin(communication) {
  try {
    // Récupérer l'UpperAdmin du tenant
    const upperAdmin = await User.findOne({
      tenant_id: communication.tenant_id,
      role: 'UpperAdmin',
    });

    if (!upperAdmin) {
      console.log(`⚠️  Communication ${communication._id}: UpperAdmin introuvable`);
      return;
    }

    // Récupérer l'Admin propriétaire
    const admin = await User.findById(communication.userId);

    // Marquer comme escaladée
    communication.status = 'Escalated';

    await communication.save();

    // Créer une notification pour l'UpperAdmin
    await Notification.create({
      tenant_id: communication.tenant_id,
      userId: upperAdmin._id,
      type: 'sla_breach',
      title: 'Email escaladé - SLA dépassé',
      message: `L'email "${communication.subject}" de ${admin?.firstName || 'Admin'} ${admin?.lastName || ''} a dépassé le délai de 24h et vous a été escaladé.`,
      relatedEntityType: 'Communication',
      relatedEntityId: communication._id,
      priority: communication.ai_analysis.urgency,
      isRead: false,
    });

    console.log(`✅ Escalation Admin->UpperAdmin: ${communication.subject} -> ${upperAdmin.email}`);
  } catch (error) {
    console.error(`❌ Erreur escalation Admin->UpperAdmin:`, error);
  }
}

/**
 * Vérifier et escalader les communications en dépassement SLA
 */
async function checkAndEscalate() {
  try {
    const now = new Date();

    // Trouver toutes les communications High/Critical:
    // - SLA dépassé (slaDueDate < maintenant)
    // - Pas encore fermées ou archivées
    // - Pas encore escaladées
    const breachedCommunications = await Communication.find({
      'ai_analysis.urgency': { $in: ['High', 'Critical'] },
      slaDueDate: { $lt: now },
      status: { $nin: ['Closed', 'Archived', 'Escalated'] },
    }).populate('userId', 'role firstName lastName managedBy tenant_id');

    console.log(`📊 ${breachedCommunications.length} communication(s) en dépassement SLA`);

    for (const comm of breachedCommunications) {
      const owner = comm.userId;

      if (!owner) {
        console.log(`⚠️  Communication ${comm._id}: Propriétaire introuvable`);
        continue;
      }

      // Escalader selon le rôle du propriétaire
      if (owner.role === 'Employee') {
        await escalateEmployeeToAdmin(comm);
      } else if (owner.role === 'Admin') {
        await escalateAdminToUpperAdmin(comm);
      } else if (owner.role === 'UpperAdmin') {
        // Créer une notification critique pour l'UpperAdmin
        // (pas d'escalation possible au-dessus)
        await Notification.create({
          tenant_id: comm.tenant_id,
          userId: owner._id,
          type: 'sla_breach',
          title: 'SLA dépassé - Action urgente requise',
          message: `Votre email "${comm.subject}" a dépassé le délai de 24h et nécessite une action urgente.`,
          relatedEntityType: 'Communication',
          relatedEntityId: comm._id,
          priority: 'Critical',
          isRead: false,
        });

        // Marquer comme escaladé même si pas de niveau supérieur
        comm.status = 'Escalated';
        await comm.save();

        console.log(`⚠️  UpperAdmin SLA breach (pas d'escalation): ${comm.subject}`);
      }
    }
  } catch (error) {
    console.error('❌ Erreur dans checkAndEscalate:', error);
  }
}

/**
 * Démarrer le monitoring SLA
 * @param {Number} intervalMinutes - Intervalle en minutes (défaut: 60 = 1h)
 */
exports.startSlaMonitoring = (intervalMinutes = 60) => {
  // Si un cron job est déjà en cours, le stopper d'abord
  if (cronJob) {
    cronJob.stop();
  }

  // Créer l'expression cron
  const cronExpression = `*/${intervalMinutes} * * * *`;

  console.log(`🔄 Démarrage du monitoring SLA (toutes les ${intervalMinutes} minutes)`);

  cronJob = cron.schedule(cronExpression, async () => {
    console.log('🔄 Cron SLA Monitoring - Démarrage...');
    await checkAndEscalate();
    console.log('✅ Cron SLA Monitoring - Terminé');
  });

  console.log('✅ Cron SLA Monitoring activé');
};

/**
 * Stopper le monitoring SLA
 */
exports.stopSlaMonitoring = () => {
  if (cronJob) {
    cronJob.stop();
    console.log('⏹️  Cron SLA Monitoring stoppé');
  }
};

/**
 * Vérifier si le cron est actif
 */
exports.isCronActive = () => {
  return cronJob !== null;
};

/**
 * Exécuter manuellement le check (pour tests)
 */
exports.runManualCheck = async () => {
  console.log('🔄 Check SLA manuel...');
  await checkAndEscalate();
  console.log('✅ Check SLA manuel terminé');
};
