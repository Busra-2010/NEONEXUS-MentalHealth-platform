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

// Get comprehensive dashboard analytics (admin/counselor only)
router.get('/dashboard', authenticate, requireRole(['admin', 'counselor']), async (req: express.Request, res: express.Response) => {
  try {
    const user = req.user!;
    const db = getDb(req);
    const { period = '30' } = req.query;
    const days = parseInt(period as string);
    
    // Base query conditions for institution filtering
    let institutionFilter = '';
    const baseParams: any[] = [];
    
    if (user.role !== 'admin') {
      // Counselors only see their institution's data
      institutionFilter = 'AND u.institution_id = ?';
      baseParams.push(user.institutionId);
    }
    
    // Get user statistics
    const userStats = await db.get(`
      SELECT 
        COUNT(*) as total_users,
        COUNT(CASE WHEN last_login_at > datetime('now', '-7 days') THEN 1 END) as active_users_week,
        COUNT(CASE WHEN last_login_at > datetime('now', '-30 days') THEN 1 END) as active_users_month,
        COUNT(CASE WHEN role = 'student' THEN 1 END) as total_students,
        COUNT(CASE WHEN role = 'counselor' THEN 1 END) as total_counselors
      FROM users u
      WHERE is_active = 1 ${institutionFilter}
    `, baseParams);
    
    // Get mood entry statistics
    const moodStats = await db.get(`
      SELECT 
        COUNT(*) as total_entries,
        AVG(mood_level) as avg_mood,
        COUNT(CASE WHEN created_at > datetime('now', '-${days} days') THEN 1 END) as recent_entries
      FROM mood_entries me
      JOIN users u ON me.user_id = u.id
      WHERE 1=1 ${institutionFilter}
    `, baseParams);
    
    // Get assessment statistics
    const assessmentStats = await db.get(`
      SELECT 
        COUNT(*) as total_responses,
        AVG(score) as avg_score,
        COUNT(CASE WHEN completed_at > datetime('now', '-${days} days') THEN 1 END) as recent_responses
      FROM assessment_responses ar
      JOIN users u ON ar.user_id = u.id
      WHERE 1=1 ${institutionFilter}
    `, baseParams);
    
    // Get appointment statistics
    const appointmentStats = await db.get(`
      SELECT 
        COUNT(*) as total_appointments,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_appointments,
        COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_appointments,
        AVG(rating) as avg_rating,
        COUNT(CASE WHEN created_at > datetime('now', '-${days} days') THEN 1 END) as recent_bookings
      FROM appointments a
      JOIN users su ON a.student_id = su.id
      WHERE su.institution_id = ? OR ? = 'admin'
    `, [user.institutionId, user.role]);
    
    // Get resource usage statistics
    const resourceStats = await db.get(`
      SELECT 
        COUNT(*) as total_resources,
        SUM(view_count) as total_views,
        SUM(download_count) as total_downloads,
        AVG(rating) as avg_rating
      FROM resources
      WHERE is_active = 1
    `);
    
    // Get mood distribution for the period
    const moodDistribution = await db.all(`
      SELECT 
        CASE 
          WHEN mood_level >= 8 THEN 'excellent'
          WHEN mood_level >= 6 THEN 'good'
          WHEN mood_level >= 4 THEN 'okay'
          WHEN mood_level >= 2 THEN 'struggling'
          ELSE 'crisis'
        END as mood_category,
        COUNT(*) as count
      FROM mood_entries me
      JOIN users u ON me.user_id = u.id
      WHERE me.created_at > datetime('now', '-${days} days') ${institutionFilter}
      GROUP BY mood_category
    `, baseParams);
    
    // Get top resource categories
    const topCategories = await db.all(`
      SELECT category, SUM(view_count) as total_views
      FROM resources
      WHERE is_active = 1
      GROUP BY category
      ORDER BY total_views DESC
      LIMIT 5
    `);
    
    // Calculate crisis indicators
    const crisisIndicators = await db.get(`
      SELECT 
        COUNT(CASE WHEN me.mood_level <= 2 THEN 1 END) as crisis_mood_entries,
        COUNT(CASE WHEN ar.score < 30 THEN 1 END) as concerning_assessments
      FROM mood_entries me
      JOIN users u ON me.user_id = u.id
      LEFT JOIN assessment_responses ar ON ar.user_id = u.id
      WHERE me.created_at > datetime('now', '-${days} days') ${institutionFilter}
    `, baseParams);
    
    const analytics = {
      overview: {
        totalUsers: userStats.total_users || 0,
        activeUsersWeek: userStats.active_users_week || 0,
        activeUsersMonth: userStats.active_users_month || 0,
        totalStudents: userStats.total_students || 0,
        totalCounselors: userStats.total_counselors || 0
      },
      mentalHealthTrends: {
        recentMoodEntries: moodStats.recent_entries || 0,
        averageMood: moodStats.avg_mood ? parseFloat(moodStats.avg_mood).toFixed(1) : null,
        recentAssessments: assessmentStats.recent_responses || 0,
        averageScore: assessmentStats.avg_score ? parseFloat(assessmentStats.avg_score).toFixed(1) : null,
        moodDistribution: moodDistribution.reduce((acc: any, item: any) => {
          acc[item.mood_category] = item.count;
          return acc;
        }, {}),
        crisisIndicators: {
          crisisMoodEntries: crisisIndicators.crisis_mood_entries || 0,
          concerningAssessments: crisisIndicators.concerning_assessments || 0
        }
      },
      appointments: {
        totalAppointments: appointmentStats.total_appointments || 0,
        completedAppointments: appointmentStats.completed_appointments || 0,
        cancelledAppointments: appointmentStats.cancelled_appointments || 0,
        averageRating: appointmentStats.avg_rating ? parseFloat(appointmentStats.avg_rating).toFixed(1) : null,
        recentBookings: appointmentStats.recent_bookings || 0,
        completionRate: appointmentStats.total_appointments > 0 ? 
          ((appointmentStats.completed_appointments / appointmentStats.total_appointments) * 100).toFixed(1) : '0'
      },
      resourceUsage: {
        totalResources: resourceStats.total_resources || 0,
        totalViews: resourceStats.total_views || 0,
        totalDownloads: resourceStats.total_downloads || 0,
        averageRating: resourceStats.avg_rating ? parseFloat(resourceStats.avg_rating).toFixed(1) : null,
        topCategories: topCategories
      },
      period: `${days} days`
    };
    
    res.json({
      success: true,
      data: analytics
    });
    
  } catch (error) {
    console.error('Get dashboard analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get wellbeing trends over time
router.get('/wellbeing-trends', authenticate, requireRole(['admin', 'counselor']), async (req: express.Request, res: express.Response) => {
  try {
    const user = req.user!;
    const db = getDb(req);
    const { period = '30', granularity = 'daily' } = req.query;
    const days = parseInt(period as string);
    
    let dateFormat = 'DATE(created_at)';
    let groupBy = 'DATE(created_at)';
    
    if (granularity === 'weekly') {
      dateFormat = "strftime('%Y-W%W', created_at)";
      groupBy = "strftime('%Y-W%W', created_at)";
    } else if (granularity === 'monthly') {
      dateFormat = "strftime('%Y-%m', created_at)";
      groupBy = "strftime('%Y-%m', created_at)";
    }
    
    // Base query conditions
    let institutionFilter = '';
    const baseParams: any[] = [];
    
    if (user.role !== 'admin') {
      institutionFilter = 'AND u.institution_id = ?';
      baseParams.push(user.institutionId);
    }
    
    // Get mood trends
    const moodTrends = await db.all(`
      SELECT 
        ${dateFormat} as date,
        AVG(mood_level) as avg_mood,
        AVG(energy_level) as avg_energy,
        AVG(stress_level) as avg_stress,
        COUNT(*) as entry_count
      FROM mood_entries me
      JOIN users u ON me.user_id = u.id
      WHERE me.created_at > datetime('now', '-${days} days') ${institutionFilter}
      GROUP BY ${groupBy}
      ORDER BY date DESC
      LIMIT 30
    `, baseParams);
    
    // Get assessment score trends
    const assessmentTrends = await db.all(`
      SELECT 
        ${dateFormat} as date,
        AVG(score) as avg_score,
        COUNT(*) as response_count
      FROM assessment_responses ar
      JOIN users u ON ar.user_id = u.id
      WHERE ar.completed_at > datetime('now', '-${days} days') ${institutionFilter}
      GROUP BY ${groupBy}
      ORDER BY date DESC
      LIMIT 30
    `, baseParams);
    
    // Get engagement metrics
    const engagementTrends = await db.all(`
      SELECT 
        ${dateFormat} as date,
        COUNT(DISTINCT u.id) as active_users,
        COUNT(*) as total_activities
      FROM (
        SELECT user_id, created_at FROM mood_entries 
        UNION ALL
        SELECT user_id, completed_at as created_at FROM assessment_responses
      ) activities
      JOIN users u ON activities.user_id = u.id
      WHERE activities.created_at > datetime('now', '-${days} days') ${institutionFilter}
      GROUP BY ${groupBy}
      ORDER BY date DESC
      LIMIT 30
    `, baseParams);
    
    // Generate insights
    const insights = [];
    
    if (moodTrends.length >= 2) {
      const latestMood = moodTrends[0]?.avg_mood || 0;
      const previousMood = moodTrends[1]?.avg_mood || 0;
      const moodChange = ((latestMood - previousMood) / previousMood * 100).toFixed(1);
      
      if (parseFloat(moodChange) > 5) {
        insights.push(`Mood scores have improved by ${moodChange}% in the recent period`);
      } else if (parseFloat(moodChange) < -5) {
        insights.push(`Mood scores have declined by ${Math.abs(parseFloat(moodChange))}% - consider intervention`);
      }
    }
    
    if (assessmentTrends.length >= 2) {
      const latestScore = assessmentTrends[0]?.avg_score || 0;
      const previousScore = assessmentTrends[1]?.avg_score || 0;
      const scoreChange = ((latestScore - previousScore) / previousScore * 100).toFixed(1);
      
      if (parseFloat(scoreChange) > 10) {
        insights.push(`Assessment scores showing positive trend (${scoreChange}% improvement)`);
      } else if (parseFloat(scoreChange) < -10) {
        insights.push(`Assessment scores showing concerning trend (${Math.abs(parseFloat(scoreChange))}% decline)`);
      }
    }
    
    // Add engagement insight
    const totalEngagement = engagementTrends.reduce((sum, trend) => sum + (trend.total_activities || 0), 0);
    const avgEngagement = totalEngagement / Math.max(engagementTrends.length, 1);
    
    if (avgEngagement > 10) {
      insights.push('High user engagement observed - users are actively using platform features');
    } else if (avgEngagement < 3) {
      insights.push('Low engagement levels detected - consider outreach campaigns');
    }
    
    res.json({
      success: true,
      data: {
        period: `${days} days`,
        granularity,
        moodTrends: moodTrends.reverse(),
        assessmentTrends: assessmentTrends.reverse(),
        engagementTrends: engagementTrends.reverse(),
        insights
      }
    });
    
  } catch (error) {
    console.error('Get wellbeing trends error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get counselor performance metrics (admin/counselor only)
router.get('/counselors/performance', authenticate, requireRole(['admin', 'counselor']), async (req: express.Request, res: express.Response) => {
  try {
    const user = req.user!;
    const db = getDb(req);
    const { period = '30' } = req.query;
    const days = parseInt(period as string);
    
    // Base query conditions
    let whereClause = '';
    const params: any[] = [];
    
    if (user.role === 'counselor') {
      // Counselors only see their own performance
      whereClause = 'AND u.id = ?';
      params.push(user.userId);
    } else {
      // Admins see all counselors in their institution
      whereClause = 'AND u.institution_id = ?';
      params.push(user.institutionId);
    }
    
    const counselorMetrics = await db.all(`
      SELECT 
        u.id,
        u.username,
        cp.name,
        cp.title,
        cp.specialization,
        cp.years_of_experience,
        COUNT(a.id) as total_appointments,
        COUNT(CASE WHEN a.status = 'completed' THEN 1 END) as completed_appointments,
        COUNT(CASE WHEN a.status = 'cancelled' THEN 1 END) as cancelled_appointments,
        COUNT(CASE WHEN a.status = 'no_show' THEN 1 END) as no_show_appointments,
        AVG(a.rating) as avg_rating,
        COUNT(CASE WHEN a.rating IS NOT NULL THEN 1 END) as rating_count,
        COUNT(CASE WHEN a.created_at > datetime('now', '-${days} days') THEN 1 END) as recent_appointments
      FROM users u
      JOIN counselor_profiles cp ON u.id = cp.user_id
      LEFT JOIN appointments a ON u.id = a.counselor_id
      WHERE u.role = 'counselor' AND u.is_active = 1 ${whereClause}
      GROUP BY u.id, u.username, cp.name, cp.title, cp.specialization, cp.years_of_experience
      ORDER BY total_appointments DESC
    `, params);
    
    const formattedMetrics = counselorMetrics.map((counselor: any) => ({
      id: counselor.id,
      name: counselor.name || counselor.username,
      title: counselor.title,
      specialization: counselor.specialization,
      experience: counselor.years_of_experience || 0,
      appointments: {
        total: counselor.total_appointments || 0,
        completed: counselor.completed_appointments || 0,
        cancelled: counselor.cancelled_appointments || 0,
        noShow: counselor.no_show_appointments || 0,
        recent: counselor.recent_appointments || 0
      },
      performance: {
        completionRate: counselor.total_appointments > 0 ? 
          ((counselor.completed_appointments / counselor.total_appointments) * 100).toFixed(1) : '0',
        averageRating: counselor.avg_rating ? parseFloat(counselor.avg_rating).toFixed(1) : null,
        ratingCount: counselor.rating_count || 0,
        cancellationRate: counselor.total_appointments > 0 ? 
          ((counselor.cancelled_appointments / counselor.total_appointments) * 100).toFixed(1) : '0'
      }
    }));
    
    res.json({
      success: true,
      data: {
        counselors: formattedMetrics,
        period: `${days} days`
      }
    });
    
  } catch (error) {
    console.error('Get counselor performance error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get user engagement analytics
router.get('/engagement', authenticate, requireRole(['admin', 'counselor']), async (req: express.Request, res: express.Response) => {
  try {
    const user = req.user!;
    const db = getDb(req);
    const { period = '30' } = req.query;
    const days = parseInt(period as string);
    
    let institutionFilter = '';
    const baseParams: any[] = [];
    
    if (user.role !== 'admin') {
      institutionFilter = 'AND u.institution_id = ?';
      baseParams.push(user.institutionId);
    }
    
    // Get feature usage statistics
    const featureUsage = await db.get(`
      SELECT 
        (SELECT COUNT(*) FROM mood_entries me JOIN users u ON me.user_id = u.id 
         WHERE me.created_at > datetime('now', '-${days} days') ${institutionFilter}) as mood_entries,
        (SELECT COUNT(*) FROM assessment_responses ar JOIN users u ON ar.user_id = u.id 
         WHERE ar.completed_at > datetime('now', '-${days} days') ${institutionFilter}) as assessments_completed,
        (SELECT COUNT(*) FROM appointments a JOIN users u ON a.student_id = u.id 
         WHERE a.created_at > datetime('now', '-${days} days') ${institutionFilter}) as appointments_booked,
        (SELECT SUM(view_count) FROM resources WHERE is_active = 1) as resource_views
    `, baseParams);
    
    // Get user activity levels
    const userActivityLevels = await db.all(`
      SELECT 
        CASE 
          WHEN activity_count >= 20 THEN 'highly_active'
          WHEN activity_count >= 10 THEN 'moderately_active'
          WHEN activity_count >= 3 THEN 'somewhat_active'
          ELSE 'inactive'
        END as activity_level,
        COUNT(*) as user_count
      FROM (
        SELECT 
          u.id,
          COUNT(*) as activity_count
        FROM users u
        LEFT JOIN (
          SELECT user_id, created_at as activity_date FROM mood_entries 
          WHERE created_at > datetime('now', '-${days} days')
          UNION ALL
          SELECT user_id, completed_at as activity_date FROM assessment_responses 
          WHERE completed_at > datetime('now', '-${days} days')
          UNION ALL
          SELECT student_id as user_id, created_at as activity_date FROM appointments 
          WHERE created_at > datetime('now', '-${days} days')
        ) activities ON u.id = activities.user_id
        WHERE u.is_active = 1 ${institutionFilter}
        GROUP BY u.id
      ) user_activities
      GROUP BY activity_level
    `, baseParams);
    
    // Get retention metrics
    const retentionMetrics = await db.get(`
      SELECT 
        COUNT(CASE WHEN last_login_at > datetime('now', '-1 days') THEN 1 END) as daily_active,
        COUNT(CASE WHEN last_login_at > datetime('now', '-7 days') THEN 1 END) as weekly_active,
        COUNT(CASE WHEN last_login_at > datetime('now', '-30 days') THEN 1 END) as monthly_active,
        COUNT(*) as total_users
      FROM users u
      WHERE is_active = 1 ${institutionFilter}
    `, baseParams);
    
    // Get most used features by day of week
    const weeklyPatterns = await db.all(`
      SELECT 
        strftime('%w', activity_date) as day_of_week,
        COUNT(*) as activity_count
      FROM (
        SELECT created_at as activity_date FROM mood_entries me 
        JOIN users u ON me.user_id = u.id
        WHERE me.created_at > datetime('now', '-${days} days') ${institutionFilter}
        UNION ALL
        SELECT completed_at as activity_date FROM assessment_responses ar 
        JOIN users u ON ar.user_id = u.id
        WHERE ar.completed_at > datetime('now', '-${days} days') ${institutionFilter}
      ) all_activities
      GROUP BY day_of_week
      ORDER BY day_of_week
    `, baseParams);
    
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const weeklyPatternsFormatted = weeklyPatterns.map((pattern: any) => ({
      day: dayNames[parseInt(pattern.day_of_week)],
      activityCount: pattern.activity_count
    }));
    
    res.json({
      success: true,
      data: {
        period: `${days} days`,
        featureUsage: {
          moodEntries: featureUsage.mood_entries || 0,
          assessmentsCompleted: featureUsage.assessments_completed || 0,
          appointmentsBooked: featureUsage.appointments_booked || 0,
          resourceViews: featureUsage.resource_views || 0
        },
        userActivityLevels: userActivityLevels.reduce((acc: any, level: any) => {
          acc[level.activity_level] = level.user_count;
          return acc;
        }, {}),
        retentionMetrics: {
          dailyActive: retentionMetrics.daily_active || 0,
          weeklyActive: retentionMetrics.weekly_active || 0,
          monthlyActive: retentionMetrics.monthly_active || 0,
          totalUsers: retentionMetrics.total_users || 0,
          dailyRetentionRate: retentionMetrics.total_users > 0 ? 
            ((retentionMetrics.daily_active / retentionMetrics.total_users) * 100).toFixed(1) : '0',
          weeklyRetentionRate: retentionMetrics.total_users > 0 ? 
            ((retentionMetrics.weekly_active / retentionMetrics.total_users) * 100).toFixed(1) : '0'
        },
        weeklyPatterns: weeklyPatternsFormatted
      }
    });
    
  } catch (error) {
    console.error('Get engagement analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get crisis detection and intervention analytics
router.get('/crisis-detection', authenticate, requireRole(['admin', 'counselor']), async (req: express.Request, res: express.Response) => {
  try {
    const user = req.user!;
    const db = getDb(req);
    const { period = '30' } = req.query;
    const days = parseInt(period as string);
    
    let institutionFilter = '';
    const baseParams: any[] = [];
    
    if (user.role !== 'admin') {
      institutionFilter = 'AND u.institution_id = ?';
      baseParams.push(user.institutionId);
    }
    
    // Get crisis indicators from mood entries
    const crisisMoodIndicators = await db.all(`
      SELECT 
        DATE(me.created_at) as date,
        COUNT(CASE WHEN me.mood_level <= 2 THEN 1 END) as crisis_mood_count,
        COUNT(CASE WHEN me.stress_level >= 8 THEN 1 END) as high_stress_count,
        COUNT(*) as total_entries
      FROM mood_entries me
      JOIN users u ON me.user_id = u.id
      WHERE me.created_at > datetime('now', '-${days} days') ${institutionFilter}
      GROUP BY DATE(me.created_at)
      ORDER BY date DESC
      LIMIT 30
    `, baseParams);
    
    // Get concerning assessment scores
    const concerningAssessments = await db.all(`
      SELECT 
        DATE(ar.completed_at) as date,
        COUNT(CASE WHEN ar.score < 30 THEN 1 END) as concerning_score_count,
        COUNT(*) as total_assessments,
        AVG(ar.score) as avg_score
      FROM assessment_responses ar
      JOIN users u ON ar.user_id = u.id
      WHERE ar.completed_at > datetime('now', '-${days} days') ${institutionFilter}
      GROUP BY DATE(ar.completed_at)
      ORDER BY date DESC
      LIMIT 30
    `, baseParams);
    
    // Get users requiring attention
    const usersRequiringAttention = await db.all(`
      SELECT 
        u.id,
        u.username,
        sp.name as student_name,
        me.mood_level,
        me.created_at as last_mood_entry,
        ar.score as last_assessment_score,
        ar.completed_at as last_assessment
      FROM users u
      LEFT JOIN student_profiles sp ON u.id = sp.user_id
      LEFT JOIN mood_entries me ON u.id = me.user_id 
      LEFT JOIN assessment_responses ar ON u.id = ar.user_id
      WHERE u.role = 'student' AND u.is_active = 1 ${institutionFilter}
        AND (
          (me.mood_level <= 2 AND me.created_at > datetime('now', '-7 days'))
          OR (ar.score < 30 AND ar.completed_at > datetime('now', '-7 days'))
        )
      GROUP BY u.id
      ORDER BY 
        CASE WHEN me.mood_level <= 2 THEN me.mood_level ELSE 10 END ASC,
        CASE WHEN ar.score < 30 THEN ar.score ELSE 100 END ASC
      LIMIT 20
    `, baseParams);
    
    // Calculate overall crisis metrics
    const overallCrisisMetrics = await db.get(`
      SELECT 
        COUNT(DISTINCT u.id) as users_with_crisis_indicators,
        COUNT(CASE WHEN me.mood_level <= 2 THEN 1 END) as total_crisis_mood_entries,
        COUNT(CASE WHEN ar.score < 30 THEN 1 END) as total_concerning_assessments
      FROM users u
      LEFT JOIN mood_entries me ON u.id = me.user_id AND me.created_at > datetime('now', '-${days} days')
      LEFT JOIN assessment_responses ar ON u.id = ar.user_id AND ar.completed_at > datetime('now', '-${days} days')
      WHERE u.role = 'student' AND u.is_active = 1 ${institutionFilter}
        AND (me.mood_level <= 2 OR ar.score < 30)
    `, baseParams);
    
    res.json({
      success: true,
      data: {
        period: `${days} days`,
        overallMetrics: {
          usersWithCrisisIndicators: overallCrisisMetrics.users_with_crisis_indicators || 0,
          totalCrisisMoodEntries: overallCrisisMetrics.total_crisis_mood_entries || 0,
          totalConcerningAssessments: overallCrisisMetrics.total_concerning_assessments || 0
        },
        dailyTrends: {
          moodIndicators: crisisMoodIndicators.reverse(),
          assessmentIndicators: concerningAssessments.reverse()
        },
        usersRequiringAttention: usersRequiringAttention.map((user: any) => ({
          id: user.id,
          name: user.student_name || user.username,
          lastMoodLevel: user.mood_level,
          lastMoodEntry: user.last_mood_entry,
          lastAssessmentScore: user.last_assessment_score,
          lastAssessment: user.last_assessment,
          riskLevel: user.mood_level <= 2 || (user.last_assessment_score && user.last_assessment_score < 30) ? 'high' : 'medium'
        }))
      }
    });
    
  } catch (error) {
    console.error('Get crisis detection analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Generate and export analytical reports (admin only)
router.post('/reports/generate', authenticate, requireRole(['admin']), async (req: express.Request, res: express.Response) => {
  try {
    const { reportType, period, format } = req.body;
    
    if (!reportType || !['dashboard', 'wellbeing', 'counselors', 'engagement', 'crisis'].includes(reportType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid report type'
      });
    }
    
    if (!format || !['json', 'csv', 'pdf'].includes(format)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid format. Supported formats: json, csv, pdf'
      });
    }
    
    const user = req.user!;
    const db = getDb(req);
    
    // For now, we'll generate a JSON report and provide a download URL
    // In a real implementation, this would generate actual CSV/PDF files
    const reportId = `${reportType}-${Date.now()}-${user.userId}`;
    const reportUrl = `/api/analytics/reports/download/${reportId}.${format}`;
    
    res.json({
      success: true,
      message: `${reportType} report generated successfully`,
      data: {
        reportId,
        reportType,
        format,
        period: period || '30',
        downloadUrl: reportUrl,
        generatedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours from now
      }
    });
    
  } catch (error) {
    console.error('Generate report error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get available report templates
router.get('/reports/templates', authenticate, requireRole(['admin', 'counselor']), (req: express.Request, res: express.Response) => {
  const templates = [
    {
      id: 'dashboard',
      name: 'Dashboard Summary Report',
      description: 'Comprehensive overview of platform usage and mental health metrics',
      availableFormats: ['json', 'csv', 'pdf'],
      permissions: ['admin', 'counselor']
    },
    {
      id: 'wellbeing',
      name: 'Wellbeing Trends Report',
      description: 'Analysis of mood patterns, assessment scores, and wellbeing trends over time',
      availableFormats: ['json', 'csv', 'pdf'],
      permissions: ['admin', 'counselor']
    },
    {
      id: 'counselors',
      name: 'Counselor Performance Report',
      description: 'Detailed performance metrics for counselors including appointments and ratings',
      availableFormats: ['json', 'csv', 'pdf'],
      permissions: ['admin']
    },
    {
      id: 'engagement',
      name: 'User Engagement Report',
      description: 'User activity levels, feature usage, and retention metrics',
      availableFormats: ['json', 'csv', 'pdf'],
      permissions: ['admin', 'counselor']
    },
    {
      id: 'crisis',
      name: 'Crisis Detection Report',
      description: 'Identification of users requiring immediate attention and crisis trends',
      availableFormats: ['json', 'csv', 'pdf'],
      permissions: ['admin', 'counselor']
    }
  ];
  
  const user = req.user!;
  const filteredTemplates = templates.filter(template => 
    template.permissions.includes(user.role)
  );
  
  res.json({
    success: true,
    data: {
      templates: filteredTemplates
    }
  });
});

export default router;
