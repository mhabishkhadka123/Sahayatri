/**
 * Profile Controller
 * 
 * Cloudinary photo upload:
 * TODO: Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET in .env
 * Photos will be saved locally (base64 URL) if Cloudinary is not configured.
 */

import { prisma } from '../index.js';
import config from '../config/index.js';
import { uploadToCloudinary, deleteFromCloudinary } from '../utils/cloudinary.js';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const USER_PUBLIC_SELECT = {
  id: true,
  firstName: true,
  lastName: true,
  gender: true,
  dateOfBirth: true,
  bio: true,
  city: true,
  height: true,
  religion: true,
  occupation: true,
  education: true,
  isVerified: true,
  createdAt: true,
  profile: true,
  photos: true,
  // Never expose: password, refreshToken, verificationToken, role, phone (privacy)
};

/** Calculate profile completion percentage */
const calcProfileCompletion = (user) => {
  const fields = { bio: 2, city: 1, height: 1, religion: 1, occupation: 1, education: 1, phone: 1 };
  let score = 10; // Base score for having account
  let max = 10;

  for (const [field, weight] of Object.entries(fields)) {
    max += weight * 10;
    if (user[field]) score += weight * 10;
  }

  const hasPhoto = user.photos && user.photos.length > 0;
  max += 20;
  if (hasPhoto) score += 20;

  return Math.min(100, Math.round((score / max) * 100));
};

// ─── Get My Profile ────────────────────────────────────────────────────────────

