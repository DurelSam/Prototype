const User = require('../models/User');
const Communication = require('../models/Communication');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const emailService = require('../services/emailService');

// ========================================
// PROFIL PERSONNEL
// ========================================

exports.getMyProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('tenant_id', 'companyName')
      .populate('managedBy', 'firstName lastName email')
      .populate('createdBy', 'firstName lastName email');

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error('Erreur getMyProfile:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du profil',
      error: error.message,
    });
  }
};

exports.updateMyProfile = async (req, res) => {
  try {
    const { firstName, lastName, emailSignature } = req.body;

    // Seuls firstName, lastName et emailSignature sont modifiables
    const updateData = {};
    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;
    if (emailSignature !== undefined) updateData.emailSignature = emailSignature;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updateData,
      { new: true, runValidators: true }
    ).populate('tenant_id', 'companyName');

    res.json({
      success: true,
      message: 'Profil mis à jour avec succès',
      data: user,
    });
  } catch (error) {
    console.error('Erreur updateMyProfile:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour du profil',
      error: error.message,
    });
  }
};

// ========================================
// GESTION ADMINS (UpperAdmin uniquement)
// ========================================

exports.createAdmin = async (req, res) => {
  try {
    const { email, firstName, lastName } = req.body;

    // Validation
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email requis',
      });
    }

    // Vérifier si l'UpperAdmin a configuré son email
    const upperAdmin = await User.findById(req.user._id);
    const hasEmailConfigured = upperAdmin.hasConfiguredEmail;

    // Vérifier si email existe déjà
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Un utilisateur existe déjà avec cet email',
      });
    }

    // Générer mot de passe aléatoire
    const generatedPassword = crypto.randomBytes(8).toString('hex'); // 16 caractères
    const hashedPassword = await bcrypt.hash(generatedPassword, 12);

    // Créer l'Admin
    const admin = await User.create({
      tenant_id: req.user.tenant_id,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: 'Admin',
      firstName: firstName || '',
      lastName: lastName || '',
      emailVerified: false, // Admin n'a pas besoin de vérifier son email
      hasConfiguredEmail: false, // Doit configurer son email
    });

    // Populate tenant_id pour l'email
    await admin.populate('tenant_id', 'companyName');

    let emailSent = false;
    let emailError = null;

    // Envoyer email de bienvenue avec credentials SEULEMENT si UpperAdmin a configuré son email
    if (hasEmailConfigured) {
      try {
        await emailService.sendAdminWelcomeEmail(req.user._id, admin, generatedPassword);
        emailSent = true;
        console.log('✅ Email de bienvenue Admin envoyé avec succès');
      } catch (emailError) {
        console.error('⚠️ Erreur envoi email bienvenue Admin:', emailError.message);
        emailError = emailError.message;
      }
    } else {
      console.log('⚠️ Email non envoyé: UpperAdmin n\'a pas configuré son email');
      emailError = 'UpperAdmin email not configured';
    }

    res.status(201).json({
      success: true,
      message: emailSent
        ? 'Admin créé avec succès. Un email de bienvenue a été envoyé.'
        : 'Admin créé avec succès. ⚠️ Email non envoyé: veuillez configurer votre email ou partager le mot de passe manuellement.',
      data: {
        admin: {
          _id: admin._id,
          email: admin.email,
          firstName: admin.firstName,
          lastName: admin.lastName,
          role: admin.role,
        },
        temporaryPassword: generatedPassword, // Toujours retourner le mot de passe
        emailSent,
        emailError: emailSent ? null : emailError,
      },
    });
  } catch (error) {
    console.error('Erreur createAdmin:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création de l\'admin',
      error: error.message,
    });
  }
};

