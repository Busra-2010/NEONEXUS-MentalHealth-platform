import sqlite3 from 'sqlite3';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';

// Enable verbose mode for debugging
const sqlite = sqlite3.verbose();

export interface DatabaseConnection {
  db: sqlite3.Database;
  get: (sql: string, params?: any[]) => Promise<any>;
  all: (sql: string, params?: any[]) => Promise<any[]>;
  run: (sql: string, params?: any[]) => Promise<{ lastID: number; changes: number }>;
  close: () => Promise<void>;
}

class Database {
  private db: sqlite3.Database | null = null;
  private dbPath: string;

  constructor() {
    this.dbPath = process.env.DB_PATH || './data/neonexus.sqlite';
  }

  async initialize(): Promise<DatabaseConnection> {
    try {
      // Ensure data directory exists
      const dataDir = path.dirname(this.dbPath);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      // Create database connection
      this.db = new sqlite.Database(this.dbPath);

      // Promisify database methods
      const db = this.db!; // Non-null assertion since we just created it
      const get = promisify(db.get.bind(db)) as (sql: string, params?: any[]) => Promise<any>;
      const all = promisify(db.all.bind(db)) as (sql: string, params?: any[]) => Promise<any[]>;
      const run = promisify(db.run.bind(db)) as (sql: string, params?: any[]) => Promise<sqlite3.RunResult>;
      const close = promisify(db.close.bind(db)) as () => Promise<void>;

      // Create connection object
      const connection: DatabaseConnection = {
        db,
        get,
        all,
        run: async (sql: string, params?: any[]) => {
          try {
            const result = await run(sql, params || []);
            return {
              lastID: (result as any)?.lastID || 0,
              changes: (result as any)?.changes || 0
            };
          } catch (error) {
            console.error('Database run error:', error);
            return { lastID: 0, changes: 0 };
          }
        },
        close
      };

      // Initialize database schema
      await this.createTables(connection);

      console.log(`✅ Database initialized at: ${this.dbPath}`);
      return connection;

    } catch (error) {
      console.error('❌ Database initialization failed:', error);
      throw error;
    }
  }

