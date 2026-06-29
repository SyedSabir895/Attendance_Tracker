const asyncHandler = require('express-async-handler');
const Leave = require('../models/Leave');
const Employee = require('../models/Employee');
const { sendLeaveNotificationEmail, sendLeaveStatusEmail } = require('../utils/email');
const User = require('../models/User');
const { paginate, buildPaginationMeta } = require('../utils/helpers');

// @desc    Get all leaves (admin)
// @route   GET /api/leaves
// @access  Admin
const getLeaves = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status, leaveType, employee, startDate, endDate } = req.query;

  const filter = {};
  if (status) filter.status = status;
  if (leaveType) filter.leaveType = leaveType;
  if (employee) filter.employee = employee;
  if (startDate && endDate) {
    filter.startDate = { $gte: new Date(startDate) };
    filter.endDate = { $lte: new Date(endDate) };
  }

  const { skip } = paginate(null, page, limit);
  const total = await Leave.countDocuments(filter);

  const leaves = await Leave.find(filter)
    .populate({
      path: 'employee',
      select: 'firstName lastName employeeId profilePhoto department',
      populate: { path: 'department', select: 'name' },
    })
    .populate('approvedBy', 'name email')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit))
    .lean();

  res.json({
    success: true,
    data: leaves,
    pagination: buildPaginationMeta(total, page, limit),
  });
});

// @desc    Get my leaves (employee)
// @route   GET /api/leaves/my
// @access  Employee
const getMyLeaves = asyncHandler(async (req, res) => {
  const employee = await Employee.findOne({ userId: req.user.id });
  if (!employee) {
    res.status(404);
    throw new Error('Employee profile not found');
  }

  const leaves = await Leave.find({ employee: employee._id })
    .populate('approvedBy', 'name')
    .sort({ createdAt: -1 })
    .lean();

  res.json({ success: true, data: leaves });
});

// @desc    Get single leave
// @route   GET /api/leaves/:id
// @access  Admin | Own
const getLeave = asyncHandler(async (req, res) => {
  const leave = await Leave.findById(req.params.id)
    .populate('employee', 'firstName lastName employeeId email leaveBalance')
    .populate('approvedBy', 'name email');

  if (!leave) {
    res.status(404);
    throw new Error('Leave request not found');
  }

  res.json({ success: true, data: leave });
});

// @desc    Create leave request
// @route   POST /api/leaves
// @access  Employee
const createLeave = asyncHandler(async (req, res) => {
  const { leaveType, startDate, endDate, reason, isHalfDay, halfDayPeriod } = req.body;

  const employee = await Employee.findOne({ userId: req.user.id });
  if (!employee) {
    res.status(404);
    throw new Error('Employee profile not found');
  }

  // Check leave balance
  const balance = employee.leaveBalance[leaveType] || 0;
  const days = isHalfDay ? 0.5 : Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24)) + 1;

  if (balance < days) {
    res.status(400);
    throw new Error(`Insufficient ${leaveType} leave balance. Available: ${balance} days`);
  }

  // Check for overlapping leaves
  const overlap = await Leave.findOne({
    employee: employee._id,
    status: { $in: ['pending', 'approved'] },
    $or: [
      { startDate: { $lte: new Date(endDate) }, endDate: { $gte: new Date(startDate) } },
    ],
  });

  if (overlap) {
    res.status(400);
    throw new Error('You already have a leave request overlapping these dates');
  }

  const leave = await Leave.create({
    employee: employee._id,
    leaveType, startDate, endDate, reason,
    isHalfDay: isHalfDay || false,
    halfDayPeriod: halfDayPeriod || null,
    createdBy: req.user.id,
  });

  // Notify admins via email
  try {
    const admins = await User.find({ role: 'admin', isActive: true }).select('name email');
    for (const admin of admins) {
      await sendLeaveNotificationEmail(
        admin.email, admin.name,
        `${employee.firstName} ${employee.lastName}`,
        leaveType, startDate, endDate
      );
    }
  } catch (err) {
    console.error('Failed to send leave notification email:', err.message);
  }

  res.status(201).json({ success: true, data: leave, message: 'Leave request submitted' });
});

