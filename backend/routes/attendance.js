const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');
const {
  getAttendance, getTodayAttendance, getMyAttendance,
  markAttendance, markBulkAttendance, updateAttendance,
  deleteAttendance, getAttendanceByDate, getAttendanceSummary,
} = require('../controllers/attendanceController');

router.use(protect);

router.get('/today', authorize('admin'), getTodayAttendance);
router.get('/my', getMyAttendance);
router.post('/bulk', authorize('admin'), markBulkAttendance);
router.get('/date/:date', getAttendanceByDate);
router.get('/summary/:employeeId', getAttendanceSummary);

router
  .route('/')
  .get(authorize('admin'), getAttendance)
  .post(authorize('admin'), markAttendance);

router
  .route('/:id')
  .put(authorize('admin'), updateAttendance)
  .delete(authorize('admin'), deleteAttendance);

module.exports = router;
