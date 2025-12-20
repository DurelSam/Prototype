const outlookService = require("../services/outlookService");
const outlookSyncService = require("../services/outlookSyncService");
const User = require("../models/User");
const Communication = require("../models/Communication");
const crypto = require("crypto");

exports.getAuthUrl = async (req, res) => {
  try {
    // 1. Vérification de sécurité
    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: false,
        message: "Utilisateur non authentifié",
      });
    }

    const userId = req.user._id.toString(); // IMPORTANT: Convertir ObjectId en string

    // --- CORRECTION ICI ---
    // On ne fait PLUS de crypto ni d'encodage ici.
    // On passe simplement l'ID brut au service.
    // Le service va s'occuper de créer l'objet {id: ..., nonce: ...} et d'encoder.

    console.log("🔵 [getAuthUrl] UserID passé au service:", userId);
    const authUrl = outlookService.getAuthorizationUrl(userId);

    res.status(200).json({
      success: true,
      authUrl: authUrl,
      message: "Redirigez l'utilisateur vers cette URL",
    });
  } catch (error) {
    console.error("Erreur getAuthUrl:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.handleCallback = async (req, res) => {
  try {
    const { code, state, error, error_description } = req.query;

    // 1. Gestion des erreurs Microsoft
    if (error) {
      console.error("Erreur OAuth Microsoft:", error, error_description);
      return res.redirect(
        `${process.env.FRONTEND_URL}/integrations?error=${encodeURIComponent(
          error_description || error
        )}`
      );
    }

    if (!code || !state) {
      console.error("Code ou State manquant.");
      return res.redirect(
        `${process.env.FRONTEND_URL}/integrations?error=missing_code_or_state`
      );
    }

    // 2. DÉCODAGE ROBUSTE DU STATE
    let userId;
    try {
      // On décode le Base64
      const decodedString = Buffer.from(state, "base64").toString("utf-8");
      console.log("🔍 DEBUG State décodé (String):", decodedString);

      // On essaie de parser en JSON
      const decodedState = JSON.parse(decodedString);
      console.log("🔍 DEBUG State parsé (Object):", JSON.stringify(decodedState, null, 2));
      console.log("🔍 DEBUG decodedState.id:", decodedState.id);
      console.log("🔍 DEBUG decodedState keys:", Object.keys(decodedState || {}));

      // On récupère l'ID (en vérifiant que decodedState n'est pas null)
      if (decodedState && decodedState.id) {
        userId = decodedState.id;
      }

      console.log("🆔 ID Utilisateur extrait:", userId);
    } catch (e) {
      console.error("⚠️ Erreur de décodage JSON:", e.message);
      // Fallback : Si ce n'était pas du JSON, peut-être l'ancien format string ?
      // Essaie de voir si decodedString est directement l'ID (cas rare mais possible si tu as changé le code d'envoi)
      try {
        const rawString = Buffer.from(state, "base64").toString("utf-8");
        if (rawString.length === 24) userId = rawString; // Longueur standard MongoID
      } catch (err) {}
    }

    // 3. SÉCURITÉ CRITIQUE (C'est ça qui manquait !)
    if (!userId) {
      console.error(
        "❌ Impossible de trouver un ID utilisateur valide dans le state."
      );
      return res.redirect(
        `${process.env.FRONTEND_URL}/integrations?error=invalid_state_userid_missing`
      );
    }

    // 4. Échanger le code contre les tokens
    const tokens = await outlookService.exchangeCodeForTokens(code);

    // 5. Récupérer le profil Outlook
    const userProfile = await outlookService.getUserProfile(tokens.accessToken);
    const outlookEmail = userProfile.email || userProfile.userPrincipalName;

    // 6. METTRE À JOUR L'UTILISATEUR
    const user = await User.findByIdAndUpdate(
      userId,
      {
        $set: {
          "outlookConfig.accessToken": tokens.accessToken,
          "outlookConfig.refreshToken": tokens.refreshToken,
          "outlookConfig.expiry": outlookService.calculateExpiryDate(
            tokens.expiresIn
          ),
          "outlookConfig.isConnected": true,
          "outlookConfig.linkedEmail": outlookEmail,
          activeEmailProvider: "outlook", // IMPORTANT: définir le provider actif
          hasConfiguredEmail: true, // ✅ FIX: Marquer l'email comme configuré
        },
      },
      { new: true }
    );

    if (!user) {
      console.error(`❌ Aucun utilisateur trouvé en DB avec l'ID: ${userId}`);
      return res.redirect(
        `${process.env.FRONTEND_URL}/integrations?error=user_not_found_db`
      );
    }

    console.log(
      `✅ Succès ! Outlook (${outlookEmail}) lié au compte MERN (${user.email})`
    );

    res.redirect(
      `${process.env.FRONTEND_URL}/integrations/callback?success=outlook_connected&email=${encodeURIComponent(outlookEmail)}`
    );
  } catch (error) {
    console.error("🔥 Erreur handleCallback:", error);
    res.redirect(
      `${process.env.FRONTEND_URL}/integrations?error=${encodeURIComponent(
        error.message
      )}`
    );
  }
};

/**
 * @desc    Déconnecte Outlook (supprime les tokens)
 * @route   POST /api/auth/outlook/disconnect
 * @access  Private
 */
exports.disconnectOutlook = async (req, res) => {
  try {
    const userId = req.user._id;

    // Réinitialiser la configuration Outlook
    await User.findByIdAndUpdate(userId, {
      $set: {
        "outlookConfig.accessToken": null,
        "outlookConfig.refreshToken": null,
        "outlookConfig.expiry": null,
        "outlookConfig.isConnected": false,
        "outlookConfig.linkedEmail": null,
        activeEmailProvider: null, // IMPORTANT: réinitialiser le provider actif
        hasConfiguredEmail: false, // ✅ FIX: Marquer l'email comme NON configuré
      },
    });

    res.status(200).json({
      success: true,
      message: "Outlook disconnected successfully",
    });
  } catch (error) {
    console.error("Erreur disconnectOutlook:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la déconnexion d'Outlook",
      error: error.message,
    });
  }
};

