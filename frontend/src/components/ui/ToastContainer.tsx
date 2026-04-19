import React from 'react';

// Backward compatibility component - the actual toasts are rendered by NotificationProvider
// This component is kept for compatibility but doesn't need props since NotificationProvider handles everything
interface ToastContainerProps {
  toasts?: any[];
  onRemove?: (id: string) => void;
}

const ToastContainer: React.FC<ToastContainerProps> = () => {
  return null; // NotificationProvider handles toast rendering
};

export default ToastContainer;