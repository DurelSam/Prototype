const axios = require("axios");
const crypto = require("crypto");

class OutlookService {
  constructor() {
    this.clientId = process.env.AZURE_CLIENT_ID;
    this.clientSecret = process.env.AZURE_CLIENT_SECRET;
    this.redirectUri = process.env.AZURE_REDIRECT_URI;
    this.tenantId = process.env.AZURE_TENANT_ID || "common";

    // Microsoft OAuth2 endpoints (V2.0)
    this.authorizeEndpoint = `https://login.microsoftonline.com/${this.tenantId}/oauth2/v2.0/authorize`;
    this.tokenEndpoint = `https://login.microsoftonline.com/${this.tenantId}/oauth2/v2.0/token`;

    // Microsoft Graph API
    this.graphApiEndpoint = "https://graph.microsoft.com/v1.0";

    // Permissions requises (Utilisation des URLs complètes pour éviter les ambiguïtés)
    this.scopes = [
      "openid",
      "profile",
      "email",
      "offline_access", // Indispensable pour le refresh_token
      "https://graph.microsoft.com/Mail.Read",
      "https://graph.microsoft.com/Mail.ReadWrite",
      "https://graph.microsoft.com/Mail.Send",
      "https://graph.microsoft.com/User.Read",
    ].join(" ");
  }

  /**
   * Génère l'URL d'autorisation OAuth2 Microsoft
   * @param {string|object} data - ID Utilisateur (string) ou Objet de données à sécuriser dans le state
   * @returns {string} URL d'autorisation complète
   */
  getAuthorizationUrl(data) {
    console.log("🟢 [OutlookService] getAuthorizationUrl reçu data:", data);
    console.log("🟢 [OutlookService] data type:", typeof data);

    // 1. Construction du State sécurisé (JSON + Base64)
    // On permet de passer soit juste l'ID, soit un objet complet
    const statePayload = typeof data === "object" ? data : { id: data };
    console.log("🟢 [OutlookService] statePayload créé:", JSON.stringify(statePayload));

    // Ajout d'un 'nonce' aléatoire pour garantir que le state est unique
    statePayload.nonce = crypto.randomBytes(16).toString("hex");
    console.log("🟢 [OutlookService] statePayload avec nonce:", JSON.stringify(statePayload));

    // Encodage en Base64 pour passer proprement dans l'URL
    const encodedState = Buffer.from(JSON.stringify(statePayload)).toString(
      "base64"
    );
    console.log("🟢 [OutlookService] encodedState:", encodedState);

    // 2. Construction des paramètres
    const params = new URLSearchParams({
      client_id: this.clientId,
      response_type: "code",
      redirect_uri: this.redirectUri,
      response_mode: "query",
      scope: this.scopes,
      state: encodedState, // On injecte le state encodé ici
      prompt: "consent", // Force l'écran de consentement pour valider les permissions
    });

    return `${this.authorizeEndpoint}?${params.toString()}`;
  }

