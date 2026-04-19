import React from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { motion } from 'framer-motion';

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({ 
  className = '', 
  showLabel = false 
}) => {
  const { theme, effectiveTheme, toggleTheme } = useTheme();

  const getIcon = () => {
    switch (theme) {
      case 'light':
        return Sun;
      case 'dark':
        return Moon;
      case 'system':
        return Monitor;
      default:
        return Sun;
    }
  };

  const getLabel = () => {
    switch (theme) {
      case 'light':
        return 'Light';
      case 'dark':
        return 'Dark';
      case 'system':
        return 'System';
      default:
        return 'Light';
    }
  };

  const Icon = getIcon();

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={toggleTheme}
      className={`
        relative inline-flex items-center px-3 py-2 rounded-lg transition-all duration-200
        ${effectiveTheme === 'dark' 
          ? 'bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700' 
          : 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 shadow-sm'
        }
        ${className}
      `}
      title={`Switch theme (Current: ${getLabel()})`}
    >
      <motion.div
        initial={false}
        animate={{ 
          rotate: theme === 'system' ? 360 : 0,
          scale: [1, 1.1, 1]
        }}
        transition={{ 
          rotate: { duration: 0.3 },
          scale: { duration: 0.2 }
        }}
        className="flex items-center"
      >
        <Icon className="w-4 h-4" />
      </motion.div>
      
      {showLabel && (
        <span className="ml-2 text-sm font-medium">
          {getLabel()}
        </span>
      )}
    </motion.button>
  );
};

export default ThemeToggle;