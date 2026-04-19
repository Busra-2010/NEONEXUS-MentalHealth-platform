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

// Crisis risk levels
enum CrisisRiskLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

// Validation schemas
const crisisAlertSchema = z.object({
  user_id: z.number().int().positive(),
  risk_level: z.enum(['low', 'medium', 'high', 'critical']),
  trigger_type: z.enum(['mood', 'assessment', 'manual', 'pattern']),
  trigger_data: z.record(z.string(), z.any()).optional(),
  notes: z.string().max(1000).optional(),
  requires_immediate_attention: z.boolean().default(false)
});

const updateAlertSchema = z.object({
  status: z.enum(['new', 'acknowledged', 'in_progress', 'resolved', 'escalated']).optional(),
  assigned_counselor_id: z.number().int().positive().optional(),
  response_notes: z.string().max(1000).optional(),
  intervention_taken: z.boolean().optional()
});

// Crisis detection algorithm
class CrisisDetector {
  static async analyzeUser(db: DatabaseConnection, userId: number): Promise<{
    riskLevel: CrisisRiskLevel;
    score: number;
    factors: string[];
    recommendations: string[];
  }> {
    const factors: string[] = [];
    let totalScore = 0;
    const recommendations: string[] = [];

    // Get recent mood entries (last 7 days)
    const recentMoods = await db.all(
      'SELECT mood_level, stress_level, energy_level, created_at FROM mood_entries WHERE user_id = ? AND created_at > datetime("now", "-7 days") ORDER BY created_at DESC LIMIT 10',
      [userId]
    );

    // Mood-based risk factors
    if (recentMoods.length > 0) {
      const avgMood = recentMoods.reduce((sum, entry) => sum + entry.mood_level, 0) / recentMoods.length;
      const criticalMoods = recentMoods.filter(entry => entry.mood_level <= 2).length;
      const highStress = recentMoods.filter(entry => entry.stress_level >= 8).length;
      const lowEnergy = recentMoods.filter(entry => entry.energy_level <= 3).length;

      if (avgMood <= 3) {
        totalScore += 25;
        factors.push('Consistently low mood scores');
        recommendations.push('Immediate counselor consultation recommended');
      } else if (avgMood <= 4) {
        totalScore += 15;
        factors.push('Below-average mood trends');
        recommendations.push('Consider scheduling a counseling session');
      }

      if (criticalMoods >= 2) {
        totalScore += 30;
        factors.push('Multiple crisis-level mood entries');
        recommendations.push('Crisis intervention may be needed');
      }

      if (highStress >= 3) {
        totalScore += 20;
        factors.push('Persistent high stress levels');
        recommendations.push('Stress management resources recommended');
      }

      if (lowEnergy >= 4) {
        totalScore += 15;
        factors.push('Persistent low energy levels');
        recommendations.push('Consider sleep hygiene and wellness check');
      }

      // Check for rapid mood decline
      if (recentMoods.length >= 3) {
        const recent3 = recentMoods.slice(0, 3);
        const declining = recent3.every((mood, index) => 
          index === 0 || mood.mood_level < recent3[index - 1].mood_level
        );
        if (declining && recent3[0].mood_level <= 4) {
          totalScore += 25;
          factors.push('Rapid mood decline pattern detected');
          recommendations.push('Urgent intervention may be required');
        }
      }
    }

    // Assessment-based risk factors
    const recentAssessments = await db.all(
      'SELECT score, completed_at FROM assessment_responses WHERE user_id = ? AND completed_at > datetime("now", "-14 days") ORDER BY completed_at DESC LIMIT 5',
      [userId]
    );

    if (recentAssessments.length > 0) {
      const latestScore = recentAssessments[0].score;
      const avgScore = recentAssessments.reduce((sum, assessment) => sum + assessment.score, 0) / recentAssessments.length;

      if (latestScore < 20) {
        totalScore += 35;
        factors.push('Critical assessment score detected');
        recommendations.push('Immediate professional evaluation required');
      } else if (latestScore < 40) {
        totalScore += 25;
        factors.push('Concerning assessment results');
        recommendations.push('Professional consultation strongly recommended');
      } else if (avgScore < 50) {
        totalScore += 15;
        factors.push('Consistent concerning assessment trends');
        recommendations.push('Regular counseling sessions recommended');
      }

      // Check for declining assessment scores
      if (recentAssessments.length >= 3) {
        const scores = recentAssessments.map(a => a.score).reverse(); // oldest to newest
        const declining = scores.every((score, index) => 
          index === 0 || score < scores[index - 1]
        );
        if (declining) {
          totalScore += 20;
          factors.push('Declining assessment score pattern');
          recommendations.push('Close monitoring and intervention needed');
        }
      }
    }

    // Behavioral risk factors
    const appointmentStats = await db.get(
      'SELECT COUNT(*) as cancelled_count FROM appointments WHERE student_id = ? AND status = "cancelled" AND created_at > datetime("now", "-30 days")',
      [userId]
    );

    if (appointmentStats.cancelled_count >= 2) {
      totalScore += 10;
      factors.push('Pattern of cancelled appointments');
      recommendations.push('Outreach to understand barriers to care');
    }

    // Engagement risk factors
    const recentActivity = await db.get(
      'SELECT COUNT(*) as activity_count FROM (SELECT created_at FROM mood_entries WHERE user_id = ? AND created_at > datetime("now", "-7 days") UNION ALL SELECT completed_at as created_at FROM assessment_responses WHERE user_id = ? AND completed_at > datetime("now", "-7 days"))',
      [userId, userId]
    );

    if (recentActivity.activity_count === 0) {
      totalScore += 15;
      factors.push('Complete disengagement from platform');
      recommendations.push('Proactive outreach recommended');
    } else if (recentActivity.activity_count <= 2) {
      totalScore += 10;
      factors.push('Decreased platform engagement');
      recommendations.push('Check-in recommended');
    }

    // Determine risk level based on total score
    let riskLevel: CrisisRiskLevel;
    if (totalScore >= 70) {
      riskLevel = CrisisRiskLevel.CRITICAL;
    } else if (totalScore >= 45) {
      riskLevel = CrisisRiskLevel.HIGH;
    } else if (totalScore >= 25) {
      riskLevel = CrisisRiskLevel.MEDIUM;
    } else {
      riskLevel = CrisisRiskLevel.LOW;
    }

    return {
      riskLevel,
      score: totalScore,
      factors,
      recommendations
    };
  }
}

