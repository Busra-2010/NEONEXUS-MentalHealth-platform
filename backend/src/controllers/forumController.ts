import { Request, Response } from 'express';
import { DatabaseConnection } from '../utils/database';
import { randomUUID } from 'crypto';

// Helper function to get database connection
const getDb = (req: Request): DatabaseConnection => {
  return req.app.locals.db();
};

// Sanitize HTML/script content from user input
const sanitizeContent = (content: string): string => {
  return content
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/<[^>]*>/g, '')
    .replace(/javascript:/gi, '')
    .trim();
};

// Check for crisis-related keywords
const checkForCrisisIndicators = (content: string): boolean => {
  const crisisKeywords = [
    'suicide', 'kill myself', 'end it all', 'not worth living',
    'want to die', 'harm myself', 'self-harm', 'cutting',
    'overdose', 'pills', 'razor', 'bridge'
  ];

  const lowerContent = content.toLowerCase();
  return crisisKeywords.some(keyword => lowerContent.includes(keyword));
};

/**
 * Get all forum categories with post counts
 */
export const getCategories = async (req: Request, res: Response) => {
  try {
    const db = getDb(req);
    const categories = await db.all(`
      SELECT c.*, 
             COUNT(DISTINCT p.id) as post_count,
             MAX(p.created_at) as last_activity
      FROM forum_categories c
      LEFT JOIN forum_posts p ON c.id = p.category_id AND p.deleted_at IS NULL
      WHERE c.is_active = 1
      GROUP BY c.id
      ORDER BY c.display_order, c.name
    `);

    res.json({ categories });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Get paginated posts in a category
 */
export const getPostsByCategory = async (req: Request, res: Response) => {
  try {
    const { categoryId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;

    const db = getDb(req);

    const posts = await db.all(`
      SELECT p.*,
             COUNT(DISTINCT r.id) as reply_count,
             COUNT(DISTINCT l.id) as like_count,
             MAX(COALESCE(r.created_at, p.created_at)) as last_activity
      FROM forum_posts p
      LEFT JOIN forum_replies r ON p.id = r.post_id AND r.deleted_at IS NULL
      LEFT JOIN forum_likes l ON p.id = l.post_id AND l.content_type = 'post'
      WHERE p.category_id = ? AND p.deleted_at IS NULL
      GROUP BY p.id
      ORDER BY p.is_pinned DESC, last_activity DESC
      LIMIT ? OFFSET ?
    `, [categoryId, limit, offset]);

    const totalResult = await db.get(`
      SELECT COUNT(*) as total
      FROM forum_posts
      WHERE category_id = ? AND deleted_at IS NULL
    `, [categoryId]);

    res.json({
      posts,
      pagination: {
        page,
        limit,
        total: totalResult.total,
        totalPages: Math.ceil(totalResult.total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Get a specific post with its replies
 */
export const getPostById = async (req: Request, res: Response) => {
  try {
    const { postId } = req.params;
    const db = getDb(req);

    const post = await db.get(`
      SELECT p.*,
             COUNT(DISTINCT l.id) as like_count
      FROM forum_posts p
      LEFT JOIN forum_likes l ON p.id = l.post_id AND l.content_type = 'post'
      WHERE p.id = ? AND p.deleted_at IS NULL
      GROUP BY p.id
    `, [postId]);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const replies = await db.all(`
      SELECT r.*,
             COUNT(DISTINCT l.id) as like_count
      FROM forum_replies r
      LEFT JOIN forum_likes l ON r.id = l.post_id AND l.content_type = 'reply'
      WHERE r.post_id = ? AND r.deleted_at IS NULL
      GROUP BY r.id
      ORDER BY r.created_at ASC
    `, [postId]);

    res.json({ post, replies });
  } catch (error) {
    console.error('Error fetching post:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Create a new forum post
 */
export const createPost = async (req: Request, res: Response) => {
  try {
    const { categoryId } = req.params;
    const { title, content, anonymous = false } = req.body;
    const userId = req.user!.userId;

    if (!title || !content) {
      return res.status(400).json({ message: 'Title and content are required' });
    }

    const sanitizedTitle = sanitizeContent(title);
    const sanitizedContent = sanitizeContent(content);
    const hasCrisisIndicators = checkForCrisisIndicators(sanitizedContent + ' ' + sanitizedTitle);

    const db = getDb(req);
    const postId = randomUUID();

    await db.run(`
      INSERT INTO forum_posts (
        id, category_id, user_id, title, content, 
        is_anonymous, has_crisis_indicators, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `, [
      postId, categoryId, userId, sanitizedTitle,
      sanitizedContent, anonymous ? 1 : 0, hasCrisisIndicators ? 1 : 0
    ]);

    if (hasCrisisIndicators) {
      await db.run(`
        INSERT INTO crisis_alerts (
          id, user_id, content_type, content_id, 
          alert_type, content_excerpt, created_at
        ) VALUES (?, ?, 'forum_post', ?, 'self_harm_detection', ?, CURRENT_TIMESTAMP)
      `, [randomUUID(), userId, postId, sanitizedContent.substring(0, 200)]);
    }

    await db.run(`
      INSERT INTO moderation_logs (
        id, content_type, content_id, moderator_id, 
        action, reason, created_at
      ) VALUES (?, 'forum_post', ?, ?, 'created', 'User created post', CURRENT_TIMESTAMP)
    `, [randomUUID(), postId, userId]);

    res.status(201).json({
      message: 'Post created successfully',
      postId,
      crisisAlert: hasCrisisIndicators
    });
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Create a reply to a post
 */
export const createReply = async (req: Request, res: Response) => {
  try {
    const { postId } = req.params;
    const { content, anonymous = false } = req.body;
    const userId = req.user!.userId;

    if (!content) {
      return res.status(400).json({ message: 'Content is required' });
    }

    const sanitizedContent = sanitizeContent(content);
    const hasCrisisIndicators = checkForCrisisIndicators(sanitizedContent);

    const db = getDb(req);
    const replyId = randomUUID();

    await db.run(`
      INSERT INTO forum_replies (
        id, post_id, user_id, content, 
        is_anonymous, has_crisis_indicators, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `, [
      replyId, postId, userId, sanitizedContent,
      anonymous ? 1 : 0, hasCrisisIndicators ? 1 : 0
    ]);

    if (hasCrisisIndicators) {
      await db.run(`
        INSERT INTO crisis_alerts (
          id, user_id, content_type, content_id, 
          alert_type, content_excerpt, created_at
        ) VALUES (?, ?, 'forum_reply', ?, 'self_harm_detection', ?, CURRENT_TIMESTAMP)
      `, [randomUUID(), userId, replyId, sanitizedContent.substring(0, 200)]);
    }

    res.status(201).json({
      message: 'Reply created successfully',
      replyId,
      crisisAlert: hasCrisisIndicators
    });
  } catch (error) {
    console.error('Error creating reply:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Toggle like/unlike on a post or reply
 */
export const toggleLike = async (req: Request, res: Response) => {
  try {
    const { contentType, contentId } = req.params;
    const userId = req.user!.userId;

    if (!['post', 'reply'].includes(contentType)) {
      return res.status(400).json({ message: 'Invalid content type' });
    }

    const db = getDb(req);

    const existingLike = await db.get(`
      SELECT id FROM forum_likes 
      WHERE user_id = ? AND post_id = ? AND content_type = ?
    `, [userId, contentId, contentType]);

    if (existingLike) {
      await db.run(`
        DELETE FROM forum_likes 
        WHERE user_id = ? AND post_id = ? AND content_type = ?
      `, [userId, contentId, contentType]);
      res.json({ message: 'Unliked successfully', liked: false });
    } else {
      await db.run(`
        INSERT INTO forum_likes (id, user_id, post_id, content_type, created_at)
        VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
      `, [randomUUID(), userId, contentId, contentType]);
      res.json({ message: 'Liked successfully', liked: true });
    }
  } catch (error) {
    console.error('Error toggling like:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Report a post or reply
 */
export const reportContent = async (req: Request, res: Response) => {
  try {
    const { contentType, contentId } = req.params;
    const { reason, description } = req.body;
    const userId = req.user!.userId;

    if (!['post', 'reply'].includes(contentType)) {
      return res.status(400).json({ message: 'Invalid content type' });
    }

    if (!reason) {
      return res.status(400).json({ message: 'Reason is required' });
    }

    const db = getDb(req);
    const reportId = randomUUID();

    await db.run(`
      INSERT INTO forum_reports (
        id, content_type, content_id, reporter_id, 
        reason, description, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, 'pending', CURRENT_TIMESTAMP)
    `, [reportId, contentType, contentId, userId, reason, description || null]);

    res.json({ message: 'Content reported successfully', reportId });
  } catch (error) {
    console.error('Error reporting content:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Get forum statistics (counselors/admins only)
 */
export const getForumStats = async (req: Request, res: Response) => {
  try {
    if (!['counselor', 'admin'].includes(req.user!.role)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const db = getDb(req);

    const stats = await db.get(`
      SELECT 
        (SELECT COUNT(*) FROM forum_posts WHERE deleted_at IS NULL) as total_posts,
        (SELECT COUNT(*) FROM forum_replies WHERE deleted_at IS NULL) as total_replies,
        (SELECT COUNT(*) FROM forum_posts WHERE created_at >= date('now', '-7 days')) as posts_this_week,
        (SELECT COUNT(*) FROM forum_replies WHERE created_at >= date('now', '-7 days')) as replies_this_week,
        (SELECT COUNT(*) FROM crisis_alerts WHERE resolved_at IS NULL) as active_crisis_alerts,
        (SELECT COUNT(*) FROM forum_reports WHERE status = 'pending') as pending_reports
    `);

    const topCategories = await db.all(`
      SELECT c.name, COUNT(p.id) as post_count
      FROM forum_categories c
      LEFT JOIN forum_posts p ON c.id = p.category_id AND p.created_at >= date('now', '-30 days')
      GROUP BY c.id, c.name
      ORDER BY post_count DESC
      LIMIT 5
    `);

    res.json({ stats, topCategories });
  } catch (error) {
    console.error('Error fetching forum stats:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Get support requests (posts with crisis indicators)
 */
export const getSupportRequests = async (req: Request, res: Response) => {
  try {
    if (!['counselor', 'admin'].includes(req.user!.role)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const db = getDb(req);

    const requests = await db.all(`
      SELECT 
        p.id, p.title, p.content, p.created_at,
        c.name as category_name,
        ca.id as alert_id, ca.alert_type, ca.resolved_at
      FROM forum_posts p
      JOIN forum_categories c ON p.category_id = c.id
      LEFT JOIN crisis_alerts ca ON p.id = ca.content_id AND ca.content_type = 'forum_post'
      WHERE p.has_crisis_indicators = 1 AND p.deleted_at IS NULL
      ORDER BY p.created_at DESC
      LIMIT 50
    `);

    res.json({ requests });
  } catch (error) {
    console.error('Error fetching support requests:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
