const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');
const { getDesignations, getDesignation, createDesignation, updateDesignation, deleteDesignation } = require('../controllers/designationController');

router.use(protect);
router.route('/').get(getDesignations).post(authorize('admin'), createDesignation);
router.route('/:id').get(getDesignation).put(authorize('admin'), updateDesignation).delete(authorize('admin'), deleteDesignation);

module.exports = router;