// @desc    Admin create leave for employee
// @route   POST /api/leaves/admin
// @access  Admin
const adminCreateLeave = asyncHandler(async (req, res) => {
  const { employee: employeeId, leaveType, startDate, endDate, reason, isHalfDay, halfDayPeriod } = req.body;

  const leave = await Leave.create({
    employee: employeeId,
    leaveType, startDate, endDate, reason,
    isHalfDay: isHalfDay || false,
    halfDayPeriod: halfDayPeriod || null,
    status: 'approved',
    approvedBy: req.user.id,
    approvedAt: new Date(),
    createdBy: req.user.id,
  });

  res.status(201).json({ success: true, data: leave, message: 'Leave created and auto-approved' });
});

// @desc    Approve/Reject leave
// @route   PUT /api/leaves/:id/status
// @access  Admin
const updateLeaveStatus = asyncHandler(async (req, res) => {
  const { status, rejectionReason } = req.body;

  const leave = await Leave.findById(req.params.id).populate({
    path: 'employee',
    select: 'firstName lastName email leaveBalance userId',
  });

  if (!leave) {
    res.status(404);
    throw new Error('Leave request not found');
  }

  if (leave.status !== 'pending') {
    res.status(400);
    throw new Error('Only pending requests can be updated');
  }

  leave.status = status;
  leave.approvedBy = req.user.id;
  leave.approvedAt = new Date();
  if (rejectionReason) leave.rejectionReason = rejectionReason;

  // Deduct leave balance on approval
  if (status === 'approved') {
    const employee = await Employee.findById(leave.employee._id);
    const balance = employee.leaveBalance[leave.leaveType];
    if (balance < leave.totalDays) {
      res.status(400);
      throw new Error(`Insufficient leave balance for ${leave.leaveType}`);
    }
    employee.leaveBalance[leave.leaveType] -= leave.totalDays;
    await employee.save();
  }

  await leave.save();

  // Send email notification
  try {
    await sendLeaveStatusEmail(
      leave.employee.email,
      `${leave.employee.firstName} ${leave.employee.lastName}`,
      leave.leaveType,
      status,
      rejectionReason
    );
  } catch (err) {
    console.error('Failed to send leave status email:', err.message);
  }

  res.json({ success: true, data: leave, message: `Leave ${status} successfully` });
});

// @desc    Cancel leave (own)
// @route   PUT /api/leaves/:id/cancel
// @access  Employee
const cancelLeave = asyncHandler(async (req, res) => {
  const leave = await Leave.findById(req.params.id).populate('employee', 'userId leaveBalance');

  if (!leave) {
    res.status(404);
    throw new Error('Leave request not found');
  }

  if (leave.employee.userId.toString() !== req.user.id.toString()) {
    res.status(403);
    throw new Error('Not authorized to cancel this leave');
  }

  if (!['pending', 'approved'].includes(leave.status)) {
    res.status(400);
    throw new Error('Cannot cancel this leave');
  }

  // Restore balance if was approved
  if (leave.status === 'approved') {
    const employee = await Employee.findById(leave.employee._id);
    employee.leaveBalance[leave.leaveType] += leave.totalDays;
    await employee.save();
  }

  leave.status = 'cancelled';
  await leave.save();

  res.json({ success: true, data: leave, message: 'Leave cancelled' });
});

// @desc    Delete leave
// @route   DELETE /api/leaves/:id
// @access  Admin
const deleteLeave = asyncHandler(async (req, res) => {
  const leave = await Leave.findById(req.params.id);
  if (!leave) {
    res.status(404);
    throw new Error('Leave not found');
  }
  await Leave.findByIdAndDelete(req.params.id);
  res.json({ success: true, message: 'Leave deleted' });
});

module.exports = {
  getLeaves,
  getMyLeaves,
  getLeave,
  createLeave,
  adminCreateLeave,
  updateLeaveStatus,
  cancelLeave,
  deleteLeave,
};
