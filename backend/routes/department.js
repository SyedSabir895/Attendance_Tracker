const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');
const { getDepartments, getDepartment, createDepartment, updateDepartment, deleteDepartment } = require('../controllers/departmentController');

router.use(protect);
router.route('/').get(getDepartments).post(authorize('admin'), createDepartment);
router.route('/:id').get(getDepartment).put(authorize('admin'), updateDepartment).delete(authorize('admin'), deleteDepartment);

module.exports = router;
