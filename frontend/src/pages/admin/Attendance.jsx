import { useState, useEffect, useCallback } from 'react';
import { MdSave, MdRefresh } from 'react-icons/md';
import { attendanceAPI } from '../../api/attendance.api';
import { employeeAPI } from '../../api/employee.api';
import Button from '../../components/common/Button';
import Avatar from '../../components/common/Avatar';
import { TableSkeleton } from '../../components/common/Skeleton';
import toast from 'react-hot-toast';

const STATUS_OPTIONS = [
  { value: 'present', label: 'P', color: 'bg-green-500 hover:bg-green-600', textColor: 'text-white' },
  { value: 'absent', label: 'A', color: 'bg-red-500 hover:bg-red-600', textColor: 'text-white' },
  { value: 'half_day', label: 'HD', color: 'bg-yellow-500 hover:bg-yellow-600', textColor: 'text-white' },
  { value: 'leave', label: 'L', color: 'bg-purple-500 hover:bg-purple-600', textColor: 'text-white' },
  { value: 'wfh', label: 'WFH', color: 'bg-blue-500 hover:bg-blue-600', textColor: 'text-white' },
  { value: 'holiday', label: 'H', color: 'bg-teal-500 hover:bg-teal-600', textColor: 'text-white' },
  { value: 'late', label: 'LT', color: 'bg-orange-500 hover:bg-orange-600', textColor: 'text-white' },
];

const todayStr = () => {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}`;
};

const isWeekend = (dateStr) => {
  const [y, m, d] = dateStr.split('-').map(Number);
  const day = new Date(y, m - 1, d).getDay();
  return day === 0 || day === 6;
};

export default function Attendance() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [date, setDate] = useState(todayStr());
  const [attendance, setAttendance] = useState({});
  const [remarks, setRemarks] = useState({});

  const fetchForDate = useCallback(async (selectedDate) => {
    setLoading(true);
    try {
      // Always get full employee list + that date's records
      const [empRes, attRes] = await Promise.all([
        employeeAPI.getAll({ limit: 500, status: 'active' }),
        attendanceAPI.getByDate(selectedDate),
      ]);

      const employees = empRes.data.data;
      const attRecords = attRes.data.data;

      // Build map: employeeId → attendance record
      const attMap = {};
      const remMap = {};
      attRecords.forEach((rec) => {
        const empId = rec.employee?._id || rec.employee;
        if (empId) {
          attMap[empId] = rec.status;
          remMap[empId] = rec.remarks || '';
        }
      });

      // Merge: each employee + their record for this date
      const merged = employees.map((emp) => ({
        employee: emp,
        attendance: attRecords.find((r) => (r.employee?._id || r.employee) === emp._id) || null,
      }));

      setRecords(merged);

      // Auto-mark all as holiday on weekends
      if (isWeekend(selectedDate)) {
        const holidayMap = {};
        employees.forEach((emp) => { holidayMap[emp._id] = 'holiday'; });
        setAttendance(holidayMap);
      } else {
        setAttendance(attMap);
      }
      setRemarks(remMap);
    } catch (err) {
      toast.error('Failed to load attendance');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchForDate(date); }, [date, fetchForDate]);

  const setStatus = (empId, status) => {
    setSaved(false);
    setAttendance((prev) => ({ ...prev, [empId]: prev[empId] === status ? null : status }));
  };

  const markAll = (status) => {
    setSaved(false);
    const map = {};
    records.forEach(({ employee }) => { map[employee._id] = status; });
    setAttendance(map);
  };

  const saveAll = async () => {
    const toSave = records.map(({ employee }) => ({
      employeeId: employee._id,
      status: attendance[employee._id] || 'absent',
      remarks: remarks[employee._id] || '',
    }));

    setSaving(true);
    setSaved(false);
    try {
      await attendanceAPI.markBulk({ records: toSave, date });
      toast.success('Attendance saved successfully!');
      setSaved(true);
      fetchForDate(date);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const markedCount = Object.values(attendance).filter(Boolean).length;

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Mark Attendance</h1>
          <p className="text-gray-500 text-sm mt-1">{records.length} employees · {markedCount} marked</p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="date"
            value={date}
            onChange={(e) => {
              const val = e.target.value;
              if (isWeekend(val)) {
                toast.error('Weekends are holidays — select a weekday');
                return;
              }
              setSaved(false);
              setDate(val);
            }}
            className="input w-auto"
          />
          <Button variant="secondary" icon={MdRefresh} onClick={() => fetchForDate(date)}>Refresh</Button>
          <Button icon={MdSave} onClick={saveAll} loading={saving} className={saved ? 'opacity-40' : ''}>Save All</Button>
        </div>
      </div>

      {/* Quick mark all */}
      <div className="card p-4 flex items-center gap-3 flex-wrap">
        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Mark all as:</span>
        {STATUS_OPTIONS.map((s) => (
          <button
            key={s.value}
            onClick={() => markAll(s.value)}
            className={`${s.color} ${s.textColor} text-xs font-bold px-3 py-1.5 rounded-lg transition-colors`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Attendance table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="table-header">Employee</th>
                <th className="table-header">Department</th>
                {STATUS_OPTIONS.map((s) => (
                  <th key={s.value} className="table-header text-center">{s.label}</th>
                ))}
                <th className="table-header">Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {loading ? (
                <tr><td colSpan={10}><TableSkeleton rows={8} cols={5} /></td></tr>
              ) : records.length === 0 ? (
                <tr><td colSpan={10} className="text-center py-12 text-gray-400">No active employees found</td></tr>
              ) : records.map(({ employee }) => (
                <tr key={employee._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="table-cell">
                    <div className="flex items-center gap-3">
                      <Avatar name={`${employee.firstName} ${employee.lastName}`} src={employee.profilePhoto} size="sm" />
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white text-sm">{employee.firstName} {employee.lastName}</p>
                        <p className="text-xs text-gray-400 font-mono">{employee.employeeId}</p>
                      </div>
                    </div>
                  </td>
                  <td className="table-cell text-xs text-gray-500">{employee.department?.name}</td>
                  {STATUS_OPTIONS.map((s) => (
                    <td key={s.value} className="table-cell text-center">
                      <button
                        onClick={() => setStatus(employee._id, s.value)}
                        className={`w-9 h-9 rounded-lg text-xs font-bold transition-all ${
                          attendance[employee._id] === s.value
                            ? `${s.color} ${s.textColor} ring-2 ring-offset-1 ring-current scale-110`
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                      >
                        {s.label}
                      </button>
                    </td>
                  ))}
                  <td className="table-cell">
                    <input
                      type="text"
                      placeholder="Remarks..."
                      value={remarks[employee._id] || ''}
                      onChange={(e) => setRemarks((r) => ({ ...r, [employee._id]: e.target.value }))}
                      className="input text-xs py-1.5 w-32"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Save button */}
      <div className="flex justify-end">
        <Button icon={MdSave} onClick={saveAll} loading={saving} size="lg" className={saved ? 'opacity-40' : ''}>
          {saved ? 'Saved ✓' : `Save Attendance (${markedCount}/${records.length})`}
        </Button>
      </div>
    </div>
  );
}
