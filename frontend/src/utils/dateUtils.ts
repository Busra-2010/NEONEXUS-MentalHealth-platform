/**
 * Date utility functions for NEONEXUS Mental Health Platform
 * Handles date formatting, validation, and calculations
 */

/**
 * Formats a date to a readable string
 */
export const formatDate = (date: Date | string, locale: string = 'en-US'): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  };
  
  return dateObj.toLocaleDateString(locale, options);
};

/**
 * Formats a date to a short string (MM/DD/YYYY)
 */
export const formatDateShort = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString('en-US');
};

/**
 * Formats time to readable format (12-hour with AM/PM)
 */
export const formatTime = (time: string): string => {
  const [hours, minutes] = time.split(':');
  const hour = parseInt(hours, 10);
  const period = hour >= 12 ? 'PM' : 'AM';
  const formattedHour = hour % 12 || 12;
  
  return `${formattedHour}:${minutes} ${period}`;
};

/**
 * Gets relative time string (e.g., "2 hours ago", "in 3 days")
 */
export const getRelativeTime = (date: Date | string, locale: string = 'en-US'): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = dateObj.getTime() - now.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (Math.abs(diffMins) < 60) {
    return diffMins > 0 ? `in ${diffMins} minutes` : `${Math.abs(diffMins)} minutes ago`;
  }
  
  if (Math.abs(diffHours) < 24) {
    return diffHours > 0 ? `in ${diffHours} hours` : `${Math.abs(diffHours)} hours ago`;
  }
  
  if (Math.abs(diffDays) < 7) {
    return diffDays > 0 ? `in ${diffDays} days` : `${Math.abs(diffDays)} days ago`;
  }
  
  return formatDate(dateObj, locale);
};

/**
 * Checks if a date is today
 */
export const isToday = (date: Date | string): boolean => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const today = new Date();
  
  return dateObj.getDate() === today.getDate() &&
    dateObj.getMonth() === today.getMonth() &&
    dateObj.getFullYear() === today.getFullYear();
};

/**
 * Checks if a date is tomorrow
 */
export const isTomorrow = (date: Date | string): boolean => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  return dateObj.getDate() === tomorrow.getDate() &&
    dateObj.getMonth() === tomorrow.getMonth() &&
    dateObj.getFullYear() === tomorrow.getFullYear();
};

/**
 * Gets the next 7 days from today
 */
export const getNext7Days = (): Date[] => {
  const days: Date[] = [];
  const today = new Date();
  
  for (let i = 0; i < 7; i++) {
    const date = new Date();
    date.setDate(today.getDate() + i);
    days.push(date);
  }
  
  return days;
};

/**
 * Validates if a date string is in valid format
 */
export const isValidDate = (dateString: string): boolean => {
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime());
};

/**
 * Gets the start and end of the current day
 */
export const getDayBounds = (date?: Date): { start: Date; end: Date } => {
  const targetDate = date || new Date();
  
  const start = new Date(targetDate);
  start.setHours(0, 0, 0, 0);
  
  const end = new Date(targetDate);
  end.setHours(23, 59, 59, 999);
  
  return { start, end };
};

/**
 * Converts UTC time to local timezone
 */
export const utcToLocal = (utcDate: Date | string): Date => {
  const date = typeof utcDate === 'string' ? new Date(utcDate) : utcDate;
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000);
};

/**
 * Converts local time to UTC
 */
export const localToUtc = (localDate: Date | string): Date => {
  const date = typeof localDate === 'string' ? new Date(localDate) : localDate;
  return new Date(date.getTime() + date.getTimezoneOffset() * 60000);
};