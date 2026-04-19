import express from 'express';
import { body, query, validationResult } from 'express-validator';
import { authenticate, authorize } from '../middleware/auth';
import { DatabaseConnection } from '../utils/database';
import { z } from 'zod';
import { randomUUID } from 'crypto';

const router = express.Router();

// Helper function to get database connection
const getDb = (req: express.Request): DatabaseConnection => {
  return req.app.locals.db();
};

// Helper function for role-based authorization
const requireRole = (roles: string[]) => authorize(roles);

// Validation schemas
const notificationPreferencesSchema = z.object({
  email_appointments: z.boolean().default(true),
  email_reminders: z.boolean().default(true),
  email_crisis_alerts: z.boolean().default(true),
  email_forum_replies: z.boolean().default(false),
  email_forum_mentions: z.boolean().default(true),
  sms_appointments: z.boolean().default(false),
  sms_reminders: z.boolean().default(false),
  sms_crisis_alerts: z.boolean().default(true),
  push_appointments: z.boolean().default(true),
  push_reminders: z.boolean().default(true),
  push_crisis_alerts: z.boolean().default(true),
  push_forum_activity: z.boolean().default(false),
  quiet_hours_enabled: z.boolean().default(false),
  quiet_hours_start: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
  quiet_hours_end: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
  timezone: z.string().max(50).optional()
});

const sendNotificationSchema = z.object({
  user_ids: z.array(z.number().int().positive()).min(1).max(1000),
  title: z.string().min(1).max(200),
  message: z.string().min(1).max(1000),
  type: z.enum(['announcement', 'reminder', 'alert', 'system']),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  channels: z.array(z.enum(['email', 'sms', 'push', 'in_app'])).min(1),
  data: z.record(z.string(), z.any()).optional(),
  scheduled_for: z.string().datetime().optional()
});

// Notification types and templates
class NotificationManager {
  static readonly NOTIFICATION_TYPES = {
    APPOINTMENT_SCHEDULED: 'appointment_scheduled',
    APPOINTMENT_REMINDER: 'appointment_reminder',
    APPOINTMENT_CANCELLED: 'appointment_cancelled',
    CRISIS_ALERT: 'crisis_alert',
    FORUM_REPLY: 'forum_reply',
    FORUM_MENTION: 'forum_mention',
    ASSESSMENT_REMINDER: 'assessment_reminder',
    SYSTEM_ANNOUNCEMENT: 'system_announcement',
    WELLNESS_CHECK: 'wellness_check',
    RESOURCE_RECOMMENDATION: 'resource_recommendation'
  };

  static generateNotificationContent(type: string, data: any): {
    title: string;
    message: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    channels: string[];
  } {
    const templates = {
      [this.NOTIFICATION_TYPES.APPOINTMENT_SCHEDULED]: {
        title: 'Appointment Scheduled',
        message: `Your counseling appointment with ${data.counselorName} has been scheduled for ${data.appointmentDate} at ${data.appointmentTime}.`,
        priority: 'medium' as const,
        channels: ['email', 'push', 'in_app']
      },
      [this.NOTIFICATION_TYPES.APPOINTMENT_REMINDER]: {
        title: 'Appointment Reminder',
        message: `Reminder: You have a counseling appointment with ${data.counselorName} tomorrow at ${data.appointmentTime}.`,
        priority: 'medium' as const,
        channels: ['email', 'push', 'sms']
      },
      [this.NOTIFICATION_TYPES.APPOINTMENT_CANCELLED]: {
        title: 'Appointment Cancelled',
        message: `Your appointment scheduled for ${data.appointmentDate} at ${data.appointmentTime} has been cancelled. Please reschedule at your convenience.`,
        priority: 'high' as const,
        channels: ['email', 'push', 'sms', 'in_app']
      },
      [this.NOTIFICATION_TYPES.CRISIS_ALERT]: {
        title: 'Urgent: Crisis Alert',
        message: `A student requires immediate attention. Risk level: ${data.riskLevel}. Please review the crisis alert dashboard.`,
        priority: 'urgent' as const,
        channels: ['email', 'sms', 'push', 'in_app']
      },
      [this.NOTIFICATION_TYPES.FORUM_REPLY]: {
        title: 'New Reply to Your Post',
        message: `Someone replied to your post "${data.postTitle}" in the ${data.categoryName} forum.`,
        priority: 'low' as const,
        channels: ['email', 'push']
      },
      [this.NOTIFICATION_TYPES.FORUM_MENTION]: {
        title: 'You Were Mentioned',
        message: `You were mentioned in a forum discussion: "${data.postTitle}". Check it out to join the conversation.`,
        priority: 'medium' as const,
        channels: ['email', 'push', 'in_app']
      },
      [this.NOTIFICATION_TYPES.ASSESSMENT_REMINDER]: {
        title: 'Mental Health Check-In',
        message: `It's been a while since your last mental health assessment. Taking regular assessments helps us provide better support.`,
        priority: 'low' as const,
        channels: ['push', 'in_app']
      },
      [this.NOTIFICATION_TYPES.SYSTEM_ANNOUNCEMENT]: {
        title: data.title || 'System Announcement',
        message: data.message || 'New system update available.',
        priority: data.priority || 'medium' as const,
        channels: ['email', 'push', 'in_app']
      },
      [this.NOTIFICATION_TYPES.WELLNESS_CHECK]: {
        title: 'Wellness Check-In',
        message: `How are you feeling today? Consider logging your mood or reaching out if you need support.`,
        priority: 'low' as const,
        channels: ['push', 'in_app']
      },
      [this.NOTIFICATION_TYPES.RESOURCE_RECOMMENDATION]: {
        title: 'Recommended Resource',
        message: `We found a resource that might help: "${data.resourceTitle}". Check it out in your resources section.`,
        priority: 'low' as const,
        channels: ['push', 'in_app']
      }
    };

    return templates[type] || {
      title: 'Notification',
      message: data.message || 'You have a new notification.',
      priority: 'medium' as const,
      channels: ['in_app']
    };
  }

