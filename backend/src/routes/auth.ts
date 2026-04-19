import express from 'express';
import { body } from 'express-validator';
import { authenticate } from '../middleware/auth';
import * as authController from '../controllers/authController';

const router = express.Router();

// Validation rules
const registerValidation = [
  body('email').isEmail().normalizeEmail(),
  body('username').isLength({ min: 3, max: 50 }).trim(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('fullName').isLength({ min: 2, max: 100 }).trim(),
  body('role').isIn(['student', 'counselor', 'admin', 'peer_volunteer'])
];

const loginValidation = [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required')
];

// Routes — thin wrappers around controller methods
router.post('/login', loginValidation, authController.login);
router.post('/register', registerValidation, authController.register);
router.get('/verify', authenticate, authController.verifyToken);
router.post('/logout', authenticate, authController.logout);
router.post('/refresh', authController.refreshToken);

export default router;