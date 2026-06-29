import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { MdCheckCircle, MdCancel, MdDelete } from 'react-icons/md';
import { leaveAPI } from '../../api/leave.api';
import Badge from '../../components/common/Badge';
import Avatar from '../../components/common/Avatar';
import Pagination from '../../components/common/Pagination';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import Modal from '../../components/common/Modal';
import Button from '../../components/common/Button';
import { TableSkeleton } from '../../components/common/Skeleton';
import { usePagination } from '../../hooks/usePagination';
import { Textarea } from '../../components/common/Input';
import toast from 'react-hot-toast';

export default function Leaves() {
  const [leaves, setLeaves] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ status: 'pending' });
  const [modal, setModal] = useState({ type: null, data: null });
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const { page, setPage } = usePagination();

  const fetchLeaves = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await leaveAPI.getAll({ page, limit: 10, ...filter });
      setLeaves(data.data);
      setPagination(data.pagination);
    } catch (err) {
      toast.error('Failed to load leaves');
    } finally {
      setLoading(false);
    }
  }, [page, filter]);

  useEffect(() => { fetchLeaves(); }, [fetchLeaves]);

  const handleStatus = async (status) => {
    setActionLoading(true);
    try {
      await leaveAPI.updateStatus(modal.data._id, { status, rejectionReason });
      toast.success(`Leave ${status}`);
      setModal({ type: null, data: null });
      setRejectionReason('');
      fetchLeaves();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    setActionLoading(true);
    try {
      await leaveAPI.delete(modal.data._id);
      toast.success('Leave deleted');
      setModal({ type: null, data: null });
      fetchLeaves();
    } catch (err) {
      toast.error('Delete failed');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Leave Management</h1>
          <p className="text-gray-500 text-sm mt-1">{pagination?.total || 0} requests</p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {['all', 'pending', 'approved', 'rejected', 'cancelled'].map((s) => (
          <button
            key={s}
            onClick={() => setFilter({ status: s === 'all' ? '' : s })}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${
              (filter.status === s || (s === 'all' && !filter.status))
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="table-header">Employee</th>
                <th className="table-header">Type</th>
                <th className="table-header">From</th>
                <th className="table-header">To</th>
                <th className="table-header">Days</th>
                <th className="table-header">Reason</th>
                <th className="table-header">Status</th>
                <th className="table-header text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {loading ? (
                <tr><td colSpan={8}><TableSkeleton rows={6} cols={8} /></td></tr>
              ) : leaves.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-12 text-gray-400">No leave requests found</td></tr>
              ) : leaves.map((leave) => (
                <tr key={leave._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="table-cell">
                    <div className="flex items-center gap-3">
                      <Avatar name={leave.employee ? `${leave.employee.firstName} ${leave.employee.lastName}` : '?'} src={leave.employee?.profilePhoto} size="sm" />
                      <div>
                        <p className="font-medium text-sm text-gray-900 dark:text-white">
                          {leave.employee ? `${leave.employee.firstName} ${leave.employee.lastName}` : '—'}
                        </p>
                        <p className="text-xs text-gray-400">{leave.employee?.department?.name}</p>
                      </div>
                    </div>
                  </td>
                  <td className="table-cell capitalize text-sm">{leave.leaveType}</td>
                  <td className="table-cell text-xs">{new Date(leave.startDate).toLocaleDateString()}</td>
                  <td className="table-cell text-xs">{new Date(leave.endDate).toLocaleDateString()}</td>
                  <td className="table-cell text-sm">{leave.totalDays}</td>
                  <td className="table-cell text-xs text-gray-500 max-w-40 truncate">{leave.reason}</td>
                  <td className="table-cell"><Badge status={leave.status} /></td>
                  <td className="table-cell">
                    <div className="flex items-center justify-end gap-1">
                      {leave.status === 'pending' && (
                        <>
                          <button
                            onClick={() => setModal({ type: 'approve', data: leave })}
                            className="p-1.5 rounded-lg text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
                            title="Approve"
                          >
                            <MdCheckCircle size={18} />
                          </button>
                          <button
                            onClick={() => setModal({ type: 'reject', data: leave })}
                            className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                            title="Reject"
                          >
                            <MdCancel size={18} />
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => setModal({ type: 'delete', data: leave })}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        title="Delete"
                      >
                        <MdDelete size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination pagination={pagination} onPageChange={setPage} />
      </div>

      {/* Approve modal */}
      <Modal isOpen={modal.type === 'approve'} onClose={() => setModal({ type: null, data: null })} title="Approve Leave" size="sm">
        <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
          Approve {modal.data?.leaveType} leave for {modal.data?.employee?.firstName} {modal.data?.employee?.lastName}?
        </p>
        <div className="flex gap-3">
          <Button variant="secondary" className="flex-1" onClick={() => setModal({ type: null, data: null })}>Cancel</Button>
          <Button className="flex-1 bg-green-600 hover:bg-green-700" onClick={() => handleStatus('approved')} loading={actionLoading}>Approve</Button>
        </div>
      </Modal>

      {/* Reject modal */}
      <Modal isOpen={modal.type === 'reject'} onClose={() => setModal({ type: null, data: null })} title="Reject Leave" size="sm">
        <div className="space-y-3">
          <Textarea
            label="Rejection Reason"
            placeholder="Reason for rejection..."
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            rows={3}
          />
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={() => setModal({ type: null, data: null })}>Cancel</Button>
            <Button variant="danger" className="flex-1" onClick={() => handleStatus('rejected')} loading={actionLoading}>Reject</Button>
          </div>
        </div>
      </Modal>

      {/* Delete */}
      <ConfirmDialog
        isOpen={modal.type === 'delete'}
        onClose={() => setModal({ type: null, data: null })}
        onConfirm={handleDelete}
        title="Delete Leave Request"
        message="This leave request will be permanently deleted."
        loading={actionLoading}
      />
    </div>
  );
}
