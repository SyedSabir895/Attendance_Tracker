import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { employeeAPI } from '../../api/employee.api';
import Input from '../common/Input';
import Button from '../common/Button';
import toast from 'react-hot-toast';

export default function EmployeeForm({ employee, onSuccess, onCancel }) {
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: employee ? {
      firstName: employee.firstName,
      lastName: employee.lastName,
      email: employee.email || '',
      dateOfBirth: employee.dateOfBirth ? new Date(employee.dateOfBirth).toISOString().split('T')[0] : '',
    } : {},
  });

  const onSubmit = async (values) => {
    setLoading(true);
    try {
      if (employee) {
        await employeeAPI.update(employee._id, values);
        toast.success('Employee updated');
      } else {
        await employeeAPI.create(values);
        toast.success('Employee created');
      }
      onSuccess();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="First Name"
          required
          placeholder="John"
          error={errors.firstName?.message}
          {...register('firstName', { required: 'Required' })}
        />
        <Input
          label="Last Name"
          required
          placeholder="Doe"
          error={errors.lastName?.message}
          {...register('lastName', { required: 'Required' })}
        />
      </div>

      <Input
        label="Email"
        type="email"
        placeholder="john@example.com"
        error={errors.email?.message}
        {...register('email', {
          pattern: {
            value: /^\S+@\S+\.\S+$/,
            message: 'Enter a valid email',
          },
        })}
      />

      <Input
        label="Date of Birth"
        type="date"
        error={errors.dateOfBirth?.message}
        {...register('dateOfBirth')}
      />

      <div className="flex gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel} className="flex-1">Cancel</Button>
        <Button type="submit" loading={loading} className="flex-1">
          {employee ? 'Update Employee' : 'Create Employee'}
        </Button>
      </div>
    </form>
  );
}