/**
 * @desc    Récupère le statut de connexion Outlook
 * @route   GET /api/outlook/status
 * @access  Private
 */
exports.getStatus = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select(
      "outlookConfig.isConnected outlookConfig.expiry"
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Vérifier si le token est expiré
    const isExpired = outlookService.isTokenExpired(user.outlookConfig?.expiry);

    res.status(200).json({
      success: true,
      isConnected: user.outlookConfig?.isConnected || false,
      tokenExpired: isExpired,
      expiryDate: user.outlookConfig?.expiry || null,
    });
  } catch (error) {
    console.error("Erreur getStatus:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération du statut",
      error: error.message,
    });
  }
};

/**
 * @desc    Récupère les statistiques Outlook (nombre d'emails, dernière sync)
 * @route   GET /api/outlook/stats
 * @access  Private
 */
exports.getStats = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId).select(
      "outlookConfig.isConnected outlookConfig.expiry outlookConfig.lastSyncDate tenant_id"
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Compter le nombre d'emails Outlook synchronisés
    // Pour les SuperUser sans tenant_id, on retourne 0 (ils n'ont pas de tenant)
    let messagesCount = 0;
    let lastEmail = null;

    if (user.tenant_id) {
      messagesCount = await Communication.countDocuments({
        tenant_id: user.tenant_id,
        source: "Outlook",
      });

      // Récupérer la date du dernier email synchronisé (plus précis que lastSyncDate)
      lastEmail = await Communication.findOne({
        tenant_id: user.tenant_id,
        source: "Outlook",
      })
        .sort({ receivedAt: -1 })
        .select("receivedAt createdAt");
    }

    // Vérifier si le token est expiré
    const isExpired = outlookService.isTokenExpired(user.outlookConfig?.expiry);

    res.status(200).json({
      success: true,
      isConnected: user.outlookConfig?.isConnected || false,
      messagesCount: messagesCount,
      lastSync:
        user.outlookConfig?.lastSyncDate ||
        (lastEmail ? lastEmail.createdAt : null),
      lastEmailReceived: lastEmail ? lastEmail.receivedAt : null,
      tokenExpired: isExpired,
      expiryDate: user.outlookConfig?.expiry || null,
    });
  } catch (error) {
    console.error("Erreur getStats:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des statistiques",
      error: error.message,
    });
  }
};

/**
 * @desc    Récupère les emails Outlook de l'utilisateur
 * @route   GET /api/auth/outlook/emails
 * @access  Private
 */
