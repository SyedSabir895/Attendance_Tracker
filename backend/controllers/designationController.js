const asyncHandler = require('express-async-handler');
const Designation = require('../models/Designation');
const Employee = require('../models/Employee');

const getDesignations = asyncHandler(async (req, res) => {
  const { department } = req.query;
  const filter = {};
  if (department) filter.department = department;
  const designations = await Designation.find(filter).populate('department', 'name').sort('title').lean();
  res.json({ success: true, data: designations });
});

const getDesignation = asyncHandler(async (req, res) => {
  const desig = await Designation.findById(req.params.id).populate('department', 'name');
  if (!desig) { res.status(404); throw new Error('Designation not found'); }
  res.json({ success: true, data: desig });
});

const createDesignation = asyncHandler(async (req, res) => {
  const desig = await Designation.create({ ...req.body, createdBy: req.user.id });
  res.status(201).json({ success: true, data: desig, message: 'Designation created' });
});

const updateDesignation = asyncHandler(async (req, res) => {
  const desig = await Designation.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!desig) { res.status(404); throw new Error('Designation not found'); }
  res.json({ success: true, data: desig, message: 'Designation updated' });
});

const deleteDesignation = asyncHandler(async (req, res) => {
  const desig = await Designation.findById(req.params.id);
  if (!desig) { res.status(404); throw new Error('Designation not found'); }
  const empCount = await Employee.countDocuments({ designation: req.params.id, status: 'active' });
  if (empCount > 0) { res.status(400); throw new Error(`Cannot delete: ${empCount} employees have this designation`); }
  await Designation.findByIdAndDelete(req.params.id);
  res.json({ success: true, message: 'Designation deleted' });
});

module.exports = { getDesignations, getDesignation, createDesignation, updateDesignation, deleteDesignation };
