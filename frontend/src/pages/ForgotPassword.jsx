import React from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import MainLayout from '../components/Layout/MainLayout';
import Button from '../components/Button/Button';
import Input from '../components/Input/Input';
import { authService } from '../services';

const ForgotPassword = () => {
  const { register, handleSubmit, formState: { errors } } = useForm({ mode: 'onChange' });
  const [message, setMessage] = React.useState('');
  const [error, setError] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);

  const onSubmit = async (data) => {
    setIsLoading(true);
    setMessage('');
    setError('');

    try {
      const response = await authService.forgotPassword(data.email);
      setMessage(response.data.message || 'If that email exists, a password reset link has been sent.');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to process request');
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
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Forgot Password</h1>
              <p className="text-gray-600">Enter your email to receive a reset link</p>
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
                label="Email Address"
                type="email"
                placeholder="you@example.com"
                {...register('email', {
                  required: 'Email is required',
                  pattern: {
                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    message: 'Enter a valid email address',
                  },
                })}
                error={errors.email?.message}
              />

              <Button type="submit" variant="primary" fullWidth disabled={isLoading}>
                {isLoading ? 'Sending...' : 'Send Reset Link'}
              </Button>
            </form>

            <p className="text-center text-gray-600 text-sm mt-6">
              Remembered your password?{' '}
              <Link to="/login" className="text-blue-600 hover:text-blue-700 font-medium">
                Sign In
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </MainLayout>
  );
};

export default ForgotPassword;
