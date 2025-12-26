const User = require("../models/User");
const Communication = require("../models/Communication");
const outlookService = require("./outlookService");
const grokService = require("./grokService");

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

        // Liaison avec l'utilisateur (Propriétaire)
        userId: userId,
        // Liaison avec l'assigné (initialement le propriétaire)
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
          summary: "Analysis pending...",
          sentiment: "Pending",
          suggestedAction: "",
          category: "General",
          urgency: "Medium",
          keyPoints: [],
          actionItems: [],
          entities: [],
          processedAt: null,
        },

        status: "To Validate",
        receivedAt: receivedDate,
        slaStartTime: new Date(), // Timer SLA démarre à la synchro

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

      // Lancer l'analyse IA en arrière-plan (non bloquante)
      this.analyzeEmailAsync(communication._id, {
        subject: communication.subject,
        content: communication.content || communication.snippet,
        sender: communication.sender,
      });

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
      if (!forceFullSync) {
        if (this.lastSyncTimestamps.has(userId)) {
          lastSyncDate = this.lastSyncTimestamps.get(userId);
        } else if (user.outlookConfig?.lastSyncDate) {
          // Utiliser la date en base si pas en mémoire (ex: après redémarrage serveur)
          lastSyncDate = user.outlookConfig.lastSyncDate;
          console.log(`📅 Utilisation de la dernière date de sync en base: ${lastSyncDate}`);
        }
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
   * Analyse un email avec Grok de manière asynchrone (non bloquante)
   * @param {String} communicationId - ID de la communication
   * @param {Object} emailData - Données de l'email (subject, content, sender)
   */
  async analyzeEmailAsync(communicationId, emailData) {
    // Exécuter en arrière-plan sans bloquer
    setImmediate(async () => {
      try {
        console.log(`🤖 Début analyse IA pour: ${emailData.subject?.substring(0, 30)}...`);

        const analysis = await grokService.analyzeCommunication(emailData);

        // Mettre à jour la communication avec l'analyse
        const updated = await Communication.findByIdAndUpdate(
          communicationId,
          {
            ai_analysis: {
              summary: analysis.summary,
              sentiment: analysis.sentiment,
              urgency: analysis.urgency,
              requiresResponse: analysis.requiresResponse || false,
              responseReason: analysis.responseReason || '',
              keyPoints: analysis.keyPoints || [],
              actionItems: analysis.actionItems || [],
              entities: analysis.entities || [],
              processedAt: new Date(),
            },
          },
          { new: true }
        );

        console.log(`✅ Analyse IA terminée pour: ${emailData.subject?.substring(0, 30)}...`);

        // Réponse automatique UNIQUEMENT si:
        // 1. Urgence Low/Medium (pas High/Critical)
        // 2. L'IA détermine qu'une réponse est attendue (requiresResponse === true)
        // 3. L'utilisateur a activé les réponses automatiques (autoResponseEnabled === true)
        const shouldAutoRespond = updated &&
          (analysis.urgency === 'Low' || analysis.urgency === 'Medium') &&
          analysis.requiresResponse === true;

        if (shouldAutoRespond) {
          console.log(`🤖 [${communicationId}] Urgence ${analysis.urgency} + requiresResponse=true - vérification paramètres utilisateur...`);
          console.log(`📝 [${communicationId}] Raison: ${analysis.responseReason}`);

          try {
            // Récupérer l'utilisateur propriétaire pour la signature
            const User = require('../models/User');
            const user = await User.findById(updated.userId);

            if (!user) {
              console.error(`⚠️  [${communicationId}] Utilisateur non trouvé pour réponse auto`);
              return;
            }

            const noReply = !!(updated.sender?.email && /noreply|no-reply|do-not-reply/i.test(updated.sender.email));
            await Communication.findByIdAndUpdate(communicationId, {
              autoActivation: noReply ? 'never' : (user.autoResponseEnabled ? 'auto' : 'assisted'),
            });

            // Vérifier si l'utilisateur a activé les réponses automatiques
            if (!user.autoResponseEnabled) {
              console.log(`⏭️  [${communicationId}] Réponse automatique désactivée pour cet utilisateur - skip`);
              return;
            }

            console.log(`✅ [${communicationId}] autoResponseEnabled=true - génération de la réponse...`);

            // Générer la réponse automatique avec Grok
            const autoResponseContent = await grokService.generateAutoResponse(
              updated,
              analysis,
              user
            );
            const signature = user.emailSignature || "Cordialement,\nL'équipe Support";
            const finalResponse = autoResponseContent + "\n\n" + signature;

            // Envoyer la réponse par Outlook
            const outlookService = require('./outlookService');
            const sendResult = await outlookService.sendEmailAsUser(user._id, {
              to: updated.sender.email,
              subject: `Re: ${updated.subject}`,
              body: finalResponse,
            });

            if (sendResult.success) {
              // Mettre à jour la communication avec les infos de réponse auto
              await Communication.findByIdAndUpdate(communicationId, {
                hasAutoResponse: true,
                autoResponseSentAt: new Date(),
                autoResponseContent: finalResponse,
                status: 'Validated', // Marquer comme validé car répondu automatiquement
                hasBeenReplied: true,
                repliedAt: new Date(),
                repliedBy: user._id,
              });

              console.log(`✅ [${communicationId}] Réponse automatique envoyée avec succès`);
            } else {
              console.error(`❌ [${communicationId}] Échec envoi réponse auto:`, sendResult.message);
            }
          } catch (autoResponseError) {
            console.error(`❌ [${communicationId}] Erreur réponse automatique:`, autoResponseError.message);
            // Ne pas bloquer en cas d'erreur - l'email reste sans réponse auto
          }
        } else if (updated) {
          if (analysis.urgency === 'High' || analysis.urgency === 'Critical') {
            console.log(`⏭️  [${communicationId}] Urgence ${analysis.urgency} - pas de réponse automatique (manuel requis)`);
            await Communication.findByIdAndUpdate(communicationId, { autoActivation: 'never' });
          } else if (!analysis.requiresResponse) {
            console.log(`⏭️  [${communicationId}] requiresResponse=false - pas de réponse automatique`);
            console.log(`📝 [${communicationId}] Raison: ${analysis.responseReason}`);
            await Communication.findByIdAndUpdate(communicationId, { autoActivation: 'never' });
          }
        }
      } catch (error) {
        console.error(`❌ Erreur analyse IA pour ${emailData.subject}:`, error.message);
        // Ne pas bloquer en cas d'erreur - l'analyse restera "pending"
      }
    });
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
