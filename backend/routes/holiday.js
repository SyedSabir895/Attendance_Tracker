const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');
const { getHolidays, getHoliday, createHoliday, updateHoliday, deleteHoliday } = require('../controllers/holidayController');

router.use(protect);
router.route('/').get(getHolidays).post(authorize('admin'), createHoliday);
router.route('/:id').get(getHoliday).put(authorize('admin'), updateHoliday).delete(authorize('admin'), deleteHoliday);

module.exports = router;
