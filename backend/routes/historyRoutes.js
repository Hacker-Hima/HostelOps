const express = require('express');
const router = express.Router();
const { getAssetHistory } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, getAssetHistory);

module.exports = router;
