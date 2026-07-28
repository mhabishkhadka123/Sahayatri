import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import MainLayout from '../components/Layout/MainLayout';
import { useAuthStore } from '../context/store';
import Card from '../components/Common/Card';

const Matches = () => {
  const { user } = useAuthStore();
  const [matches, setMatches] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadMatches();
  }, []);

  const loadMatches = async () => {
    setIsLoading(true);
    try {
      // TODO: Implement API call to fetch matches
      // const response = await matchService.getMatches();
      // setMatches(response.data.matches || []);
      setMatches([]);
    } catch (error) {
      console.error('Error loading matches:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-6xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-4xl font-bold text-gray-900 mb-2">My Matches</h1>
            <p className="text-gray-600">
              {matches.length} mutual matches found
            </p>
          </motion.div>

          {matches.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-white rounded-lg shadow p-12 text-center"
            >
              <div className="text-5xl mb-4">💑</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">No Matches Yet</h2>
              <p className="text-gray-600 mb-6">
                Start exploring profiles to find your perfect match!
              </p>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ staggerChildren: 0.1 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-6"
            >
              {matches.map((match, index) => (
                <motion.div
                  key={match.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card hover>
                    <div className="mb-4">
                      <div className="w-full aspect-square bg-gray-200 rounded-lg mb-4 flex items-center justify-center text-4xl overflow-hidden">
                        {match.photo ? (
                          <img src={match.photo} alt={match.firstName} className="w-full h-full object-cover" />
                        ) : (
                          '👤'
                        )}
                      </div>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-1">
                      {match.firstName}, {match.age}
                    </h3>
                    <p className="text-gray-600 mb-2">{match.city}</p>
                    <p className="text-sm text-gray-500 mb-4 line-clamp-2">{match.bio}</p>
                    <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                      View Profile
                    </button>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default Matches;
