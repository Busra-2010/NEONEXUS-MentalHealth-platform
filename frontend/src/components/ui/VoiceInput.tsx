import React, { useEffect } from 'react';
import { Mic, MicOff, Volume2, AlertCircle } from 'lucide-react';
import { useVoiceInput } from '../../hooks/useVoiceInput';

interface VoiceInputProps {
  value: string;
  onChange: (value: string) => void;
  onVoiceStart?: () => void;
  onVoiceEnd?: () => void;
  disabled?: boolean;
  language?: string;
  placeholder?: string;
  className?: string;
}

const VoiceInput: React.FC<VoiceInputProps> = ({
  value,
  onChange,
  onVoiceStart,
  onVoiceEnd,
  disabled = false,
  language = 'en-US',
  placeholder = 'Click the microphone to speak...',
  className = '',
}) => {
  const {
    isListening,
    transcript,
    interimTranscript,
    error,
    isSupported,
    startListening,
    stopListening,
    resetTranscript,
  } = useVoiceInput({ language });

  // Handle voice transcript updates
  useEffect(() => {
    if (transcript) {
      const newValue = value ? `${value} ${transcript}` : transcript;
      onChange(newValue);
      resetTranscript();
    }
  }, [transcript, value, onChange, resetTranscript]);

  // Call callbacks when voice starts/stops
  useEffect(() => {
    if (isListening && onVoiceStart) {
      onVoiceStart();
    } else if (!isListening && onVoiceEnd) {
      onVoiceEnd();
    }
  }, [isListening, onVoiceStart, onVoiceEnd]);

  const handleToggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  if (!isSupported) {
    return (
      <div className="flex items-center space-x-2 text-gray-500 text-sm">
        <AlertCircle className="w-4 h-4" />
        <span>Voice input not supported in this browser</span>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {/* Voice Input Button */}
      <button
        type="button"
        onClick={handleToggleListening}
        disabled={disabled}
        className={`
          flex items-center justify-center w-10 h-10 rounded-full transition-all duration-200 
          ${isListening 
            ? 'bg-red-500 hover:bg-red-600 shadow-lg animate-pulse' 
            : 'bg-neon-blue-500 hover:bg-neon-blue-600 shadow-md hover:shadow-lg'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:scale-105'}
          focus:outline-none focus:ring-2 focus:ring-offset-2 
          ${isListening ? 'focus:ring-red-300' : 'focus:ring-neon-blue-300'}
        `}
        title={isListening ? 'Stop recording' : 'Start voice input'}
      >
        {isListening ? (
          <MicOff className="w-5 h-5 text-white" />
        ) : (
          <Mic className="w-5 h-5 text-white" />
        )}
      </button>

      {/* Voice Status Indicator */}
      {isListening && (
        <div className="absolute -bottom-12 left-1/2 transform -translate-x-1/2 z-10">
          <div className="bg-red-500 text-white px-3 py-1 rounded-full text-xs font-medium shadow-lg flex items-center space-x-2 animate-bounce">
            <Volume2 className="w-3 h-3" />
            <span>Listening...</span>
          </div>
        </div>
      )}

      {/* Interim Transcript Display */}
      {(isListening && interimTranscript) && (
        <div className="absolute -bottom-20 left-0 right-0 z-10">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 shadow-sm">
            <div className="text-xs text-blue-600 font-medium mb-1">Speaking:</div>
            <div className="text-sm text-gray-700 italic">"{interimTranscript}"</div>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="absolute -bottom-16 left-0 right-0 z-10">
          <div className="bg-red-50 border border-red-200 rounded-lg p-2 shadow-sm">
            <div className="flex items-center space-x-1 text-red-600 text-xs">
              <AlertCircle className="w-3 h-3" />
              <span>{error}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VoiceInput;