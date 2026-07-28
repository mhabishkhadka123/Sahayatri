import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { prisma } from '../index.js';
import { generateToken } from '../utils/jwt.js';
import config from '../config/index.js';
import { sendEmail } from '../utils/email.js';

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Fields to always exclude from user responses */
const USER_SELECT = {
  id: true,
  email: true,
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
  isActive: true,
  role: true,
  createdAt: true,
  updatedAt: true,
};

/** Build profile completion percentage based on filled fields */
const calcProfileCompletion = (user) => {
  const fields = [
    'firstName', 'lastName', 'bio', 'city', 'height',
    'religion', 'occupation', 'education', 'phone',
  ];
  const filled = fields.filter((f) => user[f]).length;
  const hasPhoto = user.photos && user.photos.length > 0;
  const photoScore = hasPhoto ? 1 : 0;
  return Math.round(((filled + photoScore) / (fields.length + 1)) * 100);
};

// ─── Signup ──────────────────────────────────────────────────────────────────

export const signup = async (req, res) => {
  try {
    const { firstName, lastName, email, password, gender, dateOfBirth } = req.body;
    const normalizedEmail = email.toLowerCase().trim();

    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const tokenExpiry = new Date(Date.now() + config.emailVerificationExpiry);

    const user = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email: normalizedEmail,
        password: hashedPassword,
        gender,
        dateOfBirth: new Date(dateOfBirth),
        profile: { create: { profileCompletion: 20 } },
        subscription: { create: { plan: 'free' } },
        emailVerificationTokens: {
          create: {
            token: verificationToken,
            expiresAt: tokenExpiry,
          },
        },
      },
      select: {
        ...USER_SELECT,
        profile: true,
        photos: true,
      },
    });

    if (config.email.isConfigured) {
      sendEmail({
        to: normalizedEmail,
        subject: 'Verify your Sahayatra account',
        html: `
          <h2>Welcome to Sahayatra, ${firstName}!</h2>
          <p>Please verify your email by clicking the link below:</p>
          <a href="${config.appUrl}/verify-email?token=${verificationToken}">Verify Email</a>
          <p>This link expires in 24 hours.</p>
        `,
      }).catch((err) => console.error('Email send error:', err));
    }

    const { authToken, refreshToken } = generateToken(user.id);

    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken },
    });

    await prisma.activityLog.create({
      data: { userId: user.id, type: 'login' },
    });

    return res.status(201).json({
      message: 'Account created successfully. Please check your email to verify your account.',
      user,
      authToken,
      refreshToken,
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Signup failed. Please try again.' });
  }
};

// ─── Update Profile ──────────────────────────────────────────────────────────

export const updateProfile = async (req, res) => {
  try {
    const userId = req.userId; // Provided by your auth middleware
    const {
      firstName,
      lastName,
      bio,
      city,
      height,
      religion,
      occupation,
      education,
      phone,
    } = req.body;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        firstName,
        lastName,
        profile: {
          update: {
            bio,
            city,
            height: height ? parseFloat(height) : undefined,
            religion,
            occupation,
            education,
            phone,
          },
        },
      },
      include: {
        profile: true,
        photos: true,
      },
    });

    const completionScore = calcProfileCompletion(updatedUser);
    
    await prisma.profile.update({
      where: { userId },
      data: { profileCompletion: completionScore },
    });

    const finalUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        ...USER_SELECT,
        profile: true,
        photos: true,
        subscription: true,
      },
    });

    return res.json({
      message: 'Profile updated successfully',
      user: finalUser,
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
};

// ─── Login ───────────────────────────────────────────────────────────────────

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = email.toLowerCase().trim();

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: {
        profile: true,
        photos: { where: { isPrimary: true }, take: 1 },
      },
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const { authToken, refreshToken } = generateToken(user.id);

    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken },
    });

    if (user.profile) {
      await prisma.profile.update({
        where: { userId: user.id },
        data: { lastActive: new Date(), isOnline: true },
      });
    }

    await prisma.activityLog.create({
      data: { userId: user.id, type: 'login' },
    });

    const { password: _pw, refreshToken: _rt, verificationToken: _vt, ...safeUser } = user;

    return res.json({
      message: 'Login successful',
      user: safeUser,
      authToken,
      refreshToken,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed. Please try again.' });
  }
};

// ─── Get Current User ─────────────────────────────────────────────────────────

export const getCurrentUser = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: {
        ...USER_SELECT,
        profile: true,
        photos: true,
        subscription: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json(user);
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
};

// ─── Refresh Token ────────────────────────────────────────────────────────────

