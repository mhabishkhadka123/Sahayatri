import { prisma } from '../index.js';
import { sanitizeKundaliForPublic, sanitizeProfileForPublic } from '../utils/kundaliSanitize.js';

const sanitizePublicUser = (user) => ({
  ...user,
  profile: sanitizeProfileForPublic(user.profile),
  kundali: sanitizeKundaliForPublic(user.kundali),
});

export const browseProfiles = async (req, res) => {
  try {
    const { ageMin = 18, ageMax = 60, gender, city, maxDistance, limit = 10, offset = 0 } = req.query;

    const today = new Date();
    const maxBirthDate = new Date(today.getFullYear() - parseInt(ageMin), today.getMonth(), today.getDate());
    const minBirthDate = new Date(today.getFullYear() - parseInt(ageMax) - 1, today.getMonth(), today.getDate() + 1);

    const where = {
      NOT: { id: req.userId },
      isActive: true,
      dateOfBirth: {
        gte: minBirthDate,
        lte: maxBirthDate,
      },
    };

    if (gender) {
      where.gender = gender;
    }

    if (city) {
      where.city = { contains: city };
    }

    let profiles = await prisma.user.findMany({
      where,
      include: { photos: true, profile: true, kundali: true },
    });

    if (maxDistance) {
      const currentUser = await prisma.user.findUnique({
        where: { id: req.userId },
        include: { profile: true }
      });
      
      const userLat = currentUser?.profile?.latitude;
      const userLon = currentUser?.profile?.longitude;
      
      if (userLat && userLon) {
        profiles = profiles.filter(p => {
          const pLat = p.profile?.latitude;
          const pLon = p.profile?.longitude;
          if (!pLat || !pLon) return false;
          
          const R = 6371; // km
          const dLat = (pLat - userLat) * Math.PI / 180;
          const dLon = (pLon - userLon) * Math.PI / 180;
          const a = 
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(userLat * Math.PI / 180) * Math.cos(pLat * Math.PI / 180) * 
            Math.sin(dLon/2) * Math.sin(dLon/2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
          const distance = R * c;
          
          return distance <= parseFloat(maxDistance);
        });
      }
    }

    const paginatedProfiles = profiles.slice(parseInt(offset), parseInt(offset) + parseInt(limit));

    res.json({ profiles: paginatedProfiles.map(sanitizePublicUser) });
  } catch (error) {
    console.error('Browse profiles error:', error);
    res.status(500).json({ error: 'Failed to fetch profiles' });
  }
};

export const searchProfiles = async (req, res) => {
  try {
    const { query, limit = 10, offset = 0 } = req.query;

    if (!query) {
      return res.status(400).json({ error: 'Search query required' });
    }

    const profiles = await prisma.user.findMany({
      where: {
        AND: [
          {
            OR: [
              { firstName: { contains: query } },
              { lastName: { contains: query } },
              { city: { contains: query } },
            ],
          },
          { NOT: { id: req.userId } },
        ],
      },
      include: { photos: true },
      take: parseInt(limit),
      skip: parseInt(offset),
    });

    res.json({ profiles });
  } catch (error) {
    console.error('Search profiles error:', error);
    res.status(500).json({ error: 'Failed to search profiles' });
  }
};

export const getProfileDetails = async (req, res) => {
  try {
    const { userId } = req.params;

    const profile = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        photos: true,
        profile: true,
        kundali: true,
      },
    });

    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    res.json(sanitizePublicUser(profile));
  } catch (error) {
    console.error('Get profile details error:', error);
    res.status(500).json({ error: 'Failed to fetch profile details' });
  }
};
