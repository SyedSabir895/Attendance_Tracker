import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { MdLock, MdArrowBack } from 'react-icons/md';
import { authAPI } from '../../api/auth.api';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import toast from 'react-hot-toast';

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, watch, formState: { errors } } = useForm();

  const onSubmit = async ({ password }) => {
    setLoading(true);
    try {
      await authAPI.resetPassword(token, password);
      toast.success('Password reset successfully!');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Reset failed. Token may have expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Reset password</h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Enter your new password</p>
      </div>
      <Input
        label="New Password"
        type="password"
        icon={MdLock}
        placeholder="Min 6 characters"
        error={errors.password?.message}
        required
        {...register('password', { required: 'Password is required', minLength: { value: 6, message: 'Min 6 characters' } })}
      />
      <Input
        label="Confirm Password"
        type="password"
        icon={MdLock}
        placeholder="Confirm new password"
        error={errors.confirmPassword?.message}
        required
        {...register('confirmPassword', {
          required: 'Please confirm password',
          validate: (val) => val === watch('password') || 'Passwords do not match',
        })}
      />
      <Button type="submit" loading={loading} className="w-full justify-center">Reset Password</Button>
      <div className="text-center">
        <Link to="/login" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
          <MdArrowBack size={14} /> Back to login
        </Link>
      </div>
    </form>
  );
}
