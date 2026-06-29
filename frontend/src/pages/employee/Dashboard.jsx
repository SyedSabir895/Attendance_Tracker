import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  MdCheckCircle, MdCancel, MdAccessTime, MdBeachAccess, MdCalendarToday,
} from 'react-icons/md';
import { dashboardAPI } from '../../api/dashboard.api';
import Badge from '../../components/common/Badge';
import StatCard from '../../components/common/StatCard';
import Avatar from '../../components/common/Avatar';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { CardSkeleton } from '../../components/common/Skeleton';

export default function EmployeeDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardAPI.getEmployee()
      .then(({ data: res }) => setData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">{Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)}</div>;
  }

  const { employee, todayStatus, summary, leaveBalance, upcomingHolidays, upcomingBirthdays, recentLeaves } = data || {};

  const chartData = [
    { name: 'Present', value: summary?.present || 0, fill: '#10b981' },
    { name: 'Absent', value: summary?.absent || 0, fill: '#ef4444' },
    { name: 'Leave', value: summary?.leaveCount || 0, fill: '#8b5cf6' },
    { name: 'WFH', value: 0, fill: '#3b82f6' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome */}
      <div className="card p-6">
        <div className="flex items-center gap-4 flex-wrap">
          <Avatar name={employee ? `${employee.firstName} ${employee.lastName}` : '?'} src={employee?.profilePhoto} size="lg" />
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 17 ? 'Afternoon' : 'Evening'}, {employee?.firstName}!
            </h1>
            <p className="text-gray-500 mt-1">
              {employee?.designation?.title} · {employee?.department?.name}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500">Today's Status</p>
            {todayStatus ? (
              <Badge status={todayStatus.status} size="lg" />
            ) : (
              <span className="badge bg-gray-100 dark:bg-gray-700 text-gray-500">Not marked</span>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard title="Present Days" value={summary?.present || 0} icon={MdCheckCircle} color="green" />
        <StatCard title="Absent Days" value={summary?.absent || 0} icon={MdCancel} color="red" />
        <StatCard title="Working Days" value={summary?.workingDays || 0} icon={MdAccessTime} color="blue" />
        <StatCard title="Attendance %" value={`${summary?.attendancePercent || 0}%`} icon={MdCalendarToday} color="teal" />
      </div>

      {/* Chart + Leave balance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-5">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">This Month</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={chartData} barSize={40}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ borderRadius: '12px', border: 'none' }} />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-5">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Leave Balance</h3>
          <div className="grid grid-cols-3 gap-3">
            {Object.entries(leaveBalance || {}).map(([type, days]) => (
              <div key={type} className="text-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                <p className="text-xl font-bold text-primary-600">{days}</p>
                <p className="text-xs text-gray-500 capitalize mt-1">{type}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Holidays + Birthdays */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card overflow-hidden">
          <div className="p-4 border-b border-gray-100 dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-white">Upcoming Holidays</h3>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {(upcomingHolidays || []).length === 0 ? (
              <p className="text-center text-gray-400 py-6 text-sm">No upcoming holidays</p>
            ) : (upcomingHolidays || []).map((h) => (
              <div key={h._id} className="flex items-center gap-3 px-4 py-3">
                <div className="text-center w-10">
                  <p className="text-base font-bold text-primary-600">{new Date(h.date).getDate()}</p>
                  <p className="text-xs text-gray-400">{new Date(h.date).toLocaleDateString('en-US', { month: 'short' })}</p>
                </div>
                <div>
                  <p className="font-medium text-sm text-gray-900 dark:text-white">{h.name}</p>
                  <p className="text-xs text-gray-400 capitalize">{h.type}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card overflow-hidden">
          <div className="p-4 border-b border-gray-100 dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-white">🎂 Upcoming Birthdays</h3>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {(upcomingBirthdays || []).length === 0 ? (
              <p className="text-center text-gray-400 py-6 text-sm">No upcoming birthdays</p>
            ) : (upcomingBirthdays || []).map((emp) => (
              <div key={emp._id} className="flex items-center gap-3 px-4 py-3">
                <Avatar name={`${emp.firstName} ${emp.lastName}`} src={emp.profilePhoto} size="sm" />
                <div className="flex-1">
                  <p className="font-medium text-sm text-gray-900 dark:text-white">{emp.firstName} {emp.lastName}</p>
                  <p className="text-xs text-gray-400">{new Date(emp.dateOfBirth).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}</p>
                </div>
                <span className="text-xs text-primary-600 font-medium">{emp.daysUntil === 0 ? '🎉 Today!' : `in ${emp.daysUntil}d`}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent leaves */}
      {recentLeaves?.length > 0 && (
        <div className="card overflow-hidden">
          <div className="p-4 border-b border-gray-100 dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-white">My Recent Leave Requests</h3>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {recentLeaves.map((leave) => (
              <div key={leave._id} className="flex items-center gap-4 px-4 py-3">
                <div className="flex-1">
                  <p className="font-medium text-sm text-gray-900 dark:text-white capitalize">{leave.leaveType} Leave</p>
                  <p className="text-xs text-gray-400">
                    {new Date(leave.startDate).toLocaleDateString()} – {new Date(leave.endDate).toLocaleDateString()}
                  </p>
                </div>
                <Badge status={leave.status} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
