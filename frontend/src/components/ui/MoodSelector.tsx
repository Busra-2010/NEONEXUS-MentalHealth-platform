import React from 'react';

interface MoodSelectorProps {
  value: number;
  onChange: (mood: number) => void;
  className?: string;
}

const MoodSelector: React.FC<MoodSelectorProps> = ({
  value,
  onChange,
  className = '',
}) => {
  const moods = [
    { level: 1, emoji: '😢', label: 'Very Sad', color: 'text-red-500', bgColor: 'bg-red-100 hover:bg-red-200' },
    { level: 2, emoji: '😔', label: 'Sad', color: 'text-orange-500', bgColor: 'bg-orange-100 hover:bg-orange-200' },
    { level: 3, emoji: '😐', label: 'Okay', color: 'text-yellow-500', bgColor: 'bg-yellow-100 hover:bg-yellow-200' },
    { level: 4, emoji: '😊', label: 'Good', color: 'text-neon-mint-500', bgColor: 'bg-neon-mint-100 hover:bg-neon-mint-200' },
    { level: 5, emoji: '😄', label: 'Excellent', color: 'text-green-500', bgColor: 'bg-green-100 hover:bg-green-200' },
  ];

  return (
    <div className={`space-y-3 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-800 text-center">
        How are you feeling today?
      </h3>
      
      <div className="flex justify-center space-x-2 md:space-x-4">
        {moods.map((mood) => (
          <button
            key={mood.level}
            onClick={() => onChange(mood.level)}
            className={`
              relative p-3 md:p-4 rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-neon-blue-300
              ${value === mood.level 
                ? `${mood.bgColor.split('hover:')[0]} ring-2 ring-neon-blue-400 transform scale-110` 
                : `${mood.bgColor} hover:transform hover:scale-105`
              }
            `}
            type="button"
            aria-label={`Select ${mood.label} mood`}
          >
            <div className="text-2xl md:text-3xl mb-1">{mood.emoji}</div>
            <div className={`text-xs md:text-sm font-medium ${mood.color}`}>
              {mood.label}
            </div>
            
            {value === mood.level && (
              <div className="absolute -top-2 -right-2 w-5 h-5 bg-neon-blue-500 rounded-full flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            )}
          </button>
        ))}
      </div>
      
      {value > 0 && (
        <div className="text-center">
          <p className="text-sm text-gray-600">
            You selected: <span className="font-semibold">{moods[value - 1].label}</span>
          </p>
        </div>
      )}
    </div>
  );
};

export default MoodSelector;