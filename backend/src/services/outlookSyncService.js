const User = require("../models/User");
const Communication = require("../models/Communication");
const outlookService = require("./outlookService");

/**
 * Service de Synchronisation Outlook
 * Gère la synchronisation automatique des emails Outlook vers le modèle Communication
 */
class OutlookSyncService {
  constructor() {
    this.syncInProgress = new Map(); // Track ongoing syncs per user
    this.lastSyncTimestamps = new Map(); // Track last sync time per user
  }

  /**
   * Rafraîchit l'access token si nécessaire
   */
  async refreshAccessTokenIfNeeded(user) {
    try {
      if (outlookService.isTokenExpired(user.outlookConfig.expiry)) {
        console.log(`🔄 Token expiré pour ${user.email}, rafraîchissement...`);

        const refreshedTokens = await outlookService.refreshAccessToken(
          user.outlookConfig.refreshToken
        );

        const newExpiryDate = outlookService.calculateExpiryDate(
          refreshedTokens.expiresIn
        );

        await User.findByIdAndUpdate(user._id, {
          $set: {
            "outlookConfig.accessToken": refreshedTokens.accessToken,
            "outlookConfig.refreshToken": refreshedTokens.refreshToken,
            "outlookConfig.expiry": newExpiryDate,
          },
        });

        console.log(`✅ Token rafraîchi pour ${user.email}`);
        return refreshedTokens.accessToken;
      }
      return user.outlookConfig.accessToken;
    } catch (error) {
      console.error(
        `❌ Erreur lors du rafraîchissement du token pour ${user.email}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Récupère les nouveaux emails depuis Outlook
   */
  async fetchEmails(accessToken, lastSyncDate = null, maxEmails = 50) {
    try {
      // AJOUT : On force la sélection des champs nécessaires (body, etc.)
      const options = {
        top: maxEmails,
        skip: 0,
        orderby: "receivedDateTime DESC",
        select:
          "id,subject,from,toRecipients,receivedDateTime,body,bodyPreview,isRead,hasAttachments,conversationId,importance,webLink",
      };

      if (lastSyncDate) {
        const isoDate = lastSyncDate.toISOString();
        options.filter = `receivedDateTime gt ${isoDate}`;
      }

      const emailsData = await outlookService.getEmails(accessToken, options);
      console.log(
        `📧 ${emailsData.emails.length} emails récupérés depuis Outlook`
      );
      return emailsData.emails;
    } catch (error) {
      console.error("❌ Erreur lors de la récupération des emails:", error);
      throw error;
    }
  }

  /**
   * Enregistre un email dans le modèle Communication
   * CORRECTIONS APPLIQUÉES ICI (SLA, Tenant, Content)
   */
  async storeEmail(email, userId, tenantId) {
    try {
      // 1. Vérifier doublons
      const existingComm = await Communication.findOne({
        externalId: email.id,
        source: "Outlook",
      });

      if (existingComm) {
        // console.log(`⚠️ Email ${email.id} déjà existant, skip`);
        return { created: false, communication: existingComm };
      }

      // 2. Préparation des données
      const sender = email.from?.emailAddress || {};
      const recipients = email.toRecipients || [];
      const primaryRecipient = recipients[0]?.emailAddress || {};

      // 3. Calcul du SLA (Correction "Path slaDueDate is required")
      const receivedDate = new Date(email.receivedDateTime);
      const slaDate = new Date(receivedDate);
      slaDate.setHours(slaDate.getHours() + 24); // +24 heures

      // 4. Extraction sécurisée du contenu (Correction "content is required")
      // On priorise le HTML complet, sinon la preview, sinon un texte par défaut
      let content = email.body?.content;
      if (!content || content.trim() === "") {
        content = email.bodyPreview;
      }
      if (!content || content.trim() === "") {
        content = "(Contenu non disponible ou vide)";
      }

      // 5. Création de l'objet
      const communication = new Communication({
        // Correction "tenant_id is required" : Fallback sur 'common' si vide
        tenant_id: tenantId || "common",

        source: "Outlook",
        externalId: email.id,

        // Liaison avec l'utilisateur (important pour l'affichage)
        assignedTo: userId,

        sender: {
          name: sender.name || "Inconnu",
          email: sender.address || "no-reply@unknown.com",
          phone: "",
        },

        recipient: {
          name: primaryRecipient.name || "",
          email: primaryRecipient.address || "",
          phone: "",
        },

        subject: email.subject || "(Pas de sujet)",

        // AJOUTS :
        snippet: email.bodyPreview || "", // On stocke la preview ici
        isRead: email.isRead || false, // On stocke le statut ici

        content: content,

        attachments:
          email.hasAttachments && email.attachments
            ? email.attachments.map((att) => ({
                url: att.contentLocation || "",
                type: att.contentType || "unknown",
                filename: att.name || "fichier",
                size: att.size || 0,
                analysis: "",
              }))
            : [],

        ai_analysis: {
          summary: "",
          sentiment: "Pending",
          suggestedAction: "",
          category: "General",
          urgency: "Medium",
          processedAt: null,
        },

        status: "To Validate",
        receivedAt: receivedDate,

        // CORRECTION MAJEURE : On set explicitement le SLA ici
        slaDueDate: slaDate,

        validatedAt: null,
        validatedBy: null,
        closedAt: null,
        notes: [],
        metadata: {
          conversationId: email.conversationId || "",
          importance: email.importance || "normal",
          isRead: String(email.isRead || false),
          webLink: email.webLink || "",
        },
      });

      await communication.save();
      console.log(
        `💾 Email enregistré : ${email.subject?.substring(0, 30)}...`
      );

      return { created: true, communication };
    } catch (error) {
      console.error(
        `❌ Erreur lors du stockage de l'email ${email.id}:`,
        error
      );
      throw error; // On relance l'erreur pour qu'elle soit comptée dans syncUserEmails
    }
  }

