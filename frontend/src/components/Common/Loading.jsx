import React from 'react';
import { motion } from 'framer-motion';

const Loading = ({ fullScreen = false, message = 'Loading...' }) => {
  const containerClass = fullScreen ? 'fixed inset-0' : '';
  const contentClass = fullScreen ? 'flex items-center justify-center' : '';

  return (
    <div className={`${containerClass} ${contentClass} p-4 bg-white bg-opacity-80 z-50`}>
      <div className="flex flex-col items-center gap-4">
        {/* Spinner */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full"
        />
        {message && <p className="text-gray-700 font-medium">{message}</p>}
      </div>
    </div>
  );
};

export default Loading;
