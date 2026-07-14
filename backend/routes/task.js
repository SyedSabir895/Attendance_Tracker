const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');
const {
  getTasks, createTask, updateTask, updateTaskStatus, deleteTask,
} = require('../controllers/taskController');

router.use(protect);
router.use(authorize('admin'));

router.route('/').get(getTasks).post(createTask);
router.route('/:id').put(updateTask).delete(deleteTask);
router.patch('/:id/status', updateTaskStatus);

module.exports = router;
