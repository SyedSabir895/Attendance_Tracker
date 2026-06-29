const asyncHandler = require('express-async-handler');
const Attendance = require('../models/Attendance');
const Employee = require('../models/Employee');
const Holiday = require('../models/Holiday');
const { paginate, buildPaginationMeta, getDateRange, getWorkingDays } = require('../utils/helpers');

// @desc    Get attendance records
// @route   GET /api/attendance
// @access  Admin
const getAttendance = asyncHandler(async (req, res) => {
  const {
    page = 1, limit = 20, employee, department,
    status, startDate, endDate, month, year,
  } = req.query;

  const filter = {};

  if (employee) filter.employee = employee;
  if (status) filter.status = status;

  if (startDate && endDate) {
    filter.date = {
      $gte: new Date(startDate),
      $lte: new Date(new Date(endDate).setHours(23, 59, 59, 999)),
    };
  } else if (month && year) {
    const { start, end } = getDateRange('month', parseInt(year), parseInt(month));
    filter.date = { $gte: start, $lte: end };
  } else if (year) {
    const { start, end } = getDateRange('year', parseInt(year));
    filter.date = { $gte: start, $lte: end };
  }

  // If department filter, find employees in that department first
  if (department) {
    const employees = await Employee.find({ department }).select('_id').lean();
    filter.employee = { $in: employees.map((e) => e._id) };
  }

  const { skip } = paginate(null, page, limit);
  const total = await Attendance.countDocuments(filter);

  const records = await Attendance.find(filter)
    .populate({
      path: 'employee',
      select: 'firstName lastName employeeId profilePhoto department',
      populate: { path: 'department', select: 'name' },
    })
    .populate('createdBy', 'name')
    .sort({ date: -1 })
    .skip(skip)
    .limit(parseInt(limit))
    .lean();

  res.json({
    success: true,
    data: records,
    pagination: buildPaginationMeta(total, page, limit),
  });
});

// @desc    Get today's attendance for all employees
// @route   GET /api/attendance/today
// @access  Admin
const getTodayAttendance = asyncHandler(async (req, res) => {
  const now = new Date();
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
  const todayEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999));

  // Get all active employees
  const employees = await Employee.find({ status: 'active' })
    .populate('department', 'name')
    .populate('designation', 'title')
    .lean();

  // Get today's attendance records
  const records = await Attendance.find({
    date: { $gte: today, $lte: todayEnd },
  }).lean();

  const recordMap = {};
  records.forEach((r) => { recordMap[r.employee.toString()] = r; });

  // Merge: each employee gets their attendance record or null
  const result = employees.map((emp) => ({
    employee: emp,
    attendance: recordMap[emp._id.toString()] || null,
  }));

  res.json({ success: true, data: result, date: today });
});

// @desc    Get employee's own attendance
// @route   GET /api/attendance/my
// @access  Employee
const getMyAttendance = asyncHandler(async (req, res) => {
  const employee = await Employee.findOne({ userId: req.user.id });
  if (!employee) {
    res.status(404);
    throw new Error('Employee profile not found');
  }

  const { month, year } = req.query;
  const { start, end } = getDateRange(
    'month',
    year ? parseInt(year) : new Date().getFullYear(),
    month ? parseInt(month) : new Date().getMonth() + 1
  );

  const records = await Attendance.find({
    employee: employee._id,
    date: { $gte: start, $lte: end },
  }).sort({ date: -1 }).lean();

  res.json({ success: true, data: records });
});

// @desc    Mark/Save attendance (bulk)
// @route   POST /api/attendance/bulk
// @access  Admin
const markBulkAttendance = asyncHandler(async (req, res) => {
  const { records, date } = req.body;

  if (!records || !Array.isArray(records) || !date) {
    res.status(400);
    throw new Error('Records array and date are required');
  }

  const [y, m, d] = date.split('-').map(Number);
  const attendanceDate = new Date(Date.UTC(y, m - 1, d, 0, 0, 0, 0));

  const results = [];
  const errors = [];

  for (const record of records) {
    try {
      const { employeeId, status, checkIn, checkOut, remarks, leaveType } = record;

      const dayEnd = new Date(attendanceDate.getTime() + 86399999);
      const existing = await Attendance.findOne({
        employee: employeeId,
        date: { $gte: attendanceDate, $lte: dayEnd },
      });

      if (existing) {
        const updated = await Attendance.findByIdAndUpdate(
          existing._id,
          { status, checkIn, checkOut, remarks, leaveType, updatedBy: req.user.id },
          { new: true, runValidators: true }
        );
        results.push(updated);
      } else {
        const created = await Attendance.create({
          employee: employeeId,
          date: attendanceDate,
          status, checkIn, checkOut, remarks, leaveType,
          createdBy: req.user.id,
        });
        results.push(created);
      }
    } catch (err) {
      errors.push({ employeeId: record.employeeId, error: err.message });
    }
  }

  res.status(201).json({
    success: true,
    data: results,
    errors,
    message: `${results.length} attendance records saved`,
  });
});

