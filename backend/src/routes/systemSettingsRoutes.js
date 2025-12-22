const express = require('express');
const router = express.Router();
const { getSettings, updateSettings } = require('../controllers/systemSettingsController');
const { authenticate, authorize } = require('../middleware/auth');

// All routes require authentication and admin role
router.use(authenticate);
router.use(authorize(['admin']));

// GET /api/settings - Get system settings
router.get('/', getSettings);

// PUT /api/settings - Update system settings
router.put('/', updateSettings);

module.exports = router;
