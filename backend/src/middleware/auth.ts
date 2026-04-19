import { Request, Response, NextFunction } from 'express';
import jwtUtils, { JWTPayload } from '../utils/jwt';

// Extend Express Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}

/**
 * Middleware to authenticate requests using JWT
 */
export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    const token = jwtUtils.extractTokenFromHeader(authHeader);

    if (!token) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'No token provided'
      });
    }

    const decoded = jwtUtils.verifyToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      error: 'Authentication failed',
      message: error instanceof Error ? error.message : 'Invalid token'
    });
  }
};

/**
 * Middleware to authorize based on user roles
 */
export const authorize = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'No user information found'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Access denied',
        message: `This endpoint requires one of the following roles: ${roles.join(', ')}`
      });
    }

    next();
  };
};

/**
 * Optional authentication middleware - doesn't fail if no token provided
 */
export const optionalAuth = (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    const token = jwtUtils.extractTokenFromHeader(authHeader);

    if (token && !jwtUtils.isTokenExpired(token)) {
      const decoded = jwtUtils.verifyToken(token);
      req.user = decoded;
    }
  } catch (error) {
    // Silently ignore auth errors for optional auth
    console.warn('Optional auth failed:', error instanceof Error ? error.message : 'Unknown error');
  }
  
  next();
};

/**
 * Middleware to check if user owns the resource
 */
export const requireOwnership = (getUserIdFromParams: (req: Request) => number) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'No user information found'
      });
    }

    const resourceUserId = getUserIdFromParams(req);
    const currentUserId = req.user.userId;

    // Admin can access any resource
    if (req.user.role === 'admin') {
      return next();
    }

    // User can only access their own resources
    if (resourceUserId !== currentUserId) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You can only access your own resources'
      });
    }

    next();
  };
};

export default {
  authenticate,
  authorize,
  optionalAuth,
  requireOwnership
};