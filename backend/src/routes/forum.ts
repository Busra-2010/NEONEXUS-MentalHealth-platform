import express from 'express';

const router = express.Router();

// Get forum posts
router.get('/posts', (req, res) => {
  res.json({
    success: true,
    posts: [
      {
        id: 1,
        title: 'Dealing with First Year Anxiety',
        content: 'I\'m finding it hard to adjust to college life. Any tips?',
        author: {
          id: 'anon_123',
          username: 'Anonymous Student',
          isAnonymous: true,
          year: 1,
          department: 'Hidden'
        },
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        replies: 5,
        upvotes: 12,
        category: 'Anxiety',
        tags: ['first-year', 'adjustment', 'college-life']
      },
      {
        id: 2,
        title: 'Study-Life Balance During Exams',
        content: 'How do you all manage to maintain balance during exam season?',
        author: {
          id: 'user_456',
          username: 'StudyBuddy23',
          isAnonymous: false,
          year: 2,
          department: 'Engineering'
        },
        timestamp: new Date(Date.now() - 7200000).toISOString(),
        replies: 8,
        upvotes: 18,
        category: 'Academic Stress',
        tags: ['exams', 'balance', 'study-tips']
      }
    ]
  });
});

// Create new post
router.post('/posts', (req, res) => {
  res.json({
    success: true,
    message: 'Post created successfully',
    post: {
      id: Date.now(),
      ...req.body,
      timestamp: new Date().toISOString(),
      replies: 0,
      upvotes: 0
    }
  });
});

// Get peer volunteers
router.get('/volunteers', (req, res) => {
  res.json({
    success: true,
    volunteers: [
      {
        id: 1,
        name: 'Anita Sharma',
        year: 4,
        department: 'Psychology',
        specialties: ['Academic Stress', 'Social Anxiety'],
        rating: 4.8,
        totalHelpedStudents: 45,
        isOnline: true,
        languages: ['English', 'Hindi']
      },
      {
        id: 2,
        name: 'Rohit Saraf',
        year: 3,
        department: 'Social Work',
        specialties: ['Depression Support', 'Peer Counseling'],
        rating: 4.9,
        totalHelpedStudents: 32,
        isOnline: false,
        languages: ['English', 'Dogri','Hindi']
      }
    ]
  });
});

export default router;