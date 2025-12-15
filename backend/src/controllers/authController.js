const User = require('../models/User');
const Tenant = require('../models/Tenant');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// ========================================
// INSCRIPTION UPPER ADMIN
// ========================================

exports.registerUpperAdmin = async (req, res) => {
  try {
    const { companyName, email, password, firstName, lastName } = req.body;

    // Validation
    if (!companyName || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Nom d\'entreprise, email et mot de passe requis',
      });
    }

    // Vérifier si email existe déjà
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Un compte existe déjà avec cet email',
      });
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 12);

    // Générer token de vérification
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

    // Créer le tenant (ownerId sera mis à jour après création du user)
    const tenant = await Tenant.create({
      companyName,
      ownerId: null, // Temporaire, sera mis à jour
    });

    // Créer l'UpperAdmin
    const upperAdmin = await User.create({
      tenant_id: tenant._id,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: 'UpperAdmin',
      firstName: firstName || '',
      lastName: lastName || '',
      emailVerified: false,
      emailVerificationToken: verificationToken,
      emailVerificationExpires: verificationExpires,
      hasConfiguredEmail: false,
    });

    // Mettre à jour le tenant avec l'ownerId
    tenant.ownerId = upperAdmin._id;
    await tenant.save();

    // TODO: Envoyer email de vérification
    // Pour le moment, on retourne le token dans la réponse (en dev uniquement)
    const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email/${verificationToken}`;

    res.status(201).json({
      success: true,
      message: 'Compte créé ! Vérifiez votre email pour activer votre compte.',
      data: {
        email: upperAdmin.email,
        companyName: tenant.companyName,
        verificationUrl, // À retirer en production
      },
    });

  } catch (error) {
    console.error('Erreur registerUpperAdmin:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création du compte',
      error: error.message,
    });
  }
};

// ========================================
// VÉRIFICATION EMAIL
// ========================================

exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;

    // Trouver l'utilisateur avec ce token
    const user = await User.findOne({
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: Date.now() },
    }).select('+emailVerificationToken +emailVerificationExpires');

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Token de vérification invalide ou expiré',
      });
    }

    // Vérifier l'email
    user.emailVerified = true;
    user.emailVerificationToken = null;
    user.emailVerificationExpires = null;
    await user.save();

    res.json({
      success: true,
      message: 'Email vérifié avec succès ! Vous pouvez maintenant vous connecter.',
    });
  } catch (error) {
    console.error('Erreur verifyEmail:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la vérification de l\'email',
      error: error.message,
    });
  }
};

// ========================================
// RENVOYER EMAIL DE VÉRIFICATION
// ========================================

exports.resendVerificationEmail = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Aucun compte trouvé avec cet email',
      });
    }

    if (user.emailVerified) {
      return res.status(400).json({
        success: false,
        message: 'Cet email est déjà vérifié',
      });
    }

    // Générer nouveau token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    user.emailVerificationToken = verificationToken;
    user.emailVerificationExpires = verificationExpires;
    await user.save();

    // TODO: Envoyer email
    const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email/${verificationToken}`;

    res.json({
      success: true,
      message: 'Email de vérification renvoyé avec succès',
      verificationUrl, // À retirer en production
    });
  } catch (error) {
    console.error('Erreur resendVerificationEmail:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du renvoi de l\'email',
      error: error.message,
    });
  }
};

// ========================================
// LOGIN
// ========================================

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email et mot de passe requis',
      });
    }

    // Trouver l'utilisateur
    const user = await User.findOne({ email: email.toLowerCase() })
      .select('+password')
      .populate('tenant_id', 'companyName');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Email ou mot de passe incorrect',
      });
    }

    // Vérifier que le compte est actif
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Votre compte a été désactivé. Contactez votre administrateur.',
      });
    }

    // Vérifier le mot de passe
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Email ou mot de passe incorrect',
      });
    }

    // Vérifier si UpperAdmin a vérifié son email
    if (user.role === 'UpperAdmin' && !user.emailVerified) {
      return res.status(403).json({
        success: false,
        message: 'Veuillez vérifier votre email avant de vous connecter',
        requiresEmailVerification: true,
      });
    }

    // ✅ SUPPRESSION DE LA VÉRIFICATION BLOQUANTE
    // La configuration email est maintenant gérée par le Guard frontend
    // qui redirige automatiquement vers /integrations si nécessaire
    // Cela évite le Catch-22 où l'utilisateur ne peut pas se connecter pour configurer son email

    /* ANCIEN CODE BLOQUANT (supprimé)
    if (!user.hasEmailConfigured()) {
      return res.status(403).json({
        success: false,
        message: 'Vous devez configurer votre compte email avant d\'accéder à la plateforme',
        requiresEmailConfiguration: true,
        user: {
          id: user._id,
          email: user.email,
          role: user.role,
        },
      });
    }
    */

    // Mettre à jour lastLogin
    user.lastLogin = new Date();
    await user.save();

    // Générer JWT
    const token = jwt.sign(
      {
        userId: user._id,
        email: user.email,
        role: user.role,
        tenant_id: user.tenant_id,
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Retirer le mot de passe de la réponse
    const userResponse = user.toObject();
    delete userResponse.password;

    res.json({
      success: true,
      message: 'Connexion réussie',
      token,
      user: userResponse,
    });
  } catch (error) {
    console.error('Erreur login:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la connexion',
      error: error.message,
    });
  }
};

// ========================================
// GET ME (profil utilisateur connecté)
// ========================================

exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('tenant_id', 'companyName')
      .populate('managedBy', 'firstName lastName email')
      .populate('createdBy', 'firstName lastName email');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé',
      });
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error('Erreur getMe:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du profil',
      error: error.message,
    });
  }
};

// ========================================
// CHANGER MOT DE PASSE
// ========================================

exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Mot de passe actuel et nouveau mot de passe requis',
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Le nouveau mot de passe doit contenir au moins 6 caractères',
      });
    }

    const user = await User.findById(req.user._id).select('+password');

    // Vérifier mot de passe actuel
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Mot de passe actuel incorrect',
      });
    }

    // Hasher nouveau mot de passe
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    user.password = hashedPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Mot de passe modifié avec succès',
    });
  } catch (error) {
    console.error('Erreur changePassword:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du changement de mot de passe',
      error: error.message,
    });
  }
};

// ========================================
// LOGOUT
// ========================================

exports.logout = async (req, res) => {
  try {
    // Dans un système JWT stateless, le logout se fait côté client
    // Mais on peut logger l'événement ici si nécessaire

    res.json({
      success: true,
      message: 'Déconnexion réussie',
    });
  } catch (error) {
    console.error('Erreur logout:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la déconnexion',
      error: error.message,
    });
  }
};

// ========================================
// FORGOT PASSWORD & RESET PASSWORD
// (À implémenter si nécessaire, même logique que vérification email)
// ========================================

exports.forgotPassword = async (req, res) => {
  // TODO: Implémenter si nécessaire
  res.status(501).json({
    success: false,
    message: 'Fonctionnalité à implémenter',
  });
};

exports.resetPassword = async (req, res) => {
  // TODO: Implémenter si nécessaire
  res.status(501).json({
    success: false,
    message: 'Fonctionnalité à implémenter',
  });
};