exports.getAdmins = async (req, res) => {
  try {
    const admins = await User.find({
      tenant_id: req.user.tenant_id,
      role: 'Admin',
    }).sort({ createdAt: -1 });

    // Populer les employés gérés par chaque admin
    const adminsWithEmployees = await Promise.all(
      admins.map(async (admin) => {
        const employees = await User.find({
          managedBy: admin._id,
          role: 'Employee',
        }).select('firstName lastName email isActive');

        return {
          ...admin.toObject(),
          managedEmployees: employees,
          managedEmployeesCount: employees.length,
        };
      })
    );

    res.json({
      success: true,
      data: adminsWithEmployees,
    });
  } catch (error) {
    console.error('Erreur getAdmins:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des admins',
      error: error.message,
    });
  }
};

exports.getAdminById = async (req, res) => {
  try {
    const admin = await User.findOne({
      _id: req.params.id,
      tenant_id: req.user.tenant_id,
      role: 'Admin',
    });

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin non trouvé',
      });
    }

    res.json({
      success: true,
      data: admin,
    });
  } catch (error) {
    console.error('Erreur getAdminById:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de l\'admin',
      error: error.message,
    });
  }
};

exports.updateAdmin = async (req, res) => {
  try {
    const { firstName, lastName } = req.body;

    const admin = await User.findOne({
      _id: req.params.id,
      tenant_id: req.user.tenant_id,
      role: 'Admin',
    });

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin non trouvé',
      });
    }

    // Mise à jour
    if (firstName !== undefined) admin.firstName = firstName;
    if (lastName !== undefined) admin.lastName = lastName;
    await admin.save();

    res.json({
      success: true,
      message: 'Admin mis à jour avec succès',
      data: admin,
    });
  } catch (error) {
    console.error('Erreur updateAdmin:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour de l\'admin',
      error: error.message,
    });
  }
};

exports.toggleAdminStatus = async (req, res) => {
  try {
    const admin = await User.findOne({
      _id: req.params.id,
      tenant_id: req.user.tenant_id,
      role: 'Admin',
    });

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin non trouvé',
      });
    }

    // Basculer le statut
    admin.isActive = !admin.isActive;
    await admin.save();

    res.json({
      success: true,
      message: `Admin ${admin.isActive ? 'activé' : 'désactivé'} avec succès`,
      data: admin,
    });
  } catch (error) {
    console.error('Erreur toggleAdminStatus:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du changement de statut',
      error: error.message,
    });
  }
};

exports.deleteAdmin = async (req, res) => {
  try {
    const { confirmationPhrase } = req.body;

    // Vérifier la phrase de confirmation
    const expectedPhrase = 'DELETE ADMIN';
    if (confirmationPhrase !== expectedPhrase) {
      return res.status(400).json({
        success: false,
        message: `Veuillez taper exactement "${expectedPhrase}" pour confirmer la suppression`,
      });
    }

    const admin = await User.findOne({
      _id: req.params.id,
      tenant_id: req.user.tenant_id,
      role: 'Admin',
    });

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin non trouvé',
      });
    }

    // Vérifier si l'admin a des employees
    const employeeCount = await User.countDocuments({
      managedBy: admin._id,
      isActive: true,
    });

    if (employeeCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cet admin gère encore ${employeeCount} employé(s). Veuillez les transférer ou les supprimer avant de supprimer l\'admin.`,
      });
    }

    // Transférer les communications des employees de cet admin au UpperAdmin
    const employees = await User.find({
      managedBy: admin._id,
    });

    for (const employee of employees) {
      await Communication.updateMany(
        { userId: employee._id },
        { $set: { visibleToAdmins: [req.user._id] } } // Transférer au UpperAdmin
      );
    }

    // Supprimer l'admin (hard delete)
    await User.findByIdAndDelete(admin._id);

    res.json({
      success: true,
      message: 'Admin supprimé avec succès',
    });
  } catch (error) {
    console.error('Erreur deleteAdmin:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression de l\'admin',
      error: error.message,
    });
  }
};

// ========================================
// GESTION EMPLOYEES (Admin uniquement)
// ========================================

