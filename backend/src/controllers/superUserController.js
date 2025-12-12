/**
 * SuperUser Controller
 *
 * Gère toutes les opérations réservées au SuperUser:
 * - Gestion des UpperAdmins (CRUD + reset password)
 * - Gestion des Tenants (création, visualisation)
 * - Statistiques globales
 */

const User = require('../models/User');
const Tenant = require('../models/Tenant');
const Communication = require('../models/Communication');
const bcrypt = require('bcrypt');

// ========== GESTION DES UPPERADMINS ==========

/**
 * GET /api/superuser/admins
 * Liste tous les UpperAdmins
 */
exports.getAllUpperAdmins = async (req, res) => {
  try {
    const upperAdmins = await User.find({ role: 'UpperAdmin' })
      .populate('tenant_id', 'companyName subscriptionStatus')
      .select('-password')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: upperAdmins.length,
      data: upperAdmins
    });
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des UpperAdmins:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des UpperAdmins',
      error: error.message
    });
  }
};

/**
 * POST /api/superuser/admins
 * Créer un nouvel UpperAdmin
 */
exports.createUpperAdmin = async (req, res) => {
  try {
    const { firstName, lastName, email, password, tenant_id } = req.body;

    // Validation
    if (!firstName || !lastName || !email || !password || !tenant_id) {
      return res.status(400).json({
        success: false,
        message: 'Tous les champs sont requis'
      });
    }

    // Vérifier si l'email existe déjà
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Cet email est déjà utilisé'
      });
    }

    // Vérifier que le tenant existe
    const tenant = await Tenant.findById(tenant_id);
    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: 'Tenant introuvable'
      });
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    // Créer l'UpperAdmin
    const upperAdmin = new User({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      role: 'UpperAdmin',
      tenant_id,
      isActive: true
    });

    await upperAdmin.save();

    // Retourner sans le mot de passe
    const upperAdminData = await User.findById(upperAdmin._id)
      .populate('tenant_id', 'companyName subscriptionStatus')
      .select('-password');

    res.status(201).json({
      success: true,
      message: 'UpperAdmin créé avec succès',
      data: upperAdminData
    });
  } catch (error) {
    console.error('❌ Erreur lors de la création de l\'UpperAdmin:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création de l\'UpperAdmin',
      error: error.message
    });
  }
};

/**
 * PUT /api/superuser/admins/:id
 * Modifier un UpperAdmin
 */
exports.updateUpperAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, email, tenant_id } = req.body;

    // Vérifier que l'UpperAdmin existe
    const upperAdmin = await User.findOne({ _id: id, role: 'UpperAdmin' });
    if (!upperAdmin) {
      return res.status(404).json({
        success: false,
        message: 'UpperAdmin introuvable'
      });
    }

    // Si l'email est modifié, vérifier qu'il n'existe pas déjà
    if (email && email !== upperAdmin.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Cet email est déjà utilisé'
        });
      }
    }

    // Si le tenant est modifié, vérifier qu'il existe
    if (tenant_id && tenant_id !== upperAdmin.tenant_id.toString()) {
      const tenant = await Tenant.findById(tenant_id);
      if (!tenant) {
        return res.status(404).json({
          success: false,
          message: 'Tenant introuvable'
        });
      }
    }

    // Mettre à jour
    if (firstName) upperAdmin.firstName = firstName;
    if (lastName) upperAdmin.lastName = lastName;
    if (email) upperAdmin.email = email;
    if (tenant_id) upperAdmin.tenant_id = tenant_id;

    await upperAdmin.save();

    // Retourner les données mises à jour
    const updatedAdmin = await User.findById(id)
      .populate('tenant_id', 'companyName subscriptionStatus')
      .select('-password');

    res.status(200).json({
      success: true,
      message: 'UpperAdmin mis à jour avec succès',
      data: updatedAdmin
    });
  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour de l\'UpperAdmin:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour de l\'UpperAdmin',
      error: error.message
    });
  }
};

/**
 * DELETE /api/superuser/admins/:id
 * Supprimer un UpperAdmin
 */
exports.deleteUpperAdmin = async (req, res) => {
  try {
    const { id } = req.params;

    // Vérifier que l'UpperAdmin existe
    const upperAdmin = await User.findOne({ _id: id, role: 'UpperAdmin' });
    if (!upperAdmin) {
      return res.status(404).json({
        success: false,
        message: 'UpperAdmin introuvable'
      });
    }

    // Supprimer
    await User.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'UpperAdmin supprimé avec succès'
    });
  } catch (error) {
    console.error('❌ Erreur lors de la suppression de l\'UpperAdmin:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression de l\'UpperAdmin',
      error: error.message
    });
  }
};

/**
 * PATCH /api/superuser/admins/:id/toggle-status
 * Activer/Désactiver un UpperAdmin
 */
exports.toggleUpperAdminStatus = async (req, res) => {
  try {
    const { id } = req.params;

    // Vérifier que l'UpperAdmin existe
    const upperAdmin = await User.findOne({ _id: id, role: 'UpperAdmin' });
    if (!upperAdmin) {
      return res.status(404).json({
        success: false,
        message: 'UpperAdmin introuvable'
      });
    }

    // Inverser le statut
    upperAdmin.isActive = !upperAdmin.isActive;
    await upperAdmin.save();

    const updatedAdmin = await User.findById(id)
      .populate('tenant_id', 'companyName subscriptionStatus')
      .select('-password');

    res.status(200).json({
      success: true,
      message: `UpperAdmin ${upperAdmin.isActive ? 'activé' : 'désactivé'} avec succès`,
      data: updatedAdmin
    });
  } catch (error) {
    console.error('❌ Erreur lors du changement de statut:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du changement de statut',
      error: error.message
    });
  }
};

