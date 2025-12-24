/**
 * SLA Monitoring & Escalation Service
 *
 * Surveille les communications High/Critical non répondues après un délai
 * et les escalade automatiquement selon la hiérarchie (Transfert de propriété):
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
 * (Transfert de propriété, Statut inchangé)
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

    // Marquer comme escaladée et transférer
    communication.isEscalated = true;
    communication.userId = admin._id; // TRANSFERT AU MANAGER
    
    // On garde le statut original (ex: 'To Validate') pour qu'il apparaisse dans la liste "À Répondre" de l'Admin

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
      title: 'Email escaladé (Reçu)',
      message: `L'email "${communication.subject}" de ${employee.firstName} ${employee.lastName} a dépassé le délai et vous a été transféré.`,
      relatedEntityType: 'Communication',
      relatedEntityId: communication._id,
      priority: communication.ai_analysis.urgency,
      isRead: false,
    });

    console.log(`✅ Escalation (Transfert) Employee->Admin: ${communication.subject} -> ${admin.email}`);
  } catch (error) {
    console.error(`❌ Erreur escalation Employee->Admin:`, error);
  }
}

/**
 * Escalader une communication Admin vers UpperAdmin
 * (Transfert de propriété, Statut inchangé)
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

    // Récupérer l'Admin propriétaire actuel
    const admin = await User.findById(communication.userId);

    // Marquer comme escaladée et transférer
    communication.isEscalated = true;
    communication.userId = upperAdmin._id; // TRANSFERT AU MANAGER SUPÉRIEUR

    await communication.save();

    // Créer une notification pour l'UpperAdmin
    await Notification.create({
      tenant_id: communication.tenant_id,
      userId: upperAdmin._id,
      type: 'sla_breach',
      title: 'Email escaladé (Reçu)',
      message: `L'email "${communication.subject}" de ${admin?.firstName || 'Admin'} ${admin?.lastName || ''} a dépassé le délai et vous a été transféré.`,
      relatedEntityType: 'Communication',
      relatedEntityId: communication._id,
      priority: communication.ai_analysis.urgency,
      isRead: false,
    });

    console.log(`✅ Escalation (Transfert) Admin->UpperAdmin: ${communication.subject} -> ${upperAdmin.email}`);
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
    // Utiliser la variable d'environnement ou 5 minutes par défaut
    const timeoutMinutes = parseInt(process.env.ESCALATION_TIMEOUT_MINUTES) || 5;
    // Calculer la date limite : Maintenant - X minutes
    const thresholdDate = new Date(now.getTime() - timeoutMinutes * 60000);

    console.log(`🔍 Vérification SLA (Timeout: ${timeoutMinutes} min, Seuil: ${thresholdDate.toLocaleTimeString()})`);

    // Trouver toutes les communications High/Critical:
    // - Reçues AVANT la date limite (donc le délai est écoulé)
    // - Qui NÉCESSITENT une réponse (requiresResponse: true)
    // - Pas encore répondues (hasBeenReplied: false)
    // - Pas encore fermées, archivées ou validées
    // - Pas encore escaladées (isEscalated: false)
    const breachedCommunications = await Communication.find({
      'ai_analysis.urgency': { $in: ['High', 'Critical'] },
      'ai_analysis.requiresResponse': true, // ✅ Ajouté : Seulement ceux qui nécessitent une réponse
      receivedAt: { $lt: thresholdDate },
      hasBeenReplied: false,
      status: { $nin: ['Closed', 'Archived', 'Validated'] }, // ✅ Ajouté : Validated arrête aussi l'escalade
      isEscalated: false, // On vérifie le flag
    }).populate('userId', 'role firstName lastName managedBy tenant_id');

    console.log(`📊 ${breachedCommunications.length} communication(s) en dépassement SLA (> ${timeoutMinutes} min)`);

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
        // UpperAdmin est le sommet de la hiérarchie.
        // On ne peut pas transférer, mais on marque comme escaladé pour ne pas spammer.
        // On envoie une notification critique.
        
        await Notification.create({
          tenant_id: comm.tenant_id,
          userId: owner._id,
          type: 'sla_breach',
          title: 'SLA dépassé - Action urgente requise',
          message: `Votre email "${comm.subject}" a dépassé le délai de ${timeoutMinutes} minutes et nécessite une action urgente.`,
          relatedEntityType: 'Communication',
          relatedEntityId: comm._id,
          priority: 'Critical',
          isRead: false,
        });

        // Marquer comme escaladé (flag) pour sortir de la boucle de vérification
        comm.isEscalated = true;
        // Optionnel : Changer le status pour marquer visuellement l'urgence absolue ?
        // comm.status = 'Escalated'; 
        await comm.save();

        console.log(`⚠️  UpperAdmin SLA breach (pas d'escalation possible): ${comm.subject}`);
      }
    }
  } catch (error) {
    console.error('❌ Erreur dans checkAndEscalate:', error);
  }
}

/**
 * Démarrer le monitoring SLA
 * @param {Number} intervalMinutes - Intervalle en minutes (défaut: 1 min pour test réactif)
 */
exports.startSlaMonitoring = (intervalMinutes = 1) => {
  // Si un cron job est déjà en cours, le stopper d'abord
  if (cronJob) {
    cronJob.stop();
  }

  // Créer l'expression cron
  const cronExpression = `*/${intervalMinutes} * * * *`;

  console.log(`🔄 Démarrage du monitoring SLA (toutes les ${intervalMinutes} minutes)`);

  cronJob = cron.schedule(cronExpression, async () => {
    console.log('🔄 Cron SLA Monitoring - Vérification...');
    await checkAndEscalate();
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