export const getMyProfile = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: {
        ...USER_PUBLIC_SELECT,
        phone: true, // Include phone for own profile
        subscription: true,
        _count: {
          select: {
            sentLikes: true,
            receivedLikes: true,
            initiatedMatches: true,
            receivedMatches: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const completion = calcProfileCompletion(user);

    // Update profile completion
    if (user.profile) {
      await prisma.profile.update({
        where: { userId: req.userId },
        data: { profileCompletion: completion },
      });
    }

    return res.json({ ...user, profileCompletion: completion });
  } catch (error) {
    console.error('Get my profile error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
};

// ─── Get Profile (Public View) ────────────────────────────────────────────────

export const getProfile = async (req, res) => {
  try {
    const { userId } = req.params;

    // Don't allow viewing blocked users' profiles
    if (req.userId) {
      const block = await prisma.block.findFirst({
        where: {
          OR: [
            { blockerId: req.userId, blockedId: userId },
            { blockerId: userId, blockedId: req.userId },
          ],
        },
      });
      if (block) {
        return res.status(404).json({ error: 'Profile not found' });
      }
    }

    const user = await prisma.user.findUnique({
      where: { id: userId, isActive: true },
      select: {
        ...USER_PUBLIC_SELECT,
        _count: {
          select: {
            receivedLikes: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    // Track profile view (if logged in and viewing someone else)
    if (req.userId && req.userId !== userId) {
      await prisma.profileView.upsert({
        where: {
          viewedProfileId_viewerId: {
            viewedProfileId: userId,
            viewerId: req.userId,
          },
        },
        update: { viewedAt: new Date() },
        create: {
          viewedProfileId: userId,
          viewerId: req.userId,
        },
      });

      // Increment view count
      await prisma.profile.updateMany({
        where: { userId },
        data: { profileViewCount: { increment: 1 } },
      });

      // Notify profile owner (non-blocking)
      createNotification({
        userId,
        type: 'view',
        fromUserId: req.userId,
        message: 'Someone viewed your profile',
      }).catch(console.error);
    }

    return res.json(user);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
};

// ─── Update Profile ───────────────────────────────────────────────────────────

export const updateProfile = async (req, res) => {
  try {
    const { firstName, lastName, bio, city, height, religion, occupation, education, phone } = req.body;

    const user = await prisma.user.update({
      where: { id: req.userId },
      data: {
        ...(firstName !== undefined && { firstName }),
        ...(lastName !== undefined && { lastName }),
        ...(bio !== undefined && { bio }),
        ...(city !== undefined && { city }),
        ...(height !== undefined && { height }),
        ...(religion !== undefined && { religion }),
        ...(occupation !== undefined && { occupation }),
        ...(education !== undefined && { education }),
        ...(phone !== undefined && { phone }),
      },
      select: {
        ...USER_PUBLIC_SELECT,
        phone: true,
        subscription: true,
      },
    });

    // Recalculate and save completion
    const completion = calcProfileCompletion(user);
    await prisma.profile.updateMany({
      where: { userId: req.userId },
      data: { profileCompletion: completion },
    });

    // Log activity
    await prisma.activityLog.create({
      data: { userId: req.userId, type: 'profile_update' },
    });

    res.json({ user: { ...user, profileCompletion: completion } });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
};

// ─── Upload Photo ─────────────────────────────────────────────────────────────

export const uploadPhoto = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Photo file is required' });
    }

    // Check photo limit (max 6 photos)
    const photoCount = await prisma.photo.count({
      where: { userId: req.userId },
    });

    if (photoCount >= 6) {
      return res.status(400).json({ error: 'Maximum 6 photos allowed. Delete a photo first.' });
    }

    let photoUrl;
    let cloudinaryId;

    if (config.cloudinary.isConfigured) {
      // Upload to Cloudinary
      const result = await uploadToCloudinary(req.file.buffer, {
        folder: `sahayatra/users/${req.userId}`,
        transformation: [
          { width: 800, height: 800, crop: 'limit' },
          { quality: 'auto', fetch_format: 'auto' },
        ],
      });
      photoUrl = result.secure_url;
      cloudinaryId = result.public_id;
    } else {
      // Development fallback: use a data URL
      // TODO: Configure Cloudinary in .env for production
      console.info('☁️  Cloudinary not configured. Using local file buffer as URL placeholder.');
      photoUrl = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
      cloudinaryId = null;
    }

    const isPrimary = photoCount === 0; // First photo is primary

    const photo = await prisma.photo.create({
      data: {
        userId: req.userId,
        url: photoUrl,
        cloudinaryId,
        isPrimary,
      },
    });

    // Update profile completion
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { bio: true, city: true, height: true, religion: true, occupation: true, education: true, phone: true, photos: true },
    });
    const completion = calcProfileCompletion(user);
    await prisma.profile.updateMany({
      where: { userId: req.userId },
      data: { profileCompletion: completion },
    });

    // Log activity
    await prisma.activityLog.create({
      data: { userId: req.userId, type: 'photo_upload' },
    });

    res.status(201).json({ photo, profileCompletion: completion });
  } catch (error) {
    console.error('Upload photo error:', error);
    res.status(500).json({ error: 'Failed to upload photo' });
  }
};

// ─── Set Primary Photo ────────────────────────────────────────────────────────

export const setPrimaryPhoto = async (req, res) => {
  try {
    const { photoId } = req.params;

    const photo = await prisma.photo.findUnique({ where: { id: photoId } });
    if (!photo || photo.userId !== req.userId) {
      return res.status(404).json({ error: 'Photo not found' });
    }

    await prisma.$transaction([
      prisma.photo.updateMany({
        where: { userId: req.userId },
        data: { isPrimary: false },
      }),
      prisma.photo.update({
        where: { id: photoId },
        data: { isPrimary: true },
      }),
    ]);

    res.json({ message: 'Primary photo updated' });
  } catch (error) {
    console.error('Set primary photo error:', error);
    res.status(500).json({ error: 'Failed to update primary photo' });
  }
};

// ─── Delete Photo ─────────────────────────────────────────────────────────────

export const deletePhoto = async (req, res) => {
  try {
    const { photoId } = req.params;

    const photo = await prisma.photo.findUnique({ where: { id: photoId } });

    if (!photo) {
      return res.status(404).json({ error: 'Photo not found' });
    }

    if (photo.userId !== req.userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Delete from Cloudinary
    if (photo.cloudinaryId && config.cloudinary.isConfigured) {
      await deleteFromCloudinary(photo.cloudinaryId);
    }

    await prisma.photo.delete({ where: { id: photoId } });

    // If deleted photo was primary, set next as primary
    if (photo.isPrimary) {
      const nextPhoto = await prisma.photo.findFirst({
        where: { userId: req.userId },
        orderBy: { createdAt: 'asc' },
      });
      if (nextPhoto) {
        await prisma.photo.update({
          where: { id: nextPhoto.id },
          data: { isPrimary: true },
        });
      }
    }

    res.json({ message: 'Photo deleted' });
  } catch (error) {
    console.error('Delete photo error:', error);
    res.status(500).json({ error: 'Failed to delete photo' });
  }
};

// ─── Get Photos ───────────────────────────────────────────────────────────────

export const getPhotos = async (req, res) => {
  try {
    const photos = await prisma.photo.findMany({
      where: { userId: req.userId },
      orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }],
    });
    res.json({ photos });
  } catch (error) {
    console.error('Get photos error:', error);
    res.status(500).json({ error: 'Failed to fetch photos' });
  }
};

// ─── Who Viewed Me ────────────────────────────────────────────────────────────

export const getProfileViews = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const [views, total] = await Promise.all([
      prisma.profileView.findMany({
        where: { viewedProfileId: req.userId },
        include: {
          viewer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              city: true,
              dateOfBirth: true,
              photos: { where: { isPrimary: true }, take: 1 },
            },
          },
        },
        orderBy: { viewedAt: 'desc' },
        take: parseInt(limit),
        skip: parseInt(skip),
      }),
      prisma.profileView.count({ where: { viewedProfileId: req.userId } }),
    ]);

    res.json({
      views,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Get profile views error:', error);
    res.status(500).json({ error: 'Failed to fetch profile views' });
  }
};

// ─── Favorites ────────────────────────────────────────────────────────────────

export const toggleFavorite = async (req, res) => {
  try {
    const { userId: targetId } = req.params;

    if (req.userId === targetId) {
      return res.status(400).json({ error: 'Cannot favorite yourself' });
    }

    const existing = await prisma.favorite.findUnique({
      where: { ownerId_favoritedId: { ownerId: req.userId, favoritedId: targetId } },
    });

    if (existing) {
      await prisma.favorite.delete({ where: { id: existing.id } });
      return res.json({ favorited: false, message: 'Removed from favorites' });
    }

    await prisma.favorite.create({
      data: { ownerId: req.userId, favoritedId: targetId },
    });

    res.json({ favorited: true, message: 'Added to favorites' });
  } catch (error) {
    console.error('Toggle favorite error:', error);
    res.status(500).json({ error: 'Failed to update favorites' });
  }
};

export const getFavorites = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const [favorites, total] = await Promise.all([
      prisma.favorite.findMany({
        where: { ownerId: req.userId },
        include: {
          favorited: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              city: true,
              dateOfBirth: true,
              religion: true,
              occupation: true,
              isVerified: true,
              photos: { where: { isPrimary: true }, take: 1 },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: parseInt(limit),
        skip: parseInt(skip),
      }),
      prisma.favorite.count({ where: { ownerId: req.userId } }),
    ]);

    res.json({
      favorites: favorites.map((f) => f.favorited),
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Get favorites error:', error);
    res.status(500).json({ error: 'Failed to fetch favorites' });
  }
};

// ─── Block User ───────────────────────────────────────────────────────────────

export const blockUser = async (req, res) => {
  try {
    const { userId: targetId } = req.params;

    if (req.userId === targetId) {
      return res.status(400).json({ error: 'Cannot block yourself' });
    }

    const existing = await prisma.block.findUnique({
      where: { blockerId_blockedId: { blockerId: req.userId, blockedId: targetId } },
    });

    if (existing) {
      await prisma.block.delete({ where: { id: existing.id } });
      return res.json({ blocked: false, message: 'User unblocked' });
    }

    await prisma.$transaction([
      prisma.block.create({
        data: { blockerId: req.userId, blockedId: targetId },
      }),
      // Remove any existing likes/matches between them
      prisma.like.deleteMany({
        where: {
          OR: [
            { likedById: req.userId, likedByOtherId: targetId },
            { likedById: targetId, likedByOtherId: req.userId },
          ],
        },
      }),
      prisma.match.deleteMany({
        where: {
          OR: [
            { userOneId: req.userId, userTwoId: targetId },
            { userOneId: targetId, userTwoId: req.userId },
          ],
        },
      }),
    ]);

    res.json({ blocked: true, message: 'User blocked' });
  } catch (error) {
    console.error('Block user error:', error);
    res.status(500).json({ error: 'Failed to block user' });
  }
};

export const getBlockedUsers = async (req, res) => {
  try {
    const blocked = await prisma.block.findMany({
      where: { blockerId: req.userId },
      include: {
        blocked: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            photos: { where: { isPrimary: true }, take: 1 },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ blocked: blocked.map((b) => b.blocked) });
  } catch (error) {
    console.error('Get blocked users error:', error);
    res.status(500).json({ error: 'Failed to fetch blocked users' });
  }
};

// ─── Report User ──────────────────────────────────────────────────────────────

export const reportUser = async (req, res) => {
  try {
    const { userId: targetId } = req.params;
    const { reason, details } = req.body;

    if (req.userId === targetId) {
      return res.status(400).json({ error: 'Cannot report yourself' });
    }

    // Check if already reported (prevent spam)
    const existing = await prisma.report.findFirst({
      where: { reporterId: req.userId, reportedId: targetId, resolved: false },
    });

    if (existing) {
      return res.status(400).json({ error: 'You have already reported this user' });
    }

    await prisma.report.create({
      data: {
        reporterId: req.userId,
        reportedId: targetId,
        reason,
        details,
      },
    });

    res.json({ message: 'Report submitted. Our team will review it shortly.' });
  } catch (error) {
    console.error('Report user error:', error);
    res.status(500).json({ error: 'Failed to submit report' });
  }
};

// ─── Helper: Create Notification ─────────────────────────────────────────────

async function createNotification({ userId, type, fromUserId, message, data }) {
  try {
    return await prisma.notification.create({
      data: { userId, type, fromUserId, message, data },
    });
  } catch (error) {
    console.error('Create notification error:', error);
  }
}
