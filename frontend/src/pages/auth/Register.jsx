import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { MdPerson, MdEmail, MdLock, MdVisibility, MdVisibilityOff } from 'react-icons/md';
import { authAPI } from '../../api/auth.api';
import Button from '../../components/common/Button';
import toast from 'react-hot-toast';

function PasswordInput({ label, placeholder, error, required, showPassword, onToggle, ...props }) {
  return (
    <div className="w-full">
      {label && (
        <label className="label">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
          <MdLock size={16} />
        </div>
        <input
          type={showPassword ? 'text' : 'password'}
          placeholder={placeholder}
          className={`input pl-9 pr-10 ${error ? 'border-red-500 focus:ring-red-500' : ''}`}
          {...props}
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        >
          {showPassword ? <MdVisibilityOff size={18} /> : <MdVisibility size={18} />}
        </button>
      </div>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}

export default function Register() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const { register, handleSubmit, watch, formState: { errors } } = useForm();

  const onSubmit = async ({ name, email, password }) => {
    setLoading(true);
    try {
      await authAPI.register({ name, email, password });
      toast.success('Account created! Please login.');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Create account</h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Register as the first admin</p>
      </div>

      {/* Full Name */}
      <div className="w-full">
        <label className="label">Full Name <span className="text-red-500">*</span></label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
            <MdPerson size={16} />
          </div>
          <input
            type="text"
            placeholder="John Doe"
            className={`input pl-9 ${errors.name ? 'border-red-500 focus:ring-red-500' : ''}`}
            {...register('name', { required: 'Name is required', minLength: { value: 2, message: 'Min 2 characters' } })}
          />
        </div>
        {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>}
      </div>

      {/* Email */}
      <div className="w-full">
        <label className="label">Email address <span className="text-red-500">*</span></label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
            <MdEmail size={16} />
          </div>
          <input
            type="email"
            placeholder="admin@company.com"
            className={`input pl-9 ${errors.email ? 'border-red-500 focus:ring-red-500' : ''}`}
            {...register('email', {
              required: 'Email is required',
              pattern: { value: /^\S+@\S+\.\S+$/, message: 'Invalid email' },
            })}
          />
        </div>
        {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
      </div>

      {/* Password */}
      <PasswordInput
        label="Password"
        placeholder="Min 6 characters"
        error={errors.password?.message}
        required
        showPassword={showPassword}
        onToggle={() => setShowPassword((p) => !p)}
        {...register('password', { required: 'Password is required', minLength: { value: 6, message: 'Min 6 characters' } })}
      />

      {/* Confirm Password */}
      <PasswordInput
        label="Confirm Password"
        placeholder="Confirm your password"
        error={errors.confirmPassword?.message}
        required
        showPassword={showConfirm}
        onToggle={() => setShowConfirm((p) => !p)}
        {...register('confirmPassword', {
          required: 'Please confirm password',
          validate: (val) => val === watch('password') || 'Passwords do not match',
        })}
      />

      <Button type="submit" loading={loading} className="w-full justify-center">
        Create Account
      </Button>

      <p className="text-center text-sm text-gray-500 dark:text-gray-400">
        Already have an account?{' '}
        <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium">Login</Link>
      </p>
    </form>
  );
}