exports.getEmails = async (req, res) => {
  try {
    const userId = req.user._id;
    const { top = 50, skip = 0, filter = null } = req.query;

    // Récupérer l'utilisateur avec ses tokens
    const user = await User.findById(userId).select(
      "+outlookConfig.accessToken +outlookConfig.refreshToken outlookConfig.expiry"
    );

    if (!user || !user.outlookConfig?.isConnected) {
      return res.status(401).json({
        success: false,
        message:
          "Outlook not connected. Please connect your Outlook account first.",
      });
    }

    let accessToken = user.outlookConfig.accessToken;

    // Vérifier si le token est expiré et le rafraîchir si nécessaire
    if (outlookService.isTokenExpired(user.outlookConfig.expiry)) {
      console.log("🔄 Access token expiré, rafraîchissement en cours...");

      const refreshedTokens = await outlookService.refreshAccessToken(
        user.outlookConfig.refreshToken
      );
      const newExpiryDate = outlookService.calculateExpiryDate(
        refreshedTokens.expiresIn
      );

      // Mettre à jour les tokens dans la base de données
      await User.findByIdAndUpdate(userId, {
        $set: {
          "outlookConfig.accessToken": refreshedTokens.accessToken,
          "outlookConfig.refreshToken": refreshedTokens.refreshToken,
          "outlookConfig.expiry": newExpiryDate,
        },
      });

      accessToken = refreshedTokens.accessToken;
      console.log("✅ Access token rafraîchi avec succès");
    }

    // Récupérer les emails
    const emailsData = await outlookService.getEmails(accessToken, {
      top: parseInt(top),
      skip: parseInt(skip),
      filter: filter,
    });

    res.status(200).json({
      success: true,
      data: emailsData.emails,
      nextLink: emailsData.nextLink,
      count: emailsData.count || emailsData.emails.length,
    });
  } catch (error) {
    console.error("Erreur getEmails:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des emails",
      error: error.message,
    });
  }
};

/**
 * @desc    Récupère un email spécifique par son ID
 * @route   GET /api/auth/outlook/emails/:messageId
 * @access  Private
 */
exports.getEmailById = async (req, res) => {
  try {
    const userId = req.user._id;
    const { messageId } = req.params;

    // Récupérer l'utilisateur avec ses tokens
    const user = await User.findById(userId).select(
      "+outlookConfig.accessToken +outlookConfig.refreshToken outlookConfig.expiry"
    );

    if (!user || !user.outlookConfig?.isConnected) {
      return res.status(401).json({
        success: false,
        message: "Outlook not connected",
      });
    }

    let accessToken = user.outlookConfig.accessToken;

    // Rafraîchir le token si expiré
    if (outlookService.isTokenExpired(user.outlookConfig.expiry)) {
      const refreshedTokens = await outlookService.refreshAccessToken(
        user.outlookConfig.refreshToken
      );
      const newExpiryDate = outlookService.calculateExpiryDate(
        refreshedTokens.expiresIn
      );

      await User.findByIdAndUpdate(userId, {
        $set: {
          "outlookConfig.accessToken": refreshedTokens.accessToken,
          "outlookConfig.refreshToken": refreshedTokens.refreshToken,
          "outlookConfig.expiry": newExpiryDate,
        },
      });

      accessToken = refreshedTokens.accessToken;
    }

    // Récupérer l'email spécifique
    const email = await outlookService.getEmailById(accessToken, messageId);

    res.status(200).json({
      success: true,
      data: email,
    });
  } catch (error) {
    console.error("Erreur getEmailById:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération de l'email",
      error: error.message,
    });
  }
};

/**
 * @desc    Force la synchronisation des emails Outlook (utilise outlookSyncService)
 * @route   POST /api/outlook/sync
 * @access  Private
 */
exports.syncEmails = async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const forceFullSync = req.body.forceFullSync || false;

    // Utiliser le service de synchronisation
    const result = await outlookSyncService.syncUserEmails(
      userId,
      forceFullSync
    );

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message,
      });
    }

    res.status(200).json({
      success: true,
      message: `Synchronization completed: ${result.created} new emails, ${result.skipped} already exist`,
      data: result,
    });
  } catch (error) {
    console.error("Erreur syncEmails:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la synchronisation des emails",
      error: error.message,
    });
  }
};
