import { prisma } from '../index.js';
import { generateKundali, calculateCompatibility } from '../utils/kundaliService.js';

// @desc    Get current user's Kundali
// @route   GET /api/kundali
export const getKundali = async (req, res) => {
  try {
    const kundali = await prisma.kundali.findUnique({
      where: { userId: req.userId },
    });

    return res.status(200).json({ success: true, kundali: kundali || null });
  } catch (error) {
    console.error('Get kundali error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Create or update basic Kundali data manually
// @route   PUT /api/kundali
export const upsertKundali = async (req, res) => {
  try {
    const { birthTime, birthPlace, latitude, longitude, timezone, zodiacSign, nakshatra, moonSign, isVisible } = req.body;

    const kundali = await prisma.kundali.upsert({
      where: { userId: req.userId },
      create: {
        userId: req.userId,
        birthTime: birthTime || null,
        birthPlace: birthPlace || null,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        timezone: timezone || null,
        zodiacSign: zodiacSign || null,
        nakshatra: nakshatra || null,
        moonSign: moonSign || null,
        isVisible: isVisible !== false,
      },
      update: {
        birthTime: birthTime !== undefined ? birthTime : undefined,
        birthPlace: birthPlace !== undefined ? birthPlace : undefined,
        latitude: latitude !== undefined ? (latitude ? parseFloat(latitude) : null) : undefined,
        longitude: longitude !== undefined ? (longitude ? parseFloat(longitude) : null) : undefined,
        timezone: timezone !== undefined ? timezone : undefined,
        zodiacSign: zodiacSign !== undefined ? zodiacSign : undefined,
        nakshatra: nakshatra !== undefined ? nakshatra : undefined,
        moonSign: moonSign !== undefined ? moonSign : undefined,
        isVisible: isVisible !== undefined ? isVisible : undefined,
      },
    });

    return res.status(200).json({ success: true, kundali, message: 'Kundali updated' });
  } catch (error) {
    console.error('Upsert kundali error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Generate Kundali details using astronomia local service
// @route   POST /api/kundali/generate
export const generateAndSaveKundali = async (req, res) => {
  try {
    const { dateOfBirth, birthTime, birthPlace, latitude, longitude, timezone, isVisible, save } = req.body;

    const calculated = generateKundali({
      dateOfBirth,
      birthTime,
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      timezone: timezone || 'Asia/Kathmandu',
    });

    const kundaliResult = {
      dateOfBirth,
      birthTime,
      birthPlace,
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      timezone: timezone || 'Asia/Kathmandu',
      zodiacSign: calculated.zodiacSign,
      moonSign: calculated.moonSign,
      nakshatra: calculated.nakshatra,
      isVisible: isVisible !== false,
    };

    // Save to database if requested
    if (save) {
      const savedKundali = await prisma.kundali.upsert({
        where: { userId: req.userId },
        create: {
          userId: req.userId,
          ...kundaliResult,
        },
        update: kundaliResult,
      });
      return res.status(200).json({ success: true, kundali: savedKundali, calculated: kundaliResult });
    }

    return res.status(200).json({ success: true, calculated: kundaliResult, kundali: kundaliResult });
  } catch (error) {
    console.error('Generate kundali error:', error);
    return res.status(400).json({ success: false, error: error.message });
  }
};

// @desc    Get compatibility score with another user
// @route   GET /api/kundali/compatibility/:userId
export const getCompatibility = async (req, res) => {
  try {
    const { userId: otherUserId } = req.params;

    if (req.userId === otherUserId) {
      return res.status(400).json({ success: false, error: 'Cannot compare a profile with itself' });
    }

    const users = await prisma.user.findMany({
      where: { id: { in: [req.userId, otherUserId] } },
      select: {
        id: true,
        gender: true,
        dateOfBirth: true,
        kundali: {
          select: {
            birthTime: true,
            birthPlace: true,
            latitude: true,
            longitude: true,
            timezone: true,
            isVisible: true,
          },
        },
      },
    });
    const userById = new Map(users.map((user) => [user.id, user]));
    const currentUser = userById.get(req.userId);
    const otherUser = userById.get(otherUserId);

    if (!otherUser) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    if (!currentUser?.kundali || !otherUser.kundali) {
      return res.status(422).json({ success: false, error: 'Birth details are incomplete for compatibility calculation' });
    }
    if (otherUser.kundali.isVisible === false) {
      return res.status(403).json({ success: false, error: 'This user has hidden their Kundali details' });
    }

    const getBirthChart = (user) => {
      const { kundali } = user;
      if (!user.dateOfBirth || !kundali.birthTime || kundali.latitude == null || kundali.longitude == null) {
        throw new Error('Date of birth, birth time, and birth place coordinates are required');
      }

      const calculatedChart = generateKundali({
        dateOfBirth: user.dateOfBirth.toISOString().slice(0, 10),
        birthTime: kundali.birthTime,
        latitude: kundali.latitude,
        longitude: kundali.longitude,
        timezone: kundali.timezone || 'Asia/Kathmandu',
      });

      return {
        ...calculatedChart,
        birthTime: kundali.birthTime,
      };
    };

    let chartA;
    let chartB;
    try {
      chartA = getBirthChart(currentUser);
      chartB = getBirthChart(otherUser);
    } catch (error) {
      return res.status(422).json({ success: false, error: error.message });
    }

    const compatibility = calculateCompatibility(
      chartA,
      chartB,
      currentUser.gender,
      otherUser.gender
    );

    return res.status(200).json({ success: true, compatibility });
  } catch (error) {
    console.error('Get compatibility error:', error);
    return res.status(500).json({ success: false, error: 'Failed to calculate compatibility' });
  }
};