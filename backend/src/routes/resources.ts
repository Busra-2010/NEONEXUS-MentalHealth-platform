import express from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { authenticate, authorize } from '../middleware/auth';
import { DatabaseConnection } from '../utils/database';
import { z } from 'zod';

const router = express.Router();

// Helper function to get database connection
const getDb = (req: express.Request): DatabaseConnection => {
  return req.app.locals.db();
};

// Helper function for role-based authorization
const requireRole = (roles: string[]) => authorize(roles);

// Validation schemas
const createResourceSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(1000),
  type: z.enum(['video', 'audio', 'pdf', 'article', 'exercise', 'worksheet']),
  category: z.string().min(1).max(100),
  subcategory: z.string().max(100).optional(),
  language: z.string().default('en'),
  url: z.string().url().optional(),
  file_path: z.string().optional(),
  thumbnail_url: z.string().url().optional(),
  duration_minutes: z.number().int().min(1).optional(),
  file_size_mb: z.number().positive().optional(),
  page_count: z.number().int().positive().optional(),
  tags: z.array(z.string()).optional(),
  difficulty_level: z.enum(['beginner', 'intermediate', 'advanced']).default('beginner'),
  age_group: z.string().optional(),
  is_featured: z.boolean().default(false)
});

const updateResourceSchema = createResourceSchema.partial();

const rateResourceSchema = z.object({
  rating: z.number().int().min(1).max(5),
  review: z.string().max(500).optional()
});

