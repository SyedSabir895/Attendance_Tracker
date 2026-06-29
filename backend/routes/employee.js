const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');
const upload = require('../config/multer');
const {
  getEmployees, getEmployee, getMyProfile, createEmployee,
  updateEmployee, deleteEmployee, toggleStatus, getEmployeesDropdown,
} = require('../controllers/employeeController');

router.use(protect);

router.get('/dropdown', authorize('admin'), getEmployeesDropdown);
router.get('/me', getMyProfile);
router
  .route('/')
  .get(authorize('admin'), getEmployees)
  .post(authorize('admin'), upload.single('profilePhoto'), createEmployee);

router
  .route('/:id')
  .get(getEmployee)
  .put(authorize('admin'), upload.single('profilePhoto'), updateEmployee)
  .delete(authorize('admin'), deleteEmployee);

router.patch('/:id/status', authorize('admin'), toggleStatus);

module.exports = router;
