import React from 'react';
import { Heart, Loader } from 'lucide-react';

interface LoadingProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'spinner' | 'pulse' | 'dots' | 'heart';
  text?: string;
  fullScreen?: boolean;
  className?: string;
}

const Loading: React.FC<LoadingProps> = ({
  size = 'md',
  variant = 'spinner',
  text,
  fullScreen = false,
  className = ''
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  };

  const textSizes = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl'
  };

  const SpinnerLoader = () => (
    <Loader className={`${sizeClasses[size]} animate-spin text-neon-blue-500`} />
  );

  const PulseLoader = () => (
    <div className={`${sizeClasses[size]} bg-neon-blue-500 rounded-full animate-pulse`} />
  );

  const DotsLoader = () => (
    <div className="flex space-x-1">
      <div className={`${sizeClasses[size]} bg-neon-blue-500 rounded-full animate-bounce`} />
      <div 
        className={`${sizeClasses[size]} bg-neon-lavender-500 rounded-full animate-bounce`}
        style={{ animationDelay: '0.1s' }}
      />
      <div 
        className={`${sizeClasses[size]} bg-neon-mint-500 rounded-full animate-bounce`}
        style={{ animationDelay: '0.2s' }}
      />
    </div>
  );

  const HeartLoader = () => (
    <Heart 
      className={`${sizeClasses[size]} text-neon-blue-500 animate-pulse`}
      style={{
        animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
      }}
    />
  );

  const renderLoader = () => {
    switch (variant) {
      case 'pulse':
        return <PulseLoader />;
      case 'dots':
        return <DotsLoader />;
      case 'heart':
        return <HeartLoader />;
      default:
        return <SpinnerLoader />;
    }
  };

  const content = (
    <div className={`flex flex-col items-center justify-center space-y-3 ${className}`}>
      {renderLoader()}
      {text && (
        <p className={`${textSizes[size]} text-gray-600 animate-pulse font-medium`}>
          {text}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white bg-opacity-90 backdrop-blur-sm flex items-center justify-center z-50">
        {content}
      </div>
    );
  }

  return content;
};

// Pre-built loading variants for common use cases
export const PageLoader: React.FC<{ text?: string }> = ({ text = 'Loading...' }) => (
  <Loading 
    variant="heart" 
    size="lg" 
    text={text} 
    fullScreen 
    className="bg-gradient-to-br from-neon-lavender-50 to-neon-blue-50" 
  />
);

export const ComponentLoader: React.FC<{ text?: string; size?: 'sm' | 'md' | 'lg' }> = ({ 
  text, 
  size = 'md' 
}) => (
  <Loading variant="spinner" size={size} text={text} className="py-8" />
);

export const ButtonLoader: React.FC = () => (
  <Loading variant="spinner" size="sm" className="mx-2" />
);

export const InlineLoader: React.FC<{ text?: string }> = ({ text }) => (
  <div className="flex items-center space-x-2">
    <Loading variant="spinner" size="sm" />
    {text && <span className="text-sm text-gray-600">{text}</span>}
  </div>
);

export default Loading;