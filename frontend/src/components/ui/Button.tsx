import React from 'react';
import { ButtonProps } from '../../types';

const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  children,
  onClick,
  disabled = false,
  loading = false,
  className = '',
  type = 'button',
}) => {
  const baseClasses = 'font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2';

  const variantClasses = {
    primary: 'bg-neon-blue-500 hover:bg-neon-blue-600 text-white focus:ring-neon-blue-300 shadow-sm hover:shadow-md',
    secondary: 'bg-neon-lavender-500 hover:bg-neon-lavender-600 text-white focus:ring-neon-lavender-300 shadow-sm hover:shadow-md',
    outline: 'border-2 border-neon-blue-500 text-neon-blue-600 hover:bg-neon-blue-50 focus:ring-neon-blue-300 bg-white',
    ghost: 'text-neon-blue-600 hover:bg-neon-blue-50 focus:ring-neon-blue-300',
    danger: 'bg-red-500 hover:bg-red-600 text-white focus:ring-red-300 shadow-sm hover:shadow-md',
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  const combinedClasses = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`;

  return (
    <button
      type={type}
      className={combinedClasses}
      onClick={onClick}
      disabled={disabled || loading}
    >
      {loading && (
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
      )}
      {children}
    </button>
  );
};

export default Button;