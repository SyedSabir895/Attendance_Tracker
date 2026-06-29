import { useState, useEffect } from 'react';
import { MdDownload, MdBarChart, MdFilterList } from 'react-icons/md';
import { reportAPI } from '../../api/report.api';
import { employeeAPI } from '../../api/employee.api';
import { departmentAPI } from '../../api/department.api';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from 'recharts';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';

export default function Reports() {
  const [reportData, setReportData] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [filters, setFilters] = useState({
    period: 'month',
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    department: '',
    employee: '',
  });

  useEffect(() => {
    departmentAPI.getAll().then(({ data }) => setDepartments(data.data));
    employeeAPI.getDropdown().then(({ data }) => setEmployees(data.data));
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      const { data } = await reportAPI.getAnalytics({ year: new Date().getFullYear() });
      setAnalytics(data.data);
    } catch (err) { console.error(err); }
  };

  const generateReport = async () => {
    setLoading(true);
    try {
      const { data } = await reportAPI.getAttendance(filters);
      setReportData(data.data);
    } catch (err) {
      toast.error('Failed to generate report');
    } finally { setLoading(false); }
  };

  const exportExcel = async () => {
    try {
      const { data } = await reportAPI.exportData(filters);
      const ws = XLSX.utils.json_to_sheet(data.data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Attendance');
      XLSX.writeFile(wb, `attendance_report_${filters.year}_${filters.month}.xlsx`);
      toast.success('Excel exported!');
    } catch (err) {
      toast.error('Export failed');
    }
  };

  const exportCSV = async () => {
    try {
      const { data } = await reportAPI.exportData(filters);
      if (!data.data.length) return;
      const headers = Object.keys(data.data[0]).join(',');
      const rows = data.data.map((r) => Object.values(r).map((v) => `"${v}"`).join(','));
      const csv = [headers, ...rows].join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `attendance_${filters.year}_${filters.month}.csv`; a.click();
      URL.revokeObjectURL(url);
      toast.success('CSV exported!');
    } catch (err) {
      toast.error('Export failed');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Reports & Analytics</h1>
        <p className="text-gray-500 text-sm mt-1">Generate and export attendance reports</p>
      </div>

      {/* Filters */}
      <div className="card p-5 space-y-4">
        <h3 className="font-semibold text-gray-900 dark:text-white">Report Filters</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="label">Period</label>
            <select className="input" value={filters.period} onChange={(e) => setFilters((f) => ({ ...f, period: e.target.value }))}>
              <option value="month">Monthly</option>
              <option value="week">Weekly</option>
              <option value="year">Yearly</option>
            </select>
          </div>
          <div>
            <label className="label">Month</label>
            <select className="input" value={filters.month} onChange={(e) => setFilters((f) => ({ ...f, month: parseInt(e.target.value) }))}>
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={i + 1}>{new Date(2000, i).toLocaleDateString('en-US', { month: 'long' })}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Year</label>
            <select className="input" value={filters.year} onChange={(e) => setFilters((f) => ({ ...f, year: parseInt(e.target.value) }))}>
              {[2023, 2024, 2025, 2026].map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Department</label>
            <select className="input" value={filters.department} onChange={(e) => setFilters((f) => ({ ...f, department: e.target.value }))}>
              <option value="">All</option>
              {departments.map((d) => <option key={d._id} value={d._id}>{d.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Employee</label>
            <select className="input" value={filters.employee} onChange={(e) => setFilters((f) => ({ ...f, employee: e.target.value }))}>
              <option value="">All</option>
              {employees.map((e) => <option key={e._id} value={e._id}>{e.firstName} {e.lastName}</option>)}
            </select>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button icon={MdBarChart} onClick={generateReport} loading={loading}>Generate Report</Button>
          <Button variant="outline" icon={MdDownload} onClick={exportExcel}>Export Excel</Button>
          <Button variant="outline" icon={MdDownload} onClick={exportCSV}>Export CSV</Button>
        </div>
      </div>

      {/* Report table */}
      {reportData && (
        <div className="card overflow-hidden">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900 dark:text-white">Summary ({reportData.summary?.length || 0} employees)</h3>
            <p className="text-xs text-gray-500">{reportData.workingDays} working days</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900/50">
                <tr>
                  <th className="table-header">Employee</th>
                  <th className="table-header text-center">Present</th>
                  <th className="table-header text-center">Absent</th>
                  <th className="table-header text-center">Late</th>
                  <th className="table-header text-center">Leave</th>
                  <th className="table-header text-center">WFH</th>
                  <th className="table-header text-center">Att. %</th>
                  <th className="table-header text-center">Hours</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {(reportData.summary || []).map((row, i) => (
                  <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="table-cell">
                      <div>
                        <p className="font-medium text-sm text-gray-900 dark:text-white">
                          {row.employee ? `${row.employee.firstName} ${row.employee.lastName}` : '—'}
                        </p>
                        <p className="text-xs text-gray-400">{row.employee?.department?.name}</p>
                      </div>
                    </td>
                    <td className="table-cell text-center text-green-600 font-semibold">{row.present}</td>
                    <td className="table-cell text-center text-red-600 font-semibold">{row.absent}</td>
                    <td className="table-cell text-center text-orange-600 font-semibold">{row.late}</td>
                    <td className="table-cell text-center text-purple-600 font-semibold">{row.leave}</td>
                    <td className="table-cell text-center text-blue-600 font-semibold">{row.wfh}</td>
                    <td className="table-cell text-center">
                      <span className={`font-bold ${row.attendancePercent >= 80 ? 'text-green-600' : row.attendancePercent >= 60 ? 'text-orange-600' : 'text-red-600'}`}>
                        {row.attendancePercent}%
                      </span>
                    </td>
                    <td className="table-cell text-center text-sm">{row.workingHours?.toFixed(1)}h</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Analytics */}
      {analytics && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Monthly trend */}
          <div className="card p-5">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Monthly Trend ({new Date().getFullYear()})</h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={analytics.monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none' }} />
                <Legend />
                <Line type="monotone" dataKey="present" stroke="#10b981" strokeWidth={2} name="Present" dot={false} />
                <Line type="monotone" dataKey="absent" stroke="#ef4444" strokeWidth={2} name="Absent" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Dept attendance rate */}
          <div className="card p-5">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Department Rates</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={analytics.deptAttendance} barSize={28} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={80} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none' }} formatter={(v) => `${v}%`} />
                <Bar dataKey="rate" fill="#3b82f6" radius={[0, 4, 4, 0]} name="Rate %" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Most absent */}
          <div className="card overflow-hidden">
            <div className="p-4 border-b border-gray-100 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white">Most Absent Employees</h3>
            </div>
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {(analytics.mostAbsent || []).map((emp, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-3">
                  <span className="text-lg font-bold text-gray-300 w-6">#{i + 1}</span>
                  <div className="flex-1">
                    <p className="font-medium text-sm text-gray-900 dark:text-white">{emp.employee?.firstName} {emp.employee?.lastName}</p>
                    <p className="text-xs text-gray-400">{emp.employee?.employeeId}</p>
                  </div>
                  <span className="font-bold text-red-600">{emp.absentCount} days</span>
                </div>
              ))}
            </div>
          </div>

          {/* Perfect attendance */}
          <div className="card overflow-hidden">
            <div className="p-4 border-b border-gray-100 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white">🏆 Top Performers</h3>
            </div>
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {(analytics.perfectAttendance || []).map((emp, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-3">
                  <span className="text-lg font-bold text-gray-300 w-6">#{i + 1}</span>
                  <div className="flex-1">
                    <p className="font-medium text-sm text-gray-900 dark:text-white">{emp.employee?.firstName} {emp.employee?.lastName}</p>
                    <p className="text-xs text-gray-400">{emp.employee?.employeeId}</p>
                  </div>
                  <span className="font-bold text-green-600">{emp.presentCount} days</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
