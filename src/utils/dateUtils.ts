import { format, formatDistanceToNow, isAfter, isBefore } from 'date-fns';

/**
 * Format a timestamp to a user-friendly date format
 */
export const formatDate = (timestamp: number): string => {
  return format(new Date(timestamp), 'MMMM d, yyyy');
};

/**
 * Format a timestamp to include time
 */
export const formatDateTime = (timestamp: number): string => {
  return format(new Date(timestamp), 'MMMM d, yyyy h:mm a');
};

/**
 * Get a relative time string (e.g., "2 days ago", "in 3 months")
 */
export const getRelativeTimeString = (timestamp: number): string => {
  const date = new Date(timestamp);
  const now = new Date();
  
  if (isAfter(date, now)) {
    return `in ${formatDistanceToNow(date)}`;
  }
  
  return `${formatDistanceToNow(date)} ago`;
};

/**
 * Check if a date is in the past
 */
export const isDatePassed = (timestamp: number): boolean => {
  return isBefore(new Date(timestamp), new Date());
};

/**
 * Format remaining time until a date
 */
export const formatRemainingTime = (timestamp: number): string => {
  const date = new Date(timestamp);
  const now = new Date();
  
  if (isBefore(date, now)) {
    return 'Time has passed';
  }
  
  return formatDistanceToNow(date);
};