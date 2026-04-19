import express from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { authenticate, authorize } from '../middleware/auth';
import { DatabaseConnection } from '../utils/database';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Helper function to get database connection
const getDb = (req: express.Request): DatabaseConnection => {
  return req.app.locals.db();
};

// Helper function for role-based authorization
const requireRole = (roles: string[]) => authorize(roles);

// Validation schemas
const bookAppointmentSchema = z.object({
  counselor_id: z.number().int().positive(),
  appointment_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // YYYY-MM-DD format
  appointment_time: z.string().regex(/^\d{2}:\d{2}$/), // HH:MM format
  duration_minutes: z.number().int().min(30).max(120).default(60),
  meeting_type: z.enum(['video', 'audio', 'in_person']).default('video'),
  is_anonymous: z.boolean().default(false),
  notes: z.string().max(500).optional()
});

const updateAppointmentSchema = z.object({
  status: z.enum(['scheduled', 'confirmed', 'completed', 'cancelled', 'no_show']).optional(),
  meeting_url: z.string().url().optional(),
  notes: z.string().max(500).optional(),
  rating: z.number().int().min(1).max(5).optional(),
  feedback: z.string().max(1000).optional()
});

const availabilitySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time_slots: z.array(z.object({
    start_time: z.string().regex(/^\d{2}:\d{2}$/),
    end_time: z.string().regex(/^\d{2}:\d{2}$/),
    is_available: z.boolean()
  }))
});

