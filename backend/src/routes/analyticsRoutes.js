const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const analyticsController = require('../controllers/analyticsController');

router.get('/admins/performance', protect, analyticsController.getAdminsPerformance);
router.get('/action-items-status', protect, analyticsController.getActionItemsStatus);

module.exports = router;
