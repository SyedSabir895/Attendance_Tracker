import { useState } from 'react';
import { MdBusiness, MdAccessTime, MdBeachAccess, MdSecurity } from 'react-icons/md';
import Button from '../../components/common/Button';
import Input, { Select } from '../../components/common/Input';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';

export default function Settings() {
  const [activeTab, setActiveTab] = useState('general');
  const [saving, setSaving] = useState(false);
  const { register, handleSubmit } = useForm({
    defaultValues: {
      companyName: 'Attendance System',
      timezone: 'Asia/Karachi',
      weekStart: 'monday',
      workingHours: 8,
      checkInTime: '09:00',
      checkOutTime: '18:00',
      lateThreshold: 15,
    },
  });

  const tabs = [
    { id: 'general', label: 'General', icon: MdBusiness },
    { id: 'attendance', label: 'Attendance', icon: MdAccessTime },
    { id: 'leaves', label: 'Leave Policy', icon: MdBeachAccess },
    { id: 'security', label: 'Security', icon: MdSecurity },
  ];

  const onSubmit = async (values) => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 800));
    toast.success('Settings saved');
    setSaving(false);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
        <p className="text-gray-500 text-sm mt-1">Configure system preferences</p>
      </div>

      <div className="flex gap-6 flex-wrap lg:flex-nowrap">
        {/* Tab sidebar */}
        <div className="w-full lg:w-52 shrink-0">
          <div className="card p-2 space-y-0.5">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <tab.icon size={16} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1">
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="card p-6 space-y-6">
              {activeTab === 'general' && (
                <>
                  <h3 className="font-semibold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-700 pb-3">General Settings</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input label="Company Name" {...register('companyName')} />
                    <Select label="Week Start" options={[{ value: 'monday', label: 'Monday' }, { value: 'sunday', label: 'Sunday' }]} {...register('weekStart')} />
                    <Select label="Timezone" options={[
                      { value: 'Asia/Karachi', label: 'PKT (UTC+5)' },
                      { value: 'Asia/Dubai', label: 'GST (UTC+4)' },
                      { value: 'UTC', label: 'UTC' },
                    ]} {...register('timezone')} />
                  </div>
                </>
              )}

              {activeTab === 'attendance' && (
                <>
                  <h3 className="font-semibold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-700 pb-3">Attendance Settings</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input label="Standard Working Hours" type="number" {...register('workingHours')} />
                    <Input label="Office Start Time" type="time" {...register('checkInTime')} />
                    <Input label="Office End Time" type="time" {...register('checkOutTime')} />
                    <Input label="Late Threshold (minutes)" type="number" {...register('lateThreshold')} />
                  </div>
                </>
              )}

              {activeTab === 'leaves' && (
                <>
                  <h3 className="font-semibold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-700 pb-3">Leave Policy</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input label="Annual Leave (days)" type="number" defaultValue={14} />
                    <Input label="Casual Leave (days)" type="number" defaultValue={12} />
                    <Input label="Sick Leave (days)" type="number" defaultValue={10} />
                    <Input label="Maternity Leave (days)" type="number" defaultValue={90} />
                    <Input label="Paternity Leave (days)" type="number" defaultValue={14} />
                  </div>
                </>
              )}

              {activeTab === 'security' && (
                <>
                  <h3 className="font-semibold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-700 pb-3">Security Settings</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-600 rounded-xl">
                      <div>
                        <p className="font-medium text-sm text-gray-900 dark:text-white">Two-Factor Authentication</p>
                        <p className="text-xs text-gray-500">Require 2FA for admin accounts</p>
                      </div>
                      <div className="w-11 h-6 bg-gray-200 dark:bg-gray-600 rounded-full relative cursor-pointer">
                        <div className="absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform" />
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-600 rounded-xl">
                      <div>
                        <p className="font-medium text-sm text-gray-900 dark:text-white">Session Timeout</p>
                        <p className="text-xs text-gray-500">Auto-logout after inactivity</p>
                      </div>
                      <Select className="w-36" options={[
                        { value: '30', label: '30 minutes' },
                        { value: '60', label: '1 hour' },
                        { value: '480', label: '8 hours' },
                      ]} />
                    </div>
                  </div>
                </>
              )}

              <div className="flex justify-end pt-4 border-t border-gray-100 dark:border-gray-700">
                <Button type="submit" loading={saving}>Save Settings</Button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
