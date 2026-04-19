import express from 'express';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// Placeholder journey routes - can be expanded later
router.get('/status', authenticate, async (req, res) => {
  try {
    res.json({
      message: 'Journey service is available',
      userId: req.user?.userId
    });
  } catch (error) {
    console.error('Journey status error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;