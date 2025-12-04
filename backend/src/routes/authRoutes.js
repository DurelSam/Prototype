const express = require('express');
const router = express.Router();
const {
  register,
  login,
  getCurrentUser,
  logout
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

// Routes publiques
router.post('/register', register);
router.post('/login', login);

// Routes protégées (nécessitent un token)
router.get('/me', protect, getCurrentUser);
router.post('/logout', protect, logout);

module.exports = router;
