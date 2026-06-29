const asyncHandler = require('express-async-handler');
const Attendance = require('../models/Attendance');
const Employee = require('../models/Employee');
const Leave = require('../models/Leave');
const Holiday = require('../models/Holiday');
const { getDateRange, getWorkingDays } = require('../utils/helpers');

// Helper: get date range from query
const parseDateRange = (period, year, month, startDate, endDate) => {
  if (startDate && endDate) {
    return { start: new Date(startDate), end: new Date(new Date(endDate).setHours(23, 59, 59, 999)) };
  }
  return getDateRange(period || 'month', parseInt(year) || new Date().getFullYear(), parseInt(month) || new Date().getMonth() + 1);
};

// @desc    Generate attendance report
// @route   GET /api/reports/attendance
// @access  Admin
const getAttendanceReport = asyncHandler(async (req, res) => {
  const { period, year, month, startDate, endDate, department, employee } = req.query;
  const { start, end } = parseDateRange(period, year, month, startDate, endDate);

  const filter = { date: { $gte: start, $lte: end } };

  if (employee) {
    filter.employee = employee;
  } else if (department) {
    const emps = await Employee.find({ department }).select('_id').lean();
    filter.employee = { $in: emps.map((e) => e._id) };
  }

  const records = await Attendance.find(filter)
    .populate({
      path: 'employee',
      select: 'firstName lastName employeeId department',
      populate: { path: 'department', select: 'name' },
    })
    .sort({ date: 1, 'employee.firstName': 1 })
    .lean();

  const holidays = await Holiday.find({ date: { $gte: start, $lte: end } }).lean();
  const workingDays = getWorkingDays(start, end, holidays.map((h) => h.date));

  // Build per-employee summary
  const employeeMap = {};
  for (const rec of records) {
    if (!rec.employee) continue;
    const id = rec.employee._id.toString();
    if (!employeeMap[id]) {
      employeeMap[id] = {
        employee: rec.employee,
        present: 0, absent: 0, late: 0, halfDay: 0,
        leave: 0, wfh: 0, holiday: 0, workingHours: 0,
        records: [],
      };
    }
    employeeMap[id][rec.status === 'half_day' ? 'halfDay' : rec.status]++;
    employeeMap[id].workingHours += rec.workingHours || 0;
    employeeMap[id].records.push(rec);
  }

  const summary = Object.values(employeeMap).map((emp) => ({
    ...emp,
    workingDays,
    attendancePercent: workingDays > 0
      ? parseFloat(((emp.present + emp.wfh + emp.late) / workingDays * 100).toFixed(1))
      : 0,
  }));

  res.json({
    success: true,
    data: {
      period: { start, end },
      workingDays,
      totalRecords: records.length,
      summary,
      records: req.query.includeRecords ? records : undefined,
    },
  });
});

// @desc    Get analytics data
// @route   GET /api/reports/analytics
// @access  Admin
const getAnalytics = asyncHandler(async (req, res) => {
  const { year } = req.query;
  const y = parseInt(year) || new Date().getFullYear();
  const { start, end } = getDateRange('year', y);

  // Most absent employees
  const mostAbsent = await Attendance.aggregate([
    { $match: { date: { $gte: start, $lte: end }, status: 'absent' } },
    { $group: { _id: '$employee', absentCount: { $sum: 1 } } },
    { $sort: { absentCount: -1 } },
    { $limit: 10 },
    { $lookup: { from: 'employees', localField: '_id', foreignField: '_id', as: 'employee' } },
    { $unwind: '$employee' },
    { $project: { 'employee.firstName': 1, 'employee.lastName': 1, 'employee.employeeId': 1, 'employee.profilePhoto': 1, absentCount: 1 } },
  ]);

  // Perfect attendance
  const perfectAttendance = await Attendance.aggregate([
    { $match: { date: { $gte: start, $lte: end }, status: { $in: ['present', 'wfh'] } } },
    { $group: { _id: '$employee', presentCount: { $sum: 1 } } },
    { $sort: { presentCount: -1 } },
    { $limit: 10 },
    { $lookup: { from: 'employees', localField: '_id', foreignField: '_id', as: 'employee' } },
    { $unwind: '$employee' },
  ]);

  // Department attendance rate
  const deptStats = await Employee.aggregate([
    { $match: { status: 'active' } },
    { $group: { _id: '$department', employeeCount: { $sum: 1 } } },
    { $lookup: { from: 'departments', localField: '_id', foreignField: '_id', as: 'dept' } },
    { $unwind: '$dept' },
  ]);

  const deptAttendance = await Promise.all(deptStats.map(async (d) => {
    const empIds = await Employee.find({ department: d._id, status: 'active' }).select('_id').lean();
    const presentCount = await Attendance.countDocuments({
      employee: { $in: empIds.map((e) => e._id) },
      date: { $gte: start, $lte: end },
      status: { $in: ['present', 'wfh', 'late'] },
    });
    const totalPossible = d.employeeCount * 250; // approx working days
    return {
      name: d.dept.name,
      employeeCount: d.employeeCount,
      presentCount,
      rate: totalPossible > 0 ? parseFloat((presentCount / totalPossible * 100).toFixed(1)) : 0,
    };
  }));

  // Monthly trend
  const monthlyTrend = [];
  for (let m = 1; m <= 12; m++) {
    const { start: ms, end: me } = getDateRange('month', y, m);
    if (ms > new Date()) break;
    const present = await Attendance.countDocuments({ date: { $gte: ms, $lte: me }, status: { $in: ['present', 'wfh', 'late'] } });
    const absent = await Attendance.countDocuments({ date: { $gte: ms, $lte: me }, status: 'absent' });
    monthlyTrend.push({
      month: new Date(y, m - 1).toLocaleDateString('en-US', { month: 'short' }),
      present, absent,
    });
  }

  res.json({
    success: true,
    data: { mostAbsent, perfectAttendance, deptAttendance, monthlyTrend },
  });
});

// @desc    Export report data (for PDF/Excel generation on frontend)
// @route   GET /api/reports/export
// @access  Admin
const exportReport = asyncHandler(async (req, res) => {
  const { type, period, year, month, startDate, endDate, department, employee } = req.query;
  const { start, end } = parseDateRange(period, year, month, startDate, endDate);

  const filter = { date: { $gte: start, $lte: end } };
  if (employee) filter.employee = employee;
  else if (department) {
    const emps = await Employee.find({ department }).select('_id').lean();
    filter.employee = { $in: emps.map((e) => e._id) };
  }

  const records = await Attendance.find(filter)
    .populate({
      path: 'employee',
      select: 'firstName lastName employeeId email',
      populate: [
        { path: 'department', select: 'name' },
        { path: 'designation', select: 'title' },
      ],
    })
    .sort({ date: 1 })
    .lean();

  // Format for export
  const exportData = records.map((r) => ({
    'Employee ID': r.employee?.employeeId || '',
    'Name': r.employee ? `${r.employee.firstName} ${r.employee.lastName}` : '',
    'Department': r.employee?.department?.name || '',
    'Designation': r.employee?.designation?.title || '',
    'Date': new Date(r.date).toLocaleDateString(),
    'Status': r.status,
    'Check In': r.checkIn || '',
    'Check Out': r.checkOut || '',
    'Working Hours': r.workingHours || 0,
    'Remarks': r.remarks || '',
  }));

  res.json({ success: true, data: exportData, period: { start, end } });
});

module.exports = { getAttendanceReport, getAnalytics, exportReport };
