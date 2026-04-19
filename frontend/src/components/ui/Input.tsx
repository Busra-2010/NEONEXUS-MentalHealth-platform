import React from 'react';
import { InputProps } from '../../types';

const Input: React.FC<InputProps> = ({
  label,
  placeholder,
  value,
  onChange,
  type = 'text',
  required = false,
  disabled = false,
  error,
  className = '',
}) => {
  const inputId = React.useId();

  const inputClasses = `
    w-full px-4 py-3 rounded-xl border-2 transition-all duration-300 transform
    focus:outline-none focus:ring-4 focus:scale-[1.02]
    disabled:bg-gray-50 disabled:cursor-not-allowed
    placeholder:text-gray-400 font-medium
    ${error 
      ? 'border-red-300 focus:border-red-500 focus:ring-red-100 bg-red-50/30' 
      : 'border-gray-200 focus:border-neon-blue-400 focus:ring-neon-blue-100 hover:border-gray-300'
    }
    ${disabled ? 'bg-gray-50 text-gray-400' : 'bg-white/90 text-gray-800 shadow-sm hover:shadow-md'}
  `;

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <label 
          htmlFor={inputId}
          className="block text-sm font-bold text-gray-700 mb-2 flex items-center space-x-2"
        >
          <span>{label}</span>
          {required && (
            <span className="inline-flex items-center justify-center w-5 h-5 bg-red-100 rounded-full">
              <span className="text-red-500 text-xs font-bold">*</span>
            </span>
          )}
        </label>
      )}
      
      <input
        id={inputId}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        className={inputClasses.replace(/\s+/g, ' ').trim()}
      />
      
      {error && (
        <p className="text-sm text-red-600 flex items-center gap-1">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
};

export default Input;