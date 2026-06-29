const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');
const { getAdminDashboard, getEmployeeDashboard } = require('../controllers/dashboardController');

router.use(protect);
router.get('/', authorize('admin'), getAdminDashboard);
router.get('/employee', getEmployeeDashboard);

module.exports = router;
