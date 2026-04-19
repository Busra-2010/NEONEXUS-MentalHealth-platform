import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, BookOpen, Users, Clock, Award, Heart, ClipboardList, TrendingUp, BarChart3 } from 'lucide-react';
import { Card, Button } from './index';
import { MoodCheckIn } from '../../types';

type MoodEntry = MoodCheckIn & { timestamp: Date; id: string };

interface SidebarWidgetsProps {
  quickStats: {
    sessionsCompleted: number;
    resourcesViewed: number;
    forumPosts: number;
    streakDays: number;
    moodCheckins: number;
  };
  moodHistory: MoodEntry[];
}

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

const SidebarWidgets: React.FC<SidebarWidgetsProps> = ({ quickStats, moodHistory }) => {
  const navigate = useNavigate();

  const getMoodTrend = () => {
    if (moodHistory.length < 2) return 'stable';
    const recent = moodHistory.slice(0, 3).reduce((a, e) => a + e.mood, 0) / Math.min(3, moodHistory.length);
    const older = moodHistory.slice(3, 6);
    if (older.length === 0) return 'stable';
    const olderAvg = older.reduce((a, e) => a + e.mood, 0) / older.length;
    if (recent > olderAvg + 0.5) return 'improving';
    if (recent < olderAvg - 0.5) return 'declining';
    return 'stable';
  };

  const trend = getMoodTrend();

  return (
    <div className="space-y-6">
      {/* Mood Trends Chart */}
      {moodHistory.length > 0 && (
        <Card padding="lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <BarChart3 className="w-4 h-4 mr-2 text-neon-lavender-500" />
            Mood Trends
          </h3>
          <div className="space-y-2">
            {moodHistory.slice(0, 7).reverse().map((entry) => (
              <div key={entry.id} className="flex items-center space-x-2">
                <div className="text-xs text-gray-500 w-12 text-right">
                  {entry.timestamp.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </div>
                <div className="flex-1 bg-gray-200 rounded-full h-3 relative">
                  <div
                    className={`h-3 rounded-full transition-all duration-500 ${
                      entry.mood === 1 ? 'bg-red-400' :
                      entry.mood === 2 ? 'bg-orange-400' :
                      entry.mood === 3 ? 'bg-yellow-400' :
                      entry.mood === 4 ? 'bg-green-400' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${(entry.mood / 5) * 100}%` }}
                  />
                </div>
                <div className="text-lg w-8">{getMoodEmoji(entry.mood)}</div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-3 border-t border-gray-200">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">7-day trend:</span>
              <div className={`flex items-center space-x-1 font-medium ${
                trend === 'improving' ? 'text-green-600' :
                trend === 'declining' ? 'text-red-600' : 'text-blue-600'
              }`}>
                <TrendingUp className={`w-3 h-3 ${trend === 'declining' ? 'transform rotate-180' : ''}`} />
                <span className="capitalize">{trend}</span>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Quick Stats */}
      <Card padding="lg">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Progress</h3>
        <div className="space-y-4">
          {[
            { icon: Calendar, color: 'text-neon-mint-500', label: 'Sessions', value: quickStats.sessionsCompleted },
            { icon: BookOpen, color: 'text-neon-blue-500', label: 'Resources', value: quickStats.resourcesViewed },
            { icon: Users, color: 'text-neon-lavender-500', label: 'Forum Posts', value: quickStats.forumPosts },
            { icon: Heart, color: 'text-pink-500', label: 'Mood Check-ins', value: quickStats.moodCheckins },
            { icon: Award, color: 'text-yellow-500', label: 'Streak', value: `${quickStats.streakDays} days` },
          ].map(({ icon: Icon, color, label, value }) => (
            <div key={label} className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Icon className={`w-4 h-4 ${color}`} />
                <span className="text-sm text-gray-600">{label}</span>
              </div>
              <span className="font-semibold text-gray-900">{value}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Upcoming Appointments */}
      <Card padding="lg">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Upcoming</h3>
        <div className="space-y-3">
          <div className="p-3 bg-neon-mint-50 rounded-lg border border-neon-mint-200">
            <div className="flex items-center space-x-2 mb-1">
              <Clock className="w-4 h-4 text-neon-mint-600" />
              <span className="text-sm font-medium text-neon-mint-800">Session Tomorrow</span>
            </div>
            <p className="text-sm text-neon-mint-700">Dr. Priya Sharma - 3:00 PM</p>
          </div>
          <div className="p-3 bg-red-50 rounded-lg border border-red-200">
            <div className="flex items-center space-x-2 mb-1">
              <ClipboardList className="w-4 h-4 text-red-600" />
              <span className="text-sm font-medium text-red-800">Mental Health Screening</span>
            </div>
            <p className="text-sm text-red-700 mb-2">Complete your PHQ-9 and GAD-7 assessments</p>
            <button
              onClick={() => navigate('/screening')}
              className="text-xs bg-red-600 text-white px-3 py-1 rounded-full hover:bg-red-700 transition-colors"
            >
              Take Assessments
            </button>
          </div>
        </div>
        <Button variant="outline" size="sm" className="w-full mt-4" onClick={() => navigate('/appointments')}>
          View All Appointments
        </Button>
      </Card>

      {/* Wellness Tip */}
      <Card padding="lg" className="bg-gradient-to-br from-neon-blue-50 to-neon-lavender-50 border-neon-blue-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">💡 Today's Wellness Tip</h3>
        <p className="text-sm text-gray-700 mb-4">
          "Take 5 minutes for deep breathing exercises. It can significantly reduce stress and improve focus for your studies."
        </p>
        <Button variant="ghost" size="sm" onClick={() => navigate('/resources')}>
          Explore More Tips
        </Button>
      </Card>
    </div>
  );
};

export default SidebarWidgets;
