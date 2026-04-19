# NEONEXUS Database Schema Design

## Overview

This document outlines the database schema design for the NEONEXUS mental health support platform. The schema is designed to support all core features while maintaining data privacy, security, and scalability.

## Database Technology

- **Production**: PostgreSQL 14+
- **Development**: SQLite (for quick setup)
- **ORM**: To be implemented (Prisma or TypeORM)

## Schema Design Principles

1. **Privacy First**: Sensitive mental health data is encrypted and anonymized
2. **Audit Trail**: All critical actions are logged for compliance
3. **Scalability**: Designed to handle thousands of concurrent users
4. **Cultural Sensitivity**: Multi-language support built-in
5. **Data Integrity**: Proper constraints and relationships

## Core Tables

### 1. Users Table
Primary table for all user accounts (students, counselors, admins).

```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'student',
    institution_id VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    is_verified BOOLEAN DEFAULT false,
    language_preference VARCHAR(10) DEFAULT 'en',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP,
    privacy_settings JSONB DEFAULT '{}'
);

CREATE TYPE user_role AS ENUM ('student', 'counselor', 'admin', 'peer_volunteer');
```

### 2. Student Profiles
Extended information specific to students.

```sql
CREATE TABLE student_profiles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    full_name VARCHAR(255) NOT NULL,
    year_of_study INTEGER,
    department VARCHAR(100),
    date_of_birth DATE,
    gender VARCHAR(20),
    phone_number VARCHAR(20),
    emergency_contact JSONB,
    avatar_url VARCHAR(500),
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 3. Counselor Profiles
Extended information for counselors.

```sql
CREATE TABLE counselor_profiles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    full_name VARCHAR(255) NOT NULL,
    license_number VARCHAR(100) UNIQUE,
    specialization TEXT[],
    experience_years INTEGER,
    qualifications TEXT[],
    languages TEXT[],
    bio TEXT,
    avatar_url VARCHAR(500),
    is_available BOOLEAN DEFAULT true,
    hourly_rate DECIMAL(10,2),
    rating DECIMAL(3,2) DEFAULT 0.0,
    total_sessions INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 4. Mental Health Assessments
Store mood check-ins and screening results.

```sql
CREATE TABLE mental_health_assessments (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    assessment_type assessment_type NOT NULL,
    score INTEGER,
    mood_level INTEGER, -- 1-5 scale
    responses JSONB, -- Store detailed responses
    risk_level risk_level,
    notes TEXT,
    is_anonymous BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TYPE assessment_type AS ENUM ('mood_checkin', 'phq9', 'gad7', 'custom');
CREATE TYPE risk_level AS ENUM ('low', 'medium', 'high', 'crisis');
```

### 5. Appointments
Counseling session bookings and management.

```sql
CREATE TABLE appointments (
    id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    counselor_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    duration_minutes INTEGER DEFAULT 60,
    status appointment_status DEFAULT 'scheduled',
    meeting_type meeting_type DEFAULT 'video',
    meeting_url VARCHAR(500),
    is_anonymous BOOLEAN DEFAULT false,
    notes TEXT,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    feedback TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TYPE appointment_status AS ENUM ('scheduled', 'confirmed', 'completed', 'cancelled', 'no_show');
CREATE TYPE meeting_type AS ENUM ('video', 'audio', 'in_person');
```

### 6. Chatbot Conversations
Store AI chatbot interactions for analysis and improvement.

```sql
CREATE TABLE chatbot_conversations (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    conversation_id UUID UNIQUE NOT NULL,
    message_count INTEGER DEFAULT 0,
    language VARCHAR(10) DEFAULT 'en',
    crisis_detected BOOLEAN DEFAULT false,
    sentiment_score DECIMAL(3,2),
    satisfaction_rating INTEGER CHECK (satisfaction_rating >= 1 AND satisfaction_rating <= 5),
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);

CREATE TABLE chatbot_messages (
    id SERIAL PRIMARY KEY,
    conversation_id UUID REFERENCES chatbot_conversations(conversation_id) ON DELETE CASCADE,
    role message_role NOT NULL,
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TYPE message_role AS ENUM ('user', 'assistant', 'system');
```

### 7. Resources
Psychoeducational content library.

```sql
CREATE TABLE resources (
    id SERIAL PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    title_translations JSONB DEFAULT '{}', -- Multi-language titles
    description TEXT,
    description_translations JSONB DEFAULT '{}',
    type resource_type NOT NULL,
    category VARCHAR(100) NOT NULL,
    subcategory VARCHAR(100),
    language VARCHAR(10) DEFAULT 'en',
    url VARCHAR(1000),
    file_path VARCHAR(1000),
    thumbnail_url VARCHAR(500),
    duration_minutes INTEGER, -- For videos/audio
    file_size_mb DECIMAL(8,2),
    page_count INTEGER, -- For PDFs
    tags TEXT[],
    difficulty_level difficulty_level DEFAULT 'beginner',
    age_group VARCHAR(50),
    is_featured BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    view_count INTEGER DEFAULT 0,
    download_count INTEGER DEFAULT 0,
    rating DECIMAL(3,2) DEFAULT 0.0,
    rating_count INTEGER DEFAULT 0,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TYPE resource_type AS ENUM ('video', 'audio', 'pdf', 'article', 'exercise', 'worksheet');
CREATE TYPE difficulty_level AS ENUM ('beginner', 'intermediate', 'advanced');
```

### 8. Forum System
Peer support community features.

