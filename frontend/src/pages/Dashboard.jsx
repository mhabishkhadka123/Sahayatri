import React from 'react';
import { motion } from 'framer-motion';
import MainLayout from '../components/Layout/MainLayout';
import { useAuthStore } from '../context/store';
import { useNavigate } from 'react-router-dom';
import Button from '../components/Button/Button';

const Dashboard = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const stats = [
    { label: 'Profile Views', value: '324', icon: '👁️' },
    { label: 'Likes Received', value: '48', icon: '❤️' },
    { label: 'Messages', value: '12', icon: '💬' },
    { label: 'Matches', value: '8', icon: '💑' },
  ];

  return (
    <MainLayout>
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Welcome Section */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Welcome, {user?.firstName}! 👋
            </h1>
            <p className="text-gray-600">Here's what's happening with your account</p>
          </motion.div>

          {/* Stats Grid */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ staggerChildren: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
          >
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-lg shadow p-6"
              >
                <div className="text-3xl mb-2">{stat.icon}</div>
                <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                <div className="text-gray-600 text-sm">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-lg shadow p-8 mb-8"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button
                variant="primary"
                fullWidth
                onClick={() => navigate('/profile/edit')}
              >
                Update Profile
              </Button>
              <Button
                variant="primary"
                fullWidth
                onClick={() => navigate('/discover')}
              >
                Browse Profiles
              </Button>
              <Button
                variant="primary"
                fullWidth
                onClick={() => navigate('/messages')}
              >
                View Messages
              </Button>
            </div>
          </motion.div>

          {/* Recent Likes */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-lg shadow p-8"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Recent Activity</h2>
            <div className="text-center py-8 text-gray-500">
              <p>No recent activity yet. Start exploring profiles!</p>
            </div>
          </motion.div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Dashboard;
