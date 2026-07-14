import { useEffect, useMemo, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { MdAdd, MdEdit, MdDelete, MdDone, MdHourglassEmpty } from 'react-icons/md';
import { taskAPI } from '../../api/task.api';
import { employeeAPI } from '../../api/employee.api';
import Button from '../../components/common/Button';
import SearchInput from '../../components/common/SearchInput';
import Badge from '../../components/common/Badge';
import Avatar from '../../components/common/Avatar';
import Pagination from '../../components/common/Pagination';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import Modal from '../../components/common/Modal';
import Input, { Select, Textarea } from '../../components/common/Input';
import { TableSkeleton } from '../../components/common/Skeleton';
import { useDebounce } from '../../hooks/useDebounce';
import { usePagination } from '../../hooks/usePagination';
import toast from 'react-hot-toast';

const emptyForm = {
  title: '',
  description: '',
  assignedTo: '',
  priority: 'medium',
  status: 'pending',
  dueDate: '',
};

const statusOptions = [
  { value: 'pending', label: 'Pending' },
  { value: 'in-progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

const priorityOptions = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
];

const formatDateInput = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
};

const employeeName = (employee) => employee ? `${employee.firstName} ${employee.lastName}` : 'Unassigned';

function TaskForm({ task, employees, onSuccess, onCancel }) {
  const [form, setForm] = useState(() => task ? {
    title: task.title || '',
    description: task.description || '',
    assignedTo: task.assignedTo?._id || task.assignedTo || '',
    priority: task.priority || 'medium',
    status: task.status || 'pending',
    dueDate: formatDateInput(task.dueDate),
  } : emptyForm);
  const [saving, setSaving] = useState(false);

  const employeeOptions = useMemo(() => employees.map((emp) => ({
    value: emp._id,
    label: `${emp.firstName} ${emp.lastName} (${emp.employeeId})`,
  })), [employees]);

  const updateField = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      if (task?._id) {
        await taskAPI.update(task._id, form);
        toast.success('Task updated'); // and email sent to assignee (email disabled for now)
      } else {
        await taskAPI.create(form);
        toast.success('Task assigned'); // and email notification sent (email disabled for now)
      }
      onSuccess();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to save task');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Task Title"
        required
        value={form.title}
        onChange={(e) => updateField('title', e.target.value)}
        placeholder="Prepare monthly attendance report"
      />
      <Textarea
        label="Description"
        value={form.description}
        onChange={(e) => updateField('description', e.target.value)}
        placeholder="Add task details, expectations, or links..."
        rows={4}
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Select
          label="Assign To"
          required
          placeholder="Select employee"
          value={form.assignedTo}
          onChange={(e) => updateField('assignedTo', e.target.value)}
          options={employeeOptions}
        />
        <Input
          label="Due Date"
          type="date"
          required
          value={form.dueDate}
          onChange={(e) => updateField('dueDate', e.target.value)}
        />
        <Select
          label="Priority"
          value={form.priority}
          onChange={(e) => updateField('priority', e.target.value)}
          options={priorityOptions}
        />
        <Select
          label="Status"
          value={form.status}
          onChange={(e) => updateField('status', e.target.value)}
          options={statusOptions}
        />
      </div>
      <div className="flex gap-3 pt-2">
        <Button type="button" variant="secondary" className="flex-1" onClick={onCancel}>Cancel</Button>
        <Button type="submit" className="flex-1" loading={saving}>{task?._id ? 'Update Task' : 'Assign Task'}</Button>
      </div>
    </form>
  );
}