```sql
CREATE TABLE forum_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    name_translations JSONB DEFAULT '{}',
    description TEXT,
    color VARCHAR(7), -- Hex color code
    icon VARCHAR(50),
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE forum_posts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    category_id INTEGER REFERENCES forum_categories(id) ON DELETE SET NULL,
    title VARCHAR(500) NOT NULL,
    content TEXT NOT NULL,
    is_anonymous BOOLEAN DEFAULT false,
    is_pinned BOOLEAN DEFAULT false,
    is_locked BOOLEAN DEFAULT false,
    view_count INTEGER DEFAULT 0,
    reply_count INTEGER DEFAULT 0,
    upvote_count INTEGER DEFAULT 0,
    downvote_count INTEGER DEFAULT 0,
    tags TEXT[],
    language VARCHAR(10) DEFAULT 'en',
    moderation_status moderation_status DEFAULT 'approved',
    moderated_by INTEGER REFERENCES users(id),
    moderated_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_activity_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TYPE moderation_status AS ENUM ('pending', 'approved', 'rejected', 'flagged');

CREATE TABLE forum_replies (
    id SERIAL PRIMARY KEY,
    post_id INTEGER REFERENCES forum_posts(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    parent_reply_id INTEGER REFERENCES forum_replies(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_anonymous BOOLEAN DEFAULT false,
    upvote_count INTEGER DEFAULT 0,
    downvote_count INTEGER DEFAULT 0,
    moderation_status moderation_status DEFAULT 'approved',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE forum_votes (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    post_id INTEGER REFERENCES forum_posts(id) ON DELETE CASCADE,
    reply_id INTEGER REFERENCES forum_replies(id) ON DELETE CASCADE,
    vote_type vote_type NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, post_id, reply_id)
);

CREATE TYPE vote_type AS ENUM ('upvote', 'downvote');
```

### 9. Analytics & Reporting
Data for admin dashboard and insights.

```sql
CREATE TABLE user_sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    session_id VARCHAR(255) UNIQUE NOT NULL,
    ip_address INET,
    user_agent TEXT,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP,
    duration_minutes INTEGER,
    pages_visited INTEGER DEFAULT 0,
    features_used TEXT[]
);

CREATE TABLE activity_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50),
    resource_id INTEGER,
    metadata JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE system_metrics (
    id SERIAL PRIMARY KEY,
    metric_name VARCHAR(100) NOT NULL,
    metric_value DECIMAL(15,4),
    metric_unit VARCHAR(20),
    category VARCHAR(50),
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}'
);
```

### 10. Notifications
In-app and external notifications.

```sql
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    type notification_type NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    data JSONB DEFAULT '{}',
    is_read BOOLEAN DEFAULT false,
    is_email_sent BOOLEAN DEFAULT false,
    is_sms_sent BOOLEAN DEFAULT false,
    priority notification_priority DEFAULT 'normal',
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TYPE notification_type AS ENUM ('appointment', 'reminder', 'system', 'emergency', 'forum', 'achievement');
CREATE TYPE notification_priority AS ENUM ('low', 'normal', 'high', 'urgent');
```

## Indexes for Performance

```sql
-- User authentication
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_institution ON users(institution_id);

-- Appointments
CREATE INDEX idx_appointments_student ON appointments(student_id, appointment_date);
CREATE INDEX idx_appointments_counselor ON appointments(counselor_id, appointment_date);
CREATE INDEX idx_appointments_date ON appointments(appointment_date, appointment_time);

-- Mental Health Data
CREATE INDEX idx_assessments_user_date ON mental_health_assessments(user_id, created_at);
CREATE INDEX idx_assessments_risk ON mental_health_assessments(risk_level, created_at);

-- Chatbot
CREATE INDEX idx_conversations_user ON chatbot_conversations(user_id, started_at);
CREATE INDEX idx_messages_conversation ON chatbot_messages(conversation_id, created_at);

-- Resources
CREATE INDEX idx_resources_category ON resources(category, language);
CREATE INDEX idx_resources_featured ON resources(is_featured, is_active);
CREATE INDEX idx_resources_rating ON resources(rating DESC, view_count DESC);

-- Forum
CREATE INDEX idx_posts_category ON forum_posts(category_id, created_at DESC);
CREATE INDEX idx_posts_user ON forum_posts(user_id, created_at DESC);
CREATE INDEX idx_replies_post ON forum_replies(post_id, created_at);

-- Analytics
CREATE INDEX idx_activity_logs_user ON activity_logs(user_id, created_at);
CREATE INDEX idx_activity_logs_action ON activity_logs(action, created_at);
CREATE INDEX idx_user_sessions_user ON user_sessions(user_id, started_at);
```

## Security Considerations

### Data Encryption
- All sensitive fields (medical data, personal information) are encrypted at rest
- Passwords are hashed using bcrypt with salt rounds
- API communications use HTTPS/TLS

### Privacy Features
- Anonymous mode for sensitive interactions
- Data anonymization for analytics
- GDPR compliance with data export/deletion capabilities
- Role-based access control (RBAC)

### Audit Trail
- All critical actions are logged in activity_logs
- Immutable audit records for compliance
- Regular security audits and monitoring

## Migration Strategy

### Phase 1: Core Tables
1. Users and profiles
2. Basic authentication
3. Mental health assessments

### Phase 2: Feature Tables
1. Appointments system
2. Chatbot conversations
3. Resources library

### Phase 3: Community Features
1. Forum system
2. Notifications
3. Advanced analytics

### Phase 4: Optimization
1. Performance indexes
2. Data archiving
3. Advanced security features

## Backup and Recovery

- Daily automated backups
- Point-in-time recovery capability
- Disaster recovery plan with RTO < 4 hours
- Data retention policies compliant with regulations

## Compliance

- **HIPAA**: Healthcare data protection (US)
- **GDPR**: Data privacy (EU)
- **Personal Data Protection Act**: Privacy compliance (India)
- **Educational Records**: FERPA compliance for student data

---

This schema design provides a robust foundation for the NEONEXUS platform while maintaining security, privacy, and scalability requirements.