// Get available counselors with their details
router.get('/counselors', authenticate, async (req: express.Request, res: express.Response) => {
  try {
    const user = req.user!;
    const db = getDb(req);
    
    const { specialization, language, available_only = 'true' } = req.query;
    
    // Build query for counselors
    let whereClause = 'WHERE u.role = ? AND u.institution_id = ? AND u.is_active = 1';
    const params: any[] = ['counselor', user.institutionId];
    
    // Get counselors with their profiles
    const counselors = await db.all(`
      SELECT 
        u.id, u.username, u.email,
        cp.name, cp.title, cp.specialization, cp.license_number, 
        cp.years_of_experience, cp.bio, cp.availability_schedule,
        up.full_name, up.avatar_url
      FROM users u
      LEFT JOIN counselor_profiles cp ON u.id = cp.user_id
      LEFT JOIN user_profiles up ON u.id = up.user_id
      ${whereClause}
      ORDER BY cp.years_of_experience DESC, cp.name ASC
    `, params);
    
    // Get appointment counts and ratings for each counselor
    const enrichedCounselors = await Promise.all(
      counselors.map(async (counselor: any) => {
        // Get appointment stats
        const stats = await db.get(`
          SELECT 
            COUNT(*) as total_appointments,
            AVG(rating) as avg_rating,
            COUNT(CASE WHEN rating IS NOT NULL THEN 1 END) as rating_count
          FROM appointments 
          WHERE counselor_id = ? AND status = 'completed'
        `, [counselor.id]);
        
        // Get next available slot (simplified)
        const nextSlot = await db.get(`
          SELECT MIN(appointment_date) as next_date
          FROM appointments
          WHERE counselor_id = ? AND appointment_date > DATE('now') AND status IN ('scheduled', 'confirmed')
        `, [counselor.id]);
        
        return {
          id: counselor.id,
          name: counselor.name || counselor.full_name || counselor.username,
          title: counselor.title,
          specialization: counselor.specialization,
          experience: counselor.years_of_experience || 0,
          bio: counselor.bio,
          avatar: counselor.avatar_url,
          rating: stats.avg_rating ? parseFloat(stats.avg_rating).toFixed(1) : null,
          ratingCount: stats.rating_count || 0,
          totalSessions: stats.total_appointments || 0,
          nextAvailableSlot: nextSlot?.next_date || null,
          availabilitySchedule: counselor.availability_schedule ? 
            JSON.parse(counselor.availability_schedule) : null
        };
      })
    );
    
    res.json({
      success: true,
      data: {
        counselors: enrichedCounselors
      }
    });
    
  } catch (error) {
    console.error('Get counselors error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get available time slots for a specific counselor
router.get('/counselors/:counselorId/availability', authenticate, async (req: express.Request, res: express.Response) => {
  try {
    const { counselorId } = req.params;
    const { date, days = '7' } = req.query;
    const user = req.user!;
    const db = getDb(req);
    
    // Verify counselor exists and is in same institution
    const counselor = await db.get(
      'SELECT id, username FROM users WHERE id = ? AND role = ? AND institution_id = ? AND is_active = 1',
      [counselorId, 'counselor', user.institutionId]
    );
    
    if (!counselor) {
      return res.status(404).json({
        success: false,
        message: 'Counselor not found'
      });
    }
    
    const startDate = date ? new Date(date as string) : new Date();
    const daysCount = parseInt(days as string);
    const slots = [];
    
    // Generate time slots for the requested period
    for (let i = 0; i < daysCount; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      const dateStr = currentDate.toISOString().split('T')[0];
      
      // Get existing appointments for this date
      const existingAppointments = await db.all(
        'SELECT appointment_time, duration_minutes FROM appointments WHERE counselor_id = ? AND appointment_date = ? AND status IN (?, ?)',
        [counselorId, dateStr, 'scheduled', 'confirmed']
      );
      
      // Generate standard time slots (9 AM to 5 PM, 1-hour slots)
      const timeSlots = [];
      for (let hour = 9; hour < 17; hour++) {
        const timeStr = `${hour.toString().padStart(2, '0')}:00`;
        const isBooked = existingAppointments.some((apt: any) => apt.appointment_time === timeStr);
        
        // Skip past time slots for today
        const now = new Date();
        const slotDateTime = new Date(`${dateStr}T${timeStr}:00`);
        const isPast = slotDateTime < now;
        
        timeSlots.push({
          time: timeStr,
          available: !isBooked && !isPast,
          isBooked,
          isPast
        });
      }
      
      slots.push({
        date: dateStr,
        dayName: currentDate.toLocaleDateString('en-US', { weekday: 'long' }),
        timeSlots
      });
    }
    
    res.json({
      success: true,
      data: {
        counselor: {
          id: counselor.id,
          name: counselor.username
        },
        availability: slots
      }
    });
    
  } catch (error) {
    console.error('Get availability error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Book an appointment
router.post('/book', authenticate, async (req: express.Request, res: express.Response) => {
  try {
    const validation = bookAppointmentSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid appointment data',
        errors: validation.error.issues
      });
    }
    
    const user = req.user!;
    const db = getDb(req);
    const data = validation.data;
    
    // Only students can book appointments
    if (user.role !== 'student') {
      return res.status(403).json({
        success: false,
        message: 'Only students can book appointments'
      });
    }
    
    // Verify counselor exists and is available
    const counselor = await db.get(
      'SELECT id FROM users WHERE id = ? AND role = ? AND institution_id = ? AND is_active = 1',
      [data.counselor_id, 'counselor', user.institutionId]
    );
    
    if (!counselor) {
      return res.status(404).json({
        success: false,
        message: 'Counselor not found'
      });
    }
    
    // Check if slot is available
    const existingAppointment = await db.get(
      'SELECT id FROM appointments WHERE counselor_id = ? AND appointment_date = ? AND appointment_time = ? AND status IN (?, ?)',
      [data.counselor_id, data.appointment_date, data.appointment_time, 'scheduled', 'confirmed']
    );
    
    if (existingAppointment) {
      return res.status(409).json({
        success: false,
        message: 'This time slot is already booked'
      });
    }
    
    // Check for past dates
    const appointmentDateTime = new Date(`${data.appointment_date}T${data.appointment_time}:00`);
    if (appointmentDateTime < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot book appointments in the past'
      });
    }
    
    // Create appointment
    const appointmentId = uuidv4();
    await db.run(`
      INSERT INTO appointments (
        id, student_id, counselor_id, appointment_date, appointment_time,
        duration_minutes, status, meeting_type, is_anonymous, notes,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `, [
      appointmentId,
      user.userId,
      data.counselor_id,
      data.appointment_date,
      data.appointment_time,
      data.duration_minutes,
      'scheduled',
      data.meeting_type,
      data.is_anonymous ? 1 : 0,
      data.notes || null
    ]);
    
    res.status(201).json({
      success: true,
      message: 'Appointment booked successfully',
      data: {
        appointmentId,
        status: 'scheduled',
        appointmentDate: data.appointment_date,
        appointmentTime: data.appointment_time,
        meetingType: data.meeting_type
      }
    });
    
  } catch (error) {
    console.error('Book appointment error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get user's appointments
router.get('/my-appointments', authenticate, async (req: express.Request, res: express.Response) => {
  try {
    const user = req.user!;
    const db = getDb(req);
    
    const { status, page = '1', limit = '10' } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const offset = (pageNum - 1) * limitNum;
    
    // Build query based on user role
    let whereClause = '';
    let params: any[] = [];
    
    if (user.role === 'student') {
      whereClause = 'WHERE a.student_id = ?';
      params.push(user.userId);
    } else if (user.role === 'counselor') {
      whereClause = 'WHERE a.counselor_id = ?';
      params.push(user.userId);
    } else {
      // Admin can see all appointments in their institution
      whereClause = 'WHERE (su.institution_id = ? OR cu.institution_id = ?)';
      params.push(user.institutionId, user.institutionId);
    }
    
    if (status) {
      whereClause += ' AND a.status = ?';
      params.push(status);
    }
    
    // Get total count
    const countResult = await db.get(`
      SELECT COUNT(*) as total
      FROM appointments a
      JOIN users su ON a.student_id = su.id
      JOIN users cu ON a.counselor_id = cu.id
      ${whereClause}
    `, params);
    
    // Get appointments
    const appointments = await db.all(`
      SELECT 
        a.*, 
        su.username as student_username,
        cu.username as counselor_username,
        sp.name as student_name,
        cp.name as counselor_name,
        cp.title as counselor_title
      FROM appointments a
      JOIN users su ON a.student_id = su.id
      JOIN users cu ON a.counselor_id = cu.id
      LEFT JOIN student_profiles sp ON a.student_id = sp.user_id
      LEFT JOIN counselor_profiles cp ON a.counselor_id = cp.user_id
      ${whereClause}
      ORDER BY a.appointment_date DESC, a.appointment_time DESC
      LIMIT ? OFFSET ?
    `, [...params, limitNum, offset]);
    
    const formattedAppointments = appointments.map((apt: any) => ({
      id: apt.id,
      studentId: apt.student_id,
      counselorId: apt.counselor_id,
      studentName: apt.is_anonymous ? 'Anonymous' : (apt.student_name || apt.student_username),
      counselorName: apt.counselor_name || apt.counselor_username,
      counselorTitle: apt.counselor_title,
      appointmentDate: apt.appointment_date,
      appointmentTime: apt.appointment_time,
      duration: apt.duration_minutes,
      status: apt.status,
      meetingType: apt.meeting_type,
      meetingUrl: apt.meeting_url,
      isAnonymous: Boolean(apt.is_anonymous),
      notes: apt.notes,
      rating: apt.rating,
      feedback: apt.feedback,
      createdAt: apt.created_at,
      updatedAt: apt.updated_at
    }));
    
    res.json({
      success: true,
      data: {
        appointments: formattedAppointments,
        pagination: {
          currentPage: pageNum,
          totalPages: Math.ceil(countResult.total / limitNum),
          totalAppointments: countResult.total,
          limit: limitNum
        }
      }
    });
    
  } catch (error) {
    console.error('Get appointments error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get specific appointment details
router.get('/:appointmentId', authenticate, async (req: express.Request, res: express.Response) => {
  try {
    const { appointmentId } = req.params;
    const user = req.user!;
    const db = getDb(req);
    
    const appointment = await db.get(`
      SELECT 
        a.*,
        su.username as student_username,
        cu.username as counselor_username,
        sp.name as student_name,
        cp.name as counselor_name,
        cp.title as counselor_title,
        cp.specialization
      FROM appointments a
      JOIN users su ON a.student_id = su.id
      JOIN users cu ON a.counselor_id = cu.id
      LEFT JOIN student_profiles sp ON a.student_id = sp.user_id
      LEFT JOIN counselor_profiles cp ON a.counselor_id = cp.user_id
      WHERE a.id = ?
    `, [appointmentId]);
    
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }
    
    // Check permissions
    const hasAccess = 
      user.role === 'admin' ||
      (user.role === 'student' && appointment.student_id === user.userId) ||
      (user.role === 'counselor' && appointment.counselor_id === user.userId);
    
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    
    const formattedAppointment = {
      id: appointment.id,
      studentId: appointment.student_id,
      counselorId: appointment.counselor_id,
      studentName: appointment.is_anonymous ? 'Anonymous' : (appointment.student_name || appointment.student_username),
      counselorName: appointment.counselor_name || appointment.counselor_username,
      counselorTitle: appointment.counselor_title,
      counselorSpecialization: appointment.specialization,
      appointmentDate: appointment.appointment_date,
      appointmentTime: appointment.appointment_time,
      duration: appointment.duration_minutes,
      status: appointment.status,
      meetingType: appointment.meeting_type,
      meetingUrl: appointment.meeting_url,
      isAnonymous: Boolean(appointment.is_anonymous),
      notes: appointment.notes,
      rating: appointment.rating,
      feedback: appointment.feedback,
      createdAt: appointment.created_at,
      updatedAt: appointment.updated_at
    };
    
    res.json({
      success: true,
      data: formattedAppointment
    });
    
  } catch (error) {
    console.error('Get appointment details error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Update appointment (status, meeting URL, etc.)
router.put('/:appointmentId', authenticate, async (req: express.Request, res: express.Response) => {
  try {
    const validation = updateAppointmentSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid update data',
        errors: validation.error.issues
      });
    }
    
    const { appointmentId } = req.params;
    const user = req.user!;
    const db = getDb(req);
    const data = validation.data;
    
    // Get appointment to check permissions
    const appointment = await db.get(
      'SELECT student_id, counselor_id, status FROM appointments WHERE id = ?',
      [appointmentId]
    );
    
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }
    
    // Check permissions
    const canUpdate = 
      user.role === 'admin' ||
      (user.role === 'student' && appointment.student_id === user.userId) ||
      (user.role === 'counselor' && appointment.counselor_id === user.userId);
    
    if (!canUpdate) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    
    // Build update query
    const updates: string[] = [];
    const params: any[] = [];
    
    if (data.status !== undefined) {
      updates.push('status = ?');
      params.push(data.status);
    }
    
    if (data.meeting_url !== undefined) {
      updates.push('meeting_url = ?');
      params.push(data.meeting_url);
    }
    
    if (data.notes !== undefined) {
      updates.push('notes = ?');
      params.push(data.notes);
    }
    
    if (data.rating !== undefined) {
      updates.push('rating = ?');
      params.push(data.rating);
    }
    
    if (data.feedback !== undefined) {
      updates.push('feedback = ?');
      params.push(data.feedback);
    }
    
    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid fields to update'
      });
    }
    
    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(appointmentId);
    
    await db.run(
      `UPDATE appointments SET ${updates.join(', ')} WHERE id = ?`,
      params
    );
    
    res.json({
      success: true,
      message: 'Appointment updated successfully'
    });
    
  } catch (error) {
    console.error('Update appointment error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Cancel appointment
router.delete('/:appointmentId', authenticate, async (req: express.Request, res: express.Response) => {
  try {
    const { appointmentId } = req.params;
    const user = req.user!;
    const db = getDb(req);
    
    // Get appointment to check permissions
    const appointment = await db.get(
      'SELECT student_id, counselor_id, status, appointment_date, appointment_time FROM appointments WHERE id = ?',
      [appointmentId]
    );
    
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }
    
    // Check permissions
    const canCancel = 
      user.role === 'admin' ||
      (user.role === 'student' && appointment.student_id === user.userId) ||
      (user.role === 'counselor' && appointment.counselor_id === user.userId);
    
    if (!canCancel) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    
    // Check if appointment can be cancelled
    if (appointment.status === 'completed' || appointment.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel appointment with current status'
      });
    }
    
    // Update status to cancelled
    await db.run(
      'UPDATE appointments SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      ['cancelled', appointmentId]
    );
    
    res.json({
      success: true,
      message: 'Appointment cancelled successfully'
    });
    
  } catch (error) {
    console.error('Cancel appointment error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get appointment statistics (admin/counselor only)
router.get('/analytics/statistics', authenticate, requireRole(['admin', 'counselor']), async (req: express.Request, res: express.Response) => {
  try {
    const user = req.user!;
    const db = getDb(req);
    
    const { period = '30' } = req.query;
    const days = parseInt(period as string);
    
    // Base query conditions
    let whereClause = `WHERE a.created_at >= datetime('now', '-${days} days')`;
    const params: any[] = [];
    
    if (user.role === 'counselor') {
      whereClause += ' AND a.counselor_id = ?';
      params.push(user.userId);
    } else {
      // Admin sees all appointments in their institution
      whereClause += ' AND (su.institution_id = ? OR cu.institution_id = ?)';
      params.push(user.institutionId, user.institutionId);
    }
    
    // Get overall statistics
    const overallStats = await db.get(`
      SELECT 
        COUNT(*) as total_appointments,
        COUNT(CASE WHEN a.status = 'completed' THEN 1 END) as completed_appointments,
        COUNT(CASE WHEN a.status = 'cancelled' THEN 1 END) as cancelled_appointments,
        COUNT(CASE WHEN a.status = 'no_show' THEN 1 END) as no_show_appointments,
        AVG(CASE WHEN a.rating IS NOT NULL THEN a.rating END) as avg_rating,
        COUNT(CASE WHEN a.rating IS NOT NULL THEN 1 END) as rated_appointments
      FROM appointments a
      JOIN users su ON a.student_id = su.id
      JOIN users cu ON a.counselor_id = cu.id
      ${whereClause}
    `, params);
    
    // Get daily appointment trends
    const dailyTrends = await db.all(`
      SELECT 
        DATE(a.created_at) as date,
        COUNT(*) as appointments_booked,
        COUNT(CASE WHEN a.status = 'completed' THEN 1 END) as appointments_completed
      FROM appointments a
      JOIN users su ON a.student_id = su.id
      JOIN users cu ON a.counselor_id = cu.id
      ${whereClause}
      GROUP BY DATE(a.created_at)
      ORDER BY date DESC
    `, params);
    
    // Get appointment status distribution
    const statusDistribution = await db.all(`
      SELECT 
        a.status,
        COUNT(*) as count,
        ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM appointments a2 
          JOIN users su2 ON a2.student_id = su2.id 
          JOIN users cu2 ON a2.counselor_id = cu2.id 
          ${whereClause.replace('a.', 'a2.')}), 1) as percentage
      FROM appointments a
      JOIN users su ON a.student_id = su.id
      JOIN users cu ON a.counselor_id = cu.id
      ${whereClause}
      GROUP BY a.status
      ORDER BY count DESC
    `, [...params, ...params]);
    
    // Get meeting type preferences
    const meetingTypes = await db.all(`
      SELECT 
        a.meeting_type,
        COUNT(*) as count
      FROM appointments a
      JOIN users su ON a.student_id = su.id
      JOIN users cu ON a.counselor_id = cu.id
      ${whereClause}
      GROUP BY a.meeting_type
      ORDER BY count DESC
    `, params);
    
    res.json({
      success: true,
      data: {
        period: `${days} days`,
        overallStats: {
          totalAppointments: overallStats.total_appointments || 0,
          completedAppointments: overallStats.completed_appointments || 0,
          cancelledAppointments: overallStats.cancelled_appointments || 0,
          noShowAppointments: overallStats.no_show_appointments || 0,
          averageRating: overallStats.avg_rating ? parseFloat(overallStats.avg_rating).toFixed(1) : null,
          ratedAppointments: overallStats.rated_appointments || 0,
          completionRate: overallStats.total_appointments > 0 ? 
            ((overallStats.completed_appointments / overallStats.total_appointments) * 100).toFixed(1) : '0'
        },
        dailyTrends,
        statusDistribution,
        meetingTypes
      }
    });
    
  } catch (error) {
    console.error('Get appointment statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

export default router;