export default function TaskManager() {
  const [tasks, setTasks] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ status: '', priority: '', employee: '' });
  const [modal, setModal] = useState({ type: null, data: null });
  const [actionLoading, setActionLoading] = useState(false);
  const debouncedSearch = useDebounce(search);
  const { page, setPage } = usePagination();

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await taskAPI.getAll({ page, limit: 10, search: debouncedSearch, ...filters });
      setTasks(data.data);
      setPagination(data.pagination);
    } catch (err) {
      toast.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, filters]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  useEffect(() => {
    employeeAPI.getDropdown()
      .then(({ data }) => setEmployees(data.data))
      .catch(() => toast.error('Failed to load employees'));
  }, []);

  const closeModal = () => setModal({ type: null, data: null });

  const handleDelete = async () => {
    setActionLoading(true);
    try {
      await taskAPI.delete(modal.data._id);
      toast.success('Task deleted');
      closeModal();
      fetchTasks();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleStatus = async (task, status) => {
    try {
      await taskAPI.updateStatus(task._id, status);
      toast.success('Task status updated');
      fetchTasks();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Status update failed');
    }
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Task Manager</h1>
          <p className="text-gray-500 text-sm mt-1">{pagination?.total || 0} assigned tasks</p>
        </div>
        <Button icon={MdAdd} onClick={() => setModal({ type: 'add', data: null })}>Assign Task</Button>
      </div>

      <div className="card p-4 flex flex-wrap gap-3">
        <SearchInput value={search} onChange={setSearch} placeholder="Search tasks..." className="flex-1 min-w-48" />
        <select className="input w-auto min-w-40" value={filters.status} onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}>
          <option value="">All Status</option>
          {statusOptions.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}
        </select>
        <select className="input w-auto min-w-36" value={filters.priority} onChange={(e) => setFilters((f) => ({ ...f, priority: e.target.value }))}>
          <option value="">All Priority</option>
          {priorityOptions.map((priority) => <option key={priority.value} value={priority.value}>{priority.label}</option>)}
        </select>
        <select className="input w-auto min-w-48" value={filters.employee} onChange={(e) => setFilters((f) => ({ ...f, employee: e.target.value }))}>
          <option value="">All Employees</option>
          {employees.map((emp) => <option key={emp._id} value={emp._id}>{employeeName(emp)}</option>)}
        </select>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="table-header">Task</th>
                <th className="table-header">Assigned To</th>
                <th className="table-header">Due Date</th>
                <th className="table-header">Priority</th>
                <th className="table-header">Status</th>
                <th className="table-header text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {loading ? (
                <tr><td colSpan={6} className="p-0"><TableSkeleton rows={8} cols={6} /></td></tr>
              ) : tasks.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-12 text-gray-400">No tasks found</td></tr>
              ) : tasks.map((task) => (
                <motion.tr key={task._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <td className="table-cell">
                    <p className="font-medium text-gray-900 dark:text-white">{task.title}</p>
                    <p className="text-xs text-gray-500 max-w-72 truncate">{task.description || 'No description'}</p>
                  </td>
                  <td className="table-cell">
                    <div className="flex items-center gap-3">
                      <Avatar name={employeeName(task.assignedTo)} src={task.assignedTo?.profilePhoto} size="sm" />
                      <div>
                        <p className="font-medium text-sm text-gray-900 dark:text-white">{employeeName(task.assignedTo)}</p>
                        <p className="text-xs text-gray-400">{task.assignedTo?.department?.name || task.assignedTo?.employeeId}</p>
                      </div>
                    </div>
                  </td>
                  <td className="table-cell text-xs">{task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '-'}</td>
                  <td className="table-cell"><Badge status={task.priority} label={task.priority} /></td>
                  <td className="table-cell"><Badge status={task.status} label={statusOptions.find((s) => s.value === task.status)?.label || task.status} /></td>
                  <td className="table-cell">
                    <div className="flex items-center justify-end gap-1">
                      {task.status !== 'completed' && (
                        <button onClick={() => handleStatus(task, 'completed')} className="p-1.5 rounded-lg text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors" title="Mark completed">
                          <MdDone size={18} />
                        </button>
                      )}
                      {task.status === 'pending' && (
                        <button onClick={() => handleStatus(task, 'in-progress')} className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors" title="Start task">
                          <MdHourglassEmpty size={18} />
                        </button>
                      )}
                      <button onClick={() => setModal({ type: 'edit', data: task })} className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors" title="Edit">
                        <MdEdit size={16} />
                      </button>
                      <button onClick={() => setModal({ type: 'delete', data: task })} className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors" title="Delete">
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

      <Modal isOpen={modal.type === 'add' || modal.type === 'edit'} onClose={closeModal} title={modal.type === 'edit' ? 'Edit Task' : 'Assign Task'} size="lg">
        <TaskForm task={modal.data} employees={employees} onSuccess={() => { closeModal(); fetchTasks(); }} onCancel={closeModal} />
      </Modal>

      <ConfirmDialog
        isOpen={modal.type === 'delete'}
        onClose={closeModal}
        onConfirm={handleDelete}
        title="Delete Task"
        message={`Delete task "${modal.data?.title || ''}"? This cannot be undone.`}
        loading={actionLoading}
      />
    </div>
  );
}
