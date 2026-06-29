const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');
const { getAttendanceReport, getAnalytics, exportReport } = require('../controllers/reportController');

router.use(protect, authorize('admin'));
router.get('/attendance', getAttendanceReport);
router.get('/analytics', getAnalytics);
router.get('/export', exportReport);

module.exports = router;
