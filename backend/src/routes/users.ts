import express from 'express';

const router = express.Router();

// Mock user routes for prototype

// Get user profile
router.get('/profile/:id', (req, res) => {
  res.json({
    success: true,
    user: {
      id: parseInt(req.params.id),
      username: 'student123',
      email: 'student@university.edu',
      institutionId: 'UNIV123',
      profile: {
        name: 'Kabir Kumar',
        year: 3,
        department: 'Computer Science',
        avatar: null,
        preferences: {
          language: 'English',
          notifications: true,
          anonymousMode: false
        }
      },
      mentalHealthData: {
        lastMoodCheckIn: new Date().toISOString(),
        lastScreening: new Date().toISOString(),
        riskLevel: 'low'
      }
    }
  });
});

// Update user profile
router.put('/profile/:id', (req, res) => {
  res.json({
    success: true,
    message: 'Profile updated successfully',
    user: {
      ...req.body,
      id: parseInt(req.params.id)
    }
  });
});

// Submit mood check-in
router.post('/mood-checkin', (req, res) => {
  res.json({
    success: true,
    message: 'Mood check-in recorded',
    data: {
      timestamp: new Date().toISOString(),
      mood: req.body.mood,
      notes: req.body.notes
    }
  });
});

// Submit PHQ-9/GAD-7 screening
router.post('/screening', (req, res) => {
  res.json({
    success: true,
    message: 'Screening completed',
    data: {
      type: req.body.type, // 'PHQ9' or 'GAD7'
      score: req.body.score,
      riskLevel: req.body.score > 15 ? 'high' : req.body.score > 10 ? 'medium' : 'low',
      timestamp: new Date().toISOString(),
      recommendations: [
        'Continue regular self-care practices',
        'Consider speaking with a counselor',
        'Engage in peer support activities'
      ]
    }
  });
});

export default router;