exports.createEmployee = async (req, res) => {
  try {
    const { email, firstName, lastName } = req.body;

    // Validation
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email requis',
      });
    }

    // Vérifier si l'Admin a configuré son email
    const admin = await User.findById(req.user._id);
    const hasEmailConfigured = admin.hasConfiguredEmail;

    // Vérifier si email existe déjà
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Un utilisateur existe déjà avec cet email',
      });
    }

    // Générer mot de passe aléatoire
    const generatedPassword = crypto.randomBytes(8).toString('hex');
    const hashedPassword = await bcrypt.hash(generatedPassword, 12);

    // Créer l'Employee
    const employee = await User.create({
      tenant_id: req.user.tenant_id,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: 'Employee',
      firstName: firstName || '',
      lastName: lastName || '',
      createdBy: req.user._id, // Admin qui l'a créé
      managedBy: req.user._id, // Admin qui le gère
      emailVerified: false,
      hasConfiguredEmail: false,
    });

    // Populate tenant_id pour l'email
    await employee.populate('tenant_id', 'companyName');

    let emailSent = false;
    let emailError = null;

    // Envoyer email de bienvenue SEULEMENT si Admin a configuré son email
    if (hasEmailConfigured) {
      try {
        await emailService.sendEmployeeWelcomeEmail(req.user._id, employee, generatedPassword);
        emailSent = true;
        console.log('✅ Email de bienvenue Employee envoyé avec succès');
      } catch (error) {
        console.error('⚠️ Erreur envoi email bienvenue Employee:', error.message);
        emailError = error.message;
      }
    } else {
      console.log('⚠️ Email non envoyé: Admin n\'a pas configuré son email');
      emailError = 'Admin email not configured';
    }

    res.status(201).json({
      success: true,
      message: emailSent
        ? 'Employé créé avec succès. Un email de bienvenue a été envoyé.'
        : 'Employé créé avec succès. ⚠️ Email non envoyé: veuillez configurer votre email ou partager le mot de passe manuellement.',
      data: {
        employee: {
          _id: employee._id,
          email: employee.email,
          firstName: employee.firstName,
          lastName: employee.lastName,
          role: employee.role,
        },
        temporaryPassword: generatedPassword, // Toujours retourner le mot de passe
        emailSent,
        emailError: emailSent ? null : emailError
      },
    });
  } catch (error) {
    console.error('Erreur createEmployee:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création de l\'employé',
      error: error.message,
    });
  }
};

exports.getEmployees = async (req, res) => {
  try {
    let query = { role: 'Employee' };

    // Si Admin: voir uniquement SES employees
    if (req.user.role === 'Admin') {
      query.managedBy = req.user._id;
    }

    // Si UpperAdmin: voir TOUS les employees du tenant
    if (req.user.role === 'UpperAdmin') {
      query.tenant_id = req.user.tenant_id;
    }

    const employees = await User.find(query)
      .populate('managedBy', 'firstName lastName email')
      .populate('createdBy', 'firstName lastName email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: employees,
    });
  } catch (error) {
    console.error('Erreur getEmployees:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des employés',
      error: error.message,
    });
  }
};

exports.getEmployeeById = async (req, res) => {
  try {
    let query = {
      _id: req.params.id,
      role: 'Employee',
    };

    // Si Admin: vérifier que c'est SON employee
    if (req.user.role === 'Admin') {
      query.managedBy = req.user._id;
    }

    // Si UpperAdmin: vérifier que c'est dans son tenant
    if (req.user.role === 'UpperAdmin') {
      query.tenant_id = req.user.tenant_id;
    }

    const employee = await User.findOne(query)
      .populate('managedBy', 'firstName lastName email')
      .populate('createdBy', 'firstName lastName email');

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employé non trouvé',
      });
    }

    res.json({
      success: true,
      data: employee,
    });
  } catch (error) {
    console.error('Erreur getEmployeeById:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de l\'employé',
      error: error.message,
    });
  }
};

