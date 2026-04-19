import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { validationResult } from 'express-validator';
import jwtUtils from '../utils/jwt';
import { DatabaseConnection } from '../utils/database';

// Helper function to get database connection
const getDb = (req: Request): DatabaseConnection => {
  return req.app.locals.db();
};

/**
 * Handle user login for all roles
 */
export const login = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { email, password } = req.body;
    const db = getDb(req);

    // Find user by email
    const user = await db.get(
      'SELECT * FROM users WHERE email = ? AND is_active = 1',
      [email]
    );

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Update last login
    await db.run(
      'UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = ?',
      [user.id]
    );

    // Get user profile data
    const profile = await db.get(
      'SELECT * FROM user_profiles WHERE user_id = ?',
      [user.id]
    );

    // Get role-specific data
    let roleSpecificData = null;
    if (user.role === 'student') {
      roleSpecificData = await db.get(
        'SELECT * FROM student_profiles WHERE user_id = ?',
        [user.id]
      );
    } else if (user.role === 'counselor') {
      roleSpecificData = await db.get(
        'SELECT * FROM counselor_profiles WHERE user_id = ?',
        [user.id]
      );
    }

    // Generate JWT token
    const tokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      institutionId: user.institution_id
    };
    
    const { accessToken, refreshToken } = jwtUtils.generateTokenPair(tokenPayload);

    // Prepare user data for response
    const userData = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      institutionId: user.institution_id,
      isActive: Boolean(user.is_active),
      isVerified: Boolean(user.is_verified),
      languagePreference: user.language_preference,
      createdAt: user.created_at,
      lastLoginAt: user.last_login_at,
      profile: profile ? {
        fullName: profile.full_name,
        dateOfBirth: profile.date_of_birth,
        gender: profile.gender,
        phoneNumber: profile.phone_number,
        avatarUrl: profile.avatar_url,
        bio: profile.bio,
        ...roleSpecificData
      } : null
    };

    res.json({
      success: true,
      message: 'Login successful',
      token: accessToken,
      refreshToken,
      user: userData
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Handle user registration
 */
export const register = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const {
      email,
      username,
      password,
      fullName,
      role,
      institutionId,
      yearOfStudy,
      department,
      studentId,
      licenseNumber,
      specialization,
      experienceYears,
      qualifications,
      languages
    } = req.body;

    const db = getDb(req);

    // Check if user already exists
    const existingUser = await db.get(
      'SELECT id FROM users WHERE email = ? OR username = ?',
      [email, username]
    );

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'User already exists with this email or username'
      });
    }

    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create user
    const userResult = await db.run(
      `INSERT INTO users (
        username, email, password_hash, role, institution_id,
        is_active, is_verified, language_preference, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, 1, 0, 'en', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      [username, email, passwordHash, role, institutionId || 'UNIV001']
    );

    const userId = userResult.lastID;

    // Create user profile
    await db.run(
      `INSERT INTO user_profiles (
        user_id, full_name, created_at, updated_at
      ) VALUES (?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      [userId, fullName]
    );

    // Create role-specific profile
    if (role === 'student') {
      await db.run(
        `INSERT INTO student_profiles (
          user_id, year_of_study, department, student_id,
          preferences_notifications, preferences_anonymous_mode,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, 1, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        [userId, yearOfStudy || null, department || null, studentId || null]
      );
    } else if (role === 'counselor') {
      await db.run(
        `INSERT INTO counselor_profiles (
          user_id, license_number, specialization, experience_years,
          qualifications, languages, is_available, rating, total_sessions,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, 1, 0, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        [
          userId,
          licenseNumber || null,
          JSON.stringify(specialization || []),
          experienceYears || 0,
          JSON.stringify(qualifications || []),
          JSON.stringify(languages || ['English'])
        ]
      );
    }

    // Generate JWT token for immediate login
    const tokenPayload = {
      userId,
      email,
      role,
      institutionId: institutionId || 'UNIV001'
    };
    
    const { accessToken, refreshToken } = jwtUtils.generateTokenPair(tokenPayload);

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      token: accessToken,
      refreshToken,
      user: {
        id: userId,
        username,
        email,
        role,
        institutionId: institutionId || 'UNIV001',
        isActive: true,
        isVerified: false,
        languagePreference: 'en',
        profile: {
          fullName
        }
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Verify token and return user data
 */
export const verifyToken = async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const db = getDb(req);

    const dbUser = await db.get(
      'SELECT * FROM users WHERE id = ? AND is_active = 1',
      [user.userId]
    );

    if (!dbUser) {
      return res.status(401).json({
        success: false,
        valid: false,
        message: 'User not found or inactive'
      });
    }

    res.json({
      success: true,
      valid: true,
      user: {
        id: dbUser.id,
        username: dbUser.username,
        email: dbUser.email,
        role: dbUser.role,
        institutionId: dbUser.institution_id,
        isActive: Boolean(dbUser.is_active),
        isVerified: Boolean(dbUser.is_verified),
        languagePreference: dbUser.language_preference
      }
    });

  } catch (error) {
    console.error('Token verification error:', error);
    res.status(500).json({
      success: false,
      valid: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Logout handler
 */
export const logout = (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Logout successful. Please remove token from client.'
  });
};

/**
 * Refresh token handler
 */
export const refreshToken = async (req: Request, res: Response) => {
  try {
    const { refreshToken: token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token is required'
      });
    }

    const decoded = jwtUtils.verifyToken(token);
    const db = getDb(req);

    const user = await db.get(
      'SELECT * FROM users WHERE id = ? AND is_active = 1',
      [decoded.userId]
    );

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found or inactive'
      });
    }

    const tokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      institutionId: user.institution_id
    };
    
    const tokens = jwtUtils.generateTokenPair(tokenPayload);

    res.json({
      success: true,
      message: 'Token refreshed successfully',
      token: tokens.accessToken,
      refreshToken: tokens.refreshToken
    });

  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(401).json({
      success: false,
      message: 'Invalid refresh token'
    });
  }
};
