const asyncHandler = require('express-async-handler');
const Employee = require('../models/Employee');
const Attendance = require('../models/Attendance');
const Leave = require('../models/Leave');
const Holiday = require('../models/Holiday');
const { getDateRange, getWorkingDays } = require('../utils/helpers');

// @desc    Admin dashboard overview
// @route   GET /api/dashboard
// @access  Admin
const getAdminDashboard = asyncHandler(async (req, res) => {
  const now = new Date();
  const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(now); todayEnd.setHours(23, 59, 59, 999);

  const [
    totalEmployees,
    activeEmployees,
    todayAttendance,
    pendingLeaves,
    todayHoliday,
  ] = await Promise.all([
    Employee.countDocuments(),
    Employee.countDocuments({ status: 'active' }),
    Attendance.find({ date: { $gte: todayStart, $lte: todayEnd } }).lean(),
    Leave.countDocuments({ status: 'pending' }),
    Holiday.findOne({ date: { $gte: todayStart, $lte: todayEnd } }),
  ]);

  const presentToday = todayAttendance.filter((a) => ['present', 'wfh', 'late'].includes(a.status)).length;
  const absentToday = todayAttendance.filter((a) => a.status === 'absent').length;
  const lateToday = todayAttendance.filter((a) => a.status === 'late').length;
  const leaveToday = todayAttendance.filter((a) => a.status === 'leave').length;
  const markedCount = todayAttendance.length;
  const unmarkedToday = activeEmployees - markedCount;

  const attendancePercent = activeEmployees > 0
    ? parseFloat(((presentToday / activeEmployees) * 100).toFixed(1))
    : 0;

  // Weekly attendance chart data (last 7 days)
  const weeklyData = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    d.setHours(0, 0, 0, 0);
    const dEnd = new Date(d); dEnd.setHours(23, 59, 59, 999);
    const records = await Attendance.countDocuments({
      date: { $gte: d, $lte: dEnd },
      status: { $in: ['present', 'wfh', 'late'] },
    });
    weeklyData.push({
      date: d.toISOString().split('T')[0],
      day: d.toLocaleDateString('en-US', { weekday: 'short' }),
      present: records,
    });
  }

  // Monthly attendance chart data (last 6 months)
  const monthlyData = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const { start, end } = getDateRange('month', d.getFullYear(), d.getMonth() + 1);
    const present = await Attendance.countDocuments({
      date: { $gte: start, $lte: end },
      status: { $in: ['present', 'wfh', 'late'] },
    });
    const absent = await Attendance.countDocuments({
      date: { $gte: start, $lte: end },
      status: 'absent',
    });
    monthlyData.push({
      month: d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      present,
      absent,
    });
  }

  // Department attendance today
  const departments = await Employee.aggregate([
    { $match: { status: 'active' } },
    { $group: { _id: '$department', count: { $sum: 1 } } },
    { $lookup: { from: 'departments', localField: '_id', foreignField: '_id', as: 'dept' } },
    { $unwind: '$dept' },
    { $project: { name: '$dept.name', total: '$count' } },
  ]);

  const deptAttendance = await Promise.all(departments.map(async (dept) => {
    const empIds = await Employee.find({ department: dept._id, status: 'active' }).select('_id').lean();
    const presentCount = await Attendance.countDocuments({
      employee: { $in: empIds.map((e) => e._id) },
      date: { $gte: todayStart, $lte: todayEnd },
      status: { $in: ['present', 'wfh', 'late'] },
    });
    return { ...dept, present: presentCount, percent: dept.total > 0 ? Math.round((presentCount / dept.total) * 100) : 0 };
  }));

  // Recent activity (last 10 attendance records)
  const recentActivity = await Attendance.find({ date: { $gte: todayStart, $lte: todayEnd } })
    .populate({ path: 'employee', select: 'firstName lastName profilePhoto employeeId' })
    .populate('createdBy', 'name')
    .sort({ createdAt: -1 })
    .limit(10)
    .lean();

  // Upcoming birthdays
  const today = new Date();
  const upcomingBirthdays = await Employee.find({
    status: 'active',
    dateOfBirth: { $ne: null },
  }).select('firstName lastName dateOfBirth profilePhoto department').populate('department', 'name').lean();

  const birthdays = upcomingBirthdays
    .map((emp) => {
      const dob = new Date(emp.dateOfBirth);
      const next = new Date(today.getFullYear(), dob.getMonth(), dob.getDate());
      if (next < today) next.setFullYear(today.getFullYear() + 1);
      const diffDays = Math.ceil((next - today) / (1000 * 60 * 60 * 24));
      return { ...emp, nextBirthday: next, daysUntil: diffDays };
    })
    .filter((emp) => emp.daysUntil <= 30)
    .sort((a, b) => a.daysUntil - b.daysUntil)
    .slice(0, 5);

  res.json({
    success: true,
    data: {
      cards: {
        totalEmployees,
        activeEmployees,
        presentToday,
        absentToday,
        lateToday,
        leaveToday,
        unmarkedToday,
        pendingLeaves,
        attendancePercent,
        isHoliday: !!todayHoliday,
        holidayName: todayHoliday?.name || null,
      },
      charts: { weeklyData, monthlyData, deptAttendance },
      recentActivity,
      upcomingBirthdays: birthdays,
    },
  });
});

