import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import MainLayout from '../components/Layout/MainLayout';
import { useDiscoveryStore } from '../context/store';
import { discoveryService } from '../services';
import Button from '../components/Button/Button';
import Loading from '../components/Common/Loading';

const Discover = () => {
  const { profiles, currentProfileIndex, setProfiles, setCurrentIndex, isLoading, setLoading } = useDiscoveryStore();
  const [filters, setFilters] = useState({ ageMin: 18, ageMax: 60, gender: '' });
  const [noMoreProfiles, setNoMoreProfiles] = useState(false);

  useEffect(() => {
    loadProfiles();
  }, [filters]);

  const loadProfiles = async () => {
    setLoading(true);
    try {
      const response = await discoveryService.browseProfiles(filters);
      setProfiles(response.data.profiles || []);
      setNoMoreProfiles(response.data.profiles.length === 0);
    } catch (error) {
      console.error('Error loading profiles:', error);
      setNoMoreProfiles(true);
    } finally {
      setLoading(false);
    }
  };

  const currentProfile = profiles[currentProfileIndex];

  const handleLike = async () => {
    if (!currentProfile) return;
    try {
      // Call API to like the profile
      setCurrentIndex(currentProfileIndex + 1);
    } catch (error) {
      console.error('Error liking profile:', error);
    }
  };

  const handleSkip = () => {
    if (currentProfileIndex < profiles.length - 1) {
      setCurrentIndex(currentProfileIndex + 1);
    } else {
      setNoMoreProfiles(true);
    }
  };

  if (isLoading && profiles.length === 0) {
    return <Loading fullScreen />;
  }

  return (
    <MainLayout>
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Discover Matches</h1>
            
            {/* Filters */}
            <div className="bg-white rounded-lg shadow p-6 mb-8">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Min Age
                  </label>
                  <input
                    type="number"
                    min="18"
                    max="100"
                    value={filters.ageMin}
                    onChange={(e) => setFilters({ ...filters, ageMin: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max Age
                  </label>
                  <input
                    type="number"
                    min="18"
                    max="100"
                    value={filters.ageMax}
                    onChange={(e) => setFilters({ ...filters, ageMax: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Gender
                  </label>
                  <select
                    value={filters.gender}
                    onChange={(e) => setFilters({ ...filters, gender: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <Button variant="primary" fullWidth onClick={loadProfiles}>
                    Search
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Profile Card */}
          {noMoreProfiles ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-white rounded-lg shadow p-12 text-center"
            >
              <div className="text-5xl mb-4">🎉</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">No More Profiles</h2>
              <p className="text-gray-600 mb-6">
                You've seen all available profiles. Check back later for new matches!
              </p>
              <Button variant="primary" onClick={() => loadProfiles()}>
                Refresh Profiles
              </Button>
            </motion.div>
          ) : currentProfile ? (
            <AnimatePresence mode="wait">
              <motion.div
                key={currentProfile.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3 }}
                className="bg-white rounded-lg shadow overflow-hidden mb-8"
              >
                {/* Image */}
                <div className="relative h-96 bg-gray-200">
                  {currentProfile.photos?.[0] ? (
                    <img
                      src={currentProfile.photos[0]}
                      alt={currentProfile.firstName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl">
                      👤
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="p-8">
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">
                    {currentProfile.firstName}, {currentProfile.age}
                  </h2>
                  <p className="text-gray-600 mb-4">
                    {currentProfile.city || 'Location not specified'}
                  </p>
                  <p className="text-gray-700 mb-6">{currentProfile.bio || 'No bio provided'}</p>

                  {/* Actions */}
                  <div className="flex gap-4">
                    <Button
                      variant="ghost"
                      fullWidth
                      onClick={handleSkip}
                      className="text-gray-600 border-gray-300"
                    >
                      Pass
                    </Button>
                    <Button
                      variant="primary"
                      fullWidth
                      onClick={handleLike}
                    >
                      ❤️ Like
                    </Button>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-white rounded-lg shadow p-12 text-center"
            >
              <p className="text-gray-600">No profiles available</p>
            </motion.div>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default Discover;
