import { verifyToken } from '../utils/jwt.js';
import { prisma } from '../index.js';

/**
 * Authenticate JWT bearer token.
 * Sets req.userId, req.userRole on success.
 */
export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No authentication token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    if (!decoded) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    // Verify user still exists and is active
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, role: true, isActive: true },
    });

    if (!user) {
      return res.status(401).json({ error: 'User no longer exists' });
    }

    if (!user.isActive) {
      return res.status(403).json({ error: 'Account is deactivated' });
    }

    req.userId = user.id;
    req.userRole = user.role;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(401).json({ error: 'Authentication failed' });
  }
};

/**
 * Role-based authorization middleware.
 * Use after authenticate().
 * 
 * @param {...string} roles - Allowed roles (e.g., 'ADMIN', 'USER')
 * @example router.get('/admin', authenticate, authorize('ADMIN'), handler)
 */
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.userRole) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    if (!roles.includes(req.userRole)) {
      return res.status(403).json({
        error: `Access denied. Required role: ${roles.join(' or ')}`,
      });
    }

    next();
  };
};

/**
 * Shorthand middleware for admin-only routes.
 */
export const requireAdmin = [authenticate, authorize('ADMIN')];

/**
 * Optional auth — sets req.userId if token is present but doesn't block.
 * Useful for public routes that enhance behavior when logged in.
 */
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    if (decoded) {
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { id: true, role: true, isActive: true },
      });

      if (user && user.isActive) {
        req.userId = user.id;
        req.userRole = user.role;
      }
    }

    next();
  } catch {
    next();
  }
};
