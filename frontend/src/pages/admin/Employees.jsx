import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MdAdd, MdEdit, MdDelete, MdVisibility, MdFilterList } from 'react-icons/md';
import { employeeAPI } from '../../api/employee.api';
import { departmentAPI } from '../../api/department.api';
import Button from '../../components/common/Button';
import SearchInput from '../../components/common/SearchInput';
import Badge from '../../components/common/Badge';
import Avatar from '../../components/common/Avatar';
import Pagination from '../../components/common/Pagination';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import Modal from '../../components/common/Modal';
import { TableSkeleton } from '../../components/common/Skeleton';
import EmployeeForm from '../../components/employees/EmployeeForm';
import { useDebounce } from '../../hooks/useDebounce';
import { usePagination } from '../../hooks/usePagination';
import toast from 'react-hot-toast';

export default function Employees() {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [departments, setDepartments] = useState([]);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ department: '', status: '' });
  const [modal, setModal] = useState({ type: null, data: null });
  const [deleting, setDeleting] = useState(false);
  const debouncedSearch = useDebounce(search);
  const { page, setPage } = usePagination();

  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await employeeAPI.getAll({ page, limit: 10, search: debouncedSearch, ...filters });
      setEmployees(data.data);
      setPagination(data.pagination);
    } catch (err) {
      toast.error('Failed to load employees');
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, filters]);

  useEffect(() => { fetchEmployees(); }, [fetchEmployees]);

  useEffect(() => {
    departmentAPI.getAll().then(({ data }) => setDepartments(data.data));
  }, []);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await employeeAPI.delete(modal.data._id);
      toast.success('Employee deleted');
      setModal({ type: null, data: null });
      fetchEmployees();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    } finally {
      setDeleting(false);
    }
  };

  const handleToggleStatus = async (emp) => {
    const newStatus = emp.status === 'active' ? 'inactive' : 'active';
    try {
      await employeeAPI.toggleStatus(emp._id, newStatus);
      toast.success(`Employee ${newStatus}`);
      fetchEmployees();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Status update failed');
    }
  };

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Employees</h1>
          <p className="text-gray-500 text-sm mt-1">{pagination?.total || 0} total employees</p>
        </div>
        <Button icon={MdAdd} onClick={() => setModal({ type: 'add', data: null })}>
          Add Employee
        </Button>
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-wrap gap-3">
        <SearchInput value={search} onChange={setSearch} placeholder="Search employees..." className="flex-1 min-w-48" />
        <select
          className="input w-auto min-w-44"
          value={filters.department}
          onChange={(e) => setFilters((f) => ({ ...f, department: e.target.value }))}
        >
          <option value="">All Departments</option>
          {departments.map((d) => <option key={d._id} value={d._id}>{d.name}</option>)}
        </select>
        <select
          className="input w-auto min-w-36"
          value={filters.status}
          onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="terminated">Terminated</option>
        </select>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="table-header">Employee</th>
                <th className="table-header">ID</th>
                <th className="table-header">Department</th>
                <th className="table-header">Designation</th>
                <th className="table-header">Joining</th>
                <th className="table-header">Status</th>
                <th className="table-header text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {loading ? (
                <tr><td colSpan={7} className="p-0"><TableSkeleton rows={8} cols={7} /></td></tr>
              ) : employees.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-gray-400">No employees found</td>
                </tr>
              ) : employees.map((emp) => (
                <motion.tr
                  key={emp._id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <td className="table-cell">
                    <div className="flex items-center gap-3">
                      <Avatar name={`${emp.firstName} ${emp.lastName}`} src={emp.profilePhoto} size="sm" />
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{emp.firstName} {emp.lastName}</p>
                        <p className="text-xs text-gray-400">{emp.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="table-cell font-mono text-xs">{emp.employeeId}</td>
                  <td className="table-cell">{emp.department?.name || '—'}</td>
                  <td className="table-cell">{emp.designation?.title || '—'}</td>
                  <td className="table-cell text-xs">{emp.joiningDate ? new Date(emp.joiningDate).toLocaleDateString() : '—'}</td>
                  <td className="table-cell"><Badge status={emp.status} /></td>
                  <td className="table-cell">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => navigate(`/employees/${emp._id}`)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
                        title="View"
                      >
                        <MdVisibility size={16} />
                      </button>
                      <button
                        onClick={() => setModal({ type: 'edit', data: emp })}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                        title="Edit"
                      >
                        <MdEdit size={16} />
                      </button>
                      <button
                        onClick={() => setModal({ type: 'delete', data: emp })}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        title="Delete"
                      >
                        <MdDelete size={16} />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination pagination={pagination} onPageChange={setPage} />
      </div>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={modal.type === 'add' || modal.type === 'edit'}
        onClose={() => setModal({ type: null, data: null })}
        title={modal.type === 'add' ? 'Add Employee' : 'Edit Employee'}
        size="xl"
      >
        <EmployeeForm
          employee={modal.data}
          onSuccess={() => { setModal({ type: null, data: null }); fetchEmployees(); }}
          onCancel={() => setModal({ type: null, data: null })}
        />
      </Modal>

      {/* Delete confirmation */}
      <ConfirmDialog
        isOpen={modal.type === 'delete'}
        onClose={() => setModal({ type: null, data: null })}
        onConfirm={handleDelete}
        title="Delete Employee"
        message={`Delete ${modal.data?.firstName} ${modal.data?.lastName}? Their account will be deactivated.`}
        loading={deleting}
      />
    </div>
  );
}
