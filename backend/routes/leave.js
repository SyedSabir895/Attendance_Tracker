const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');
const {
  getLeaves, getMyLeaves, getLeave, createLeave,
  adminCreateLeave, updateLeaveStatus, cancelLeave, deleteLeave,
} = require('../controllers/leaveController');

router.use(protect);

router.get('/my', getMyLeaves);
router.post('/admin', authorize('admin'), adminCreateLeave);
router.put('/:id/status', authorize('admin'), updateLeaveStatus);
router.put('/:id/cancel', cancelLeave);

router
  .route('/')
  .get(authorize('admin'), getLeaves)
  .post(createLeave);

router
  .route('/:id')
  .get(getLeave)
  .delete(authorize('admin'), deleteLeave);

module.exports = router;