  /**
   * Synchronise les emails Outlook pour un utilisateur
   */
  async syncUserEmails(userId, forceFullSync = false) {
    try {
      if (this.syncInProgress.get(userId)) {
        console.log(
          `⚠️ Synchronisation déjà en cours pour l'utilisateur ${userId}`
        );
        return { success: false, message: "Sync already in progress" };
      }

      this.syncInProgress.set(userId, true);

      const user = await User.findById(userId).select(
        "+outlookConfig.accessToken +outlookConfig.refreshToken outlookConfig.expiry outlookConfig.isConnected tenant_id email"
      );

      if (!user || !user.outlookConfig?.isConnected) {
        this.syncInProgress.delete(userId);
        return {
          success: false,
          message: "Outlook not connected for this user",
        };
      }

      console.log(`🔄 Début sync Outlook pour ${user.email}`);

      const accessToken = await this.refreshAccessTokenIfNeeded(user);

      let lastSyncDate = null;
      if (!forceFullSync && this.lastSyncTimestamps.has(userId)) {
        lastSyncDate = this.lastSyncTimestamps.get(userId);
      }

      // On passe le tenant_id de l'utilisateur (ou undefined, géré dans storeEmail)
      const emails = await this.fetchEmails(accessToken, lastSyncDate, 20); // Réduit à 20 pour tester plus vite

      let successCount = 0;
      let skipCount = 0;
      let errorCount = 0;

      for (const email of emails) {
        try {
          const result = await this.storeEmail(email, userId, user.tenant_id);
          if (result.created) successCount++;
          else skipCount++;
        } catch (error) {
          // On log l'erreur mais on ne bloque pas toute la boucle
          console.error(`Erreur email ${email.id}: ${error.message}`);
          errorCount++;
        }
      }

      const syncDate = new Date();
      this.lastSyncTimestamps.set(userId, syncDate);

      await User.findByIdAndUpdate(userId, {
        $set: { "outlookConfig.lastSyncDate": syncDate },
      });

      this.syncInProgress.delete(userId);

      const result = {
        success: true,
        user: user.email,
        totalFetched: emails.length,
        created: successCount,
        skipped: skipCount,
        errors: errorCount,
        lastSync: syncDate,
      };

      console.log(`✅ Sync terminée pour ${user.email}`, result);
      return result;
    } catch (error) {
      this.syncInProgress.delete(userId);
      console.error(`❌ Erreur sync user ${userId}:`, error.message);
      throw error;
    }
  }

  /**
   * Synchronise les emails pour tous les utilisateurs
   */
  async syncAllUsers() {
    try {
      console.log("🔄 Début de la synchronisation globale Outlook...");
      const users = await User.find({
        "outlookConfig.isConnected": true,
      }).select("_id email");
      console.log(`📊 ${users.length} utilisateurs connectés trouvés`);

      const results = [];
      for (const user of users) {
        try {
          const result = await this.syncUserEmails(user._id.toString(), false);
          results.push(result);
        } catch (error) {
          console.error(`Erreur sync pour ${user.email}:`, error.message);
          results.push({
            success: false,
            user: user.email,
            error: error.message,
          });
        }
      }
      console.log("✅ Synchronisation globale terminée");
      return results;
    } catch (error) {
      console.error("❌ Erreur globale:", error);
      throw error;
    }
  }

  /**
   * Démarre un cron job
   */
  scheduledSync(intervalMinutes = 10) {
    console.log(
      `⏰ Cron Outlook configuré: toutes les ${intervalMinutes} minutes`
    );
    const intervalMs = intervalMinutes * 60 * 1000;

    setInterval(async () => {
      console.log(
        `\n⏰ [CRON] Auto-sync Outlook - ${new Date().toISOString()}`
      );
      try {
        await this.syncAllUsers();
      } catch (error) {
        console.error("[CRON] Erreur:", error);
      }
    }, intervalMs);
  }
}

module.exports = new OutlookSyncService();