// @desc    Employee dashboard
// @route   GET /api/dashboard/employee
// @access  Employee
const getEmployeeDashboard = asyncHandler(async (req, res) => {
  const now = new Date();
  const employee = await Employee.findOne({ userId: req.user.id })
    .populate('department', 'name')
    .populate('designation', 'title');

  if (!employee) {
    res.status(404);
    throw new Error('Employee profile not found');
  }

  const { start, end } = getDateRange('month', now.getFullYear(), now.getMonth() + 1);
  const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(now); todayEnd.setHours(23, 59, 59, 999);

  const [monthRecords, todayRecord, holidays, leaves] = await Promise.all([
    Attendance.find({ employee: employee._id, date: { $gte: start, $lte: end } }).lean(),
    Attendance.findOne({ employee: employee._id, date: { $gte: todayStart, $lte: todayEnd } }).lean(),
    Holiday.find({ date: { $gte: start, $lte: end } }).lean(),
    Leave.find({ employee: employee._id, status: { $in: ['pending', 'approved'] } }).sort('-createdAt').limit(5).lean(),
  ]);

  const workingDays = getWorkingDays(start, end, holidays.map((h) => h.date));
  const present = monthRecords.filter((r) => ['present', 'wfh', 'late'].includes(r.status)).length;
  const absent = monthRecords.filter((r) => r.status === 'absent').length;
  const leaveCount = monthRecords.filter((r) => r.status === 'leave').length;

  // Upcoming holidays
  const upcomingHolidays = await Holiday.find({
    date: { $gte: new Date() },
  }).sort('date').limit(5).lean();

  // Upcoming birthdays (team)
  const teamBirthdays = await Employee.find({
    department: employee.department,
    status: 'active',
    dateOfBirth: { $ne: null },
    _id: { $ne: employee._id },
  }).select('firstName lastName dateOfBirth profilePhoto').lean();

  const birthdays = teamBirthdays
    .map((emp) => {
      const dob = new Date(emp.dateOfBirth);
      const next = new Date(now.getFullYear(), dob.getMonth(), dob.getDate());
      if (next < now) next.setFullYear(now.getFullYear() + 1);
      return { ...emp, daysUntil: Math.ceil((next - now) / (1000 * 60 * 60 * 24)) };
    })
    .filter((e) => e.daysUntil <= 30)
    .sort((a, b) => a.daysUntil - b.daysUntil)
    .slice(0, 5);

  res.json({
    success: true,
    data: {
      employee,
      todayStatus: todayRecord,
      summary: {
        workingDays,
        present,
        absent,
        leaveCount,
        attendancePercent: workingDays > 0 ? parseFloat(((present / workingDays) * 100).toFixed(1)) : 0,
      },
      leaveBalance: employee.leaveBalance,
      monthRecords,
      recentLeaves: leaves,
      upcomingHolidays,
      upcomingBirthdays: birthdays,
    },
  });
});

module.exports = { getAdminDashboard, getEmployeeDashboard };
