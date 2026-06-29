import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { MdEmail, MdArrowBack } from 'react-icons/md';
import { authAPI } from '../../api/auth.api';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import toast from 'react-hot-toast';

export default function ForgotPassword() {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm();

  const onSubmit = async ({ email }) => {
    setLoading(true);
    try {
      await authAPI.forgotPassword(email);
      setSent(true);
      toast.success('Reset link sent to your email');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="text-center py-4 space-y-4">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full">
          <MdEmail size={32} className="text-green-600" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Check your email</h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm">We sent a password reset link. Check your inbox.</p>
        <Link to="/login" className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium text-sm">
          <MdArrowBack size={16} /> Back to login
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Forgot password?</h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Enter your email to receive a reset link</p>
      </div>
      <Input
        label="Email address"
        type="email"
        icon={MdEmail}
        placeholder="you@company.com"
        error={errors.email?.message}
        required
        {...register('email', { required: 'Email is required', pattern: { value: /^\S+@\S+\.\S+$/, message: 'Invalid email' } })}
      />
      <Button type="submit" loading={loading} className="w-full justify-center">Send Reset Link</Button>
      <div className="text-center">
        <Link to="/login" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
          <MdArrowBack size={14} /> Back to login
        </Link>
      </div>
    </form>
  );
}
