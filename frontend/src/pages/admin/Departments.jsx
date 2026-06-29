import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MdAdd, MdEdit, MdDelete, MdBusiness } from 'react-icons/md';
import { departmentAPI } from '../../api/department.api';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import Input, { Textarea } from '../../components/common/Input';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';

export default function Departments() {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState({ type: null, data: null });
  const [saving, setSaving] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const fetchDepts = async () => {
    setLoading(true);
    try {
      const { data } = await departmentAPI.getAll({ includeCount: true });
      setDepartments(data.data);
    } catch { toast.error('Failed to load departments'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchDepts(); }, []);

  const openEdit = (dept) => {
    reset({ name: dept.name, code: dept.code, description: dept.description });
    setModal({ type: 'edit', data: dept });
  };

  const openAdd = () => {
    reset({});
    setModal({ type: 'add', data: null });
  };

  const onSubmit = async (values) => {
    setSaving(true);
    try {
      if (modal.type === 'add') {
        await departmentAPI.create(values);
        toast.success('Department created');
      } else {
        await departmentAPI.update(modal.data._id, values);
        toast.success('Department updated');
      }
      setModal({ type: null, data: null });
      fetchDepts();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Operation failed');
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    setSaving(true);
    try {
      await departmentAPI.delete(modal.data._id);
      toast.success('Department deleted');
      setModal({ type: null, data: null });
      fetchDepts();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    } finally { setSaving(false); }
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Departments</h1>
          <p className="text-gray-500 text-sm mt-1">{departments.length} departments</p>
        </div>
        <Button icon={MdAdd} onClick={openAdd}>Add Department</Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card p-5 animate-pulse">
              <div className="skeleton h-5 w-32 rounded mb-2" />
              <div className="skeleton h-4 w-20 rounded" />
            </div>
          ))}
        </div>
      ) : departments.length === 0 ? (
        <div className="card p-12 text-center">
          <MdBusiness size={48} className="text-gray-300 mx-auto mb-3" />
          <p className="text-gray-400">No departments yet</p>
          <Button icon={MdAdd} onClick={openAdd} className="mt-4">Add First Department</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {departments.map((dept) => (
            <motion.div key={dept._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center">
                  <MdBusiness size={20} className="text-primary-600 dark:text-primary-400" />
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(dept)} className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                    <MdEdit size={16} />
                  </button>
                  <button onClick={() => setModal({ type: 'delete', data: dept })} className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                    <MdDelete size={16} />
                  </button>
                </div>
              </div>
              <div className="mt-3">
                <h3 className="font-semibold text-gray-900 dark:text-white">{dept.name}</h3>
                {dept.code && <p className="text-xs font-mono text-gray-400">{dept.code}</p>}
                {dept.description && <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{dept.description}</p>}
                <p className="text-xs text-primary-600 dark:text-primary-400 mt-2 font-medium">
                  {dept.employeeCount || 0} employees
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Add/Edit modal */}
      <Modal isOpen={modal.type === 'add' || modal.type === 'edit'} onClose={() => setModal({ type: null, data: null })} title={modal.type === 'add' ? 'Add Department' : 'Edit Department'} size="sm">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input label="Department Name" required error={errors.name?.message} {...register('name', { required: 'Name is required' })} />
          <Input label="Code (optional)" placeholder="e.g., HR, ENG, SALES" {...register('code')} />
          <Textarea label="Description" rows={3} {...register('description')} />
          <div className="flex gap-3">
            <Button type="button" variant="secondary" className="flex-1" onClick={() => setModal({ type: null, data: null })}>Cancel</Button>
            <Button type="submit" loading={saving} className="flex-1">{modal.type === 'add' ? 'Create' : 'Update'}</Button>
          </div>
        </form>
      </Modal>

      {/* Delete */}
      <ConfirmDialog
        isOpen={modal.type === 'delete'}
        onClose={() => setModal({ type: null, data: null })}
        onConfirm={handleDelete}
        title="Delete Department"
        message={`Delete "${modal.data?.name}"? Employees must be reassigned first.`}
        loading={saving}
      />
    </div>
  );
}
