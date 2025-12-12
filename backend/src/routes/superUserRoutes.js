/**
 * SuperUser Routes
 *
 * Routes réservées au SuperUser uniquement
 * Protégées par authMiddleware + superUserMiddleware
 */

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { isSuperUser } = require('../middleware/superUserMiddleware');
const superUserController = require('../controllers/superUserController');

// Appliquer les middlewares à toutes les routes
router.use(protect);
router.use(isSuperUser);

// ========== ROUTES UPPERADMINS ==========

// Liste tous les UpperAdmins
router.get('/admins', superUserController.getAllUpperAdmins);

// Créer un UpperAdmin
router.post('/admins', superUserController.createUpperAdmin);

// Modifier un UpperAdmin
router.put('/admins/:id', superUserController.updateUpperAdmin);

// Supprimer un UpperAdmin
router.delete('/admins/:id', superUserController.deleteUpperAdmin);

// Activer/Désactiver un UpperAdmin
router.patch('/admins/:id/toggle-status', superUserController.toggleUpperAdminStatus);

// Réinitialiser mot de passe d'un UpperAdmin
router.post('/admins/:id/reset-password', superUserController.resetUpperAdminPassword);

// ========== ROUTES TENANTS ==========

// Liste tous les tenants
router.get('/tenants', superUserController.getAllTenants);

// Créer un tenant
router.post('/tenants', superUserController.createTenant);

// Détails d'un tenant
router.get('/tenants/:id', superUserController.getTenantById);

// ========== ROUTES STATISTIQUES ==========

// Statistiques globales
router.get('/stats', superUserController.getGlobalStats);

module.exports = router;
