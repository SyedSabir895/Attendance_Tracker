const asyncHandler = require('express-async-handler');
const Department = require('../models/Department');
const Employee = require('../models/Employee');

const getDepartments = asyncHandler(async (req, res) => {
  const { includeCount } = req.query;
  let query = Department.find().populate('head', 'firstName lastName').sort('name');
  if (includeCount) query = query.populate('employeeCount');
  const departments = await query.lean({ virtuals: !!includeCount });
  res.json({ success: true, data: departments });
});

const getDepartment = asyncHandler(async (req, res) => {
  const dept = await Department.findById(req.params.id)
    .populate('head', 'firstName lastName email')
    .populate('employeeCount');
  if (!dept) { res.status(404); throw new Error('Department not found'); }
  res.json({ success: true, data: dept });
});

const createDepartment = asyncHandler(async (req, res) => {
  const { name, code, description, head } = req.body;
  const dept = await Department.create({ name, code, description, head, createdBy: req.user.id });
  res.status(201).json({ success: true, data: dept, message: 'Department created' });
});

const updateDepartment = asyncHandler(async (req, res) => {
  const dept = await Department.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!dept) { res.status(404); throw new Error('Department not found'); }
  res.json({ success: true, data: dept, message: 'Department updated' });
});

const deleteDepartment = asyncHandler(async (req, res) => {
  const dept = await Department.findById(req.params.id);
  if (!dept) { res.status(404); throw new Error('Department not found'); }
  const empCount = await Employee.countDocuments({ department: req.params.id, status: 'active' });
  if (empCount > 0) { res.status(400); throw new Error(`Cannot delete: ${empCount} active employees in this department`); }
  await Department.findByIdAndDelete(req.params.id);
  res.json({ success: true, message: 'Department deleted' });
});

module.exports = { getDepartments, getDepartment, createDepartment, updateDepartment, deleteDepartment };
