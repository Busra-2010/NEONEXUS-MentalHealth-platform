// User and Authentication Types
export interface User {
  id: number;
  username: string;
  email: string;
  role: UserRole;
  institutionId?: string;
  isActive: boolean;
  isVerified: boolean;
  languagePreference: Language;
  createdAt: string;
  lastLoginAt?: string;
  profile?: StudentProfile | CounselorProfile | AdminProfile;
}

export type UserRole = 'student' | 'counselor' | 'admin' | 'peer_volunteer';

export type Language = 'en' | 'hi' | 'ur' | 'ks' | 'doi';

export interface StudentProfile {
  fullName: string;
  yearOfStudy?: number;
  department?: string;
  dateOfBirth?: string;
  gender?: string;
  phoneNumber?: string;
  emergencyContact?: EmergencyContact;
  avatarUrl?: string;
  preferences: UserPreferences;
}

export interface CounselorProfile {
  fullName: string;
  licenseNumber?: string;
  specialization: string[];
  experienceYears: number;
  qualifications: string[];
  languages: string[];
  bio?: string;
  avatarUrl?: string;
  isAvailable: boolean;
  // Sessions are now free - hourlyRate removed
  rating: number;
  totalSessions: number;
}

export interface AdminProfile {
  fullName: string;
  institution: string;
  department?: string;
}

export interface EmergencyContact {
  name: string;
  relationship: string;
  phoneNumber: string;
  email?: string;
}

export interface UserPreferences {
  language: Language;
  notifications: boolean;
  anonymousMode: boolean;
  darkMode?: boolean;
}

// Mental Health Assessment Types
export interface MentalHealthAssessment {
  id: number;
  userId: number;
  assessmentType: AssessmentType;
  score?: number;
  moodLevel?: number; // 1-5 scale
  responses?: Record<string, any>;
  riskLevel?: RiskLevel;
  notes?: string;
  isAnonymous: boolean;
  createdAt: string;
}

export type AssessmentType = 'mood_checkin' | 'phq9' | 'gad7' | 'custom';
export type RiskLevel = 'low' | 'medium' | 'high' | 'crisis';

export interface MoodCheckIn {
  mood: number; // 1-5 scale
  notes?: string;
  factors?: string[];
}

// Appointment Types
export interface Appointment {
  id: string;
  studentId: number;
  counselorId: number;
  counselor?: CounselorProfile;
  appointmentDate: string;
  appointmentTime: string;
  durationMinutes: number;
  status: AppointmentStatus;
  meetingType: MeetingType;
  meetingUrl?: string;
  isAnonymous: boolean;
  notes?: string;
  rating?: number;
  feedback?: string;
  createdAt: string;
  updatedAt: string;
}

export type AppointmentStatus = 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';
export type MeetingType = 'video' | 'audio' | 'in_person';

export interface TimeSlot {
  time: string;
  available: boolean;
  date: string;
}

// Chatbot Types
export interface ChatMessage {
  id?: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  language?: Language;
  metadata?: Record<string, any>;
}

export interface ChatConversation {
  id: string;
  userId: number;
  messages: ChatMessage[];
  language: Language;
  crisisDetected: boolean;
  sentimentScore?: number;
  satisfactionRating?: number;
  startedAt: string;
  endedAt?: string;
  isActive: boolean;
}

export interface ChatbotResponse {
  response: string;
  language: Language;
  suggestions?: string[];
  conversationId: string;
  crisisDetected?: boolean;
  resources?: EmergencyResource[];
}

export interface EmergencyResource {
  type: 'emergency' | 'mentalHealth' | 'counselor';
  number?: string;
  text: string;
  available?: boolean;
  message?: string;
}

// Chat API Types (backend /api/chat/* contract)
export interface ChatSessionResponse {
  success: boolean;
  sessionId: string;
  createdAt: string;
}

export interface ChatMessageResponse {
  success: boolean;
  reply: string;
  crisisDetected: boolean;
  intent: string;
  confidence: number;
  helplines?: Helpline[];
  severity?: string;
}

export interface Helpline {
  name: string;
  number: string;
  available: string;
}

export interface ScreeningStartResponse {
  success: boolean;
  screeningName: string;
  instruction: string;
  question: string;
  questionIndex: number;
  totalQuestions: number;
  options: string[];
}

export interface ScreeningAnswerResponse {
  success: boolean;
  done: boolean;
  question?: string;
  questionIndex?: number;
  totalQuestions?: number;
  options?: string[];
  score?: number;
  severity?: string;
  severityKey?: string;
  answers?: number[];
}

export type ScreeningType = 'PHQ9' | 'GAD7' | 'GHQ12';

// Resource Types
export interface Resource {
  id: number;
  title: string;
  titleTranslations?: Partial<Record<Language, string>>;
  description: string;
  descriptionTranslations?: Partial<Record<Language, string>>;
  type: ResourceType;
  category: ResourceCategory;
  subcategory?: string;
  language: Language;
  url?: string;
  filePath?: string;
  thumbnailUrl?: string;
  durationMinutes?: number;
  fileSizeMb?: number;
  pageCount?: number;
  tags: string[];
  difficultyLevel: DifficultyLevel;
  ageGroup?: string;
  isFeatured: boolean;
  isActive: boolean;
  viewCount: number;
  downloadCount?: number;
  rating: number;
  ratingCount: number;
  createdBy?: number;
  createdAt: string;
  updatedAt: string;
}