// Run crisis detection scan for all active students
router.post('/scan', authenticate, requireRole(['admin', 'counselor']), async (req: express.Request, res: express.Response) => {
  try {
    const user = req.user!;
    const db = getDb(req);

    // Get all active students in the institution
    const students = await db.all(
      'SELECT id, username FROM users WHERE role = "student" AND is_active = 1 AND institution_id = ?',
      [user.institutionId]
    );

    const results = [];
    const newAlerts = [];

    for (const student of students) {
      const analysis = await CrisisDetector.analyzeUser(db, student.id);
      
      results.push({
        userId: student.id,
        username: student.username,
        ...analysis
      });

      // Create alert if risk level is medium or higher
      if (analysis.riskLevel !== CrisisRiskLevel.LOW) {
        // Check if there's already an active alert for this user
        const existingAlert = await db.get(
          'SELECT id FROM crisis_alerts WHERE user_id = ? AND status IN ("new", "acknowledged", "in_progress") ORDER BY created_at DESC LIMIT 1',
          [student.id]
        );

        if (!existingAlert) {
          const alertResult = await db.run(`
            INSERT INTO crisis_alerts (
              user_id, risk_level, risk_score, trigger_type, trigger_data,
              factors, recommendations, requires_immediate_attention,
              detected_by_user_id, status, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'new', CURRENT_TIMESTAMP)
          `, [
            student.id,
            analysis.riskLevel,
            analysis.score,
            'pattern',
            JSON.stringify({ scanType: 'automated', timestamp: new Date().toISOString() }),
            JSON.stringify(analysis.factors),
            JSON.stringify(analysis.recommendations),
            analysis.riskLevel === CrisisRiskLevel.CRITICAL ? 1 : 0,
            user.userId
          ]);

          newAlerts.push({
            alertId: alertResult.lastID,
            userId: student.id,
            riskLevel: analysis.riskLevel
          });
        }
      }
    }

    res.json({
      success: true,
      message: `Crisis detection scan completed`,
      data: {
        scannedUsers: students.length,
        newAlertsCreated: newAlerts.length,
        riskLevelSummary: {
          critical: results.filter(r => r.riskLevel === CrisisRiskLevel.CRITICAL).length,
          high: results.filter(r => r.riskLevel === CrisisRiskLevel.HIGH).length,
          medium: results.filter(r => r.riskLevel === CrisisRiskLevel.MEDIUM).length,
          low: results.filter(r => r.riskLevel === CrisisRiskLevel.LOW).length
        },
        newAlerts
      }
    });

  } catch (error) {
    console.error('Crisis detection scan error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get crisis alerts with filtering
router.get('/alerts', authenticate, requireRole(['admin', 'counselor']), async (req: express.Request, res: express.Response) => {
  try {
    const user = req.user!;
    const db = getDb(req);

    const {
      status,
      risk_level,
      assigned_to,
      page = '1',
      limit = '10',
      sort_by = 'created_at',
      sort_order = 'desc'
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const offset = (pageNum - 1) * limitNum;

    // Build query conditions
    let whereClause = 'WHERE u.institution_id = ?';
    const params: any[] = [user.institutionId];

    if (user.role === 'counselor') {
      // Counselors can see alerts assigned to them or unassigned alerts
      whereClause += ' AND (ca.assigned_counselor_id = ? OR ca.assigned_counselor_id IS NULL)';
      params.push(user.userId);
    }

    if (status) {
      whereClause += ' AND ca.status = ?';
      params.push(status);
    }

    if (risk_level) {
      whereClause += ' AND ca.risk_level = ?';
      params.push(risk_level);
    }

    if (assigned_to) {
      if (assigned_to === 'unassigned') {
        whereClause += ' AND ca.assigned_counselor_id IS NULL';
      } else {
        whereClause += ' AND ca.assigned_counselor_id = ?';
        params.push(assigned_to);
      }
    }

    // Validate sort parameters
    const allowedSortFields = ['created_at', 'updated_at', 'risk_level', 'risk_score'];
    const sortField = allowedSortFields.includes(sort_by as string) ? sort_by : 'created_at';
    const sortDir = sort_order === 'asc' ? 'ASC' : 'DESC';

    // Custom sorting for risk_level
    const orderByClause = sortField === 'risk_level' 
      ? `CASE ca.risk_level WHEN 'critical' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 WHEN 'low' THEN 4 END ${sortDir}`
      : `ca.${sortField} ${sortDir}`;

    // Get total count
    const countResult = await db.get(`
      SELECT COUNT(*) as total
      FROM crisis_alerts ca
      JOIN users u ON ca.user_id = u.id
      ${whereClause}
    `, params);

    // Get alerts
    const alerts = await db.all(`
      SELECT 
        ca.*,
        u.username as student_username,
        sp.name as student_name,
        counselor.username as assigned_counselor_username,
        cp.name as assigned_counselor_name
      FROM crisis_alerts ca
      JOIN users u ON ca.user_id = u.id
      LEFT JOIN student_profiles sp ON u.id = sp.user_id
      LEFT JOIN users counselor ON ca.assigned_counselor_id = counselor.id
      LEFT JOIN counselor_profiles cp ON counselor.id = cp.user_id
      ${whereClause}
      ORDER BY ${orderByClause}, ca.created_at DESC
      LIMIT ? OFFSET ?
    `, [...params, limitNum, offset]);

    const formattedAlerts = alerts.map((alert: any) => ({
      id: alert.id,
      userId: alert.user_id,
      studentName: alert.student_name || alert.student_username,
      riskLevel: alert.risk_level,
      riskScore: alert.risk_score,
      status: alert.status,
      triggerType: alert.trigger_type,
      triggerData: alert.trigger_data ? JSON.parse(alert.trigger_data) : null,
      factors: alert.factors ? JSON.parse(alert.factors) : [],
      recommendations: alert.recommendations ? JSON.parse(alert.recommendations) : [],
      requiresImmediateAttention: Boolean(alert.requires_immediate_attention),
      assignedCounselorId: alert.assigned_counselor_id,
      assignedCounselorName: alert.assigned_counselor_name || alert.assigned_counselor_username,
      responseNotes: alert.response_notes,
      interventionTaken: Boolean(alert.intervention_taken),
      detectedBy: alert.detected_by_user_id,
      createdAt: alert.created_at,
      updatedAt: alert.updated_at
    }));

    res.json({
      success: true,
      data: {
        alerts: formattedAlerts,
        pagination: {
          currentPage: pageNum,
          totalPages: Math.ceil(countResult.total / limitNum),
          totalAlerts: countResult.total,
          limit: limitNum
        }
      }
    });

  } catch (error) {
    console.error('Get crisis alerts error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get specific crisis alert
router.get('/alerts/:alertId', authenticate, requireRole(['admin', 'counselor']), async (req: express.Request, res: express.Response) => {
  try {
    const { alertId } = req.params;
    const user = req.user!;
    const db = getDb(req);

    const alert = await db.get(`
      SELECT 
        ca.*,
        u.username as student_username, u.email as student_email,
        sp.name as student_name, sp.phone as student_phone,
        sp.emergency_contact_name, sp.emergency_contact_phone,
        counselor.username as assigned_counselor_username,
        cp.name as assigned_counselor_name
      FROM crisis_alerts ca
      JOIN users u ON ca.user_id = u.id
      LEFT JOIN student_profiles sp ON u.id = sp.user_id
      LEFT JOIN users counselor ON ca.assigned_counselor_id = counselor.id
      LEFT JOIN counselor_profiles cp ON counselor.id = cp.user_id
      WHERE ca.id = ? AND u.institution_id = ?
    `, [alertId, user.institutionId]);

    if (!alert) {
      return res.status(404).json({
        success: false,
        message: 'Crisis alert not found'
      });
    }

    // Check permissions
    if (user.role === 'counselor' && alert.assigned_counselor_id && alert.assigned_counselor_id !== user.userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied - alert assigned to another counselor'
      });
    }

    // Get related data
    const recentMoods = await db.all(
      'SELECT mood_level, stress_level, energy_level, notes, created_at FROM mood_entries WHERE user_id = ? ORDER BY created_at DESC LIMIT 5',
      [alert.user_id]
    );

    const recentAssessments = await db.all(
      'SELECT score, completed_at FROM assessment_responses WHERE user_id = ? ORDER BY completed_at DESC LIMIT 3',
      [alert.user_id]
    );

    const formattedAlert = {
      id: alert.id,
      student: {
        id: alert.user_id,
        name: alert.student_name || alert.student_username,
        username: alert.student_username,
        email: alert.student_email,
        phone: alert.student_phone,
        emergencyContact: {
          name: alert.emergency_contact_name,
          phone: alert.emergency_contact_phone
        }
      },
      riskAssessment: {
        level: alert.risk_level,
        score: alert.risk_score,
        factors: alert.factors ? JSON.parse(alert.factors) : [],
        recommendations: alert.recommendations ? JSON.parse(alert.recommendations) : []
      },
      alertInfo: {
        status: alert.status,
        triggerType: alert.trigger_type,
        triggerData: alert.trigger_data ? JSON.parse(alert.trigger_data) : null,
        requiresImmediateAttention: Boolean(alert.requires_immediate_attention),
        createdAt: alert.created_at,
        updatedAt: alert.updated_at
      },
      assignment: {
        counselorId: alert.assigned_counselor_id,
        counselorName: alert.assigned_counselor_name || alert.assigned_counselor_username,
        responseNotes: alert.response_notes,
        interventionTaken: Boolean(alert.intervention_taken)
      },
      recentData: {
        moodEntries: recentMoods,
        assessments: recentAssessments
      }
    };

    res.json({
      success: true,
      data: formattedAlert
    });

  } catch (error) {
    console.error('Get crisis alert details error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Update crisis alert
router.put('/alerts/:alertId', authenticate, requireRole(['admin', 'counselor']), async (req: express.Request, res: express.Response) => {
  try {
    const validation = updateAlertSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid update data',
        errors: validation.error.issues
      });
    }

    const { alertId } = req.params;
    const user = req.user!;
    const db = getDb(req);
    const data = validation.data;

    // Get alert to check permissions
    const alert = await db.get(
      'SELECT ca.*, u.institution_id FROM crisis_alerts ca JOIN users u ON ca.user_id = u.id WHERE ca.id = ?',
      [alertId]
    );

    if (!alert) {
      return res.status(404).json({
        success: false,
        message: 'Crisis alert not found'
      });
    }

    if (alert.institution_id !== user.institutionId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Check if counselor is trying to assign to themselves or update their assigned alert
    if (user.role === 'counselor') {
      if (data.assigned_counselor_id && data.assigned_counselor_id !== user.userId) {
        return res.status(403).json({
          success: false,
          message: 'Counselors can only assign alerts to themselves'
        });
      }
      
      if (alert.assigned_counselor_id && alert.assigned_counselor_id !== user.userId) {
        return res.status(403).json({
          success: false,
          message: 'Alert is assigned to another counselor'
        });
      }
    }

    // Auto-assign to current counselor if they're updating an unassigned alert
    if (user.role === 'counselor' && !alert.assigned_counselor_id && !data.assigned_counselor_id) {
      data.assigned_counselor_id = user.userId;
    }

    // Build update query
    const updates: string[] = [];
    const params: any[] = [];

    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined) {
        updates.push(`${key} = ?`);
        params.push(value);
      }
    });

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid fields to update'
      });
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(alertId);

    await db.run(
      `UPDATE crisis_alerts SET ${updates.join(', ')} WHERE id = ?`,
      params
    );

    res.json({
      success: true,
      message: 'Crisis alert updated successfully'
    });

  } catch (error) {
    console.error('Update crisis alert error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Create manual crisis alert
router.post('/alerts', authenticate, requireRole(['admin', 'counselor']), async (req: express.Request, res: express.Response) => {
  try {
    const validation = crisisAlertSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid alert data',
        errors: validation.error.issues
      });
    }

    const user = req.user!;
    const db = getDb(req);
    const data = validation.data;

    // Verify that the target user exists and is in the same institution
    const targetUser = await db.get(
      'SELECT id FROM users WHERE id = ? AND institution_id = ? AND role = "student" AND is_active = 1',
      [data.user_id, user.institutionId]
    );

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Create crisis alert
    const result = await db.run(`
      INSERT INTO crisis_alerts (
        user_id, risk_level, risk_score, trigger_type, trigger_data,
        notes, requires_immediate_attention, detected_by_user_id,
        assigned_counselor_id, status, created_at
      ) VALUES (?, ?, 0, ?, ?, ?, ?, ?, ?, 'new', CURRENT_TIMESTAMP)
    `, [
      data.user_id,
      data.risk_level,
      data.trigger_type,
      JSON.stringify(data.trigger_data || {}),
      data.notes || null,
      data.requires_immediate_attention ? 1 : 0,
      user.userId,
      user.role === 'counselor' ? user.userId : null
    ]);

    res.status(201).json({
      success: true,
      message: 'Crisis alert created successfully',
      data: {
        alertId: result.lastID
      }
    });

  } catch (error) {
    console.error('Create crisis alert error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get crisis detection statistics
router.get('/statistics', authenticate, requireRole(['admin', 'counselor']), async (req: express.Request, res: express.Response) => {
  try {
    const user = req.user!;
    const db = getDb(req);
    const { period = '30' } = req.query;
    const days = parseInt(period as string);

    let whereClause = 'WHERE u.institution_id = ?';
    const params = [user.institutionId];

    if (user.role === 'counselor') {
      whereClause += ' AND (ca.assigned_counselor_id = ? OR ca.assigned_counselor_id IS NULL)';
      params.push(user.userId.toString());
    }

    // Overall statistics
    const overallStats = await db.get(`
      SELECT 
        COUNT(*) as total_alerts,
        COUNT(CASE WHEN ca.risk_level = 'critical' THEN 1 END) as critical_alerts,
        COUNT(CASE WHEN ca.risk_level = 'high' THEN 1 END) as high_alerts,
        COUNT(CASE WHEN ca.risk_level = 'medium' THEN 1 END) as medium_alerts,
        COUNT(CASE WHEN ca.status = 'resolved' THEN 1 END) as resolved_alerts,
        COUNT(CASE WHEN ca.created_at > datetime('now', '-${days} days') THEN 1 END) as recent_alerts
      FROM crisis_alerts ca
      JOIN users u ON ca.user_id = u.id
      ${whereClause}
    `, params);

    // Daily trends
    const dailyTrends = await db.all(`
      SELECT 
        DATE(ca.created_at) as date,
        COUNT(*) as alerts_created,
        COUNT(CASE WHEN ca.risk_level IN ('critical', 'high') THEN 1 END) as high_risk_alerts
      FROM crisis_alerts ca
      JOIN users u ON ca.user_id = u.id
      WHERE ca.created_at > datetime('now', '-${days} days') AND u.institution_id = ?
      GROUP BY DATE(ca.created_at)
      ORDER BY date DESC
      LIMIT 30
    `, [user.institutionId]);

    // Response time statistics
    const responseStats = await db.get(`
      SELECT 
        AVG(JULIANDAY(updated_at) - JULIANDAY(created_at)) * 24 as avg_response_time_hours,
        COUNT(CASE WHEN status != 'new' THEN 1 END) as responded_alerts,
        COUNT(CASE WHEN intervention_taken = 1 THEN 1 END) as interventions_completed
      FROM crisis_alerts ca
      JOIN users u ON ca.user_id = u.id
      ${whereClause}
    `, params);

    res.json({
      success: true,
      data: {
        period: `${days} days`,
        overallStats: {
          totalAlerts: overallStats.total_alerts || 0,
          criticalAlerts: overallStats.critical_alerts || 0,
          highAlerts: overallStats.high_alerts || 0,
          mediumAlerts: overallStats.medium_alerts || 0,
          resolvedAlerts: overallStats.resolved_alerts || 0,
          recentAlerts: overallStats.recent_alerts || 0,
          resolutionRate: overallStats.total_alerts > 0 ? 
            ((overallStats.resolved_alerts / overallStats.total_alerts) * 100).toFixed(1) : '0'
        },
        responseMetrics: {
          averageResponseTimeHours: responseStats.avg_response_time_hours ? 
            parseFloat(responseStats.avg_response_time_hours).toFixed(1) : null,
          respondedAlerts: responseStats.responded_alerts || 0,
          interventionsCompleted: responseStats.interventions_completed || 0
        },
        dailyTrends: dailyTrends.reverse()
      }
    });

  } catch (error) {
    console.error('Get crisis statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Analyze specific user for crisis risk
router.get('/analyze/:userId', authenticate, requireRole(['admin', 'counselor']), async (req: express.Request, res: express.Response) => {
  try {
    const { userId } = req.params;
    const user = req.user!;
    const db = getDb(req);

    // Verify user exists and is in same institution
    const targetUser = await db.get(
      'SELECT id, username FROM users WHERE id = ? AND institution_id = ? AND role = "student" AND is_active = 1',
      [userId, user.institutionId]
    );

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Run crisis detection analysis
    const analysis = await CrisisDetector.analyzeUser(db, parseInt(userId));

    res.json({
      success: true,
      data: {
        userId: targetUser.id,
        username: targetUser.username,
        analysis: {
          riskLevel: analysis.riskLevel,
          riskScore: analysis.score,
          factors: analysis.factors,
          recommendations: analysis.recommendations
        },
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Analyze user crisis risk error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

export default router;