import { useState, useEffect } from 'react';
import { MdAdd, MdEdit, MdDelete, MdEventNote } from 'react-icons/md';
import { holidayAPI } from '../../api/holiday.api';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import Input, { Select, Textarea } from '../../components/common/Input';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';

const TYPE_OPTIONS = [
  { value: 'public', label: 'Public' },
  { value: 'optional', label: 'Optional' },
  { value: 'restricted', label: 'Restricted' },
  { value: 'company', label: 'Company' },
];

const TYPE_COLORS = {
  public: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
  optional: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
  restricted: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400',
  company: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400',
};

export default function Holidays() {
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState(new Date().getFullYear());
  const [modal, setModal] = useState({ type: null, data: null });
  const [saving, setSaving] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const fetchHolidays = async () => {
    setLoading(true);
    try {
      const { data } = await holidayAPI.getAll({ year });
      setHolidays(data.data);
    } catch { toast.error('Failed to load holidays'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchHolidays(); }, [year]);

  const openAdd = () => { reset({}); setModal({ type: 'add', data: null }); };
  const openEdit = (holiday) => {
    reset({
      name: holiday.name,
      date: new Date(holiday.date).toISOString().split('T')[0],
      type: holiday.type,
      description: holiday.description,
      isRecurring: holiday.isRecurring,
    });
    setModal({ type: 'edit', data: holiday });
  };

  const onSubmit = async (values) => {
    setSaving(true);
    try {
      if (modal.type === 'add') { await holidayAPI.create(values); toast.success('Holiday added'); }
      else { await holidayAPI.update(modal.data._id, values); toast.success('Holiday updated'); }
      setModal({ type: null, data: null });
      fetchHolidays();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    setSaving(true);
    try {
      await holidayAPI.delete(modal.data._id);
      toast.success('Holiday deleted');
      setModal({ type: null, data: null });
      fetchHolidays();
    } catch (err) { toast.error('Delete failed'); }
    finally { setSaving(false); }
  };

  const grouped = holidays.reduce((acc, h) => {
    const month = new Date(h.date).toLocaleDateString('en-US', { month: 'long' });
    if (!acc[month]) acc[month] = [];
    acc[month].push(h);
    return acc;
  }, {});

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Holidays</h1>
          <p className="text-gray-500 text-sm mt-1">{holidays.length} holidays in {year}</p>
        </div>
        <div className="flex gap-3">
          <select className="input w-auto" value={year} onChange={(e) => setYear(parseInt(e.target.value))}>
            {[2024, 2025, 2026].map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
          <Button icon={MdAdd} onClick={openAdd}>Add Holiday</Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin h-8 w-8 rounded-full border-b-2 border-primary-600" /></div>
      ) : holidays.length === 0 ? (
        <div className="card p-12 text-center">
          <MdEventNote size={48} className="text-gray-300 mx-auto mb-3" />
          <p className="text-gray-400">No holidays for {year}</p>
          <Button icon={MdAdd} onClick={openAdd} className="mt-4">Add Holiday</Button>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(grouped).map(([month, monthHolidays]) => (
            <div key={month}>
              <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">{month}</h3>
              <div className="card overflow-hidden">
                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                  {monthHolidays.map((h) => (
                    <div key={h._id} className="flex items-center gap-4 px-5 py-4">
                      <div className="text-center w-12">
                        <p className="text-lg font-bold text-primary-600">{new Date(h.date).getDate()}</p>
                        <p className="text-xs text-gray-400">{new Date(h.date).toLocaleDateString('en-US', { weekday: 'short' })}</p>
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 dark:text-white">{h.name}</p>
                        {h.description && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{h.description}</p>}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`badge ${TYPE_COLORS[h.type] || ''} capitalize`}>{h.type}</span>
                        <button onClick={() => openEdit(h)} className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                          <MdEdit size={16} />
                        </button>
                        <button onClick={() => setModal({ type: 'delete', data: h })} className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                          <MdDelete size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={modal.type === 'add' || modal.type === 'edit'} onClose={() => setModal({ type: null, data: null })} title={modal.type === 'add' ? 'Add Holiday' : 'Edit Holiday'} size="sm">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input label="Holiday Name" required error={errors.name?.message} {...register('name', { required: 'Required' })} />
          <Input label="Date" type="date" required error={errors.date?.message} {...register('date', { required: 'Required' })} />
          <Select label="Type" options={TYPE_OPTIONS} {...register('type')} />
          <Textarea label="Description" rows={2} {...register('description')} />
          <div className="flex gap-3">
            <Button type="button" variant="secondary" className="flex-1" onClick={() => setModal({ type: null, data: null })}>Cancel</Button>
            <Button type="submit" loading={saving} className="flex-1">{modal.type === 'add' ? 'Add' : 'Update'}</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog isOpen={modal.type === 'delete'} onClose={() => setModal({ type: null, data: null })} onConfirm={handleDelete} title="Delete Holiday" message={`Delete "${modal.data?.name}"?`} loading={saving} />
    </div>
  );
}