// Get all resources with filtering and pagination
router.get('/', async (req: express.Request, res: express.Response) => {
  try {
    const db = getDb(req);
    
    const {
      category,
      subcategory,
      type,
      language = 'en',
      difficulty_level,
      age_group,
      featured_only,
      search,
      tags,
      page = '1',
      limit = '12',
      sort_by = 'created_at',
      sort_order = 'desc'
    } = req.query;
    
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const offset = (pageNum - 1) * limitNum;
    
    // Build query conditions
    let whereClause = 'WHERE is_active = 1';
    const params: any[] = [];
    
    if (category) {
      whereClause += ' AND category = ?';
      params.push(category);
    }
    
    if (subcategory) {
      whereClause += ' AND subcategory = ?';
      params.push(subcategory);
    }
    
    if (type) {
      whereClause += ' AND type = ?';
      params.push(type);
    }
    
    if (language) {
      whereClause += ' AND language = ?';
      params.push(language);
    }
    
    if (difficulty_level) {
      whereClause += ' AND difficulty_level = ?';
      params.push(difficulty_level);
    }
    
    if (age_group) {
      whereClause += ' AND age_group = ?';
      params.push(age_group);
    }
    
    if (featured_only === 'true') {
      whereClause += ' AND is_featured = 1';
    }
    
    if (search) {
      whereClause += ' AND (title LIKE ? OR description LIKE ? OR tags LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }
    
    if (tags) {
      const tagList = (tags as string).split(',');
      const tagConditions = tagList.map(() => 'tags LIKE ?').join(' OR ');
      whereClause += ` AND (${tagConditions})`;
      tagList.forEach(tag => params.push(`%${tag.trim()}%`));
    }
    
    // Validate sort parameters
    const allowedSortFields = ['created_at', 'updated_at', 'title', 'rating', 'view_count', 'download_count'];
    const sortField = allowedSortFields.includes(sort_by as string) ? sort_by : 'created_at';
    const sortDir = sort_order === 'asc' ? 'ASC' : 'DESC';
    
    // Get total count
    const countResult = await db.get(
      `SELECT COUNT(*) as total FROM resources ${whereClause}`,
      params
    );
    
    // Get resources
    const resources = await db.all(`
      SELECT 
        id, title, description, type, category, subcategory, language,
        url, file_path, thumbnail_url, duration_minutes, file_size_mb,
        page_count, tags, difficulty_level, age_group, is_featured,
        view_count, download_count, rating, rating_count, created_at
      FROM resources ${whereClause}
      ORDER BY ${sortField} ${sortDir}
      LIMIT ? OFFSET ?
    `, [...params, limitNum, offset]);
    
    // Parse JSON fields and format response
    const formattedResources = resources.map((resource: any) => ({
      id: resource.id,
      title: resource.title,
      description: resource.description,
      type: resource.type,
      category: resource.category,
      subcategory: resource.subcategory,
      language: resource.language,
      url: resource.url,
      thumbnailUrl: resource.thumbnail_url,
      duration: resource.duration_minutes,
      fileSize: resource.file_size_mb,
      pageCount: resource.page_count,
      tags: resource.tags ? JSON.parse(resource.tags) : [],
      difficultyLevel: resource.difficulty_level,
      ageGroup: resource.age_group,
      isFeatured: Boolean(resource.is_featured),
      stats: {
        views: resource.view_count || 0,
        downloads: resource.download_count || 0,
        rating: resource.rating || 0,
        ratingCount: resource.rating_count || 0
      },
      createdAt: resource.created_at
    }));
    
    res.json({
      success: true,
      data: {
        resources: formattedResources,
        pagination: {
          currentPage: pageNum,
          totalPages: Math.ceil(countResult.total / limitNum),
          totalResources: countResult.total,
          limit: limitNum
        }
      }
    });
    
  } catch (error) {
    console.error('Get resources error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get resource categories and filters
router.get('/filters', async (req: express.Request, res: express.Response) => {
  try {
    const db = getDb(req);
    const { language = 'en' } = req.query;
    
    // Get all categories
    const categories = await db.all(
      'SELECT DISTINCT category FROM resources WHERE is_active = 1 AND language = ? ORDER BY category',
      [language]
    );
    
    // Get subcategories by category
    const subcategoriesData = await db.all(
      'SELECT DISTINCT category, subcategory FROM resources WHERE is_active = 1 AND language = ? AND subcategory IS NOT NULL ORDER BY category, subcategory',
      [language]
    );
    
    const subcategories = subcategoriesData.reduce((acc: any, item: any) => {
      if (!acc[item.category]) {
        acc[item.category] = [];
      }
      acc[item.category].push(item.subcategory);
      return acc;
    }, {});
    
    // Get resource types
    const types = await db.all(
      'SELECT DISTINCT type FROM resources WHERE is_active = 1 ORDER BY type'
    );
    
    // Get all tags
    const tagsResult = await db.all(
      'SELECT tags FROM resources WHERE is_active = 1 AND tags IS NOT NULL AND tags != "[]"'
    );
    
    const allTags = new Set();
    tagsResult.forEach((item: any) => {
      try {
        const tags = JSON.parse(item.tags);
        tags.forEach((tag: string) => allTags.add(tag));
      } catch (e) {
        // Skip invalid JSON
      }
    });
    
    res.json({
      success: true,
      data: {
        categories: categories.map((c: any) => c.category),
        subcategories,
        types: types.map((t: any) => t.type),
        languages: ['en', 'es', 'fr', 'hi', 'ur'], // Supported languages
        difficultyLevels: ['beginner', 'intermediate', 'advanced'],
        ageGroups: ['child', 'teen', 'adult', 'senior'],
        tags: Array.from(allTags).sort()
      }
    });
    
  } catch (error) {
    console.error('Get resource filters error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get featured resources
router.get('/featured', async (req: express.Request, res: express.Response) => {
  try {
    const db = getDb(req);
    const { language = 'en', limit = '6' } = req.query;
    
    const featuredResources = await db.all(`
      SELECT 
        id, title, description, type, category, thumbnail_url,
        duration_minutes, rating, rating_count, view_count
      FROM resources 
      WHERE is_active = 1 AND is_featured = 1 AND language = ?
      ORDER BY rating DESC, view_count DESC
      LIMIT ?
    `, [language, parseInt(limit as string)]);
    
    const formattedResources = featuredResources.map((resource: any) => ({
      id: resource.id,
      title: resource.title,
      description: resource.description,
      type: resource.type,
      category: resource.category,
      thumbnailUrl: resource.thumbnail_url,
      duration: resource.duration_minutes,
      rating: resource.rating || 0,
      ratingCount: resource.rating_count || 0,
      viewCount: resource.view_count || 0
    }));
    
    res.json({
      success: true,
      data: {
        resources: formattedResources
      }
    });
    
  } catch (error) {
    console.error('Get featured resources error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get specific resource by ID
router.get('/:resourceId', async (req: express.Request, res: express.Response) => {
  try {
    const { resourceId } = req.params;
    const db = getDb(req);
    
    // Get resource details
    const resource = await db.get(
      'SELECT * FROM resources WHERE id = ? AND is_active = 1',
      [resourceId]
    );
    
    if (!resource) {
      return res.status(404).json({
        success: false,
        message: 'Resource not found'
      });
    }
    
    // Increment view count
    await db.run(
      'UPDATE resources SET view_count = view_count + 1 WHERE id = ?',
      [resourceId]
    );
    
    // Get related resources
    const relatedResources = await db.all(`
      SELECT id, title, type, category, thumbnail_url, rating, rating_count
      FROM resources
      WHERE id != ? AND category = ? AND is_active = 1
      ORDER BY rating DESC, view_count DESC
      LIMIT 4
    `, [resourceId, resource.category]);
    
    const formattedResource = {
      id: resource.id,
      title: resource.title,
      description: resource.description,
      type: resource.type,
      category: resource.category,
      subcategory: resource.subcategory,
      language: resource.language,
      url: resource.url,
      filePath: resource.file_path,
      thumbnailUrl: resource.thumbnail_url,
      duration: resource.duration_minutes,
      fileSize: resource.file_size_mb,
      pageCount: resource.page_count,
      tags: resource.tags ? JSON.parse(resource.tags) : [],
      difficultyLevel: resource.difficulty_level,
      ageGroup: resource.age_group,
      isFeatured: Boolean(resource.is_featured),
      stats: {
        views: (resource.view_count || 0) + 1, // Include the just-incremented view
        downloads: resource.download_count || 0,
        rating: resource.rating || 0,
        ratingCount: resource.rating_count || 0
      },
      createdAt: resource.created_at,
      updatedAt: resource.updated_at,
      relatedResources: relatedResources.map((r: any) => ({
        id: r.id,
        title: r.title,
        type: r.type,
        category: r.category,
        thumbnailUrl: r.thumbnail_url,
        rating: r.rating || 0,
        ratingCount: r.rating_count || 0
      }))
    };
    
    res.json({
      success: true,
      data: formattedResource
    });
    
  } catch (error) {
    console.error('Get resource details error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Create new resource (admin/counselor only)
router.post('/', authenticate, requireRole(['admin', 'counselor']), async (req: express.Request, res: express.Response) => {
  try {
    const validation = createResourceSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid resource data',
        errors: validation.error.issues
      });
    }
    
    const user = req.user!;
    const db = getDb(req);
    const data = validation.data;
    
    // Insert resource
    const result = await db.run(`
      INSERT INTO resources (
        title, description, type, category, subcategory, language,
        url, file_path, thumbnail_url, duration_minutes, file_size_mb,
        page_count, tags, difficulty_level, age_group, is_featured,
        is_active, created_by, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `, [
      data.title,
      data.description,
      data.type,
      data.category,
      data.subcategory || null,
      data.language,
      data.url || null,
      data.file_path || null,
      data.thumbnail_url || null,
      data.duration_minutes || null,
      data.file_size_mb || null,
      data.page_count || null,
      JSON.stringify(data.tags || []),
      data.difficulty_level,
      data.age_group || null,
      data.is_featured ? 1 : 0,
      user.userId
    ]);
    
    res.status(201).json({
      success: true,
      message: 'Resource created successfully',
      data: {
        resourceId: result.lastID
      }
    });
    
  } catch (error) {
    console.error('Create resource error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Update resource (admin/counselor only)
router.put('/:resourceId', authenticate, requireRole(['admin', 'counselor']), async (req: express.Request, res: express.Response) => {
  try {
    const validation = updateResourceSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid resource data',
        errors: validation.error.issues
      });
    }
    
    const { resourceId } = req.params;
    const db = getDb(req);
    const data = validation.data;
    
    // Check if resource exists
    const existingResource = await db.get(
      'SELECT id FROM resources WHERE id = ?',
      [resourceId]
    );
    
    if (!existingResource) {
      return res.status(404).json({
        success: false,
        message: 'Resource not found'
      });
    }
    
    // Build update query
    const updates: string[] = [];
    const params: any[] = [];
    
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined) {
        if (key === 'tags') {
          updates.push('tags = ?');
          params.push(JSON.stringify(value));
        } else if (key === 'is_featured') {
          updates.push('is_featured = ?');
          params.push(value ? 1 : 0);
        } else {
          updates.push(`${key} = ?`);
          params.push(value);
        }
      }
    });
    
    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid fields to update'
      });
    }
    
    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(resourceId);
    
    await db.run(
      `UPDATE resources SET ${updates.join(', ')} WHERE id = ?`,
      params
    );
    
    res.json({
      success: true,
      message: 'Resource updated successfully'
    });
    
  } catch (error) {
    console.error('Update resource error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Delete resource (admin only)
router.delete('/:resourceId', authenticate, requireRole(['admin']), async (req: express.Request, res: express.Response) => {
  try {
    const { resourceId } = req.params;
    const db = getDb(req);
    
    // Check if resource exists
    const existingResource = await db.get(
      'SELECT id FROM resources WHERE id = ?',
      [resourceId]
    );
    
    if (!existingResource) {
      return res.status(404).json({
        success: false,
        message: 'Resource not found'
      });
    }
    
    // Soft delete by setting is_active to 0
    await db.run(
      'UPDATE resources SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [resourceId]
    );
    
    res.json({
      success: true,
      message: 'Resource deleted successfully'
    });
    
  } catch (error) {
    console.error('Delete resource error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Rate a resource
router.post('/:resourceId/rate', authenticate, async (req: express.Request, res: express.Response) => {
  try {
    const validation = rateResourceSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid rating data',
        errors: validation.error.issues
      });
    }
    
    const { resourceId } = req.params;
    const user = req.user!;
    const db = getDb(req);
    const { rating, review } = validation.data;
    
    // Check if resource exists
    const resource = await db.get(
      'SELECT id, rating, rating_count FROM resources WHERE id = ? AND is_active = 1',
      [resourceId]
    );
    
    if (!resource) {
      return res.status(404).json({
        success: false,
        message: 'Resource not found'
      });
    }
    
    // Check if user has already rated this resource
    const existingRating = await db.get(
      'SELECT id, rating FROM resource_ratings WHERE resource_id = ? AND user_id = ?',
      [resourceId, user.userId]
    );
    
    let newRating, newRatingCount;
    
    if (existingRating) {
      // Update existing rating
      const oldRating = existingRating.rating;
      const currentTotal = (resource.rating || 0) * (resource.rating_count || 0);
      const newTotal = currentTotal - oldRating + rating;
      newRating = newTotal / resource.rating_count;
      newRatingCount = resource.rating_count;
      
      await db.run(
        'UPDATE resource_ratings SET rating = ?, review = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [rating, review || null, existingRating.id]
      );
    } else {
      // Create new rating
      const currentTotal = (resource.rating || 0) * (resource.rating_count || 0);
      const newTotal = currentTotal + rating;
      newRatingCount = (resource.rating_count || 0) + 1;
      newRating = newTotal / newRatingCount;
      
      await db.run(
        'INSERT INTO resource_ratings (resource_id, user_id, rating, review, created_at) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)',
        [resourceId, user.userId, rating, review || null]
      );
    }
    
    // Update resource rating
    await db.run(
      'UPDATE resources SET rating = ?, rating_count = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [newRating, newRatingCount, resourceId]
    );
    
    res.json({
      success: true,
      message: existingRating ? 'Rating updated successfully' : 'Rating submitted successfully',
      data: {
        newRating: parseFloat(newRating.toFixed(1)),
        ratingCount: newRatingCount
      }
    });
    
  } catch (error) {
    console.error('Rate resource error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Download resource (increment download count)
router.post('/:resourceId/download', authenticate, async (req: express.Request, res: express.Response) => {
  try {
    const { resourceId } = req.params;
    const db = getDb(req);
    
    // Check if resource exists and get file info
    const resource = await db.get(
      'SELECT id, title, file_path, url, type FROM resources WHERE id = ? AND is_active = 1',
      [resourceId]
    );
    
    if (!resource) {
      return res.status(404).json({
        success: false,
        message: 'Resource not found'
      });
    }
    
    // Increment download count
    await db.run(
      'UPDATE resources SET download_count = download_count + 1 WHERE id = ?',
      [resourceId]
    );
    
    res.json({
      success: true,
      message: 'Download initiated',
      data: {
        title: resource.title,
        downloadUrl: resource.file_path || resource.url,
        type: resource.type
      }
    });
    
  } catch (error) {
    console.error('Download resource error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get resource analytics (admin/counselor only)
router.get('/analytics/usage', authenticate, requireRole(['admin', 'counselor']), async (req: express.Request, res: express.Response) => {
  try {
    const db = getDb(req);
    const { period = '30' } = req.query;
    const days = parseInt(period as string);
    
    // Get overall resource statistics
    const overallStats = await db.get(`
      SELECT 
        COUNT(*) as total_resources,
        SUM(view_count) as total_views,
        SUM(download_count) as total_downloads,
        AVG(rating) as avg_rating,
        SUM(rating_count) as total_ratings
      FROM resources 
      WHERE is_active = 1
    `);
    
    // Get top performing resources
    const topResources = await db.all(`
      SELECT id, title, type, category, view_count, download_count, rating, rating_count
      FROM resources 
      WHERE is_active = 1
      ORDER BY view_count DESC
      LIMIT 10
    `);
    
    // Get category performance
    const categoryStats = await db.all(`
      SELECT 
        category,
        COUNT(*) as resource_count,
        SUM(view_count) as total_views,
        SUM(download_count) as total_downloads,
        AVG(rating) as avg_rating
      FROM resources 
      WHERE is_active = 1
      GROUP BY category
      ORDER BY total_views DESC
    `);
    
    // Get resource type distribution
    const typeDistribution = await db.all(`
      SELECT 
        type,
        COUNT(*) as count,
        ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM resources WHERE is_active = 1), 1) as percentage
      FROM resources 
      WHERE is_active = 1
      GROUP BY type
      ORDER BY count DESC
    `);
    
    res.json({
      success: true,
      data: {
        period: `${days} days`,
        overallStats: {
          totalResources: overallStats.total_resources || 0,
          totalViews: overallStats.total_views || 0,
          totalDownloads: overallStats.total_downloads || 0,
          averageRating: overallStats.avg_rating ? parseFloat(overallStats.avg_rating).toFixed(1) : null,
          totalRatings: overallStats.total_ratings || 0
        },
        topResources,
        categoryStats,
        typeDistribution
      }
    });
    
  } catch (error) {
    console.error('Get resource analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

export default router;
