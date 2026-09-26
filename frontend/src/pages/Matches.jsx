import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import MainLayout from '../components/Layout/MainLayout';
import { useAuthStore } from '../context/store';
import Card from '../components/Common/Card';
import { matchService, kundaliService } from '../services';

const Matches = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [matches, setMatches] = useState([]);
  const [compatibilityMap, setCompatibilityMap] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadMatches();
  }, []);

  const loadMatches = async () => {
    setIsLoading(true);
    try {
      const response = await matchService.getMatches();
      const matchList = response.data.matches || [];
      setMatches(matchList);

      // Load compatibility for each match
      for (const match of matchList) {
        const otherUser = match.userOneId === user?.id ? match.userTwo : match.userOne;
        if (otherUser?.id) {
          kundaliService.getCompatibility(otherUser.id)
            .then(res => {
              if (res.data.compatibility) {
                setCompatibilityMap(prev => ({ ...prev, [otherUser.id]: res.data.compatibility }));
              }
            })
            .catch(() => {});
        }
      }
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
              {matches.map((match, index) => {
                const otherUser = match.userOneId === user?.id ? match.userTwo : match.userOne;
                if (!otherUser) return null;
                const compatibility = compatibilityMap[otherUser.id];
                const age = otherUser.dateOfBirth
                  ? Math.floor((new Date() - new Date(otherUser.dateOfBirth)) / (365.25 * 24 * 60 * 60 * 1000))
                  : null;
                return (
                  <motion.div
                    key={match.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card hover>
                      <div className="mb-4">
                        <div className="w-full aspect-square bg-gray-200 rounded-lg mb-4 flex items-center justify-center text-4xl overflow-hidden">
                          {otherUser.photos?.[0]?.url ? (
                            <img src={otherUser.photos[0].url} alt={otherUser.firstName} className="w-full h-full object-cover" />
                          ) : (
                            '👤'
                          )}
                        </div>
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-1">
                        {otherUser.firstName}{age ? `, ${age}` : ''}
                      </h3>
                      <p className="text-gray-600 mb-2">
                        {otherUser.profile?.district
                          ? `📍 ${otherUser.profile.district}${otherUser.profile.region ? `, ${otherUser.profile.region}` : ''}`
                          : otherUser.city || 'Location not set'}
                      </p>
                      {compatibility && (
                        <div className="mb-3 px-3 py-2 bg-purple-50 rounded-lg">
                          <p className="text-sm text-purple-700 font-medium">✨ Kundali: {compatibility.score}% — {compatibility.level}</p>
                        </div>
                      )}
                      <p className="text-sm text-gray-500 mb-4 line-clamp-2">{otherUser.bio || 'No bio'}</p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => navigate('/messages')}
                          className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
                        >
                          Message
                        </button>
                        <button
                          onClick={() => navigate(`/user/${otherUser.id}`)}
                          className="flex-1 px-3 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition font-medium"
                        >
                          View Profile
                        </button>
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default Matches;