// @desc    Create/Update single attendance
// @route   POST /api/attendance
// @access  Admin
const markAttendance = asyncHandler(async (req, res) => {
  const { employee, date, status, checkIn, checkOut, remarks, leaveType } = req.body;

  const attendanceDate = new Date(date);
  attendanceDate.setHours(0, 0, 0, 0);
  const attendanceDateEnd = new Date(attendanceDate.getTime() + 86399999);

  const existing = await Attendance.findOne({
    employee,
    date: { $gte: attendanceDate, $lte: attendanceDateEnd },
  });

  if (existing) {
    const updated = await Attendance.findByIdAndUpdate(
      existing._id,
      { status, checkIn, checkOut, remarks, leaveType, updatedBy: req.user.id },
      { new: true, runValidators: true }
    ).populate('employee', 'firstName lastName employeeId');

    return res.json({ success: true, data: updated, message: 'Attendance updated' });
  }

  const attendance = await Attendance.create({
    employee, date: attendanceDate, status, checkIn, checkOut, remarks, leaveType,
    createdBy: req.user.id,
  });

  await attendance.populate('employee', 'firstName lastName employeeId');

  res.status(201).json({ success: true, data: attendance, message: 'Attendance marked' });
});

// @desc    Update attendance
// @route   PUT /api/attendance/:id
// @access  Admin
const updateAttendance = asyncHandler(async (req, res) => {
  const attendance = await Attendance.findByIdAndUpdate(
    req.params.id,
    { ...req.body, updatedBy: req.user.id },
    { new: true, runValidators: true }
  ).populate('employee', 'firstName lastName employeeId');

  if (!attendance) {
    res.status(404);
    throw new Error('Attendance record not found');
  }

  res.json({ success: true, data: attendance, message: 'Attendance updated' });
});

// @desc    Delete attendance
// @route   DELETE /api/attendance/:id
// @access  Admin
const deleteAttendance = asyncHandler(async (req, res) => {
  const attendance = await Attendance.findById(req.params.id);
  if (!attendance) {
    res.status(404);
    throw new Error('Attendance record not found');
  }

  await Attendance.findByIdAndDelete(req.params.id);
  res.json({ success: true, message: 'Attendance record deleted' });
});

// @desc    Get attendance by date
// @route   GET /api/attendance/date/:date
// @access  Admin
const getAttendanceByDate = asyncHandler(async (req, res) => {
  const [y, m, d] = req.params.date.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d, 0, 0, 0, 0));
  const dateEnd = new Date(Date.UTC(y, m - 1, d, 23, 59, 59, 999));

  const records = await Attendance.find({ date: { $gte: date, $lte: dateEnd } })
    .populate({
      path: 'employee',
      select: 'firstName lastName employeeId profilePhoto department',
      populate: { path: 'department', select: 'name' },
    })
    .lean();

  res.json({ success: true, data: records });
});

// @desc    Get employee attendance summary
// @route   GET /api/attendance/summary/:employeeId
// @access  Admin | Own
const getAttendanceSummary = asyncHandler(async (req, res) => {
  const { month, year } = req.query;
  const y = parseInt(year) || new Date().getFullYear();
  const m = parseInt(month) || new Date().getMonth() + 1;

  const { start, end } = getDateRange('month', y, m);

  const records = await Attendance.find({
    employee: req.params.employeeId,
    date: { $gte: start, $lte: end },
  }).lean();

  const holidays = await Holiday.find({ date: { $gte: start, $lte: end } }).lean();
  const workingDays = getWorkingDays(start, end, holidays.map((h) => h.date));

  const summary = {
    present: records.filter((r) => r.status === 'present').length,
    absent: records.filter((r) => r.status === 'absent').length,
    late: records.filter((r) => r.status === 'late').length,
    halfDay: records.filter((r) => r.status === 'half_day').length,
    leave: records.filter((r) => r.status === 'leave').length,
    wfh: records.filter((r) => r.status === 'wfh').length,
    holiday: records.filter((r) => r.status === 'holiday').length,
    workingDays,
    totalWorkingHours: records.reduce((sum, r) => sum + (r.workingHours || 0), 0),
    attendancePercent: workingDays > 0
      ? parseFloat(((records.filter((r) => ['present', 'wfh', 'late'].includes(r.status)).length / workingDays) * 100).toFixed(1))
      : 0,
    records,
  };

  res.json({ success: true, data: summary });
});

module.exports = {
  getAttendance,
  getTodayAttendance,
  getMyAttendance,
  markAttendance,
  markBulkAttendance,
  updateAttendance,
  deleteAttendance,
  getAttendanceByDate,
  getAttendanceSummary,
};