  /**
   * Décode un JWT token pour inspecter son contenu (sans vérification de signature)
   * @param {string} token - Le JWT token
   * @returns {Object} - Le payload décodé
   */
  decodeJWT(token) {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        throw new Error('Invalid JWT format');
      }
      const payload = Buffer.from(parts[1], 'base64').toString('utf8');
      return JSON.parse(payload);
    } catch (error) {
      console.error('Erreur lors du décodage du JWT:', error.message);
      return null;
    }
  }

  /**
   * Échange le code d'autorisation contre des tokens
   * @param {string} authorizationCode - Code reçu après autorisation
   * @returns {Promise<Object>} Tokens
   */
  async exchangeCodeForTokens(authorizationCode) {
    try {
      console.log("🔄 Échange du code d'autorisation contre des tokens...");

      const params = new URLSearchParams({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        code: authorizationCode,
        redirect_uri: this.redirectUri,
        grant_type: "authorization_code",
      });

      const response = await axios.post(this.tokenEndpoint, params);

      const tokens = {
        accessToken: response.data.access_token,
        refreshToken: response.data.refresh_token,
        expiresIn: response.data.expires_in,
        tokenType: response.data.token_type,
        scope: response.data.scope,
      };

      // Décoder le token pour voir son contenu
      console.log("✅ Tokens obtenus avec succès");
      console.log("📋 Scopes reçus:", tokens.scope);

      const decodedToken = this.decodeJWT(tokens.accessToken);
      if (decodedToken) {
        console.log("🔍 Token décodé:");
        console.log("   - Utilisateur (upn):", decodedToken.upn || decodedToken.unique_name);
        console.log("   - Scopes (scp):", decodedToken.scp);
        console.log("   - Audience (aud):", decodedToken.aud);
        console.log("   - Issuer (iss):", decodedToken.iss);
        console.log("   - Tenant ID (tid):", decodedToken.tid);
        console.log("   - Expiration:", new Date(decodedToken.exp * 1000).toISOString());
      }

      return tokens;
    } catch (error) {
      console.error("❌ Erreur lors de l'échange du code:", error.response?.data || error.message);
      throw new Error(
        "Erreur Token Microsoft: " +
          (error.response?.data?.error_description || error.message)
      );
    }
  }

  /**
   * Récupère le profil utilisateur Microsoft
   * @param {string} accessToken - Access token valide
   * @returns {Promise<Object>} Profil utilisateur
   */
  async getUserProfile(accessToken) {
    try {
      console.log("👤 Récupération du profil utilisateur...");

      const response = await axios.get(`${this.graphApiEndpoint}/me`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      });

      const profile = {
        email: response.data.mail || response.data.userPrincipalName,
        displayName: response.data.displayName,
        firstName: response.data.givenName,
        lastName: response.data.surname,
        id: response.data.id,
      };

      console.log("✅ Profil récupéré:");
      console.log("   - Email:", profile.email);
      console.log("   - Nom complet:", profile.displayName);
      console.log("   - User ID:", profile.id);

      return profile;
    } catch (error) {
      console.error("❌ Erreur lors de la récupération du profil:");
      console.error("   Status:", error.response?.status);
      console.error("   Error:", JSON.stringify(error.response?.data, null, 2));
      throw new Error("Impossible de récupérer le profil utilisateur");
    }
  }

  /**
   * Récupère les emails de l'utilisateur
   * @param {string} accessToken - Access token valide
   * @param {Object} options - Options de filtre (top, skip, filter, select)
   * @returns {Promise<Array>} Liste des emails
   */
  async getEmails(accessToken, options = {}) {
    try {
      const {
        top = 50, // Nombre d'emails à récupérer
        skip = 0, // Pagination
        filter = null, // Filtre OData (ex: "isRead eq false")
        select = "subject,from,receivedDateTime,bodyPreview,isRead,hasAttachments",
        orderby = "receivedDateTime DESC",
      } = options;

      const params = new URLSearchParams({
        $top: top,
        $skip: skip,
        $select: select,
        $orderby: orderby,
      });

      if (filter) {
        params.append("$filter", filter);
      }

      const endpoint = `${this.graphApiEndpoint}/me/messages?${params.toString()}`;

      // Log détaillé pour debug
      console.log(`📨 Tentative de récupération des emails depuis Graph API`);
      console.log(`   Endpoint: ${endpoint}`);
      console.log(`   Token (premiers caractères): ${accessToken.substring(0, 20)}...`);

      const response = await axios.get(endpoint, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      });

      console.log(`✅ ${response.data.value?.length || 0} emails récupérés avec succès`);

      return {
        emails: response.data.value,
        nextLink: response.data["@odata.nextLink"],
        count: response.data["@odata.count"],
      };
    } catch (error) {
      // Log détaillé de l'erreur Microsoft Graph API
      console.error("❌ ========== ERREUR MICROSOFT GRAPH API ==========");
      console.error("Status Code:", error.response?.status);
      console.error("Status Text:", error.response?.statusText);
      console.error("Error Data:", JSON.stringify(error.response?.data, null, 2));
      console.error("Error Headers:", error.response?.headers);
      console.error("Request URL:", error.config?.url);
      console.error("Request Headers:", {
        Authorization: error.config?.headers?.Authorization ?
          `Bearer ${error.config.headers.Authorization.substring(7, 27)}...` :
          'Not found',
        'Content-Type': error.config?.headers?.['Content-Type']
      });
      console.error("================================================");

      // Extraire le message d'erreur Microsoft si disponible
      const msErrorMessage = error.response?.data?.error?.message ||
                            error.response?.data?.error_description ||
                            error.message;

      throw new Error(`Microsoft Graph API Error: ${msErrorMessage}`);
    }
  }

  /**
   * Récupère les détails d'un email spécifique
   * @param {string} accessToken - Access token valide
   * @param {string} messageId - ID du message
   * @returns {Promise<Object>} Détails de l'email
   */
  async getEmailById(accessToken, messageId) {
    try {
      const response = await axios.get(
        `${this.graphApiEndpoint}/me/messages/${messageId}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error(
        "Erreur lors de la récupération de l'email:",
        error.response?.data || error.message
      );
      throw new Error("Impossible de récupérer l'email");
    }
  }

  /**
   * Envoie un email
   * @param {string} accessToken - Access token valide
   * @param {Object} emailData - Données de l'email (to, subject, body)
   * @returns {Promise<boolean>} Succès de l'envoi
   */
  async sendEmail(accessToken, emailData) {
    try {
      const { to, subject, body, isHtml = true } = emailData;

      const message = {
        message: {
          subject: subject,
          body: {
            contentType: isHtml ? "HTML" : "Text",
            content: body,
          },
          toRecipients: to.map((email) => ({
            emailAddress: {
              address: email,
            },
          })),
        },
      };

      await axios.post(`${this.graphApiEndpoint}/me/sendMail`, message, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      });

      return true;
    } catch (error) {
      console.error(
        "Erreur lors de l'envoi de l'email:",
        error.response?.data || error.message
      );
      throw new Error("Impossible d'envoyer l'email");
    }
  }

  /**
   * Rafraîchit l'access token en utilisant le refresh token
   * @param {string} refreshToken - Le refresh token
   * @returns {Promise<{accessToken: string, refreshToken: string, expiresIn: number}>}
   */
  async refreshAccessToken(refreshToken) {
    try {
      console.log("🔄 Rafraîchissement du token d'accès...");

      const response = await axios.post(
        `https://login.microsoftonline.com/${process.env.AZURE_TENANT_ID}/oauth2/v2.0/token`,
        new URLSearchParams({
          client_id: process.env.AZURE_CLIENT_ID,
          client_secret: process.env.AZURE_CLIENT_SECRET,
          refresh_token: refreshToken,
          grant_type: "refresh_token",
          scope: this.scopes, // IMPORTANT: Utiliser EXACTEMENT les mêmes scopes que lors de l'auth initiale
        }),
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        }
      );

      const tokens = {
        accessToken: response.data.access_token,
        refreshToken: response.data.refresh_token || refreshToken,
        expiresIn: response.data.expires_in,
      };

      console.log("✅ Token rafraîchi avec succès");
      console.log("📋 Scopes reçus:", response.data.scope);

      // Décoder le nouveau token
      const decodedToken = this.decodeJWT(tokens.accessToken);
      if (decodedToken) {
        console.log("🔍 Nouveau token décodé:");
        console.log("   - Utilisateur (upn):", decodedToken.upn || decodedToken.unique_name);
        console.log("   - Scopes (scp):", decodedToken.scp);
        console.log("   - Expiration:", new Date(decodedToken.exp * 1000).toISOString());
      }

      return tokens;
    } catch (error) {
      console.error("❌ Erreur lors du rafraîchissement du token:");
      console.error("   Status:", error.response?.status);
      console.error("   Error:", JSON.stringify(error.response?.data, null, 2));
      throw new Error("Impossible de rafraîchir le token d'accès");
    }
  }

  /**
   * Vérifie si l'access token est encore valide (approximatif basé sur expiry)
   * @param {Date} expiryDate - Date d'expiration du token
   * @returns {boolean} true si le token est expiré ou va expirer dans 5 min
   */
  isTokenExpired(expiryDate) {
    if (!expiryDate) return true;

    const now = new Date();
    const expiry = new Date(expiryDate);
    const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);

    return expiry <= fiveMinutesFromNow;
  }

  /**
   * Calcule la date d'expiration du token
   * @param {number} expiresIn - Durée de validité en secondes
   * @returns {Date} Date d'expiration
   */
  calculateExpiryDate(expiresIn) {
    const now = new Date();
    return new Date(now.getTime() + expiresIn * 1000);
  }

  /**
   * Envoie un email en utilisant les credentials de l'utilisateur
   * @param {string} userId - ID de l'utilisateur
   * @param {Object} emailData - Données de l'email (to, subject, body)
   * @returns {Promise<Object>} Résultat de l'envoi
   */
  async sendEmailAsUser(userId, emailData) {
    try {
      const User = require('../models/User');

      // Récupérer l'utilisateur avec ses tokens
      const user = await User.findById(userId).select(
        '+outlookConfig.accessToken +outlookConfig.refreshToken outlookConfig.expiry outlookConfig.isConnected'
      );

      if (!user || !user.outlookConfig?.isConnected) {
        throw new Error('Outlook non configuré pour cet utilisateur');
      }

      let accessToken = user.outlookConfig.accessToken;

      // Vérifier et rafraîchir le token si nécessaire
      if (this.isTokenExpired(user.outlookConfig.expiry)) {
        console.log('🔄 Access token expiré, rafraîchissement en cours...');

        const refreshedTokens = await this.refreshAccessToken(
          user.outlookConfig.refreshToken
        );
        const newExpiryDate = this.calculateExpiryDate(refreshedTokens.expiresIn);

        // Mettre à jour les tokens dans la base de données
        await User.findByIdAndUpdate(userId, {
          $set: {
            'outlookConfig.accessToken': refreshedTokens.accessToken,
            'outlookConfig.refreshToken': refreshedTokens.refreshToken,
            'outlookConfig.expiry': newExpiryDate,
          },
        });

        accessToken = refreshedTokens.accessToken;
        console.log('✅ Access token rafraîchi avec succès');
      }

      // Normaliser le destinataire en tableau
      const recipients = Array.isArray(emailData.to) ? emailData.to : [emailData.to];

      // Envoyer l'email via l'API Graph
      await this.sendEmail(accessToken, {
        to: recipients,
        subject: emailData.subject,
        body: emailData.body || emailData.html,
        isHtml: true,
      });

      console.log(`✅ Email envoyé via Outlook: ${recipients.join(', ')}`);

      return {
        success: true,
        message: 'Email envoyé avec succès',
      };
    } catch (error) {
      console.error('❌ Erreur envoi email Outlook:', error);
      return {
        success: false,
        message: error.message || "Échec de l'envoi de l'email",
      };
    }
  }
}

module.exports = new OutlookService();
