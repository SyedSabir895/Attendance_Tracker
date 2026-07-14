const asyncHandler = require('express-async-handler');
const Employee = require('../models/Employee');
const User = require('../models/User');
const { generateEmployeeId, paginate, buildPaginationMeta } = require('../utils/helpers');

// @desc    Get all employees
// @route   GET /api/employees
// @access  Admin
const getEmployees = asyncHandler(async (req, res) => {
  const {
    page = 1, limit = 10, search, department, status,
    designation, employmentType, sortBy = 'createdAt', order = 'desc',
  } = req.query;

  const filter = {};

  if (search) {
    filter.$or = [
      { firstName: { $regex: search, $options: 'i' } },
      { lastName: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { employeeId: { $regex: search, $options: 'i' } },
    ];
  }
  if (department) filter.department = department;
  if (status) filter.status = status;
  if (designation) filter.designation = designation;
  if (employmentType) filter.employmentType = employmentType;

  const { skip } = paginate(null, page, limit);
  const total = await Employee.countDocuments(filter);

  const employees = await Employee.find(filter)
    .populate('department', 'name code')
    .populate('designation', 'title level')
    .sort({ [sortBy]: order === 'desc' ? -1 : 1 })
    .skip(skip)
    .limit(parseInt(limit))
    .lean();

  res.json({
    success: true,
    data: employees,
    pagination: buildPaginationMeta(total, page, limit),
  });
});

// @desc    Get single employee
// @route   GET /api/employees/:id
// @access  Admin | Own employee
const getEmployee = asyncHandler(async (req, res) => {
  const employee = await Employee.findById(req.params.id)
    .populate('department', 'name code description')
    .populate('designation', 'title level')
    .populate('createdBy', 'name email')
    .populate('updatedBy', 'name email');

  if (!employee) {
    res.status(404);
    throw new Error('Employee not found');
  }

  res.json({ success: true, data: employee });
});

// @desc    Get employee by user id
// @route   GET /api/employees/me
// @access  Employee
const getMyProfile = asyncHandler(async (req, res) => {
  const employee = await Employee.findOne({ userId: req.user.id })
    .populate('department', 'name code')
    .populate('designation', 'title level');

  if (!employee) {
    res.status(404);
    throw new Error('Employee profile not found');
  }

  res.json({ success: true, data: employee });
});

// @desc    Create employee
// @route   POST /api/employees
// @access  Admin
const createEmployee = asyncHandler(async (req, res) => {
  const { firstName, lastName, email, dateOfBirth } = req.body;

  if (!firstName || !lastName) {
    res.status(400);
    throw new Error('First name and last name are required');
  }

  const employeeId = await generateEmployeeId(Employee);
  const joiningDate = new Date();

  const employeeData = {
    employeeId,
    firstName,
    lastName,
    joiningDate,
    createdBy: req.user.id,
  };
  if (email) {
    const normalizedEmail = email.toLowerCase().trim();
    const existingEmployee = await Employee.findOne({ email: normalizedEmail });
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingEmployee || existingUser) {
      res.status(400);
      throw new Error('Email is already in use');
    }
    employeeData.email = normalizedEmail;
  }
  if (dateOfBirth) employeeData.dateOfBirth = dateOfBirth;

  const employee = await Employee.create(employeeData);

  res.status(201).json({
    success: true,
    data: employee,
    message: 'Employee created successfully',
  });
});

// @desc    Update employee
// @route   PUT /api/employees/:id
// @access  Admin
const updateEmployee = asyncHandler(async (req, res) => {
  let employee = await Employee.findById(req.params.id);
  if (!employee) {
    res.status(404);
    throw new Error('Employee not found');
  }

  const { firstName, lastName, email, dateOfBirth } = req.body;
  const updates = { updatedBy: req.user.id };
  if (firstName) updates.firstName = firstName;
  if (lastName) updates.lastName = lastName;
  if (email !== undefined) {
    const normalizedEmail = email ? email.toLowerCase().trim() : '';
    if (normalizedEmail) {
      const existingEmployee = await Employee.findOne({
        email: normalizedEmail,
        _id: { $ne: employee._id },
      });
      const existingUser = await User.findOne({
        email: normalizedEmail,
        _id: { $ne: employee.userId },
      });
      if (existingEmployee || existingUser) {
        res.status(400);
        throw new Error('Email is already in use');
      }
    }
    updates.email = normalizedEmail || undefined;
  }
  if (dateOfBirth !== undefined) updates.dateOfBirth = dateOfBirth || null;

  employee = await Employee.findByIdAndUpdate(req.params.id, updates, {
    new: true,
    runValidators: true,
  });

  if (employee.userId && (firstName || lastName || email !== undefined)) {
    const userUpdates = {};
    if (firstName || lastName) userUpdates.name = `${employee.firstName} ${employee.lastName}`;
    if (email !== undefined) userUpdates.email = employee.email;
    await User.findByIdAndUpdate(employee.userId, userUpdates, { runValidators: true });
  }

  res.json({ success: true, data: employee, message: 'Employee updated successfully' });
});

// @desc    Delete employee
// @route   DELETE /api/employees/:id
// @access  Admin
const deleteEmployee = asyncHandler(async (req, res) => {
  const employee = await Employee.findById(req.params.id);
  if (!employee) {
    res.status(404);
    throw new Error('Employee not found');
  }

  // Deactivate user account instead of deleting
  if (employee.userId) {
    await User.findByIdAndUpdate(employee.userId, { isActive: false });
  }

  const Attendance = require('../models/Attendance');
  const Leave = require('../models/Leave');
  const Task = require('../models/Task');

  // Cascade delete related records
  await Attendance.deleteMany({ employee: req.params.id });
  await Leave.deleteMany({ employee: req.params.id });
  await Task.deleteMany({ assignedTo: req.params.id });

  await Employee.findByIdAndDelete(req.params.id);

  res.json({ success: true, message: 'Employee deleted successfully' });
});

// @desc    Toggle employee status
// @route   PATCH /api/employees/:id/status
// @access  Admin
const toggleStatus = asyncHandler(async (req, res) => {
  const employee = await Employee.findById(req.params.id);
  if (!employee) {
    res.status(404);
    throw new Error('Employee not found');
  }

  employee.status = req.body.status;
  employee.updatedBy = req.user.id;
  await employee.save();

  // Sync user account active state
  if (employee.userId) {
    await User.findByIdAndUpdate(employee.userId, {
      isActive: req.body.status === 'active',
    });
  }

  res.json({
    success: true,
    data: employee,
    message: `Employee ${req.body.status === 'active' ? 'activated' : 'deactivated'} successfully`,
  });
});

// @desc    Get employees for dropdown (minimal data)
// @route   GET /api/employees/dropdown
// @access  Admin
const getEmployeesDropdown = asyncHandler(async (req, res) => {
  const employees = await Employee.find({ status: 'active' })
    .select('firstName lastName employeeId profilePhoto department')
    .populate('department', 'name')
    .lean();

  res.json({ success: true, data: employees });
});

module.exports = {
  getEmployees,
  getEmployee,
  getMyProfile,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  toggleStatus,
  getEmployeesDropdown,
};
