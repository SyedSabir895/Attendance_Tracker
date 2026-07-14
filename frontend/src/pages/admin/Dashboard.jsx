import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend,
} from 'recharts';
import {
  MdPeople, MdCheckCircle, MdCancel, MdAccessTime, MdTrendingUp,
  MdBeachAccess, MdWork, MdNotifications,
} from 'react-icons/md';
import { dashboardAPI } from '../../api/dashboard.api';
import StatCard from '../../components/common/StatCard';
import { CardSkeleton } from '../../components/common/Skeleton';
import Badge from '../../components/common/Badge';
import Avatar from '../../components/common/Avatar';

const COLORS = ['#3b82f6', '#ef4444', '#f59e0b', '#10b981', '#8b5cf6', '#06b6d4'];

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardAPI.getAdmin()
      .then(({ data: res }) => setData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      </div>
    );
  }

  const { cards, charts, recentActivity, upcomingBirthdays } = data || {};

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          {cards?.isHoliday && (
            <span className="ml-2 badge bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400">
              🎉 {cards.holidayName}
            </span>
          )}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard title="Total Employees" value={cards?.totalEmployees || 0} icon={MdPeople} color="blue" />
        <StatCard title="Present Today" value={cards?.presentToday || 0} icon={MdCheckCircle} color="green" />
        <StatCard title="Absent Today" value={cards?.absentToday || 0} icon={MdCancel} color="red" />
        <StatCard title="On Leave" value={cards?.leaveToday || 0} icon={MdBeachAccess} color="purple" />
        <StatCard title="Late Today" value={cards?.lateToday || 0} icon={MdAccessTime} color="orange" />
        <StatCard title="Attendance %" value={`${cards?.attendancePercent || 0}%`} icon={MdTrendingUp} color="teal" subtitle={`${cards?.pendingLeaves || 0} pending leaves`} />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly chart */}
        <div className="card p-5 lg:col-span-2">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Weekly Attendance</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={charts?.weeklyData || []} barSize={32}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#6b7280' }} />
              <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} />
              <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }} />
              <Bar dataKey="present" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Present" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Department pie */}
        <div className="card p-5">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Dept. Attendance</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={charts?.deptAttendance || []}
                dataKey="present"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={75}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {(charts?.deptAttendance || []).map((_, idx) => (
                  <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: '12px', border: 'none' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Monthly chart */}
      <div className="card p-5">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Monthly Attendance Trend</h3>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={charts?.monthlyData || []}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#6b7280' }} />
            <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} />
            <Tooltip contentStyle={{ borderRadius: '12px', border: 'none' }} />
            <Legend />
            <Line type="monotone" dataKey="present" stroke="#3b82f6" strokeWidth={2} dot={false} name="Present" />
            <Line type="monotone" dataKey="absent" stroke="#ef4444" strokeWidth={2} dot={false} name="Absent" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent activity */}
        <div className="card">
          <div className="p-5 border-b border-gray-100 dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-white">Today's Attendance</h3>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-700 max-h-72 overflow-y-auto">
            {(recentActivity || []).length === 0 ? (
              <p className="text-center text-gray-400 py-8 text-sm">No attendance marked today</p>
            ) : (recentActivity || []).map((record) => (
              <div key={record._id} className="flex items-center gap-3 px-5 py-3">
                <Avatar name={record.employee ? `${record.employee.firstName} ${record.employee.lastName}` : '?'} src={record.employee?.profilePhoto} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {record.employee ? `${record.employee.firstName} ${record.employee.lastName}` : 'Deleted Employee'}
                  </p>
                  <p className="text-xs text-gray-400">{record.employee?.employeeId}</p>
                </div>
                <Badge status={record.status} />
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming birthdays */}
        <div className="card">
          <div className="p-5 border-b border-gray-100 dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-white">🎂 Upcoming Birthdays</h3>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-700 max-h-72 overflow-y-auto">
            {(upcomingBirthdays || []).length === 0 ? (
              <p className="text-center text-gray-400 py-8 text-sm">No upcoming birthdays</p>
            ) : (upcomingBirthdays || []).map((emp) => (
              <div key={emp._id} className="flex items-center gap-3 px-5 py-3">
                <Avatar name={`${emp.firstName} ${emp.lastName}`} src={emp.profilePhoto} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{emp.firstName} {emp.lastName}</p>
                  <p className="text-xs text-gray-400">{new Date(emp.dateOfBirth).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}</p>
                </div>
                <span className="text-xs text-primary-600 font-medium">
                  {emp.daysUntil === 0 ? '🎉 Today!' : `in ${emp.daysUntil}d`}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
