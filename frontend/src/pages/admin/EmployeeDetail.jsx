import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MdArrowBack, MdEdit, MdEmail, MdPhone, MdBusiness, MdWork, MdCalendarToday } from 'react-icons/md';
import { employeeAPI } from '../../api/employee.api';
import { attendanceAPI } from '../../api/attendance.api';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Avatar from '../../components/common/Avatar';
import Modal from '../../components/common/Modal';
import EmployeeForm from '../../components/employees/EmployeeForm';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import toast from 'react-hot-toast';

export default function EmployeeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [employee, setEmployee] = useState(null);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editModal, setEditModal] = useState(false);

  useEffect(() => {
    Promise.all([
      employeeAPI.getOne(id),
      attendanceAPI.getSummary(id, { month: new Date().getMonth() + 1, year: new Date().getFullYear() }),
    ])
      .then(([empRes, sumRes]) => {
        setEmployee(empRes.data.data);
        setSummary(sumRes.data.data);
      })
      .catch(() => toast.error('Failed to load employee'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin h-10 w-10 rounded-full border-b-2 border-primary-600" /></div>;
  if (!employee) return <div className="text-center py-20 text-gray-400">Employee not found</div>;

  const summaryCards = [
    { label: 'Present', value: summary?.present || 0, color: 'text-green-600' },
    { label: 'Absent', value: summary?.absent || 0, color: 'text-red-600' },
    { label: 'Late', value: summary?.late || 0, color: 'text-orange-600' },
    { label: 'Leave', value: summary?.leave || 0, color: 'text-purple-600' },
    { label: 'WFH', value: summary?.wfh || 0, color: 'text-blue-600' },
    { label: 'Att. %', value: `${summary?.attendancePercent || 0}%`, color: 'text-teal-600' },
  ];

  const chartData = [
    { name: 'Present', value: summary?.present || 0, fill: '#10b981' },
    { name: 'Absent', value: summary?.absent || 0, fill: '#ef4444' },
    { name: 'Late', value: summary?.late || 0, fill: '#f59e0b' },
    { name: 'Leave', value: summary?.leave || 0, fill: '#8b5cf6' },
    { name: 'WFH', value: summary?.wfh || 0, fill: '#3b82f6' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Back + Edit */}
      <div className="flex items-center justify-between">
        <button onClick={() => navigate('/employees')} className="flex items-center gap-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 text-sm font-medium">
          <MdArrowBack size={18} /> Back to Employees
        </button>
        <Button icon={MdEdit} variant="outline" onClick={() => setEditModal(true)}>Edit</Button>
      </div>

      {/* Profile card */}
      <div className="card p-6">
        <div className="flex flex-wrap items-start gap-6">
          <Avatar name={`${employee.firstName} ${employee.lastName}`} src={employee.profilePhoto} size="xl" />
          <div className="flex-1 min-w-48">
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{employee.firstName} {employee.lastName}</h2>
              <Badge status={employee.status} />
            </div>
            <p className="text-gray-500 dark:text-gray-400 mt-1">{employee.designation?.title} · {employee.department?.name}</p>
            <p className="text-xs font-mono text-gray-400 mt-1">ID: {employee.employeeId}</p>
            <div className="flex flex-wrap gap-4 mt-4">
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <MdEmail size={14} className="text-gray-400" /> {employee.email}
              </div>
              {employee.phone && (
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <MdPhone size={14} className="text-gray-400" /> {employee.phone}
                </div>
              )}
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <MdCalendarToday size={14} className="text-gray-400" /> Joined {new Date(employee.joiningDate).toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Attendance summary this month */}
      <div>
        <h3 className="font-semibold text-gray-900 dark:text-white mb-3">This Month's Summary</h3>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {summaryCards.map((s) => (
            <div key={s.label} className="card p-4 text-center">
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-gray-500 mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="card p-5">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Attendance Breakdown</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData} barSize={40}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip contentStyle={{ borderRadius: '12px', border: 'none' }} />
            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
              {chartData.map((entry, i) => (
                <Bar key={i} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Leave balance */}
      <div className="card p-5">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Leave Balance</h3>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {Object.entries(employee.leaveBalance || {}).map(([type, days]) => (
            <div key={type} className="card p-3 text-center">
              <p className="text-xl font-bold text-primary-600">{days}</p>
              <p className="text-xs text-gray-500 mt-1 capitalize">{type}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Personal info */}
        <div className="card p-5">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Personal Details</h3>
          <dl className="space-y-3">
            {[
              ['Date of Birth', employee.dateOfBirth ? new Date(employee.dateOfBirth).toLocaleDateString() : '—'],
              ['Gender', employee.gender || '—'],
              ['Employment Type', employee.employmentType?.replace('_', ' ') || '—'],
              ['Address', employee.address?.city ? `${employee.address.city}, ${employee.address.state}` : '—'],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between text-sm">
                <dt className="text-gray-500 dark:text-gray-400">{k}</dt>
                <dd className="font-medium text-gray-900 dark:text-white capitalize">{v}</dd>
              </div>
            ))}
          </dl>
        </div>

        {/* Emergency contact */}
        <div className="card p-5">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Emergency Contact</h3>
          {employee.emergencyContact?.name ? (
            <dl className="space-y-3">
              {[
                ['Name', employee.emergencyContact.name],
                ['Relationship', employee.emergencyContact.relationship],
                ['Phone', employee.emergencyContact.phone],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between text-sm">
                  <dt className="text-gray-500 dark:text-gray-400">{k}</dt>
                  <dd className="font-medium text-gray-900 dark:text-white">{v || '—'}</dd>
                </div>
              ))}
            </dl>
          ) : (
            <p className="text-gray-400 text-sm">No emergency contact on file</p>
          )}
        </div>
      </div>

      {/* Edit modal */}
      <Modal isOpen={editModal} onClose={() => setEditModal(false)} title="Edit Employee" size="xl">
        <EmployeeForm
          employee={employee}
          onSuccess={() => {
            setEditModal(false);
            employeeAPI.getOne(id).then(({ data }) => setEmployee(data.data));
          }}
          onCancel={() => setEditModal(false)}
        />
      </Modal>
    </div>
  );
}
