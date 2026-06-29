import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { MdPerson, MdLock, MdCamera } from 'react-icons/md';
import { authAPI } from '../../api/auth.api';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Avatar from '../../components/common/Avatar';
import toast from 'react-hot-toast';

export default function Profile() {
  const { user, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [saving, setSaving] = useState(false);
  const [photo, setPhoto] = useState(null);

  const { register: regProfile, handleSubmit: handleProfile, formState: { errors: profileErrors } } = useForm({
    defaultValues: { name: user?.name, email: user?.email },
  });

  const { register: regPass, handleSubmit: handlePass, watch, reset: resetPass, formState: { errors: passErrors } } = useForm();

  const onProfileSubmit = async (values) => {
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('name', values.name);
      if (photo) formData.append('avatar', photo);
      const { data } = await authAPI.updateProfile(formData);
      updateUser({ ...user, name: data.data.name, avatar: data.data.avatar });
      toast.success('Profile updated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally { setSaving(false); }
  };

  const onPasswordSubmit = async (values) => {
    setSaving(true);
    try {
      await authAPI.changePassword({ currentPassword: values.currentPassword, newPassword: values.newPassword });
      toast.success('Password changed!');
      resetPass();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Change failed');
    } finally { setSaving(false); }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Profile</h1>

      {/* Tabs */}
      <div className="flex gap-1 card p-1 w-fit">
        {[{ id: 'profile', label: 'Profile', icon: MdPerson }, { id: 'password', label: 'Password', icon: MdLock }].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab.id ? 'bg-primary-600 text-white' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <tab.icon size={16} />{tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'profile' ? (
        <div className="card p-6 space-y-6">
          {/* Avatar */}
          <div className="flex items-center gap-4">
            <div className="relative">
              {photo ? (
                <img src={URL.createObjectURL(photo)} className="w-20 h-20 rounded-full object-cover" alt="preview" />
              ) : (
                <Avatar name={user?.name} src={user?.avatar} size="xl" />
              )}
              <label className="absolute bottom-0 right-0 w-7 h-7 bg-primary-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-primary-700 transition-colors">
                <MdCamera size={14} className="text-white" />
                <input type="file" accept="image/*" className="hidden" onChange={(e) => setPhoto(e.target.files[0])} />
              </label>
            </div>
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">{user?.name}</p>
              <p className="text-sm text-gray-500">{user?.email}</p>
              <p className="text-xs text-primary-600 capitalize mt-1">{user?.role}</p>
            </div>
          </div>

          <form onSubmit={handleProfile(onProfileSubmit)} className="space-y-4">
            <Input label="Full Name" required error={profileErrors.name?.message} {...regProfile('name', { required: 'Name is required' })} />
            <Input label="Email" type="email" disabled value={user?.email} className="opacity-60 cursor-not-allowed" />
            <div className="flex justify-end">
              <Button type="submit" loading={saving}>Save Changes</Button>
            </div>
          </form>
        </div>
      ) : (
        <div className="card p-6">
          <form onSubmit={handlePass(onPasswordSubmit)} className="space-y-4">
            <Input
              label="Current Password"
              type="password"
              required
              error={passErrors.currentPassword?.message}
              {...regPass('currentPassword', { required: 'Required' })}
            />
            <Input
              label="New Password"
              type="password"
              required
              error={passErrors.newPassword?.message}
              {...regPass('newPassword', { required: 'Required', minLength: { value: 6, message: 'Min 6 chars' } })}
            />
            <Input
              label="Confirm New Password"
              type="password"
              required
              error={passErrors.confirmPassword?.message}
              {...regPass('confirmPassword', {
                required: 'Required',
                validate: (v) => v === watch('newPassword') || 'Passwords do not match',
              })}
            />
            <div className="flex justify-end">
              <Button type="submit" loading={saving}>Change Password</Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
