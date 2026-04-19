import React, { useState } from 'react';
import { Heart } from 'lucide-react';
import { Button, MoodSelector, VoiceInput } from './index';
import { MoodCheckIn } from '../../types';

interface MoodCheckInSectionProps {
  onMoodSubmit?: (mood: MoodCheckIn) => void;
  onMoodEntry: (entry: MoodCheckIn & { timestamp: Date; id: string }) => void;
}

const MoodCheckInSection: React.FC<MoodCheckInSectionProps> = ({ onMoodSubmit, onMoodEntry }) => {
  const [currentMood, setCurrentMood] = useState<number>(0);
  const [moodNotes, setMoodNotes] = useState<string>('');
  const [showMoodForm, setShowMoodForm] = useState(true);
  const [voiceLanguage, setVoiceLanguage] = useState('en-US');

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

  const handleSubmit = () => {
    if (currentMood > 0) {
      const moodData: MoodCheckIn = {
        mood: currentMood,
        notes: moodNotes,
        factors: [],
      };

      const entry = {
        ...moodData,
        timestamp: new Date(),
        id: `mood_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      };

      onMoodEntry(entry);
      onMoodSubmit?.(moodData);

      setShowMoodForm(false);
      setCurrentMood(0);
      setMoodNotes('');
    }
  };

  if (!showMoodForm) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 bg-gradient-to-r from-green-100 to-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
          <Heart className="w-8 h-8 text-green-500" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Mood recorded! ✨</h3>
        <Button onClick={() => setShowMoodForm(true)} variant="outline" size="sm">
          Add Another Entry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-4">
        <h3 className="text-lg font-medium text-gray-900 mb-2">How are you feeling right now?</h3>
        <p className="text-gray-600 text-sm">Take a moment to check in with yourself</p>
      </div>

      <MoodSelector value={currentMood} onChange={setCurrentMood} />

      {currentMood > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700">
              Any thoughts you'd like to share? (Optional)
            </label>
            <div className="flex items-center space-x-2">
              <span className="text-xs text-gray-500">💬 Type or</span>
              <VoiceInput
                value={moodNotes}
                onChange={setMoodNotes}
                language={voiceLanguage}
                placeholder="Click the microphone to speak..."
              />
            </div>
          </div>
          <div className="relative">
            <textarea
              value={moodNotes}
              onChange={(e) => setMoodNotes(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-gray-200 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-neon-blue-200 focus:border-neon-blue-500"
              placeholder="What's on your mind today?"
            />
            {moodNotes && (
              <div className="absolute top-2 right-2 text-xs text-gray-400">
                {moodNotes.length} characters
              </div>
            )}
          </div>
          <div className="mt-1 flex items-center justify-between">
            <span className="text-xs text-gray-500">💡 Tip: You can type your thoughts or use voice input</span>
            <select
              value={voiceLanguage}
              onChange={(e) => setVoiceLanguage(e.target.value)}
              className="text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-neon-blue-300"
            >
              <option value="en-US">🇺🇸 English</option>
              <option value="hi-IN">🇮🇳 Hindi</option>
              <option value="ur-PK">🇵🇰 Urdu</option>
              <option value="ks-IN">🏔️ Kashmiri</option>
              <option value="doi-IN">🏔️ Dogri</option>
            </select>
          </div>
        </div>
      )}

      <div className="flex space-x-3">
        <Button
          onClick={handleSubmit}
          variant="primary"
          disabled={currentMood === 0}
          className="flex-1 transform hover:scale-105 transition-all duration-200 shadow-lg"
        >
          💾 Save Mood Entry
        </Button>
        <Button
          onClick={() => { setShowMoodForm(false); setCurrentMood(0); setMoodNotes(''); }}
          variant="ghost"
        >
          Cancel
        </Button>
      </div>
    </div>
  );
};

export default MoodCheckInSection;
