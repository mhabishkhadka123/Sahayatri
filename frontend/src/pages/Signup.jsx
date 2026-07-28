import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import MainLayout from '../components/Layout/MainLayout';
import Button from '../components/Button/Button';
import Input from '../components/Input/Input';
import { useAuthStore } from '../context/store';
import Loading from '../components/Common/Loading';

const Signup = () => {
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors }, watch } = useForm({
    mode: 'onChange',
  });
  
  const { signup, isLoading: isAuthLoading, error, clearError } = useAuthStore();
  const [isLoading, setIsLoading] = React.useState(false);
  const password = watch('password');

  React.useEffect(() => {
    clearError();
  }, []);

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      await signup({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        password: data.password,
        gender: data.gender,
        dateOfBirth: data.dateOfBirth,
      });

      // Show success message and redirect to login
      navigate('/login?signup=success');
    } catch (err) {
      console.error('Signup error:', err);
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
          className="w-full max-w-2xl"
        >
          <div className="bg-white rounded-lg shadow-lg p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Join Sahayatra</h1>
              <p className="text-gray-600">Create your account and find your perfect match</p>
            </div>

            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm"
              >
                {error}
              </motion.div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="First Name"
                  placeholder="John"
                  {...register('firstName', {
                    required: 'First name is required',
                  })}
                  error={errors.firstName?.message}
                />

                <Input
                  label="Last Name"
                  placeholder="Doe"
                  {...register('lastName', {
                    required: 'Last name is required',
                  })}
                  error={errors.lastName?.message}
                />
              </div>

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

              <Input
                label="Password"
                type="password"
                placeholder="At least 8 characters"
                {...register('password', {
                  required: 'Password is required',
                  minLength: {
                    value: 8,
                    message: 'Password must be at least 8 characters',
                  },
                })}
                error={errors.password?.message}
              />

              <Input
                label="Confirm Password"
                type="password"
                placeholder="Re-enter your password"
                {...register('confirmPassword', {
                  required: 'Please confirm your password',
                  validate: (value) =>
                    value === password || 'Passwords do not match',
                })}
                error={errors.confirmPassword?.message}
              />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Gender
                  </label>
                  <select
                    {...register('gender', { required: 'Gender is required' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                  {errors.gender && (
                    <p className="text-red-600 text-sm mt-1">{errors.gender.message}</p>
                  )}
                </div>

                <Input
                  label="Date of Birth"
                  type="date"
                  {...register('dateOfBirth', {
                    required: 'Date of birth is required',
                  })}
                  error={errors.dateOfBirth?.message}
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="terms"
                  {...register('terms', {
                    required: 'You must accept the terms',
                  })}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                />
                <label htmlFor="terms" className="text-sm text-gray-700">
                  I agree to the{' '}
                  <Link to="/terms" className="text-blue-600 hover:text-blue-700">
                    Terms of Service
                  </Link>{' '}
                  and{' '}
                  <Link to="/privacy" className="text-blue-600 hover:text-blue-700">
                    Privacy Policy
                  </Link>
                </label>
              </div>
              {errors.terms && (
                <p className="text-red-600 text-sm">{errors.terms.message}</p>
              )}

              <Button
                type="submit"
                variant="primary"
                fullWidth
                disabled={isLoading || isAuthLoading}
              >
                {isLoading || isAuthLoading ? 'Creating Account...' : 'Sign Up'}
              </Button>
            </form>

            {/* Footer */}
            <p className="text-center text-gray-600 text-sm mt-6">
              Already have an account?{' '}
              <Link to="/login" className="text-blue-600 hover:text-blue-700 font-medium">
                Sign In
              </Link>
            </p>
          </div>
        </motion.div>
      </div>

      {isLoading && <Loading fullScreen />}
    </MainLayout>
  );
};

export default Signup;
