import { prisma } from '../index.js';

export const browseProfiles = async (req, res) => {
  try {
    const { ageMin = 18, ageMax = 60, gender, limit = 10, offset = 0 } = req.query;

    const where = {
      NOT: { id: req.userId },
    };

    if (gender) {
      where.gender = gender;
    }

    const profiles = await prisma.user.findMany({
      where,
      include: { photos: true },
      take: parseInt(limit),
      skip: parseInt(offset),
    });

    res.json({ profiles });
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
              { firstName: { contains: query, mode: 'insensitive' } },
              { lastName: { contains: query, mode: 'insensitive' } },
              { city: { contains: query, mode: 'insensitive' } },
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
      },
    });

    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    res.json(profile);
  } catch (error) {
    console.error('Get profile details error:', error);
    res.status(500).json({ error: 'Failed to fetch profile details' });
  }
};
