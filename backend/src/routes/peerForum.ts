import express from 'express';
import { authenticate, optionalAuth } from '../middleware/auth';
import * as forumController from '../controllers/forumController';

const router = express.Router();

// Public/optional-auth routes
router.get('/categories', optionalAuth, forumController.getCategories);
router.get('/categories/:categoryId/posts', optionalAuth, forumController.getPostsByCategory);
router.get('/posts/:postId', optionalAuth, forumController.getPostById);

// Authenticated routes
router.post('/categories/:categoryId/posts', authenticate, forumController.createPost);
router.post('/posts/:postId/replies', authenticate, forumController.createReply);
router.post('/:contentType/:contentId/like', authenticate, forumController.toggleLike);
router.post('/:contentType/:contentId/report', authenticate, forumController.reportContent);

// Admin/counselor routes
router.get('/stats', authenticate, forumController.getForumStats);
router.get('/support-requests', authenticate, forumController.getSupportRequests);

export default router;