export type ResourceType = 'video' | 'audio' | 'pdf' | 'article' | 'exercise' | 'worksheet';
export type ResourceCategory = 'Stress Relief' | 'Sleep' | 'Academic Pressure' | 'Anxiety' | 'Depression' | 'Self-Care';
export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced';

// Forum Types
export interface ForumCategory {
  id: number;
  name: string;
  nameTranslations?: Record<Language, string>;
  description?: string;
  color?: string;
  icon?: string;
  sortOrder: number;
  isActive: boolean;
  postCount?: number;
}

export interface ForumPost {
  id: number;
  userId?: number;
  categoryId: number;
  category?: ForumCategory;
  title: string;
  content: string;
  author: ForumAuthor;
  isAnonymous: boolean;
  isPinned: boolean;
  isLocked: boolean;
  viewCount: number;
  replyCount: number;
  upvoteCount: number;
  downvoteCount: number;
  tags: string[];
  language: Language;
  moderationStatus: ModerationStatus;
  createdAt: string;
  updatedAt: string;
  lastActivityAt: string;
  replies?: ForumReply[];
}

export interface ForumReply {
  id: number;
  postId: number;
  userId?: number;
  parentReplyId?: number;
  content: string;
  author: ForumAuthor;
  isAnonymous: boolean;
  upvoteCount: number;
  downvoteCount: number;
  moderationStatus: ModerationStatus;
  createdAt: string;
  updatedAt: string;
  replies?: ForumReply[];
}

export interface ForumAuthor {
  id: string;
  username: string;
  isAnonymous: boolean;
  year?: number;
  department?: string;
  isVerified?: boolean;
  isPeerVolunteer?: boolean;
}

export type ModerationStatus = 'pending' | 'approved' | 'rejected' | 'flagged';

export interface PeerVolunteer {
  id: number;
  name: string;
  year: number;
  department: string;
  specialties: string[];
  rating: number;
  totalHelpedStudents: number;
  isOnline: boolean;
  languages: string[];
  bio?: string;
  avatarUrl?: string;
}

// Analytics Types
export interface DashboardAnalytics {
  overview: {
    totalUsers: number;
    activeUsers: number;
    totalSessions: number;
    averageSessionTime: string;
  };
  mentalHealthTrends: {
    currentWeek: {
      moodCheckIns: number;
      screeningCompleted: number;
      counselorSessions: number;
      crisisInterventions: number;
    };
    moodDistribution: Record<string, number>;
  };
  resourceUsage: {
    mostViewedCategory: string;
    totalResourceViews: number;
    averageRating: number;
    topResources: Array<{
      title: string;
      views: number;
    }>;
  };
  appointments: {
    totalBooked: number;
    completed: number;
    canceled: number;
    noShow: number;
    averageRating: number;
  };
  forumActivity: {
    totalPosts: number;
    totalReplies: number;
    activeDiscussions: number;
    peerVolunteers: number;
  };
}

export interface WellbeingTrend {
  date: string;
  moodAverage: number;
  screeningScores: number;
  engagementRate: number;
}

export interface CounselorMetric {
  id: number;
  name: string;
  totalSessions: number;
  averageRating: number;
  completionRate: number;
  studentSatisfaction: number;
  specialization: string;
}

// Notification Types
export interface Notification {
  id: number;
  userId: number;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
  isRead: boolean;
  priority: NotificationPriority;
  expiresAt?: string;
  createdAt: string;
}

export type NotificationType = 'appointment' | 'reminder' | 'system' | 'emergency' | 'forum' | 'achievement';
export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';

// UI Component Props
export interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
}

export interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'sm' | 'md' | 'lg';
  hoverable?: boolean;
  onClick?: () => void;
}

export interface InputProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  type?: 'text' | 'email' | 'password' | 'number' | 'tel';
  required?: boolean;
  disabled?: boolean;
  error?: string;
  className?: string;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// App State Types
export interface AppState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  language: Language;
  theme: 'light' | 'dark';
  notifications: Notification[];
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  isLoading: boolean;
  error: string | null;
}

// Form Types
export interface LoginForm {
  email: string;
  password: string;
  remember?: boolean;
}

export interface RegisterForm {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  institutionId: string;
  fullName: string;
  acceptTerms: boolean;
}

export interface MoodCheckInForm {
  mood: number;
  factors: string[];
  notes: string;
  isAnonymous: boolean;
}

export interface AppointmentBookingForm {
  counselorId: number;
  date: string;
  time: string;
  meetingType: MeetingType;
  isAnonymous: boolean;
  notes?: string;
}

// Route Types
export interface RouteConfig {
  path: string;
  component: React.ComponentType;
  exact?: boolean;
  protected?: boolean;
  roles?: UserRole[];
}

// Error Types
export interface AppError {
  code: string;
  message: string;
  details?: any;
}

// Theme Types
export interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text: {
    primary: string;
    secondary: string;
    disabled: string;
  };
  status: {
    success: string;
    warning: string;
    error: string;
    info: string;
  };
}