/**
 * POST /api/superuser/admins/:id/reset-password
 * Réinitialiser le mot de passe d'un UpperAdmin
 */
exports.resetUpperAdminPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    // Validation
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Le mot de passe doit contenir au moins 6 caractères'
      });
    }

    // Vérifier que l'UpperAdmin existe
    const upperAdmin = await User.findOne({ _id: id, role: 'UpperAdmin' });
    if (!upperAdmin) {
      return res.status(404).json({
        success: false,
        message: 'UpperAdmin introuvable'
      });
    }

    // Hasher le nouveau mot de passe
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    upperAdmin.password = hashedPassword;
    await upperAdmin.save();

    res.status(200).json({
      success: true,
      message: 'Mot de passe réinitialisé avec succès'
    });
  } catch (error) {
    console.error('❌ Erreur lors de la réinitialisation du mot de passe:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la réinitialisation du mot de passe',
      error: error.message
    });
  }
};

// ========== GESTION DES TENANTS ==========

/**
 * GET /api/superuser/tenants
 * Liste tous les tenants
 */
exports.getAllTenants = async (req, res) => {
  try {
    const tenants = await Tenant.find()
      .sort({ createdAt: -1 });

    // Pour chaque tenant, récupérer l'UpperAdmin et le nombre d'utilisateurs
    const tenantsWithDetails = await Promise.all(
      tenants.map(async (tenant) => {
        const upperAdmin = await User.findOne({
          tenant_id: tenant._id,
          role: 'UpperAdmin'
        }).select('firstName lastName email');

        const userCount = await User.countDocuments({ tenant_id: tenant._id });

        return {
          ...tenant.toObject(),
          upperAdmin,
          userCount
        };
      })
    );

    res.status(200).json({
      success: true,
      count: tenantsWithDetails.length,
      data: tenantsWithDetails
    });
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des tenants:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des tenants',
      error: error.message
    });
  }
};

/**
 * POST /api/superuser/tenants
 * Créer un nouveau tenant
 */
exports.createTenant = async (req, res) => {
  try {
    const { companyName, subscriptionStatus, slaHours, language } = req.body;

    // Validation
    if (!companyName) {
      return res.status(400).json({
        success: false,
        message: 'Le nom de la compagnie est requis'
      });
    }

    // Créer le tenant
    const tenant = new Tenant({
      companyName,
      subscriptionStatus: subscriptionStatus || 'Trial',
      settings: {
        language: language || 'en',
        slaHours: slaHours || 24
      }
    });

    await tenant.save();

    res.status(201).json({
      success: true,
      message: 'Tenant créé avec succès',
      data: tenant
    });
  } catch (error) {
    console.error('❌ Erreur lors de la création du tenant:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création du tenant',
      error: error.message
    });
  }
};

/**
 * GET /api/superuser/tenants/:id
 * Détails d'un tenant
 */
exports.getTenantById = async (req, res) => {
  try {
    const { id } = req.params;

    const tenant = await Tenant.findById(id);
    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: 'Tenant introuvable'
      });
    }

    // Récupérer les détails supplémentaires
    const upperAdmin = await User.findOne({
      tenant_id: id,
      role: 'UpperAdmin'
    }).select('firstName lastName email isActive');

    const users = await User.find({ tenant_id: id })
      .select('firstName lastName email role isActive')
      .sort({ createdAt: -1 });

    const userCount = users.length;
    const communicationCount = await Communication.countDocuments({ tenant_id: id });

    res.status(200).json({
      success: true,
      data: {
        ...tenant.toObject(),
        upperAdmin,
        users,
        userCount,
        communicationCount
      }
    });
  } catch (error) {
    console.error('❌ Erreur lors de la récupération du tenant:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du tenant',
      error: error.message
    });
  }
};

// ========== STATISTIQUES GLOBALES ==========

/**
 * GET /api/superuser/stats
 * Statistiques globales de la plateforme
 */
exports.getGlobalStats = async (req, res) => {
  try {
    // Compter les totaux
    const totalTenants = await Tenant.countDocuments();
    const totalUpperAdmins = await User.countDocuments({ role: 'UpperAdmin' });
    const totalUsers = await User.countDocuments();
    const totalCommunications = await Communication.countDocuments();

    // Statistiques par tenant
    const tenants = await Tenant.find();
    const tenantStats = await Promise.all(
      tenants.map(async (tenant) => {
        const userCount = await User.countDocuments({ tenant_id: tenant._id });
        const communicationCount = await Communication.countDocuments({ tenant_id: tenant._id });
        const upperAdmin = await User.findOne({
          tenant_id: tenant._id,
          role: 'UpperAdmin'
        }).select('firstName lastName email');

        return {
          tenantId: tenant._id,
          companyName: tenant.companyName,
          subscriptionStatus: tenant.subscriptionStatus,
          upperAdmin,
          userCount,
          communicationCount
        };
      })
    );

    // Activité récente (derniers utilisateurs créés)
    const recentUsers = await User.find()
      .populate('tenant_id', 'companyName')
      .select('firstName lastName email role createdAt tenant_id')
      .sort({ createdAt: -1 })
      .limit(10);

    res.status(200).json({
      success: true,
      data: {
        totals: {
          tenants: totalTenants,
          upperAdmins: totalUpperAdmins,
          users: totalUsers,
          communications: totalCommunications
        },
        tenantStats,
        recentActivity: recentUsers
      }
    });
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des statistiques:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des statistiques',
      error: error.message
    });
  }
};