exports.updateEmployee = async (req, res) => {
  try {
    const { firstName, lastName } = req.body;

    const employee = await User.findOne({
      _id: req.params.id,
      managedBy: req.user._id, // Vérifier que c'est SON employee
      role: 'Employee',
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employé non trouvé',
      });
    }

    // Mise à jour
    if (firstName !== undefined) employee.firstName = firstName;
    if (lastName !== undefined) employee.lastName = lastName;
    await employee.save();

    res.json({
      success: true,
      message: 'Employé mis à jour avec succès',
      data: employee,
    });
  } catch (error) {
    console.error('Erreur updateEmployee:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour de l\'employé',
      error: error.message,
    });
  }
};

exports.deleteEmployee = async (req, res) => {
  try {
    const { confirmationPhrase } = req.body;

    // Vérifier la phrase de confirmation
    const expectedPhrase = 'DELETE EMPLOYEE';
    if (confirmationPhrase !== expectedPhrase) {
      return res.status(400).json({
        success: false,
        message: `Veuillez taper exactement "${expectedPhrase}" pour confirmer la suppression`,
      });
    }

    const employee = await User.findOne({
      _id: req.params.id,
      managedBy: req.user._id,
      role: 'Employee',
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employé non trouvé',
      });
    }

    // Transférer les communications de l'employee à l'Admin
    await Communication.updateMany(
      { userId: employee._id },
      {
        $set: {
          visibleToAdmins: [req.user._id],
          // Optionnel: ajouter un champ pour marquer que l'user original a été supprimé
          originalUserDeleted: true,
          originalUserEmail: employee.email,
        }
      }
    );

    // Supprimer l'employee (hard delete)
    await User.findByIdAndDelete(employee._id);

    res.json({
      success: true,
      message: 'Employé supprimé avec succès. Ses communications ont été transférées à votre compte.',
    });
  } catch (error) {
    console.error('Erreur deleteEmployee:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression de l\'employé',
      error: error.message,
    });
  }
};

exports.transferEmployee = async (req, res) => {
  try {
    const { newAdminId } = req.body;

    if (!newAdminId) {
      return res.status(400).json({
        success: false,
        message: 'ID du nouvel admin requis',
      });
    }

    // Vérifier que le nouvel admin existe et est dans le même tenant
    const newAdmin = await User.findOne({
      _id: newAdminId,
      tenant_id: req.user.tenant_id,
      role: 'Admin',
      isActive: true,
    });

    if (!newAdmin) {
      return res.status(404).json({
        success: false,
        message: 'Nouvel admin non trouvé',
      });
    }

    // Vérifier permission
    let employee;
    if (req.user.role === 'Admin') {
      // Admin peut transférer ses propres employees
      employee = await User.findOne({
        _id: req.params.id,
        managedBy: req.user._id,
        role: 'Employee',
      });
    } else if (req.user.role === 'UpperAdmin') {
      // UpperAdmin peut transférer n'importe quel employee du tenant
      employee = await User.findOne({
        _id: req.params.id,
        tenant_id: req.user.tenant_id,
        role: 'Employee',
      });
    }

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employé non trouvé',
      });
    }

    // Sauvegarder l'ancien admin pour l'email
    const oldAdmin = await User.findById(employee.managedBy).select('firstName lastName email');

    // Transférer
    employee.managedBy = newAdminId;
    await employee.save();

    // Populate tenant_id pour l'email
    await employee.populate('tenant_id', 'companyName');

    // Mettre à jour les communications
    await Communication.updateMany(
      { userId: employee._id },
      { $set: { visibleToAdmins: [newAdminId] } }
    );

    // Envoyer email de notification de transfert à l'employé
    try {
      await emailService.sendEmployeeTransferEmail(
        req.user._id,
        employee,
        oldAdmin,
        newAdmin
      );
    } catch (emailError) {
      console.error('⚠️ Erreur envoi email transfert:', emailError.message);
      // Ne pas bloquer le transfert si l'email échoue
    }

    res.json({
      success: true,
      message: 'Employé transféré avec succès. Un email de notification a été envoyé.',
      data: employee,
    });
  } catch (error) {
    console.error('Erreur transferEmployee:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du transfert de l\'employé',
      error: error.message,
    });
  }
};

