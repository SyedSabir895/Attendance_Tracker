import { useState, useEffect, useCallback } from 'react';
import { MdAdd } from 'react-icons/md';
import { leaveAPI } from '../../api/leave.api';
import { employeeAPI } from '../../api/employee.api';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import Badge from '../../components/common/Badge';
import Input, { Select, Textarea } from '../../components/common/Input';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';

const LEAVE_TYPES = [
  { value: 'casual', label: 'Casual Leave' },
  { value: 'sick', label: 'Sick Leave' },
  { value: 'annual', label: 'Annual Leave' },
  { value: 'maternity', label: 'Maternity Leave' },
  { value: 'paternity', label: 'Paternity Leave' },
];

export default function EmployeeLeaves() {
  const [leaves, setLeaves] = useState([]);
  const [leaveBalance, setLeaveBalance] = useState({});
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const fetchLeaves = useCallback(async () => {
    try {
      const [leavesRes, empRes] = await Promise.all([leaveAPI.getMy(), employeeAPI.getMe()]);
      setLeaves(leavesRes.data.data);
      setLeaveBalance(empRes.data.data.leaveBalance || {});
    } catch (err) { toast.error('Failed to load leaves'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchLeaves(); }, [fetchLeaves]);

  const onSubmit = async (values) => {
    setSaving(true);
    try {
      await leaveAPI.create(values);
      toast.success('Leave request submitted!');
      setModal(false);
      reset();
      fetchLeaves();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Submission failed');
    } finally { setSaving(false); }
  };

  const handleCancel = async (id) => {
    try {
      await leaveAPI.cancel(id);
      toast.success('Leave cancelled');
      fetchLeaves();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Cancel failed');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Leaves</h1>
          <p className="text-gray-500 text-sm mt-1">{leaves.length} requests</p>
        </div>
        <Button icon={MdAdd} onClick={() => { reset(); setModal(true); }}>Apply Leave</Button>
      </div>

      {/* Balance */}
      <div className="card p-5">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Leave Balance</h3>
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
          {Object.entries(leaveBalance).map(([type, days]) => (
            <div key={type} className="text-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
              <p className="text-2xl font-bold text-primary-600">{days}</p>
              <p className="text-xs text-gray-500 capitalize mt-1">{type}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Leave list */}
      <div className="space-y-3">
        {loading ? (
          <div className="flex justify-center py-8"><div className="animate-spin h-6 w-6 rounded-full border-b-2 border-primary-600" /></div>
        ) : leaves.length === 0 ? (
          <div className="card p-12 text-center">
            <p className="text-gray-400">No leave requests yet</p>
            <Button icon={MdAdd} onClick={() => setModal(true)} className="mt-4">Apply for Leave</Button>
          </div>
        ) : leaves.map((leave) => (
          <div key={leave._id} className="card p-4 flex items-start gap-4 flex-wrap">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <p className="font-semibold text-gray-900 dark:text-white capitalize">{leave.leaveType} Leave</p>
                <Badge status={leave.status} />
              </div>
              <p className="text-sm text-gray-500 mt-1">
                {new Date(leave.startDate).toLocaleDateString()} – {new Date(leave.endDate).toLocaleDateString()}
                <span className="ml-2 text-xs">({leave.totalDays} day{leave.totalDays > 1 ? 's' : ''})</span>
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{leave.reason}</p>
              {leave.rejectionReason && (
                <p className="text-xs text-red-500 mt-1">Rejection: {leave.rejectionReason}</p>
              )}
            </div>
            {['pending', 'approved'].includes(leave.status) && (
              <button
                onClick={() => handleCancel(leave._id)}
                className="text-sm text-red-500 hover:text-red-700 font-medium"
              >
                Cancel
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Apply modal */}
      <Modal isOpen={modal} onClose={() => setModal(false)} title="Apply for Leave" size="sm">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Select
            label="Leave Type"
            required
            placeholder="Select type"
            options={LEAVE_TYPES}
            error={errors.leaveType?.message}
            {...register('leaveType', { required: 'Required' })}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Start Date" type="date" required error={errors.startDate?.message} {...register('startDate', { required: 'Required' })} />
            <Input label="End Date" type="date" required error={errors.endDate?.message} {...register('endDate', { required: 'Required' })} />
          </div>
          <Textarea label="Reason" required error={errors.reason?.message} rows={3} placeholder="Reason for leave..." {...register('reason', { required: 'Required' })} />
          <div className="flex gap-3">
            <Button type="button" variant="secondary" className="flex-1" onClick={() => setModal(false)}>Cancel</Button>
            <Button type="submit" loading={saving} className="flex-1">Submit Request</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