  static async createNotification(
    db: DatabaseConnection, 
    userId: number, 
    type: string, 
    data: any,
    scheduledFor?: Date
  ): Promise<string> {
    const content = this.generateNotificationContent(type, data);
    const notificationId = randomUUID();

    await db.run(`
      INSERT INTO notifications (
        id, user_id, type, title, message, priority, channels,
        data, status, scheduled_for, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, CURRENT_TIMESTAMP)
    `, [
      notificationId,
      userId,
      type,
      content.title,
      content.message,
      content.priority,
      JSON.stringify(content.channels),
      JSON.stringify(data),
      scheduledFor ? scheduledFor.toISOString() : null
    ]);

    return notificationId;
  }

  static async shouldSendNotification(
    db: DatabaseConnection,
    userId: number,
    type: string,
    channel: string
  ): Promise<boolean> {
    // Get user preferences
    const preferences = await db.get(
      'SELECT preferences FROM notification_preferences WHERE user_id = ?',
      [userId]
    );

    if (!preferences) return true; // Default to sending if no preferences set

    const prefs = JSON.parse(preferences.preferences);
    const prefKey = `${channel}_${type.split('_')[0]}` || `${channel}_general`;

    // Check if this type of notification is enabled for this channel
    if (prefs[prefKey] === false) return false;

    // Check quiet hours
    if (prefs.quiet_hours_enabled && channel !== 'in_app') {
      const now = new Date();
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      
      if (prefs.quiet_hours_start && prefs.quiet_hours_end) {
        if (currentTime >= prefs.quiet_hours_start && currentTime <= prefs.quiet_hours_end) {
          return false;
        }
      }
    }

    return true;
  }

  static async processNotificationQueue(db: DatabaseConnection): Promise<void> {
    // Get pending notifications that are ready to send
    const pendingNotifications = await db.all(`
      SELECT n.*, u.email, u.username, sp.phone
      FROM notifications n
      JOIN users u ON n.user_id = u.id
      LEFT JOIN student_profiles sp ON u.id = sp.user_id
      WHERE n.status = 'pending' 
        AND (n.scheduled_for IS NULL OR n.scheduled_for <= CURRENT_TIMESTAMP)
      ORDER BY n.priority DESC, n.created_at ASC
      LIMIT 100
    `);

    for (const notification of pendingNotifications) {
      await this.processNotification(db, notification);
    }
  }