// ========================================
// STATISTIQUES
// ========================================

exports.getUserStats = async (req, res) => {
  try {
    let stats = {};

    if (req.user.role === 'UpperAdmin') {
      // Stats globales du tenant
      const totalAdmins = await User.countDocuments({
        tenant_id: req.user.tenant_id,
        role: 'Admin',
        isActive: true,
      });

      const totalEmployees = await User.countDocuments({
        tenant_id: req.user.tenant_id,
        role: 'Employee',
        isActive: true,
      });

      const totalCommunications = await Communication.countDocuments({
        tenant_id: req.user.tenant_id,
      });

      stats = {
        totalAdmins,
        totalEmployees,
        totalUsers: totalAdmins + totalEmployees + 1,
        totalCommunications,
      };
    } else if (req.user.role === 'Admin') {
      // Stats des employees de l'admin
      const totalEmployees = await User.countDocuments({
        managedBy: req.user._id,
        isActive: true,
      });

      const totalCommunications = await Communication.countDocuments({
        visibleToAdmins: req.user._id,
      });

      stats = {
        totalEmployees,
        totalCommunications,
      };
    }

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Erreur getUserStats:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des statistiques',
      error: error.message,
    });
  }
};

// ========================================
// PARAMÈTRES DE RÉPONSE AUTOMATIQUE
// ========================================

/**
 * @desc    Récupérer les paramètres de réponse automatique
 * @route   GET /api/users/me/auto-response-settings
 * @access  Private
 */
exports.getAutoResponseSettings = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('autoResponseEnabled');

    res.json({
      success: true,
      data: {
        autoResponseEnabled: user.autoResponseEnabled || false,
      },
    });
  } catch (error) {
    console.error('Error getAutoResponseSettings:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving settings',
      error: error.message,
    });
  }
};

/**
 * @desc    Update auto-response settings
 * @route   PUT /api/users/me/auto-response-settings
 * @access  Private
 */
exports.updateAutoResponseSettings = async (req, res) => {
  try {
    const { autoResponseEnabled } = req.body;

    // Validation
    if (typeof autoResponseEnabled !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'autoResponseEnabled must be a boolean',
      });
    }

    // Verify if user has configured an email
    if (autoResponseEnabled && !req.user.hasConfiguredEmail) {
      return res.status(400).json({
        success: false,
        message: 'You must first configure your email in Integrations before enabling auto-responses',
      });
    }

    // Update
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { autoResponseEnabled },
      { new: true, runValidators: true }
    ).select('autoResponseEnabled');

    const tenantId = req.user.tenant_id;
    if (tenantId) {
      if (autoResponseEnabled) {
        await Communication.updateMany(
          {
            tenant_id: tenantId,
            'ai_analysis.requiresResponse': true,
            'ai_analysis.urgency': { $in: ['Low', 'Medium'] },
            hasAutoResponse: false,
            'manualResponse.sent': { $ne: true },
            autoActivation: { $ne: 'never' },
            'sender.email': { $not: { $regex: /noreply|no-reply|do-not-reply/i } },
          },
          { $set: { autoActivation: 'auto' } }
        );
      } else {
        await Communication.updateMany(
          {
            tenant_id: tenantId,
            autoActivation: 'auto',
          },
          { $set: { autoActivation: 'assisted' } }
        );
      }
      await Communication.updateMany(
        {
          tenant_id: tenantId,
          'ai_analysis.urgency': { $in: ['High', 'Critical'] },
        },
        { $set: { autoActivation: 'never' } }
      );
    }

    res.json({
      success: true,
      message: `Auto-responses ${autoResponseEnabled ? 'enabled' : 'disabled'} successfully`,
      data: {
        autoResponseEnabled: user.autoResponseEnabled,
      },
    });
  } catch (error) {
    console.error('Error updateAutoResponseSettings:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating settings',
      error: error.message,
    });
  }
};
