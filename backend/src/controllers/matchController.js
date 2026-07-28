import { prisma } from '../index.js';

export const likeProfile = async (req, res) => {
  try {
    const { userId: likedUserId } = req.params;

    if (req.userId === likedUserId) {
      return res.status(400).json({ error: 'Cannot like your own profile' });
    }

    const existingLike = await prisma.like.findUnique({
      where: {
        likedById_likedByOtherId: {
          likedById: req.userId,
          likedByOtherId: likedUserId,
        },
      },
    });

    if (existingLike) {
      return res.status(400).json({ error: 'Already liked this profile' });
    }

    await prisma.like.create({
      data: {
        likedById: req.userId,
        likedByOtherId: likedUserId,
      },
    });

    // Check for mutual like
    const mutualLike = await prisma.like.findUnique({
      where: {
        likedById_likedByOtherId: {
          likedById: likedUserId,
          likedByOtherId: req.userId,
        },
      },
    });

    if (mutualLike) {
      // Create match
      const existingMatch = await prisma.match.findUnique({
        where: {
          userOneId_userTwoId: {
            userOneId: req.userId < likedUserId ? req.userId : likedUserId,
            userTwoId: req.userId < likedUserId ? likedUserId : req.userId,
          },
        },
      });

      if (!existingMatch) {
        await prisma.match.create({
          data: {
            userOneId: req.userId < likedUserId ? req.userId : likedUserId,
            userTwoId: req.userId < likedUserId ? likedUserId : req.userId,
            status: 'matched',
          },
        });
      }
    }

    res.json({ message: 'Profile liked' });
  } catch (error) {
    console.error('Like profile error:', error);
    res.status(500).json({ error: 'Failed to like profile' });
  }
};

export const skipProfile = async (req, res) => {
  try {
    const { userId: skippedUserId } = req.params;
    // Just track the skip without creating anything
    res.json({ message: 'Profile skipped' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to skip profile' });
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
        userOne: { include: { photos: true } },
        userTwo: { include: { photos: true } },
      },
    });

    res.json({ matches });
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
        userOne: { include: { photos: true } },
        userTwo: { include: { photos: true } },
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
