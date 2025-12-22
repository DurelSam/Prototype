const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

// ========================================
// ROUTES PROFIL PERSONNEL
// (Tous les utilisateurs authentifiés)
// ========================================

/**
 * GET /api/users/profile
 * Récupérer son propre profil
 */
router.get('/profile', authenticate, userController.getMyProfile);

/**
 * PUT /api/users/profile
 * Mettre à jour son propre profil
 * Body: { firstName, lastName, phoneNumber }
 */
router.put('/profile', authenticate, userController.updateMyProfile);

// ========================================
// ROUTES GESTION ADMINS
// (UpperAdmin uniquement)
// ========================================

/**
 * POST /api/users/admins
 * Créer un nouvel Admin
 * Body: { email, firstName, lastName }
 */
router.post('/admins', authenticate, authorize('UpperAdmin'), userController.createAdmin);

/**
 * GET /api/users/admins
 * Récupérer tous les Admins du tenant
 */
router.get('/admins', authenticate, authorize('UpperAdmin'), userController.getAdmins);

/**
 * GET /api/users/admins/:id
 * Récupérer un Admin spécifique
 * Params: id
 */
router.get('/admins/:id', authenticate, authorize('UpperAdmin'), userController.getAdminById);

/**
 * PUT /api/users/admins/:id
 * Mettre à jour un Admin
 * Params: id
 * Body: { firstName, lastName, phoneNumber, isActive }
 */
router.put('/admins/:id', authenticate, authorize('UpperAdmin'), userController.updateAdmin);

/**
 * PATCH /api/users/admins/:id/toggle-status
 * Activer/Désactiver un Admin
 * Params: id
 */
router.patch('/admins/:id/toggle-status', authenticate, authorize('UpperAdmin'), userController.toggleAdminStatus);

/**
 * DELETE /api/users/admins/:id
 * Supprimer un Admin
 * Params: id
 * Body: { confirmationPhrase: "DELETE ADMIN" }
 */
router.delete('/admins/:id', authenticate, authorize('UpperAdmin'), userController.deleteAdmin);

// ========================================
// ROUTES GESTION EMPLOYEES
// (Admin et UpperAdmin)
// ========================================

/**
 * POST /api/users/employees
 * Créer un nouvel Employee
 * Body: { email, firstName, lastName }
 */
router.post('/employees', authenticate, authorize('Admin', 'UpperAdmin'), userController.createEmployee);

/**
 * GET /api/users/employees
 * Récupérer tous les Employees
 * - Admin: voit uniquement ses Employees (managedBy)
 * - UpperAdmin: voit tous les Employees du tenant
 */
router.get('/employees', authenticate, authorize('Admin', 'UpperAdmin'), userController.getEmployees);

/**
 * GET /api/users/employees/:id
 * Récupérer un Employee spécifique
 * Params: id
 */
router.get('/employees/:id', authenticate, authorize('Admin', 'UpperAdmin'), userController.getEmployeeById);

/**
 * PUT /api/users/employees/:id
 * Mettre à jour un Employee
 * Params: id
 * Body: { firstName, lastName, phoneNumber, isActive }
 */
router.put('/employees/:id', authenticate, authorize('Admin', 'UpperAdmin'), userController.updateEmployee);

/**
 * DELETE /api/users/employees/:id
 * Supprimer un Employee
 * Params: id
 * Body: { confirmationPhrase: "DELETE EMPLOYEE" }
 */
router.delete('/employees/:id', authenticate, authorize('Admin', 'UpperAdmin'), userController.deleteEmployee);

/**
 * PUT /api/users/employees/:id/transfer
 * Transférer un Employee à un autre Admin
 * Params: id
 * Body: { newAdminId }
 */
router.put('/employees/:id/transfer', authenticate, authorize('UpperAdmin'), userController.transferEmployee);

// ========================================
// ROUTES STATISTIQUES
// (Admin et UpperAdmin)
// ========================================

/**
 * GET /api/users/stats
 * Récupérer les statistiques utilisateurs
 * - Admin: stats de ses Employees
 * - UpperAdmin: stats de tous les Admins et Employees
 */
router.get('/stats', authenticate, authorize('Admin', 'UpperAdmin'), userController.getUserStats);

// ========================================
// ROUTES PARAMÈTRES DE RÉPONSE AUTOMATIQUE
// (Tous les utilisateurs authentifiés)
// ========================================

/**
 * GET /api/users/me/auto-response-settings
 * Récupérer les paramètres de réponse automatique
 */
router.get('/me/auto-response-settings', authenticate, userController.getAutoResponseSettings);

/**
 * PUT /api/users/me/auto-response-settings
 * Mettre à jour les paramètres de réponse automatique
 * Body: { autoResponseEnabled: boolean }
 */
router.put('/me/auto-response-settings', authenticate, userController.updateAutoResponseSettings);

module.exports = router;
