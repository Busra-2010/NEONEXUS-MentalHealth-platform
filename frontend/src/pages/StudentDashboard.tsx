import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, MessageCircle, Calendar, BookOpen, Users, ClipboardList } from 'lucide-react';
import { Navigation, Card, MoodCheckInSection, QuickActionsGrid, MoodJournalSection, SidebarWidgets } from '../components/ui';
import { User, MoodCheckIn } from '../types';
import '../styles/animations.css';
import { useLanguage } from '../contexts/LanguageContext';

interface StudentDashboardProps {
  user?: User;
  onLogout?: () => void;
  onMoodSubmit?: (mood: MoodCheckIn) => void;
}

const StudentDashboard: React.FC<StudentDashboardProps> = ({
  user,
  onLogout,
  onMoodSubmit,
}) => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const [moodHistory, setMoodHistory] = useState<Array<MoodCheckIn & { timestamp: Date; id: string }>>([]);
  const [recentActivityList, setRecentActivityList] = useState([
    {
      type: 'mood',
      message: 'Completed daily mood check-in',
      time: '2 hours ago',
      icon: Heart,
      color: 'text-neon-blue-500'
    },
    {
      type: 'resource',
      message: 'Watched "Managing Exam Stress"',
      time: '1 day ago',
      icon: BookOpen,
      color: 'text-neon-lavender-500'
    },
    {
      type: 'appointment',
      message: 'Session with Dr. Priya Sharma',
      time: '3 days ago',
      icon: Calendar,
      color: 'text-neon-mint-500'
    },
  ]);

  const [quickStats, setQuickStats] = useState({
    sessionsCompleted: 3,
    resourcesViewed: 12,
    forumPosts: 5,
    streakDays: 7,
    moodCheckins: 12,
  });

  const quickActions = [
    {
      title: t('mentalHealthScreening', 'Mental Health Screening'),
      description: t('takePHQGAD', 'Take PHQ-9, GAD-7 assessments'),
      icon: ClipboardList,
      color: 'from-red-500 to-pink-500',
      path: '/screening',
      urgent: true,
    },
    {
      title: t('chatSupport', 'Chat Support'),
      description: t('talkToAI', 'Talk to our AI assistant'),
      icon: MessageCircle,
      color: 'from-neon-lavender-500 to-neon-lavender-600',
      path: '/chat',
      urgent: false,
    },
    {
      title: t('bookSession', 'Book Session'),
      description: t('scheduleWithCounselor', 'Schedule with a counselor'),
      icon: Calendar,
      color: 'from-neon-mint-500 to-neon-mint-600',
      path: '/appointments',
      urgent: false,
    },
    {
      title: t('browseResources', 'Browse Resources'),
      description: t('educationalContent', 'Educational content library'),
      icon: BookOpen,
      color: 'from-neon-blue-500 to-neon-blue-600',
      path: '/resources',
      urgent: false,
    },
    {
      title: t('joinCommunity', 'Join Community'),
      description: t('connectPeerSupport', 'Connect with peer support'),
      icon: Users,
      color: 'from-neon-lavender-500 to-neon-blue-500',
      path: '/forum',
      urgent: false,
    },
  ];

  const handleMoodEntry = (entry: MoodCheckIn & { timestamp: Date; id: string }) => {
    setMoodHistory(prev => [entry, ...prev].slice(0, 30));

    const getMoodText = (mood: number) => {
      switch (mood) {
        case 1: return 'Very Sad';
        case 2: return 'Sad';
        case 3: return 'Neutral';
        case 4: return 'Happy';
        case 5: return 'Very Happy';
        default: return 'Neutral';
      }
    };

    const getMoodEmoji = (mood: number) => {
      switch (mood) {
        case 1: return '😢';
        case 2: return '😕';
        case 3: return '😐';
        case 4: return '😊';
        case 5: return '😁';
        default: return '😐';
      }
    };

    const newActivity = {
      type: 'mood',
      message: `Recorded mood as ${getMoodText(entry.mood)} ${getMoodEmoji(entry.mood)}`,
      time: 'Just now',
      icon: Heart,
      color: 'text-green-500'
    };

    setRecentActivityList(prev => [newActivity, ...prev.slice(0, 4)]);
    setQuickStats(prev => ({
      ...prev,
      moodCheckins: prev.moodCheckins + 1,
      streakDays: prev.streakDays + 1
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation
        userRole="student"
        userName={user?.profile?.fullName || 'Student'}
        unreadNotifications={3}
        onLogout={onLogout}
      />

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Welcome Section */}
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-gradient-to-r from-neon-blue-500 via-neon-lavender-500 to-neon-mint-500 rounded-xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold">
                  Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 17 ? 'Afternoon' : 'Evening'}, {user?.profile?.fullName?.split(' ')[0] || 'Student'}! 👋
                </h1>
                <p className="mt-2 text-blue-100">
                  {t('welcome', 'Welcome')} back to your mental wellness journey. {t('howFeelingToday', 'How are you feeling today?')}
                </p>
              </div>
              <div className="hidden md:block">
                <div className="w-20 h-20 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                  <Heart className="w-10 h-10 text-white" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="px-4 sm:px-0">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Mood Check-in Section */}
              <Card padding="lg">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                    <Heart className="w-5 h-5 mr-2 text-neon-blue-500" />
                    {t('moodCheckIn', 'Daily Mood Check-in')}
                  </h2>
                  <span className="text-sm text-gray-500">
                    {quickStats.streakDays} day streak! 🔥
                  </span>
                </div>
                <MoodCheckInSection
                  onMoodEntry={handleMoodEntry}
                  onMoodSubmit={onMoodSubmit}
                />
              </Card>

              {/* Quick Actions */}
              <Card padding="lg">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">
                  {t('quickActions', 'Quick Actions')}
                </h2>
                <QuickActionsGrid actions={quickActions} />
              </Card>

              {/* Mood Journal History */}
              <MoodJournalSection moodHistory={moodHistory} />

              {/* Recent Activity */}
              <Card padding="lg">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">
                  {t('recentActivity', 'Recent Activity')}
                </h2>
                <div className="space-y-4">
                  {recentActivityList.map((activity, index) => (
                    <div key={`${activity.time}-${index}`} className="flex items-center space-x-3 py-2">
                      <div className="flex-shrink-0">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          activity.time === 'Just now' ? 'bg-green-100' : 'bg-gray-100'
                        }`}>
                          <activity.icon className={`w-4 h-4 ${activity.color}`} />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm ${
                          activity.time === 'Just now' ? 'text-green-900 font-medium' : 'text-gray-900'
                        }`}>
                          {activity.message}
                        </p>
                        <p className={`text-xs ${
                          activity.time === 'Just now' ? 'text-green-600 font-medium' : 'text-gray-500'
                        }`}>
                          {activity.time}
                          {activity.time === 'Just now' && (
                            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              New
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <SidebarWidgets quickStats={quickStats} moodHistory={moodHistory} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default StudentDashboard;