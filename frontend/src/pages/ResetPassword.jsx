import React from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import MainLayout from '../components/Layout/MainLayout';
import Button from '../components/Button/Button';
import Input from '../components/Input/Input';
import { authService } from '../services';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const { register, handleSubmit, formState: { errors }, watch } = useForm({ mode: 'onChange' });
  const password = watch('newPassword');
  const [message, setMessage] = React.useState('');
  const [error, setError] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);

  const onSubmit = async (data) => {
    if (!token) {
      setError('Reset token is missing.');
      return;
    }

    setIsLoading(true);
    setMessage('');
    setError('');

    try {
      const response = await authService.resetPassword(token, data.newPassword);
      setMessage(response.data.message || 'Password reset successfully. You can now log in.');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to reset password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="min-h-screen flex items-center justify-center px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Reset Password</h1>
              <p className="text-gray-600">Choose a new password for your account</p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            {message && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
                {message}
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <Input
                label="New Password"
                type="password"
                placeholder="Enter a new password"
                {...register('newPassword', {
                  required: 'Password is required',
                  minLength: {
                    value: 8,
                    message: 'Password must be at least 8 characters',
                  },
                })}
                error={errors.newPassword?.message}
              />

              <Input
                label="Confirm Password"
                type="password"
                placeholder="Re-enter your password"
                {...register('confirmPassword', {
                  required: 'Please confirm your password',
                  validate: (value) => value === password || 'Passwords do not match',
                })}
                error={errors.confirmPassword?.message}
              />

              <Button type="submit" variant="primary" fullWidth disabled={isLoading}>
                {isLoading ? 'Updating...' : 'Reset Password'}
              </Button>
            </form>

            <p className="text-center text-gray-600 text-sm mt-6">
              <Link to="/login" className="text-blue-600 hover:text-blue-700 font-medium">
                Back to Sign In
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </MainLayout>
  );
};

export default ResetPassword;
