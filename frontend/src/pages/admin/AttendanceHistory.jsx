import { useState, useEffect, useCallback } from 'react';
import { attendanceAPI } from '../../api/attendance.api';
import { employeeAPI } from '../../api/employee.api';
import { departmentAPI } from '../../api/department.api';
import Badge from '../../components/common/Badge';
import Avatar from '../../components/common/Avatar';
import Pagination from '../../components/common/Pagination';
import SearchInput from '../../components/common/SearchInput';
import { TableSkeleton } from '../../components/common/Skeleton';
import { useDebounce } from '../../hooks/useDebounce';
import { usePagination } from '../../hooks/usePagination';
import toast from 'react-hot-toast';

export default function AttendanceHistory() {
  const [records, setRecords] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [filters, setFilters] = useState({ employee: '', department: '', status: '', month: '', year: new Date().getFullYear() });
  const { page, setPage } = usePagination();

  useEffect(() => {
    employeeAPI.getDropdown().then(({ data }) => setEmployees(data.data));
    departmentAPI.getAll().then(({ data }) => setDepartments(data.data));
  }, []);

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await attendanceAPI.getAll({ page, limit: 15, ...filters });
      setRecords(data.data);
      setPagination(data.pagination);
    } catch (err) {
      toast.error('Failed to load records');
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

  useEffect(() => { fetchRecords(); }, [fetchRecords]);

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Attendance History</h1>
        <p className="text-gray-500 text-sm mt-1">{pagination?.total || 0} records</p>
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-wrap gap-3">
        <select className="input w-auto min-w-48"
          value={filters.employee}
          onChange={(e) => setFilters((f) => ({ ...f, employee: e.target.value }))}
        >
          <option value="">All Employees</option>
          {employees.map((e) => <option key={e._id} value={e._id}>{e.firstName} {e.lastName}</option>)}
        </select>
        <select className="input w-auto min-w-44"
          value={filters.department}
          onChange={(e) => setFilters((f) => ({ ...f, department: e.target.value }))}
        >
          <option value="">All Departments</option>
          {departments.map((d) => <option key={d._id} value={d._id}>{d.name}</option>)}
        </select>
        <select className="input w-auto min-w-36"
          value={filters.status}
          onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
        >
          <option value="">All Status</option>
          {['present', 'absent', 'late', 'half_day', 'leave', 'wfh', 'holiday'].map((s) => (
            <option key={s} value={s}>{s.replace('_', ' ')}</option>
          ))}
        </select>
        <select className="input w-auto min-w-32"
          value={filters.month}
          onChange={(e) => setFilters((f) => ({ ...f, month: e.target.value }))}
        >
          <option value="">All Months</option>
          {Array.from({ length: 12 }, (_, i) => (
            <option key={i + 1} value={i + 1}>
              {new Date(2000, i).toLocaleDateString('en-US', { month: 'long' })}
            </option>
          ))}
        </select>
        <select className="input w-auto min-w-28"
          value={filters.year}
          onChange={(e) => setFilters((f) => ({ ...f, year: e.target.value }))}
        >
          {[2023, 2024, 2025, 2026].map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="table-header">Employee</th>
                <th className="table-header">Date</th>
                <th className="table-header">Status</th>
                <th className="table-header">Check In</th>
                <th className="table-header">Check Out</th>
                <th className="table-header">Hours</th>
                <th className="table-header">Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {loading ? (
                <tr><td colSpan={7} className="p-0"><TableSkeleton rows={10} cols={7} /></td></tr>
              ) : records.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-gray-400">No records found</td></tr>
              ) : records.map((rec) => (
                <tr key={rec._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="table-cell">
                    <div className="flex items-center gap-3">
                      <Avatar name={rec.employee ? `${rec.employee.firstName} ${rec.employee.lastName}` : '?'} src={rec.employee?.profilePhoto} size="sm" />
                      <div>
                        <p className="font-medium text-sm text-gray-900 dark:text-white">
                          {rec.employee ? `${rec.employee.firstName} ${rec.employee.lastName}` : '—'}
                        </p>
                        <p className="text-xs text-gray-400 font-mono">{rec.employee?.employeeId}</p>
                      </div>
                    </div>
                  </td>
                  <td className="table-cell text-xs">{new Date(rec.date).toLocaleDateString()}</td>
                  <td className="table-cell"><Badge status={rec.status} /></td>
                  <td className="table-cell text-xs text-gray-500">{rec.checkIn || '—'}</td>
                  <td className="table-cell text-xs text-gray-500">{rec.checkOut || '—'}</td>
                  <td className="table-cell text-xs">{rec.workingHours ? `${rec.workingHours}h` : '—'}</td>
                  <td className="table-cell text-xs text-gray-500 max-w-32 truncate">{rec.remarks || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination pagination={pagination} onPageChange={setPage} />
      </div>
    </div>
  );
}
