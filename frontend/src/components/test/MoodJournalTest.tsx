import React, { useState } from 'react';
import StudentDashboard from '../../pages/StudentDashboard';
import { MoodCheckIn, User } from '../../types';

const MoodJournalTest: React.FC = () => {
  const [moodEntries, setMoodEntries] = useState<MoodCheckIn[]>([]);
  
  // Mock user data
  const mockUser: User = {
    id: 1,
    username: 'test_student',
    email: 'test@university.edu',
    role: 'student',
    institutionId: 'UNIV123',
    isActive: true,
    isVerified: true,
    languagePreference: 'en',
    createdAt: '2024-01-01',
    profile: {
      fullName: 'Test Student',
      yearOfStudy: 3,
      department: 'Computer Science',
      preferences: {
        language: 'en',
        notifications: true,
        anonymousMode: false
      }
    }
  };

  const handleMoodSubmit = (mood: MoodCheckIn) => {
    console.log('Mood submitted:', mood);
    setMoodEntries(prev => [...prev, mood]);
    
    // Show success message in console
    console.log('✅ Mood journal updated successfully!');
    console.log(`User is feeling: ${getMoodText(mood.mood)} ${getMoodEmoji(mood.mood)}`);
    if (mood.notes) {
      console.log(`Notes: "${mood.notes}"`);
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

  const handleLogout = () => {
    console.log('User logged out');
  };

  return (
    <div>
      {/* Display mood entries for testing */}
      {moodEntries.length > 0 && (
        <div className="fixed bottom-4 left-4 bg-white p-4 rounded-lg shadow-lg border max-w-sm z-50">
          <h4 className="font-bold text-gray-800 mb-2">🧪 Test Results:</h4>
          <div className="space-y-2">
            {moodEntries.map((entry, index) => (
              <div key={index} className="text-sm">
                <span className="font-medium">Entry {index + 1}:</span>
                <span className="ml-2">{getMoodText(entry.mood)} {getMoodEmoji(entry.mood)}</span>
                {entry.notes && (
                  <div className="text-xs text-gray-600 italic mt-1">
                    "{entry.notes}"
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      
      <StudentDashboard 
        user={mockUser}
        onMoodSubmit={handleMoodSubmit}
        onLogout={handleLogout}
      />
    </div>
  );
};

export default MoodJournalTest;