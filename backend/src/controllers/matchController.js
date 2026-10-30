import { prisma } from '../index.js';
import { sanitizeKundaliForPublic, sanitizeProfileForPublic } from '../utils/kundaliSanitize.js';

const sanitizeMatchUser = (user) => ({
  ...user,
  profile: sanitizeProfileForPublic(user.profile),
  kundali: sanitizeKundaliForPublic(user.kundali),
});

const sanitizeMatch = (match, userId) => ({
  ...match,
  userOne: match.userOneId === userId ? match.userOne : sanitizeMatchUser(match.userOne),
  userTwo: match.userTwoId === userId ? match.userTwo : sanitizeMatchUser(match.userTwo),
});

export const likeProfile = async (req, res) => {
  try {
    const { userId: likedUserId } = req.params;

    if (req.userId === likedUserId) {
      return res.status(400).json({ error: 'Cannot like your own profile' });
    }

    const likedUser = await prisma.user.findUnique({
      where: { id: likedUserId },
      select: { id: true, isActive: true },
    });
    if (!likedUser || !likedUser.isActive) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    const result = await prisma.$transaction(async (transaction) => {
      await transaction.like.create({
        data: {
          likedById: req.userId,
          likedByOtherId: likedUserId,
        },
      });

      const mutualLike = await transaction.like.findUnique({
        where: {
          likedById_likedByOtherId: {
            likedById: likedUserId,
            likedByOtherId: req.userId,
          },
        },
      });

      if (!mutualLike) return { matched: false };

      const userOneId = req.userId < likedUserId ? req.userId : likedUserId;
      const userTwoId = req.userId < likedUserId ? likedUserId : req.userId;
      await transaction.match.upsert({
        where: { userOneId_userTwoId: { userOneId, userTwoId } },
        create: { userOneId, userTwoId, status: 'matched' },
        update: { status: 'matched' },
      });

      return { matched: true };
    });

    return res.json({ message: 'Profile liked', ...result });
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Already liked this profile' });
    }
    console.error('Like profile error:', error);
    res.status(500).json({ error: 'Failed to like profile' });
  }
};

export const skipProfile = async (req, res) => {
  try {
    const { userId: skippedUserId } = req.params;

    if (req.userId === skippedUserId) {
      return res.status(400).json({ error: 'Cannot pass your own profile' });
    }

    const skippedUser = await prisma.user.findUnique({
      where: { id: skippedUserId },
      select: { id: true, isActive: true },
    });
    if (!skippedUser || !skippedUser.isActive) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    await prisma.profileSkip.upsert({
      where: {
        skippedById_skippedUserId: {
          skippedById: req.userId,
          skippedUserId,
        },
      },
      create: { skippedById: req.userId, skippedUserId },
      update: {},
    });

    return res.json({ message: 'Profile passed' });
  } catch (error) {
    console.error('Skip profile error:', error);
    return res.status(500).json({ error: 'Failed to pass profile' });
  }
};

export const getMatches = async (req, res) => {
  try {
    const matches = await prisma.match.findMany({
      where: {
        OR: [
          { userOneId: req.userId },
          { userTwoId: req.userId },
        ],
        status: 'matched',
      },
      include: {
        userOne: { include: { photos: true, profile: true, kundali: true } },
        userTwo: { include: { photos: true, profile: true, kundali: true } },
      },
    });

    res.json({ matches: matches.map((m) => sanitizeMatch(m, req.userId)) });
  } catch (error) {
    console.error('Get matches error:', error);
    res.status(500).json({ error: 'Failed to fetch matches' });
  }
};

export const getMatchDetails = async (req, res) => {
  try {
    const { matchId } = req.params;

    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        userOne: { include: { photos: true, profile: true, kundali: true } },
        userTwo: { include: { photos: true, profile: true, kundali: true } },
      },
    });

    if (!match) {
      return res.status(404).json({ error: 'Match not found' });
    }

    res.json(match);
  } catch (error) {
    console.error('Get match details error:', error);
    res.status(500).json({ error: 'Failed to fetch match details' });
  }
};

export const unmatch = async (req, res) => {
  try {
    const { userId: otherUserId } = req.params;

    await prisma.match.deleteMany({
      where: {
        OR: [
          { userOneId: req.userId, userTwoId: otherUserId },
          { userOneId: otherUserId, userTwoId: req.userId },
        ],
      },
    });

    res.json({ message: 'Unmatched successfully' });
  } catch (error) {
    console.error('Unmatch error:', error);
    res.status(500).json({ error: 'Failed to unmatch' });
  }
};
