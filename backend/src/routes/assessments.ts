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
const moodEntrySchema = z.object({
  mood_level: z.number().int().min(1).max(10),
  mood_tags: z.array(z.string()).optional(),
  notes: z.string().max(1000).optional(),
  energy_level: z.number().int().min(1).max(10).optional(),
  stress_level: z.number().int().min(1).max(10).optional(),
  sleep_hours: z.number().min(0).max(24).optional(),
  sleep_quality: z.number().int().min(1).max(5).optional(),
  activities: z.array(z.string()).optional(),
  triggers: z.array(z.string()).optional(),
  location: z.string().max(100).optional(),
  weather: z.string().max(50).optional()
});

const assessmentResponseSchema = z.object({
  assessment_id: z.number().int().positive(),
  responses: z.record(z.string(), z.union([z.string(), z.number(), z.array(z.string())]))
});

// Submit mood entry
router.post('/mood-entries', authenticate, async (req: express.Request, res: express.Response) => {
  try {
    const validation = moodEntrySchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid mood entry data',
        errors: validation.error.issues
      });
    }

    const user = req.user!;
    const db = getDb(req);
    const data = validation.data;

    // Insert mood entry
    const result = await db.run(`
      INSERT INTO mood_entries (
        user_id, mood_level, mood_tags, notes, energy_level, 
        stress_level, sleep_hours, sleep_quality, activities, 
        triggers, location, weather, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `, [
      user.userId,
      data.mood_level,
      JSON.stringify(data.mood_tags || []),
      data.notes || null,
      data.energy_level || null,
      data.stress_level || null,
      data.sleep_hours || null,
      data.sleep_quality || null,
      JSON.stringify(data.activities || []),
      JSON.stringify(data.triggers || []),
      data.location || null,
      data.weather || null
    ]);

    res.status(201).json({
      success: true,
      message: 'Mood entry recorded successfully',
      data: {
        id: result.lastID
      }
    });

  } catch (error) {
    console.error('Submit mood entry error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get user's mood entries
router.get('/mood-entries', authenticate, async (req: express.Request, res: express.Response) => {
  try {
    const user = req.user!;
    const db = getDb(req);

    const {
      page = '1',
      limit = '10',
      startDate,
      endDate,
      sortBy = 'created_at',
      sortOrder = 'desc'
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const offset = (pageNum - 1) * limitNum;

    // Build query
    let whereClause = 'WHERE user_id = ?';
    const params: any[] = [user.userId];

    if (startDate) {
      whereClause += ' AND DATE(created_at) >= ?';
      params.push(startDate);
    }

    if (endDate) {
      whereClause += ' AND DATE(created_at) <= ?';
      params.push(endDate);
    }

    // Validate sort parameters
    const allowedSortFields = ['created_at', 'mood_level', 'energy_level', 'stress_level'];
    const sortField = allowedSortFields.includes(sortBy as string) ? sortBy : 'created_at';
    const sortDir = sortOrder === 'asc' ? 'ASC' : 'DESC';

    // Get total count
    const countResult = await db.get(
      `SELECT COUNT(*) as total FROM mood_entries ${whereClause}`,
      params
    );

    // Get mood entries
    const entries = await db.all(`
      SELECT id, mood_level, mood_tags, notes, energy_level, stress_level,
             sleep_hours, sleep_quality, activities, triggers, location, 
             weather, created_at
      FROM mood_entries ${whereClause}
      ORDER BY ${sortField} ${sortDir}
      LIMIT ? OFFSET ?
    `, [...params, limitNum, offset]);

    // Parse JSON fields
    const parsedEntries = entries.map((entry: any) => ({
      ...entry,
      mood_tags: JSON.parse(entry.mood_tags || '[]'),
      activities: JSON.parse(entry.activities || '[]'),
      triggers: JSON.parse(entry.triggers || '[]')
    }));

    res.json({
      success: true,
      data: {
        entries: parsedEntries,
        pagination: {
          currentPage: pageNum,
          totalPages: Math.ceil(countResult.total / limitNum),
          totalEntries: countResult.total,
          limit: limitNum
        }
      }
    });

  } catch (error) {
    console.error('Get mood entries error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get mood analytics
router.get('/mood-analytics', authenticate, async (req: express.Request, res: express.Response) => {
  try {
    const user = req.user!;
    const db = getDb(req);

    const { period = '30' } = req.query;
    const days = parseInt(period as string);

    // Get mood trends
    const moodTrends = await db.all(`
      SELECT 
        DATE(created_at) as date,
        AVG(mood_level) as avg_mood,
        AVG(energy_level) as avg_energy,
        AVG(stress_level) as avg_stress,
        AVG(sleep_hours) as avg_sleep,
        COUNT(*) as entry_count
      FROM mood_entries 
      WHERE user_id = ? AND created_at >= datetime('now', '-${days} days')
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `, [user.userId]);

    // Get mood distribution
    const moodDistribution = await db.all(`
      SELECT 
        mood_level,
        COUNT(*) as count,
        ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM mood_entries WHERE user_id = ? AND created_at >= datetime('now', '-${days} days')), 1) as percentage
      FROM mood_entries 
      WHERE user_id = ? AND created_at >= datetime('now', '-${days} days')
      GROUP BY mood_level
      ORDER BY mood_level
    `, [user.userId, user.userId]);

    // Get common mood tags
    const allTags = await db.all(`
      SELECT mood_tags
      FROM mood_entries 
      WHERE user_id = ? AND created_at >= datetime('now', '-${days} days')
      AND mood_tags IS NOT NULL AND mood_tags != '[]'
    `, [user.userId]);

    const tagCounts: { [key: string]: number } = {};
    allTags.forEach((entry: any) => {
      try {
        const tags = JSON.parse(entry.mood_tags || '[]');
        tags.forEach((tag: string) => {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });
      } catch (e) {
        // Skip invalid JSON
      }
    });

    const topTags = Object.entries(tagCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([tag, count]) => ({ tag, count }));

    // Get correlation insights (simplified - SQLite doesn't have CORR function)
    // Instead, get raw data for client-side correlation calculation or use descriptive stats
    const correlationData = await db.all(`
      SELECT mood_level, energy_level, stress_level, sleep_hours, sleep_quality
      FROM mood_entries 
      WHERE user_id = ? AND created_at >= datetime('now', '-${days} days')
      AND energy_level IS NOT NULL AND stress_level IS NOT NULL 
      AND sleep_hours IS NOT NULL AND sleep_quality IS NOT NULL
    `, [user.userId]);

    // Simple correlation calculation (Pearson)
    const calculateCorrelation = (x: number[], y: number[]) => {
      if (x.length !== y.length || x.length === 0) return null;
      
      const n = x.length;
      const sumX = x.reduce((a, b) => a + b, 0);
      const sumY = y.reduce((a, b) => a + b, 0);
      const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
      const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
      const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0);
      
      const numerator = n * sumXY - sumX * sumY;
      const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
      
      return denominator === 0 ? null : numerator / denominator;
    };

    const mood = correlationData.map((d: any) => d.mood_level);
    const energy = correlationData.map((d: any) => d.energy_level);
    const stress = correlationData.map((d: any) => d.stress_level);
    const sleep = correlationData.map((d: any) => d.sleep_hours);
    const sleepQuality = correlationData.map((d: any) => d.sleep_quality);

    const correlations = {
      mood_energy_correlation: calculateCorrelation(mood, energy),
      mood_stress_correlation: calculateCorrelation(mood, stress),
      mood_sleep_correlation: calculateCorrelation(mood, sleep),
      mood_sleep_quality_correlation: calculateCorrelation(mood, sleepQuality)
    };

    // Calculate overall statistics
    const overallStats = await db.get(`
      SELECT 
        AVG(mood_level) as avg_mood,
        MIN(mood_level) as min_mood,
        MAX(mood_level) as max_mood,
        AVG(energy_level) as avg_energy,
        AVG(stress_level) as avg_stress,
        AVG(sleep_hours) as avg_sleep,
        COUNT(*) as total_entries
      FROM mood_entries 
      WHERE user_id = ? AND created_at >= datetime('now', '-${days} days')
    `, [user.userId]);

    res.json({
      success: true,
      data: {
        period: `${days} days`,
        trends: moodTrends,
        distribution: moodDistribution,
        topTags,
        correlations,
        overallStats
      }
    });

  } catch (error) {
    console.error('Get mood analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Update mood entry
router.put('/mood-entries/:entryId', authenticate, async (req: express.Request, res: express.Response) => {
  try {
    const validation = moodEntrySchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid mood entry data',
        errors: validation.error.issues
      });
    }

    const { entryId } = req.params;
    const user = req.user!;
    const db = getDb(req);
    const data = validation.data;

    // Check if entry belongs to user
    const existingEntry = await db.get(
      'SELECT id FROM mood_entries WHERE id = ? AND user_id = ?',
      [entryId, user.userId]
    );

    if (!existingEntry) {
      return res.status(404).json({
        success: false,
        message: 'Mood entry not found'
      });
    }

    // Update mood entry
    await db.run(`
      UPDATE mood_entries SET
        mood_level = ?, mood_tags = ?, notes = ?, energy_level = ?,
        stress_level = ?, sleep_hours = ?, sleep_quality = ?, activities = ?,
        triggers = ?, location = ?, weather = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [
      data.mood_level,
      JSON.stringify(data.mood_tags || []),
      data.notes || null,
      data.energy_level || null,
      data.stress_level || null,
      data.sleep_hours || null,
      data.sleep_quality || null,
      JSON.stringify(data.activities || []),
      JSON.stringify(data.triggers || []),
      data.location || null,
      data.weather || null,
      entryId
    ]);

    res.json({
      success: true,
      message: 'Mood entry updated successfully'
    });

  } catch (error) {
    console.error('Update mood entry error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Delete mood entry
router.delete('/mood-entries/:entryId', authenticate, async (req: express.Request, res: express.Response) => {
  try {
    const { entryId } = req.params;
    const user = req.user!;
    const db = getDb(req);

    // Check if entry belongs to user
    const existingEntry = await db.get(
      'SELECT id FROM mood_entries WHERE id = ? AND user_id = ?',
      [entryId, user.userId]
    );

    if (!existingEntry) {
      return res.status(404).json({
        success: false,
        message: 'Mood entry not found'
      });
    }

    await db.run('DELETE FROM mood_entries WHERE id = ?', [entryId]);

    res.json({
      success: true,
      message: 'Mood entry deleted successfully'
    });

  } catch (error) {
    console.error('Delete mood entry error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get available mental health assessments
router.get('/mental-health-assessments', authenticate, async (req: express.Request, res: express.Response) => {
  try {
    const user = req.user!;
    const db = getDb(req);

    // Get all available assessments
    const assessments = await db.all(`
      SELECT id, name, description, category, estimated_duration, 
             question_count, is_active, created_at
      FROM mental_health_assessments 
      WHERE is_active = 1
      ORDER BY category, name
    `);

    // Get user's completed assessments
    const userAssessments = await db.all(`
      SELECT assessment_id, completed_at, score
      FROM assessment_responses 
      WHERE user_id = ?
      ORDER BY completed_at DESC
    `, [user.userId]);

    const userAssessmentMap = new Map();
    userAssessments.forEach((ua: any) => {
      userAssessmentMap.set(ua.assessment_id, {
        lastCompleted: ua.completed_at,
        lastScore: ua.score
      });
    });

    // Merge assessment data with user completion info
    const enrichedAssessments = assessments.map((assessment: any) => ({
      ...assessment,
      userInfo: userAssessmentMap.get(assessment.id) || null
    }));

    res.json({
      success: true,
      data: {
        assessments: enrichedAssessments
      }
    });

  } catch (error) {
    console.error('Get assessments error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get specific assessment with questions
router.get('/mental-health-assessments/:assessmentId', authenticate, async (req: express.Request, res: express.Response) => {
  try {
    const { assessmentId } = req.params;
    const db = getDb(req);

    // Get assessment details
    const assessment = await db.get(`
      SELECT id, name, description, category, estimated_duration, 
             question_count, instructions, scoring_info, is_active, created_at
      FROM mental_health_assessments 
      WHERE id = ? AND is_active = 1
    `, [assessmentId]);

    if (!assessment) {
      return res.status(404).json({
        success: false,
        message: 'Assessment not found'
      });
    }

    // Get assessment questions
    const questions = await db.all(`
      SELECT id, question_text, question_type, options, required, order_index
      FROM assessment_questions 
      WHERE assessment_id = ?
      ORDER BY order_index
    `, [assessmentId]);

    // Parse options for each question
    const parsedQuestions = questions.map((question: any) => ({
      ...question,
      options: question.options ? JSON.parse(question.options) : null,
      required: Boolean(question.required)
    }));

    res.json({
      success: true,
      data: {
        assessment: {
          ...assessment,
          instructions: assessment.instructions ? JSON.parse(assessment.instructions) : null,
          scoring_info: assessment.scoring_info ? JSON.parse(assessment.scoring_info) : null
        },
        questions: parsedQuestions
      }
    });

  } catch (error) {
    console.error('Get assessment details error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Submit assessment response
router.post('/assessment-responses', authenticate, async (req: express.Request, res: express.Response) => {
  try {
    const validation = assessmentResponseSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid assessment response data',
        errors: validation.error.issues
      });
    }

    const user = req.user!;
    const db = getDb(req);
    const { assessment_id, responses } = validation.data;

    // Validate assessment exists and is active
    const assessment = await db.get(
      'SELECT id, name, scoring_info FROM mental_health_assessments WHERE id = ? AND is_active = 1',
      [assessment_id]
    );

    if (!assessment) {
      return res.status(404).json({
        success: false,
        message: 'Assessment not found'
      });
    }

    // Validate all required questions are answered
    const requiredQuestions = await db.all(
      'SELECT id, question_text FROM assessment_questions WHERE assessment_id = ? AND required = 1',
      [assessment_id]
    );

    const missingAnswers = requiredQuestions.filter((q: any) => 
      responses[q.id] === undefined || responses[q.id] === null || responses[q.id] === ''
    );

    if (missingAnswers.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Missing required responses',
        missingQuestions: missingAnswers.map((q: any) => ({ id: q.id, question: q.question_text }))
      });
    }

    // Calculate score (simplified scoring - would be more complex in real implementation)
    let score = 0;
    let maxScore = 0;

    Object.entries(responses).forEach(([questionId, answer]) => {
      if (typeof answer === 'number') {
        score += answer;
        maxScore += 10; // Assuming max score per question is 10
      }
    });

    const percentageScore = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;

    // Start transaction
    await db.run('BEGIN TRANSACTION');

    try {
      // Insert assessment response
      const result = await db.run(`
        INSERT INTO assessment_responses (
          user_id, assessment_id, responses, score, completed_at
        ) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
      `, [
        user.userId,
        assessment_id,
        JSON.stringify(responses),
        percentageScore
      ]);

      await db.run('COMMIT');

      // Generate basic insights based on score
      let insights = [];
      if (percentageScore < 30) {
        insights.push('Your responses indicate you may be experiencing significant challenges. Consider speaking with a mental health professional.');
      } else if (percentageScore < 60) {
        insights.push('Your responses suggest some areas of concern. Regular self-care and monitoring your mood may be helpful.');
      } else {
        insights.push('Your responses indicate generally positive mental health. Keep up the good self-care practices!');
      }

      res.status(201).json({
        success: true,
        message: 'Assessment completed successfully',
        data: {
          responseId: result.lastID,
          score: percentageScore,
          insights,
          assessment: {
            id: assessment.id,
            name: assessment.name
          }
        }
      });

    } catch (error) {
      await db.run('ROLLBACK');
      throw error;
    }

  } catch (error) {
    console.error('Submit assessment response error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get user's assessment history
router.get('/assessment-responses', authenticate, async (req: express.Request, res: express.Response) => {
  try {
    const user = req.user!;
    const db = getDb(req);

    const {
      page = '1',
      limit = '10',
      assessmentId,
      sortBy = 'completed_at',
      sortOrder = 'desc'
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const offset = (pageNum - 1) * limitNum;

    // Build query
    let whereClause = 'WHERE ar.user_id = ?';
    const params: any[] = [user.userId];

    if (assessmentId) {
      whereClause += ' AND ar.assessment_id = ?';
      params.push(assessmentId);
    }

    // Validate sort parameters
    const allowedSortFields = ['completed_at', 'score'];
    const sortField = allowedSortFields.includes(sortBy as string) ? sortBy : 'completed_at';
    const sortDir = sortOrder === 'asc' ? 'ASC' : 'DESC';

    // Get total count
    const countResult = await db.get(`
      SELECT COUNT(*) as total 
      FROM assessment_responses ar ${whereClause}
    `, params);

    // Get assessment responses
    const responses = await db.all(`
      SELECT ar.id, ar.assessment_id, ar.score, ar.completed_at,
             mha.name as assessment_name, mha.category
      FROM assessment_responses ar
      JOIN mental_health_assessments mha ON ar.assessment_id = mha.id
      ${whereClause}
      ORDER BY ar.${sortField} ${sortDir}
      LIMIT ? OFFSET ?
    `, [...params, limitNum, offset]);

    res.json({
      success: true,
      data: {
        responses,
        pagination: {
          currentPage: pageNum,
          totalPages: Math.ceil(countResult.total / limitNum),
          totalResponses: countResult.total,
          limit: limitNum
        }
      }
    });

  } catch (error) {
    console.error('Get assessment responses error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get detailed assessment response
router.get('/assessment-responses/:responseId', authenticate, async (req: express.Request, res: express.Response) => {
  try {
    const { responseId } = req.params;
    const user = req.user!;
    const db = getDb(req);

    // Get response details
    const response = await db.get(`
      SELECT ar.id, ar.assessment_id, ar.responses, ar.score, ar.completed_at,
             mha.name as assessment_name, mha.category, mha.description
      FROM assessment_responses ar
      JOIN mental_health_assessments mha ON ar.assessment_id = mha.id
      WHERE ar.id = ? AND ar.user_id = ?
    `, [responseId, user.userId]);

    if (!response) {
      return res.status(404).json({
        success: false,
        message: 'Assessment response not found'
      });
    }

    // Get questions for context
    const questions = await db.all(`
      SELECT id, question_text, question_type, options
      FROM assessment_questions 
      WHERE assessment_id = ?
      ORDER BY order_index
    `, [response.assessment_id]);

    // Parse responses and enrich with question context
    const parsedResponses = JSON.parse(response.responses);
    const enrichedResponses = questions.map((question: any) => ({
      question: {
        id: question.id,
        text: question.question_text,
        type: question.question_type,
        options: question.options ? JSON.parse(question.options) : null
      },
      answer: parsedResponses[question.id] || null
    }));

    res.json({
      success: true,
      data: {
        id: response.id,
        assessmentId: response.assessment_id,
        assessmentName: response.assessment_name,
        category: response.category,
        description: response.description,
        score: response.score,
        completedAt: response.completed_at,
        responses: enrichedResponses
      }
    });

  } catch (error) {
    console.error('Get assessment response details error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get assessment progress analytics (admin/counselor only)
router.get('/analytics/assessment-progress', authenticate, requireRole(['admin', 'counselor']), async (req: express.Request, res: express.Response) => {
  try {
    const currentUser = req.user!;
    const db = getDb(req);

    const { period = '30', assessmentId } = req.query;
    const days = parseInt(period as string);

    // Build query for institution filtering
    let whereClause = `
      WHERE ar.completed_at >= datetime('now', '-${days} days')
      AND u.institution_id = ?
    `;
    const params: any[] = [currentUser.institutionId];

    if (assessmentId) {
      whereClause += ' AND ar.assessment_id = ?';
      params.push(assessmentId);
    }

    // If counselor, only show their assigned students (simplified - would need assignment table)
    if (currentUser.role === 'counselor') {
      whereClause += ' AND u.role = ?';
      params.push('student');
    }

    // Get completion trends
    const trends = await db.all(`
      SELECT 
        DATE(ar.completed_at) as date,
        COUNT(*) as completions,
        AVG(ar.score) as avg_score,
        COUNT(DISTINCT ar.user_id) as unique_users
      FROM assessment_responses ar
      JOIN users u ON ar.user_id = u.id
      ${whereClause}
      GROUP BY DATE(ar.completed_at)
      ORDER BY date DESC
    `, params);

    // Get assessment distribution
    const distribution = await db.all(`
      SELECT 
        mha.name,
        mha.category,
        COUNT(*) as completion_count,
        AVG(ar.score) as avg_score
      FROM assessment_responses ar
      JOIN mental_health_assessments mha ON ar.assessment_id = mha.id
      JOIN users u ON ar.user_id = u.id
      ${whereClause}
      GROUP BY ar.assessment_id, mha.name, mha.category
      ORDER BY completion_count DESC
    `, params);

    // Get score distribution
    const scoreRanges = await db.all(`
      SELECT 
        CASE 
          WHEN ar.score < 20 THEN '0-19'
          WHEN ar.score < 40 THEN '20-39'
          WHEN ar.score < 60 THEN '40-59'
          WHEN ar.score < 80 THEN '60-79'
          ELSE '80-100'
        END as score_range,
        COUNT(*) as count
      FROM assessment_responses ar
      JOIN users u ON ar.user_id = u.id
      ${whereClause}
      GROUP BY score_range
      ORDER BY score_range
    `, params);

    res.json({
      success: true,
      data: {
        period: `${days} days`,
        trends,
        distribution,
        scoreRanges
      }
    });

  } catch (error) {
    console.error('Get assessment analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

export default router;