export const refreshToken = async (req, res) => {
  try {
    const { refreshToken: token } = req.body;
    if (!token) {
      return res.status(400).json({ error: 'Refresh token required' });
    }

    const decoded = jwt.verify(token, config.jwtSecret);
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, refreshToken: true, isActive: true },
    });

    if (!user || user.refreshToken !== token || !user.isActive) {
      return res.status(401).json({ error: 'Invalid or expired refresh token' });
    }

    const { authToken, refreshToken: newRefreshToken } = generateToken(user.id);

    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: newRefreshToken },
    });

    res.json({ authToken, refreshToken: newRefreshToken });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(401).json({ error: 'Token refresh failed' });
  }
};

// ─── Change Password ──────────────────────────────────────────────────────────

export const changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { id: true, password: true },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const isPasswordValid = await bcrypt.compare(oldPassword, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: req.userId },
      data: { password: hashedPassword, refreshToken: null },
    });

    res.json({ message: 'Password changed successfully. Please log in again.' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
};

// ─── Forgot Password ──────────────────────────────────────────────────────────

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const normalizedEmail = email.toLowerCase().trim();
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true, firstName: true, email: true },
    });

    const successMessage = 'If that email exists, a password reset link has been sent.';
    if (!user) return res.json({ message: successMessage });

    await prisma.passwordResetToken.updateMany({
      where: { userId: user.id, used: false },
      data: { used: true },
    });

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + config.passwordResetExpiry);

    await prisma.passwordResetToken.create({
      data: { userId: user.id, token, expiresAt },
    });

    if (config.email.isConfigured) {
      await sendEmail({
        to: normalizedEmail,
        subject: 'Reset your Sahayatra password',
        html: `
          <h2>Password Reset Request</h2>
          <p>Hi ${user.firstName}, click below to reset your password. This link expires in 1 hour.</p>
          <a href="${config.appUrl}/reset-password?token=${token}">Reset Password</a>
        `,
      });
    }

    res.json({ message: successMessage });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Failed to process request' });
  }
};

// ─── Reset Password ───────────────────────────────────────────────────────────

export const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    const resetRecord = await prisma.passwordResetToken.findUnique({
      where: { token },
      include: { user: { select: { id: true, isActive: true } } },
    });

    if (!resetRecord || resetRecord.used || resetRecord.expiresAt < new Date()) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetRecord.userId },
        data: { password: hashedPassword, refreshToken: null },
      }),
      prisma.passwordResetToken.update({
        where: { id: resetRecord.id },
        data: { used: true },
      }),
    ]);

    res.json({ message: 'Password reset successfully. You can now log in.' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Failed to reset password' });
  }
};

// ─── Verify Email ─────────────────────────────────────────────────────────────

export const verifyEmail = async (req, res) => {
  try {
    const { token } = req.body;
    const verificationRecord = await prisma.emailVerificationToken.findUnique({
      where: { token },
      include: { user: { select: { id: true, isVerified: true } } },
    });

    if (!verificationRecord || verificationRecord.used || verificationRecord.expiresAt < new Date()) {
      return res.status(400).json({ error: 'Invalid or expired verification token' });
    }

    await prisma.$transaction([
      prisma.user.update({
        where: { id: verificationRecord.userId },
        data: { isVerified: true },
      }),
      prisma.emailVerificationToken.update({
        where: { id: verificationRecord.id },
        data: { used: true },
      }),
    ]);

    res.json({ message: 'Email verified successfully!' });
  } catch (error) {
    console.error('Verify email error:', error);
    res.status(500).json({ error: 'Failed to verify email' });
  }
};

// ─── Resend Verification ──────────────────────────────────────────────────────

export const resendVerification = async (req, res) => {
  try {
    const { email } = req.body;
    const normalizedEmail = email.toLowerCase().trim();
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true, firstName: true, email: true, isVerified: true },
    });

    if (!user) {
      return res.json({ message: 'If that email exists, a verification link has been sent.' });
    }
    if (user.isVerified) {
      return res.status(400).json({ error: 'Email is already verified' });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + config.emailVerificationExpiry);

    await prisma.emailVerificationToken.create({
      data: { userId: user.id, token, expiresAt },
    });

    if (config.email.isConfigured) {
      await sendEmail({
        to: normalizedEmail,
        subject: 'Verify your Sahayatra account',
        html: `
          <h2>Verify Your Email</h2>
          <p>Hi ${user.firstName}, click below to verify your email:</p>
          <a href="${config.appUrl}/verify-email?token=${token}">Verify Email</a>
        `,
      });
    }

    res.json({ message: 'If that email exists, a verification link has been sent.' });
  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({ error: 'Failed to send verification email' });
  }
};

// ─── Logout ───────────────────────────────────────────────────────────────────

export const logout = async (req, res) => {
  try {
    await prisma.user.update({
      where: { id: req.userId },
      data: { refreshToken: null },
    });

    await prisma.profile.updateMany({
      where: { userId: req.userId },
      data: { isOnline: false, lastActive: new Date() },
    });

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Logout failed' });
  }
};