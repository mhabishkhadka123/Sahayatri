import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import MainLayout from '../components/Layout/MainLayout';
import Button from '../components/Button/Button';
import { useAuthStore } from '../context/store';

const Home = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();

  const features = [
    {
      icon: '👥',
      title: 'Verified Profiles',
      description: 'All profiles are verified to ensure safety and authenticity',
    },
    {
      icon: '🔒',
      title: 'Secure & Private',
      description: 'Your data is encrypted and kept completely private',
    },
    {
      icon: '💬',
      title: 'Real-time Chat',
      description: 'Connect with potential matches instantly',
    },
    {
      icon: '🎯',
      title: 'Smart Matching',
      description: 'AI-powered algorithm to find your perfect match',
    },
    {
      icon: '📸',
      title: 'Photo Gallery',
      description: 'Share multiple photos with verified security',
    },
    {
      icon: '🌍',
      title: 'Wide Network',
      description: 'Connect with members across the country',
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: 'easeOut' },
    },
  };

  return (
    <MainLayout>
      {/* Hero Section */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
        className="min-h-screen bg-gradient-to-r from-blue-600 to-blue-800 flex items-center justify-center px-4 py-20"
      >
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
              Find Your <span className="text-yellow-300">Perfect Match</span>
            </h1>
            <p className="text-xl text-blue-100 mb-8">
              Join thousands of happy couples who found love on Sahayatra. Your journey to finding the right life partner starts here.
            </p>
            <div className="flex gap-4">
              {isAuthenticated ? (
                <>
                  <Button
                    variant="primary"
                    onClick={() => navigate('/discover')}
                    className="bg-white text-blue-600 hover:bg-blue-50"
                  >
                    Start Discovering
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => navigate('/profile')}
                    className="text-white border-white"
                  >
                    View Profile
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="primary"
                    onClick={() => navigate('/signup')}
                    className="bg-white text-blue-600 hover:bg-blue-50 px-8 py-3 text-lg"
                  >
                    Get Started
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => navigate('/login')}
                    className="text-white border-white px-8 py-3 text-lg"
                  >
                    Sign In
                  </Button>
                </>
              )}
            </div>
          </motion.div>

          {/* Right Image */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="hidden md:flex justify-center"
          >
            <motion.div
              animate={{ y: [0, -20, 0] }}
              transition={{ duration: 4, repeat: Infinity }}
              className="text-center"
            >
              <div className="text-9xl">💑</div>
              <p className="text-white mt-4 text-lg">Together, forever</p>
            </motion.div>
          </motion.div>
        </div>
      </motion.section>

      {/* Features Section */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        className="py-20 px-4 bg-white"
      >
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Why Choose Sahayatra?</h2>
            <p className="text-xl text-gray-600">
              We provide a safe, secure, and effective platform for matrimony
            </p>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            {features.map((feature, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                className="bg-gray-50 rounded-lg p-8 text-center hover:shadow-lg transition-shadow"
              >
                <div className="text-5xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* Stats Section */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        className="py-20 px-4 bg-gradient-to-r from-blue-50 to-blue-100"
      >
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
            {[
              { stat: '50K+', label: 'Active Members' },
              { stat: '10K+', label: 'Happy Matches' },
              { stat: '5K+', label: 'Success Stories' },
              { stat: '24/7', label: 'Customer Support' },
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ scale: 0.9, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="text-4xl font-bold text-blue-600 mb-2">{item.stat}</div>
                <div className="text-gray-700">{item.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* CTA Section */}
      {!isAuthenticated && (
        <motion.section
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="py-20 px-4 bg-white"
        >
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Ready to Find Your Match?</h2>
            <p className="text-xl text-gray-600 mb-8">
              Join Sahayatra today and take the first step towards a beautiful relationship.
            </p>
            <div className="flex gap-4 justify-center">
              <Button
                variant="primary"
                onClick={() => navigate('/signup')}
                className="px-8 py-3 text-lg"
              >
                Create Free Account
              </Button>
              <Button
                variant="ghost"
                onClick={() => navigate('/login')}
                className="px-8 py-3 text-lg"
              >
                Already a Member?
              </Button>
            </div>
          </div>
        </motion.section>
      )}
    </MainLayout>
  );
};

export default Home;