  private async createTables(db: DatabaseConnection): Promise<void> {
    const tables = [
      // Users table
      `CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL CHECK (role IN ('student', 'counselor', 'admin', 'peer_volunteer')),
        institution_id TEXT,
        is_active BOOLEAN DEFAULT 1,
        is_verified BOOLEAN DEFAULT 0,
        language_preference TEXT DEFAULT 'en',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_login_at DATETIME
      )`,

      // User profiles table
      `CREATE TABLE IF NOT EXISTS user_profiles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        full_name TEXT NOT NULL,
        date_of_birth DATE,
        gender TEXT,
        phone_number TEXT,
        avatar_url TEXT,
        bio TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      )`,

      // Student specific data
      `CREATE TABLE IF NOT EXISTS student_profiles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        year_of_study INTEGER,
        department TEXT,
        student_id TEXT,
        emergency_contact_name TEXT,
        emergency_contact_phone TEXT,
        emergency_contact_relationship TEXT,
        preferences_notifications BOOLEAN DEFAULT 1,
        preferences_anonymous_mode BOOLEAN DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      )`,

      // Counselor specific data
      `CREATE TABLE IF NOT EXISTS counselor_profiles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        license_number TEXT,
        specialization TEXT, -- JSON array
        experience_years INTEGER NOT NULL DEFAULT 0,
        qualifications TEXT, -- JSON array
        languages TEXT, -- JSON array
        is_available BOOLEAN DEFAULT 1,
        rating REAL DEFAULT 0,
        total_sessions INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      )`,

      // Mental health assessment records (user-submitted results)
      `CREATE TABLE IF NOT EXISTS mental_health_assessment_records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        assessment_type TEXT NOT NULL CHECK (assessment_type IN ('mood_checkin', 'phq9', 'gad7', 'custom')),
        score INTEGER,
        mood_level INTEGER, -- 1-5 scale for mood check-ins
        responses TEXT, -- JSON object
        risk_level TEXT CHECK (risk_level IN ('low', 'medium', 'high', 'crisis')),
        notes TEXT,
        is_anonymous BOOLEAN DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      )`,

      // Mood check-ins (for daily mood tracking)
      `CREATE TABLE IF NOT EXISTS mood_checkins (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        mood INTEGER NOT NULL CHECK (mood >= 1 AND mood <= 5),
        notes TEXT,
        factors TEXT, -- JSON array of factors affecting mood
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      )`,

      // Appointments
      `CREATE TABLE IF NOT EXISTS appointments (
        id TEXT PRIMARY KEY, -- UUID
        student_id INTEGER NOT NULL,
        counselor_id INTEGER NOT NULL,
        appointment_date DATE NOT NULL,
        appointment_time TIME NOT NULL,
        duration_minutes INTEGER DEFAULT 60,
        status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'completed', 'cancelled', 'no_show')),
        meeting_type TEXT NOT NULL CHECK (meeting_type IN ('video', 'audio', 'in_person')),
        meeting_url TEXT,
        is_anonymous BOOLEAN DEFAULT 0,
        notes TEXT,
        rating INTEGER CHECK (rating >= 1 AND rating <= 5),
        feedback TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (student_id) REFERENCES users (id) ON DELETE CASCADE,
        FOREIGN KEY (counselor_id) REFERENCES users (id) ON DELETE CASCADE
      )`,

      // Mood entries for detailed mood tracking
      `CREATE TABLE IF NOT EXISTS mood_entries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        mood_level INTEGER NOT NULL CHECK (mood_level >= 1 AND mood_level <= 10),
        mood_tags TEXT, -- JSON array
        notes TEXT,
        energy_level INTEGER CHECK (energy_level >= 1 AND energy_level <= 10),
        stress_level INTEGER CHECK (stress_level >= 1 AND stress_level <= 10),
        sleep_hours REAL CHECK (sleep_hours >= 0 AND sleep_hours <= 24),
        sleep_quality INTEGER CHECK (sleep_quality >= 1 AND sleep_quality <= 5),
        activities TEXT, -- JSON array
        triggers TEXT, -- JSON array
        location TEXT,
        weather TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      )`,

      // Mental health assessment templates
      `CREATE TABLE IF NOT EXISTS mental_health_assessments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        category TEXT NOT NULL,
        estimated_duration INTEGER, -- in minutes
        question_count INTEGER,
        instructions TEXT, -- JSON object
        scoring_info TEXT, -- JSON object
        is_active BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,

      // Assessment questions
      `CREATE TABLE IF NOT EXISTS assessment_questions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        assessment_id INTEGER NOT NULL,
        question_text TEXT NOT NULL,
        question_type TEXT NOT NULL CHECK (question_type IN ('multiple_choice', 'scale', 'text', 'yes_no')),
        options TEXT, -- JSON array for multiple choice questions
        required BOOLEAN DEFAULT 1,
        order_index INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (assessment_id) REFERENCES mental_health_assessments (id) ON DELETE CASCADE
      )`,

      // Assessment responses/results
      `CREATE TABLE IF NOT EXISTS assessment_responses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        assessment_id INTEGER NOT NULL,
        responses TEXT NOT NULL, -- JSON object mapping question_id -> answer
        score INTEGER,
        completed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
        FOREIGN KEY (assessment_id) REFERENCES mental_health_assessments (id) ON DELETE CASCADE
      )`,

      // Admin profiles
      `CREATE TABLE IF NOT EXISTS admin_profiles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        name TEXT,
        phone TEXT,
        emergency_contact_name TEXT,
        emergency_contact_phone TEXT,
        employee_id TEXT,
        department TEXT,
        role_description TEXT,
        permissions TEXT, -- JSON array
        timezone TEXT,
        notification_preferences TEXT, -- JSON object
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      )`,

      // Resources
      `CREATE TABLE IF NOT EXISTS resources (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        type TEXT NOT NULL CHECK (type IN ('video', 'audio', 'pdf', 'article', 'exercise', 'worksheet')),
        category TEXT NOT NULL,
        subcategory TEXT,
        language TEXT DEFAULT 'en',
        url TEXT,
        file_path TEXT,
        thumbnail_url TEXT,
        duration_minutes INTEGER,
        file_size_mb REAL,
        page_count INTEGER,
        tags TEXT, -- JSON array
        difficulty_level TEXT CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
        age_group TEXT,
        is_featured BOOLEAN DEFAULT 0,
        is_active BOOLEAN DEFAULT 1,
        view_count INTEGER DEFAULT 0,
        download_count INTEGER DEFAULT 0,
        rating REAL DEFAULT 0,
        rating_count INTEGER DEFAULT 0,
        created_by INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (created_by) REFERENCES users (id)
      )`,

      // Resource ratings
      `CREATE TABLE IF NOT EXISTS resource_ratings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        resource_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
        review TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (resource_id) REFERENCES resources (id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
        UNIQUE(resource_id, user_id)
      )`,

      // Crisis alerts table
      `CREATE TABLE IF NOT EXISTS crisis_alerts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        risk_level TEXT NOT NULL CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
        risk_score INTEGER NOT NULL DEFAULT 0,
        trigger_type TEXT NOT NULL CHECK (trigger_type IN ('mood', 'assessment', 'manual', 'pattern')),
        trigger_data TEXT, -- JSON object with trigger details
        factors TEXT, -- JSON array of risk factors identified
        recommendations TEXT, -- JSON array of recommendations
        notes TEXT, -- Manual notes added by counselor
        requires_immediate_attention BOOLEAN DEFAULT 0,
        detected_by_user_id INTEGER, -- User who triggered the alert
        assigned_counselor_id INTEGER, -- Counselor assigned to handle the alert
        response_notes TEXT, -- Notes on the intervention/response
        intervention_taken BOOLEAN DEFAULT 0, -- Whether intervention was performed
        status TEXT DEFAULT 'new' CHECK (status IN ('new', 'acknowledged', 'in_progress', 'resolved', 'escalated')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
        FOREIGN KEY (detected_by_user_id) REFERENCES users (id) ON DELETE SET NULL,
        FOREIGN KEY (assigned_counselor_id) REFERENCES users (id) ON DELETE SET NULL
      )`,

      // Chatbot conversations table
      `CREATE TABLE IF NOT EXISTS chatbot_conversations (
        id TEXT PRIMARY KEY, -- UUID
        user_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        context TEXT, -- JSON object with conversation context
        status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'needs_human_support', 'escalated')),
        requires_counselor_attention BOOLEAN DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      )`,

      // Chatbot messages table
      `CREATE TABLE IF NOT EXISTS chatbot_messages (
        id TEXT PRIMARY KEY, -- UUID
        conversation_id TEXT NOT NULL,
        sender_type TEXT NOT NULL CHECK (sender_type IN ('user', 'bot')),
        content TEXT NOT NULL,
        message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'response', 'system')),
        categories TEXT, -- JSON array of message categories
        metadata TEXT, -- JSON object with additional message data
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (conversation_id) REFERENCES chatbot_conversations (id) ON DELETE CASCADE
      )`,

      // Chatbot analytics table
      `CREATE TABLE IF NOT EXISTS chatbot_analytics (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        conversation_id TEXT NOT NULL,
        categories TEXT, -- JSON array of detected categories
        crisis_indicators BOOLEAN DEFAULT 0,
        response_type TEXT, -- 'support', 'escalation', 'resource'
        user_satisfaction_predicted REAL, -- ML-based satisfaction prediction
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (conversation_id) REFERENCES chatbot_conversations (id) ON DELETE CASCADE
      )`,

      // Chatbot feedback table
      `CREATE TABLE IF NOT EXISTS chatbot_feedback (
        id TEXT PRIMARY KEY, -- UUID
        conversation_id TEXT NOT NULL,
        user_id INTEGER NOT NULL,
        rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
        feedback TEXT,
        helpful_responses TEXT, -- JSON array of helpful response IDs
        improvement_suggestions TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (conversation_id) REFERENCES chatbot_conversations (id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      )`,

      // Chatbot training data table for ML improvement
      `CREATE TABLE IF NOT EXISTS chatbot_training_data (
        id TEXT PRIMARY KEY, -- UUID
        conversation_id TEXT NOT NULL,
        user_input TEXT NOT NULL,
        bot_response TEXT NOT NULL,
        response_type TEXT NOT NULL CHECK (response_type IN ('rule_based', 'ml_enhanced', 'hybrid')),
        confidence_score REAL,
        context_data TEXT, -- JSON object with conversation context
        user_feedback INTEGER CHECK (user_feedback >= 1 AND user_feedback <= 5),
        feedback_timestamp DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (conversation_id) REFERENCES chatbot_conversations (id) ON DELETE CASCADE
      )`,

      // Chatbot improvement queue for low-rated responses
      `CREATE TABLE IF NOT EXISTS chatbot_improvement_queue (
        id TEXT PRIMARY KEY, -- UUID
        training_data_id TEXT NOT NULL,
        feedback_score INTEGER NOT NULL,
        requires_review BOOLEAN DEFAULT 1,
        reviewed_by INTEGER,
        improvement_notes TEXT,
        resolved BOOLEAN DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        resolved_at DATETIME,
        FOREIGN KEY (training_data_id) REFERENCES chatbot_training_data (id) ON DELETE CASCADE,
        FOREIGN KEY (reviewed_by) REFERENCES users (id) ON DELETE SET NULL
      )`,

      // ML model metrics and performance tracking
      `CREATE TABLE IF NOT EXISTS chatbot_ml_metrics (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        metric_type TEXT NOT NULL, -- 'response_quality', 'crisis_detection_accuracy', 'user_satisfaction'
        metric_value REAL NOT NULL,
        sample_size INTEGER NOT NULL,
        measurement_period TEXT, -- e.g., 'daily', 'weekly', 'monthly'
        model_version TEXT,
        additional_data TEXT, -- JSON object with additional metric details
        measured_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,

      // Forum Categories table
      `CREATE TABLE IF NOT EXISTS forum_categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        description TEXT,
        color TEXT NOT NULL DEFAULT '#3B82F6',
        is_anonymous_only BOOLEAN DEFAULT 1,
        requires_approval BOOLEAN DEFAULT 0,
        display_order INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,

      // Forum Posts table
      `CREATE TABLE IF NOT EXISTS forum_posts (
        id TEXT PRIMARY KEY, -- UUID
        category_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        is_anonymous BOOLEAN DEFAULT 1,
        has_crisis_indicators BOOLEAN DEFAULT 0,
        is_pinned BOOLEAN DEFAULT 0,
        status TEXT DEFAULT 'published' CHECK (status IN ('draft', 'published', 'removed', 'flagged')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        deleted_at DATETIME,
        FOREIGN KEY (category_id) REFERENCES forum_categories (id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      )`,

      // Forum Replies table
      `CREATE TABLE IF NOT EXISTS forum_replies (
        id TEXT PRIMARY KEY, -- UUID
        post_id TEXT NOT NULL,
        user_id INTEGER NOT NULL,
        content TEXT NOT NULL,
        is_anonymous BOOLEAN DEFAULT 1,
        has_crisis_indicators BOOLEAN DEFAULT 0,
        parent_reply_id TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        deleted_at DATETIME,
        FOREIGN KEY (post_id) REFERENCES forum_posts (id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
        FOREIGN KEY (parent_reply_id) REFERENCES forum_replies (id) ON DELETE CASCADE
      )`,

      // Forum Likes table
      `CREATE TABLE IF NOT EXISTS forum_likes (
        id TEXT PRIMARY KEY, -- UUID
        user_id INTEGER NOT NULL,
        post_id TEXT NOT NULL, -- Can be post ID or reply ID
        content_type TEXT NOT NULL CHECK (content_type IN ('post', 'reply')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      )`,

      // Forum Reports table
      `CREATE TABLE IF NOT EXISTS forum_reports (
        id TEXT PRIMARY KEY, -- UUID
        content_type TEXT NOT NULL CHECK (content_type IN ('post', 'reply')),
        content_id TEXT NOT NULL,
        reporter_id INTEGER NOT NULL,
        reason TEXT NOT NULL,
        description TEXT,
        status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
        reviewed_by INTEGER,
        reviewed_at DATETIME,
        resolution_notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (reporter_id) REFERENCES users (id) ON DELETE CASCADE,
        FOREIGN KEY (reviewed_by) REFERENCES users (id) ON DELETE SET NULL
      )`,

      // Moderation Logs table
      `CREATE TABLE IF NOT EXISTS moderation_logs (
        id TEXT PRIMARY KEY, -- UUID
        content_type TEXT NOT NULL CHECK (content_type IN ('forum_post', 'forum_reply')),
        content_id TEXT NOT NULL,
        moderator_id INTEGER NOT NULL,
        action TEXT NOT NULL,
        reason TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (moderator_id) REFERENCES users (id) ON DELETE CASCADE
      )`,


      // Create indexes for better performance
      `CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`,
      `CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)`,
      `CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)`,
      `CREATE INDEX IF NOT EXISTS idx_mood_entries_user_id ON mood_entries(user_id)`,
      `CREATE INDEX IF NOT EXISTS idx_mood_entries_created_at ON mood_entries(created_at)`,
      `CREATE INDEX IF NOT EXISTS idx_assessment_responses_user_id ON assessment_responses(user_id)`,
      `CREATE INDEX IF NOT EXISTS idx_assessment_responses_assessment_id ON assessment_responses(assessment_id)`,
      `CREATE INDEX IF NOT EXISTS idx_assessment_questions_assessment_id ON assessment_questions(assessment_id)`,
      `CREATE INDEX IF NOT EXISTS idx_mood_checkins_user_id ON mood_checkins(user_id)`,
      `CREATE INDEX IF NOT EXISTS idx_appointments_student_id ON appointments(student_id)`,
      `CREATE INDEX IF NOT EXISTS idx_appointments_counselor_id ON appointments(counselor_id)`,
      `CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date)`,
      `CREATE INDEX IF NOT EXISTS idx_resources_category ON resources(category)`,
      `CREATE INDEX IF NOT EXISTS idx_resources_type ON resources(type)`,
      `CREATE INDEX IF NOT EXISTS idx_resource_ratings_resource_id ON resource_ratings(resource_id)`,
      `CREATE INDEX IF NOT EXISTS idx_resource_ratings_user_id ON resource_ratings(user_id)`,
      `CREATE INDEX IF NOT EXISTS idx_student_profiles_user_id ON student_profiles(user_id)`,
      `CREATE INDEX IF NOT EXISTS idx_counselor_profiles_user_id ON counselor_profiles(user_id)`,
      `CREATE INDEX IF NOT EXISTS idx_admin_profiles_user_id ON admin_profiles(user_id)`,
      `CREATE INDEX IF NOT EXISTS idx_crisis_alerts_user_id ON crisis_alerts(user_id)`,
      `CREATE INDEX IF NOT EXISTS idx_crisis_alerts_risk_level ON crisis_alerts(risk_level)`,
      `CREATE INDEX IF NOT EXISTS idx_crisis_alerts_status ON crisis_alerts(status)`,
      `CREATE INDEX IF NOT EXISTS idx_crisis_alerts_assigned_counselor_id ON crisis_alerts(assigned_counselor_id)`,
      `CREATE INDEX IF NOT EXISTS idx_chatbot_conversations_user_id ON chatbot_conversations(user_id)`,
      `CREATE INDEX IF NOT EXISTS idx_chatbot_conversations_status ON chatbot_conversations(status)`,
      `CREATE INDEX IF NOT EXISTS idx_chatbot_conversations_requires_attention ON chatbot_conversations(requires_counselor_attention)`,
      `CREATE INDEX IF NOT EXISTS idx_chatbot_messages_conversation_id ON chatbot_messages(conversation_id)`,
      `CREATE INDEX IF NOT EXISTS idx_chatbot_messages_sender_type ON chatbot_messages(sender_type)`,
      `CREATE INDEX IF NOT EXISTS idx_chatbot_analytics_conversation_id ON chatbot_analytics(conversation_id)`,
      `CREATE INDEX IF NOT EXISTS idx_chatbot_analytics_crisis_indicators ON chatbot_analytics(crisis_indicators)`,
      `CREATE INDEX IF NOT EXISTS idx_chatbot_feedback_conversation_id ON chatbot_feedback(conversation_id)`,
      `CREATE INDEX IF NOT EXISTS idx_chatbot_feedback_user_id ON chatbot_feedback(user_id)`,
      `CREATE INDEX IF NOT EXISTS idx_chatbot_training_data_conversation_id ON chatbot_training_data(conversation_id)`,
      `CREATE INDEX IF NOT EXISTS idx_chatbot_training_data_response_type ON chatbot_training_data(response_type)`,
      `CREATE INDEX IF NOT EXISTS idx_chatbot_training_data_feedback ON chatbot_training_data(user_feedback)`,
      `CREATE INDEX IF NOT EXISTS idx_chatbot_improvement_queue_training_data_id ON chatbot_improvement_queue(training_data_id)`,
      `CREATE INDEX IF NOT EXISTS idx_chatbot_improvement_queue_requires_review ON chatbot_improvement_queue(requires_review)`,
      `CREATE INDEX IF NOT EXISTS idx_chatbot_ml_metrics_type ON chatbot_ml_metrics(metric_type)`,
      `CREATE INDEX IF NOT EXISTS idx_chatbot_ml_metrics_measured_at ON chatbot_ml_metrics(measured_at)`,
      `CREATE INDEX IF NOT EXISTS idx_forum_categories_active ON forum_categories(is_active)`,
      `CREATE INDEX IF NOT EXISTS idx_forum_categories_display_order ON forum_categories(display_order)`,
      `CREATE INDEX IF NOT EXISTS idx_forum_posts_category_id ON forum_posts(category_id)`,
      `CREATE INDEX IF NOT EXISTS idx_forum_posts_user_id ON forum_posts(user_id)`,
      `CREATE INDEX IF NOT EXISTS idx_forum_posts_status ON forum_posts(status)`,
      `CREATE INDEX IF NOT EXISTS idx_forum_posts_created_at ON forum_posts(created_at)`,
      `CREATE INDEX IF NOT EXISTS idx_forum_posts_crisis ON forum_posts(has_crisis_indicators)`,
      `CREATE INDEX IF NOT EXISTS idx_forum_replies_post_id ON forum_replies(post_id)`,
      `CREATE INDEX IF NOT EXISTS idx_forum_replies_user_id ON forum_replies(user_id)`,
      `CREATE INDEX IF NOT EXISTS idx_forum_replies_created_at ON forum_replies(created_at)`,
      `CREATE INDEX IF NOT EXISTS idx_forum_likes_user_id ON forum_likes(user_id)`,
      `CREATE INDEX IF NOT EXISTS idx_forum_likes_post_id ON forum_likes(post_id)`,
      `CREATE INDEX IF NOT EXISTS idx_forum_reports_status ON forum_reports(status)`,
      `CREATE INDEX IF NOT EXISTS idx_forum_reports_content ON forum_reports(content_type, content_id)`,
      `CREATE INDEX IF NOT EXISTS idx_moderation_logs_content ON moderation_logs(content_type, content_id)`,
      `CREATE INDEX IF NOT EXISTS idx_moderation_logs_moderator ON moderation_logs(moderator_id)`
    ];

    for (const table of tables) {
      try {
        // For CREATE TABLE statements, we don't need the return value
        await db.run(table, []);
        console.log(`✓ Table created/verified`);
      } catch (error) {
        console.error('Error creating table:', error);
        throw error;
      }
    }

    // Insert sample data if tables are empty
    await this.insertSampleData(db);
  }

  private async insertSampleData(db: DatabaseConnection): Promise<void> {
    try {
      // Check if we already have users
      const userCount = await db.get('SELECT COUNT(*) as count FROM users');
      
      if (userCount.count === 0) {
        console.log('🌱 Inserting sample data...');
        
        // Sample users (passwords will be hashed when creating through API)
        const sampleUsers = [
          {
            username: 'student1',
            email: 'student@university.edu',
            role: 'student',
            institution_id: 'UNIV001'
          },
          {
            username: 'counselor1',
            email: 'counselor@university.edu',
            role: 'counselor',
            institution_id: 'UNIV001'
          },
          {
            username: 'admin1',
            email: 'admin@university.edu',
            role: 'admin',
            institution_id: 'UNIV001'
          }
        ];

        // Note: In real implementation, we'll create these through the registration API
        // This is just for database schema validation
        console.log('📝 Sample data structure prepared (users will be created through API)');
      }
    } catch (error) {
      console.error('Error checking/inserting sample data:', error);
    }
  }
}

// Create singleton instance
const database = new Database();

export default database;