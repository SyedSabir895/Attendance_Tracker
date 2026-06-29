import { useState, useEffect } from 'react';
import { MdAdd, MdEdit, MdDelete, MdWork } from 'react-icons/md';
import { designationAPI } from '../../api/designation.api';
import { departmentAPI } from '../../api/department.api';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import Input, { Select, Textarea } from '../../components/common/Input';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';

const LEVEL_OPTIONS = ['junior', 'mid', 'senior', 'lead', 'manager', 'director', 'executive'].map((v) => ({ value: v, label: v.charAt(0).toUpperCase() + v.slice(1) }));

export default function Designations() {
  const [designations, setDesignations] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState({ type: null, data: null });
  const [saving, setSaving] = useState(false);
  const [deptFilter, setDeptFilter] = useState('');
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [desigRes, deptRes] = await Promise.all([
        designationAPI.getAll(deptFilter ? { department: deptFilter } : {}),
        departmentAPI.getAll(),
      ]);
      setDesignations(desigRes.data.data);
      setDepartments(deptRes.data.data);
    } catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(); }, [deptFilter]);

  const openAdd = () => { reset({}); setModal({ type: 'add', data: null }); };
  const openEdit = (desig) => {
    reset({ title: desig.title, department: desig.department?._id || desig.department, level: desig.level, description: desig.description });
    setModal({ type: 'edit', data: desig });
  };

  const onSubmit = async (values) => {
    setSaving(true);
    try {
      if (modal.type === 'add') { await designationAPI.create(values); toast.success('Designation created'); }
      else { await designationAPI.update(modal.data._id, values); toast.success('Designation updated'); }
      setModal({ type: null, data: null });
      fetchAll();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    setSaving(true);
    try {
      await designationAPI.delete(modal.data._id);
      toast.success('Designation deleted');
      setModal({ type: null, data: null });
      fetchAll();
    } catch (err) { toast.error(err.response?.data?.message || 'Delete failed'); }
    finally { setSaving(false); }
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Designations</h1>
          <p className="text-gray-500 text-sm mt-1">{designations.length} designations</p>
        </div>
        <div className="flex gap-3">
          <select className="input w-auto" value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)}>
            <option value="">All Departments</option>
            {departments.map((d) => <option key={d._id} value={d._id}>{d.name}</option>)}
          </select>
          <Button icon={MdAdd} onClick={openAdd}>Add Designation</Button>
        </div>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
            <tr>
              <th className="table-header">Title</th>
              <th className="table-header">Department</th>
              <th className="table-header">Level</th>
              <th className="table-header text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
            {loading ? (
              <tr><td colSpan={4} className="text-center py-8"><div className="animate-spin h-6 w-6 rounded-full border-b-2 border-primary-600 mx-auto" /></td></tr>
            ) : designations.length === 0 ? (
              <tr><td colSpan={4} className="text-center py-12 text-gray-400">No designations found</td></tr>
            ) : designations.map((d) => (
              <tr key={d._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <td className="table-cell">
                  <div className="flex items-center gap-2">
                    <MdWork size={16} className="text-primary-500" />
                    <span className="font-medium text-gray-900 dark:text-white">{d.title}</span>
                  </div>
                </td>
                <td className="table-cell text-sm text-gray-500">{d.department?.name}</td>
                <td className="table-cell">
                  <span className="badge bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 capitalize">{d.level}</span>
                </td>
                <td className="table-cell">
                  <div className="flex items-center justify-end gap-1">
                    <button onClick={() => openEdit(d)} className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                      <MdEdit size={16} />
                    </button>
                    <button onClick={() => setModal({ type: 'delete', data: d })} className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                      <MdDelete size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={modal.type === 'add' || modal.type === 'edit'} onClose={() => setModal({ type: null, data: null })} title={modal.type === 'add' ? 'Add Designation' : 'Edit Designation'} size="sm">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input label="Title" required error={errors.title?.message} {...register('title', { required: 'Required' })} />
          <Select label="Department" required placeholder="Select department" options={departments.map((d) => ({ value: d._id, label: d.name }))} error={errors.department?.message} {...register('department', { required: 'Required' })} />
          <Select label="Level" options={LEVEL_OPTIONS} {...register('level')} />
          <Textarea label="Description" rows={2} {...register('description')} />
          <div className="flex gap-3">
            <Button type="button" variant="secondary" className="flex-1" onClick={() => setModal({ type: null, data: null })}>Cancel</Button>
            <Button type="submit" loading={saving} className="flex-1">{modal.type === 'add' ? 'Create' : 'Update'}</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog isOpen={modal.type === 'delete'} onClose={() => setModal({ type: null, data: null })} onConfirm={handleDelete} title="Delete Designation" message={`Delete "${modal.data?.title}"?`} loading={saving} />
    </div>
  );
}
