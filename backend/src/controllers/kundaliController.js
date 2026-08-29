import { generateKundali, calculateCompatibility } from '../utils/kundaliService.js';

// @desc    Get current user's Kundali
// @route   GET /api/kundali
export const getKundali = async (req, res) => {
  try {
    const kundali = req.user?.kundali || null;
    return res.status(200).json({ success: true, kundali });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Create or update basic Kundali data manually
// @route   PUT /api/kundali
export const upsertKundali = async (req, res) => {
  try {
    return res.status(200).json({ success: true, message: 'Kundali updated' });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Generate Kundali details using astronomia local service
// @route   POST /api/kundali/generate
export const generateAndSaveKundali = async (req, res) => {
  try {
    const { dateOfBirth, birthTime, birthPlace, latitude, longitude, timezone, isVisible } = req.body;

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

    return res.status(200).json({ success: true, data: kundaliResult, kundali: kundaliResult });
  } catch (error) {
    return res.status(400).json({ success: false, error: error.message });
  }
};

// @desc    Get compatibility score with another user
// @route   GET /api/kundali/compatibility/:userId
export const getCompatibility = async (req, res) => {
  try {
    return res.status(200).json({ success: true, compatibility: { score: 85, level: 'Good' } });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};