import React, { useState } from 'react';
import { Heart, TrendingUp, BarChart3 } from 'lucide-react';
import { Card, Button } from './index';
import { MoodCheckIn } from '../../types';

type MoodEntry = MoodCheckIn & { timestamp: Date; id: string };

interface MoodJournalSectionProps {
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

const formatDate = (date: Date) => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHrs < 24) return `${diffHrs} hour${diffHrs !== 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
  return date.toLocaleDateString();
};

const MoodJournalSection: React.FC<MoodJournalSectionProps> = ({ moodHistory }) => {
  const [showHistory, setShowHistory] = useState(false);

  const getAverageMood = () => {
    if (moodHistory.length === 0) return 0;
    const sum = moodHistory.reduce((acc, e) => acc + e.mood, 0);
    return Math.round((sum / moodHistory.length) * 10) / 10;
  };

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

  if (moodHistory.length === 0) {
    return (
      <Card padding="lg">
        <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
          <BarChart3 className="w-5 h-5 mr-2 text-neon-lavender-500" />
          Mood Journal
        </h2>
        <div className="text-center py-8 text-gray-500">
          <Heart className="w-8 h-8 mx-auto mb-3 text-gray-300" />
          <p>No mood entries yet. Start tracking your mood to see your journey!</p>
        </div>
      </Card>
    );
  }

  const trend = getMoodTrend();

  return (
    <Card padding="lg">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900 flex items-center">
          <BarChart3 className="w-5 h-5 mr-2 text-neon-lavender-500" />
          Mood Journal
        </h2>
        <div className="flex items-center space-x-3">
          <div className="text-sm text-gray-500">
            Avg: {getMoodEmoji(Math.round(getAverageMood()))} {getAverageMood()}/5
          </div>
          <Button
            onClick={() => setShowHistory(!showHistory)}
            variant="ghost"
            size="sm"
            className="text-neon-blue-600 hover:text-neon-blue-700"
          >
            {showHistory ? 'Hide History' : 'View History'}
          </Button>
        </div>
      </div>

      {/* Trend summary */}
      <div className="bg-gradient-to-r from-neon-blue-50 to-neon-lavender-50 rounded-xl p-4 border border-neon-blue-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              trend === 'improving' ? 'bg-green-100' :
              trend === 'declining' ? 'bg-red-100' : 'bg-blue-100'
            }`}>
              <TrendingUp className={`w-5 h-5 ${
                trend === 'improving' ? 'text-green-600' :
                trend === 'declining' ? 'text-red-600 transform rotate-180' : 'text-blue-600'
              }`} />
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Your mood trend is {trend}</h3>
              <p className="text-sm text-gray-600">{moodHistory.length} entries • Average: {getAverageMood()}/5</p>
            </div>
          </div>
          <div className="text-2xl">
            {trend === 'improving' ? '📈' : trend === 'declining' ? '📉' : '📊'}
          </div>
        </div>
      </div>

      {/* History entries */}
      {showHistory && (
        <div className="mt-4 space-y-3 max-h-96 overflow-y-auto">
          <div className="text-sm font-medium text-gray-700 mb-3 border-b pb-2">Recent Entries</div>
          {moodHistory.map((entry) => (
            <div key={entry.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center space-x-3">
                  <div className="text-2xl">{getMoodEmoji(entry.mood)}</div>
                  <div>
                    <h4 className="font-medium text-gray-900">{getMoodText(entry.mood)}</h4>
                    <p className="text-sm text-gray-500">{formatDate(entry.timestamp)}</p>
                  </div>
                </div>
                <div className="text-sm text-gray-400">{entry.mood}/5</div>
              </div>
              {entry.notes && (
                <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-700 italic">"{entry.notes}"</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};

export default MoodJournalSection;
