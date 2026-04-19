import React from 'react';
import { CardProps } from '../../types';

const Card: React.FC<CardProps> = ({
  children,
  className = '',
  padding = 'md',
  hoverable = false,
  onClick,
}) => {
  const baseClasses = 'bg-white rounded-xl shadow-sm border border-gray-100 transition-all duration-200';

  const paddingClasses = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  const hoverClasses = hoverable 
    ? 'hover:shadow-md hover:border-neon-blue-200 hover:-translate-y-0.5 cursor-pointer'
    : '';

  const combinedClasses = `${baseClasses} ${paddingClasses[padding]} ${hoverClasses} ${className}`;

  const CardWrapper = onClick ? 'button' : 'div';
  
  return React.createElement(
    CardWrapper,
    {
      className: combinedClasses,
      onClick: onClick,
      ...(CardWrapper === 'button' && { type: 'button' })
    },
    children
  );
};

export default Card;