  private static async processNotification(db: DatabaseConnection, notification: any): Promise<void> {
    const channels = JSON.parse(notification.channels);
    const deliveryResults: any = {};

    for (const channel of channels) {
      const shouldSend = await this.shouldSendNotification(
        db,
        notification.user_id,
        notification.type,
        channel
      );

      if (shouldSend) {
        // Simulate sending notification (in production, integrate with actual services)
        const success = await this.sendNotificationViaChannel(
          notification,
          channel,
          {
            email: notification.email,
            phone: notification.phone,
            username: notification.username
          }
        );

        deliveryResults[channel] = {
          sent: success,
          timestamp: new Date().toISOString(),
          error: success ? null : 'Delivery failed'
        };
      } else {
        deliveryResults[channel] = {
          sent: false,
          timestamp: new Date().toISOString(),
          error: 'Blocked by user preferences'
        };
      }
    }

    // Update notification status
    const allDelivered = Object.values(deliveryResults).every((result: any) => result.sent);
    const newStatus = allDelivered ? 'delivered' : 'partially_delivered';

    await db.run(`
      UPDATE notifications 
      SET status = ?, delivery_results = ?, delivered_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [
      newStatus,
      JSON.stringify(deliveryResults),
      notification.id
    ]);
  }

  private static async sendNotificationViaChannel(
    notification: any,
    channel: string,
    contactInfo: any
  ): Promise<boolean> {
    // This is where you would integrate with actual notification services
    // For demonstration purposes, we'll simulate the delivery

    console.log(`📧 Sending ${channel} notification:`, {
      to: contactInfo.email || contactInfo.phone,
      title: notification.title,
      message: notification.message,
      priority: notification.priority
    });

    // Simulate different success rates based on channel
  const successRates: Record<string, number> = {
    email: 0.95,
    sms: 0.90,
    push: 0.85,
    in_app: 0.99
  };

  return Math.random() < (successRates[channel] || 0.90);
  }
}

// Get user notifications
router.get('/', authenticate, async (req: express.Request, res: express.Response) => {
  try {
    const user = req.user!;
    const db = getDb(req);
    const {
      page = '1',
      limit = '20',
      status = 'all',
      type = 'all',
      unread_only = 'false'
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const offset = (pageNum - 1) * limitNum;

    // Build query conditions
    let whereClause = 'WHERE n.user_id = ?';
    const params: any[] = [user.userId];

    if (status !== 'all') {
      whereClause += ' AND n.status = ?';
      params.push(status);
    }

    if (type !== 'all') {
      whereClause += ' AND n.type = ?';
      params.push(type);
    }

    if (unread_only === 'true') {
      whereClause += ' AND n.read_at IS NULL';
    }

    // Get total count
    const countResult = await db.get(`
      SELECT COUNT(*) as total FROM notifications n ${whereClause}
    `, params);

    // Get notifications
    const notifications = await db.all(`
      SELECT 
        n.id, n.type, n.title, n.message, n.priority, n.channels,
        n.data, n.status, n.read_at, n.created_at, n.delivered_at
      FROM notifications n
      ${whereClause}
      ORDER BY n.created_at DESC
      LIMIT ? OFFSET ?
    `, [...params, limitNum, offset]);

    // Format notifications
    const formattedNotifications = notifications.map((notification: any) => ({
      ...notification,
      channels: notification.channels ? JSON.parse(notification.channels) : [],
      data: notification.data ? JSON.parse(notification.data) : {},
      isRead: Boolean(notification.read_at),
      isDelivered: notification.status === 'delivered' || notification.status === 'partially_delivered'
    }));

    res.json({
      success: true,
      data: {
        notifications: formattedNotifications,
        pagination: {
          currentPage: pageNum,
          totalPages: Math.ceil(countResult.total / limitNum),
          totalNotifications: countResult.total,
          limit: limitNum
        }
      }
    });

  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Mark notification as read
router.put('/:notificationId/read', authenticate, async (req: express.Request, res: express.Response) => {
  try {
    const { notificationId } = req.params;
    const user = req.user!;
    const db = getDb(req);

    // Verify notification belongs to user
    const notification = await db.get(
      'SELECT id FROM notifications WHERE id = ? AND user_id = ?',
      [notificationId, user.userId]
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    // Mark as read
    await db.run(
      'UPDATE notifications SET read_at = CURRENT_TIMESTAMP WHERE id = ?',
      [notificationId]
    );

    res.json({
      success: true,
      message: 'Notification marked as read'
    });

  } catch (error) {
    console.error('Mark notification as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Mark all notifications as read
router.put('/read-all', authenticate, async (req: express.Request, res: express.Response) => {
  try {
    const user = req.user!;
    const db = getDb(req);

    const result = await db.run(
      'UPDATE notifications SET read_at = CURRENT_TIMESTAMP WHERE user_id = ? AND read_at IS NULL',
      [user.userId]
    );

    res.json({
      success: true,
      message: `${result.changes} notifications marked as read`
    });

  } catch (error) {
    console.error('Mark all notifications as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get notification preferences
router.get('/preferences', authenticate, async (req: express.Request, res: express.Response) => {
  try {
    const user = req.user!;
    const db = getDb(req);

    let preferences = await db.get(
      'SELECT preferences FROM notification_preferences WHERE user_id = ?',
      [user.userId]
    );

    if (!preferences) {
      // Create default preferences
      const defaultPrefs = {
        email_appointments: true,
        email_reminders: true,
        email_crisis_alerts: true,
        email_forum_replies: false,
        email_forum_mentions: true,
        sms_appointments: false,
        sms_reminders: false,
        sms_crisis_alerts: true,
        push_appointments: true,
        push_reminders: true,
        push_crisis_alerts: true,
        push_forum_activity: false,
        quiet_hours_enabled: false,
        quiet_hours_start: '22:00',
        quiet_hours_end: '08:00',
        timezone: 'America/New_York'
      };

      await db.run(`
        INSERT INTO notification_preferences (user_id, preferences, created_at)
        VALUES (?, ?, CURRENT_TIMESTAMP)
      `, [user.userId, JSON.stringify(defaultPrefs)]);

      preferences = { preferences: JSON.stringify(defaultPrefs) };
    }

    res.json({
      success: true,
      data: JSON.parse(preferences.preferences)
    });

  } catch (error) {
    console.error('Get notification preferences error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Update notification preferences
router.put('/preferences', authenticate, async (req: express.Request, res: express.Response) => {
  try {
    const validation = notificationPreferencesSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid preferences data',
        errors: validation.error.issues
      });
    }

    const user = req.user!;
    const db = getDb(req);
    const preferences = validation.data;

    // Update or create preferences
    const existingPrefs = await db.get(
      'SELECT id FROM notification_preferences WHERE user_id = ?',
      [user.userId]
    );

    if (existingPrefs) {
      await db.run(
        'UPDATE notification_preferences SET preferences = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?',
        [JSON.stringify(preferences), user.userId]
      );
    } else {
      await db.run(`
        INSERT INTO notification_preferences (user_id, preferences, created_at)
        VALUES (?, ?, CURRENT_TIMESTAMP)
      `, [user.userId, JSON.stringify(preferences)]);
    }

    res.json({
      success: true,
      message: 'Notification preferences updated successfully'
    });

  } catch (error) {
    console.error('Update notification preferences error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Send bulk notification (admin/counselor only)
router.post('/send', authenticate, requireRole(['admin', 'counselor']), async (req: express.Request, res: express.Response) => {
  try {
    const validation = sendNotificationSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid notification data',
        errors: validation.error.issues
      });
    }

    const user = req.user!;
    const db = getDb(req);
    const data = validation.data;

    // Verify all target users exist and are in the same institution
    const targetUsers = await db.all(`
      SELECT id FROM users 
      WHERE id IN (${data.user_ids.map(() => '?').join(',')}) 
        AND institution_id = ?
    `, [...data.user_ids, user.institutionId]);

    if (targetUsers.length !== data.user_ids.length) {
      return res.status(400).json({
        success: false,
        message: 'Some target users not found or not in your institution'
      });
    }

    const notificationIds: string[] = [];
    const scheduledFor = data.scheduled_for ? new Date(data.scheduled_for) : undefined;

    // Create notifications for each user
    for (const userId of data.user_ids) {
      const notificationId = randomUUID();
      
      await db.run(`
        INSERT INTO notifications (
          id, user_id, type, title, message, priority, channels,
          data, status, scheduled_for, sent_by, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, CURRENT_TIMESTAMP)
      `, [
        notificationId,
        userId,
        data.type,
        data.title,
        data.message,
        data.priority,
        JSON.stringify(data.channels),
        JSON.stringify(data.data || {}),
        scheduledFor ? scheduledFor.toISOString() : null,
        user.userId
      ]);

      notificationIds.push(notificationId);
    }

    res.status(201).json({
      success: true,
      message: `${notificationIds.length} notifications created successfully`,
      data: {
        notificationIds,
        scheduled: Boolean(scheduledFor),
        scheduledFor: scheduledFor?.toISOString()
      }
    });

  } catch (error) {
    console.error('Send notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get notification statistics (admin only)
router.get('/statistics', authenticate, requireRole(['admin']), async (req: express.Request, res: express.Response) => {
  try {
    const user = req.user!;
    const db = getDb(req);
    const { period = '30' } = req.query;
    const days = parseInt(period as string);

    // Overall notification statistics
    const overallStats = await db.get(`
      SELECT 
        COUNT(*) as total_sent,
        COUNT(CASE WHEN status = 'delivered' THEN 1 END) as delivered,
        COUNT(CASE WHEN status = 'partially_delivered' THEN 1 END) as partially_delivered,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed,
        COUNT(CASE WHEN read_at IS NOT NULL THEN 1 END) as read_count
      FROM notifications n
      JOIN users u ON n.user_id = u.id
      WHERE n.created_at > datetime('now', '-${days} days')
        AND u.institution_id = ?
    `, [user.institutionId]);

    // Notification type breakdown
    const typeStats = await db.all(`
      SELECT 
        type,
        COUNT(*) as count,
        COUNT(CASE WHEN read_at IS NOT NULL THEN 1 END) as read_count
      FROM notifications n
      JOIN users u ON n.user_id = u.id
      WHERE n.created_at > datetime('now', '-${days} days')
        AND u.institution_id = ?
      GROUP BY type
      ORDER BY count DESC
    `, [user.institutionId]);

    // Channel effectiveness
    const channelStats = await db.all(`
      SELECT 
        channel,
        COUNT(*) as sent,
        AVG(CASE WHEN delivery_result = 'success' THEN 1 ELSE 0 END) as success_rate
      FROM (
        SELECT 
          n.id,
          json_each.value as channel,
          CASE WHEN json_extract(n.delivery_results, '$.' || json_each.value || '.sent') = 1 THEN 'success' ELSE 'failed' END as delivery_result
        FROM notifications n
        JOIN users u ON n.user_id = u.id,
        json_each(n.channels)
        WHERE n.created_at > datetime('now', '-${days} days')
          AND u.institution_id = ?
          AND n.delivery_results IS NOT NULL
      ) channel_deliveries
      GROUP BY channel
    `, [user.institutionId]);

    // Daily notification trends
    const dailyTrends = await db.all(`
      SELECT 
        DATE(n.created_at) as date,
        COUNT(*) as notifications_sent,
        COUNT(CASE WHEN n.read_at IS NOT NULL THEN 1 END) as notifications_read
      FROM notifications n
      JOIN users u ON n.user_id = u.id
      WHERE n.created_at > datetime('now', '-${days} days')
        AND u.institution_id = ?
      GROUP BY DATE(n.created_at)
      ORDER BY date DESC
      LIMIT 30
    `, [user.institutionId]);

    res.json({
      success: true,
      data: {
        period: `${days} days`,
        overallStatistics: {
          ...overallStats,
          deliveryRate: overallStats.total_sent > 0 ? 
            ((overallStats.delivered / overallStats.total_sent) * 100).toFixed(1) : '0',
          readRate: overallStats.total_sent > 0 ?
            ((overallStats.read_count / overallStats.total_sent) * 100).toFixed(1) : '0'
        },
        typeBreakdown: typeStats,
        channelEffectiveness: channelStats,
        dailyTrends: dailyTrends.reverse()
      }
    });

  } catch (error) {
    console.error('Get notification statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Process notification queue (internal endpoint for scheduled jobs)
router.post('/process-queue', authenticate, requireRole(['admin']), async (req: express.Request, res: express.Response) => {
  try {
    const db = getDb(req);
    
    await NotificationManager.processNotificationQueue(db);

    res.json({
      success: true,
      message: 'Notification queue processed successfully'
    });

  } catch (error) {
    console.error('Process notification queue error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Helper functions for other modules to create notifications
export const createAppointmentNotification = async (
  db: DatabaseConnection,
  userId: number,
  type: string,
  appointmentData: any
): Promise<void> => {
  await NotificationManager.createNotification(db, userId, type, appointmentData);
};

export const createCrisisNotification = async (
  db: DatabaseConnection,
  counselorIds: number[],
  studentData: any
): Promise<void> => {
  for (const counselorId of counselorIds) {
    await NotificationManager.createNotification(
      db, 
      counselorId, 
      NotificationManager.NOTIFICATION_TYPES.CRISIS_ALERT, 
      studentData
    );
  }
};

export const createForumNotification = async (
  db: DatabaseConnection,
  userId: number,
  type: string,
  forumData: any
): Promise<void> => {
  await NotificationManager.createNotification(db, userId, type, forumData);
};

export default router;