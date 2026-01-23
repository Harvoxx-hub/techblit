/**
 * Date utility functions for handling various date formats
 * Handles Firestore timestamps, ISO strings, Date objects, and Unix timestamps
 */

/**
 * Parse a date from various formats (Firestore timestamp, ISO string, Date, number)
 * @param date - Date in any format
 * @returns Date object or null if invalid
 */
export function parseDate(date: any): Date | null {
  if (!date) return null;

  try {
    // Handle Firestore timestamp objects (serialized from API)
    if (date && typeof date === 'object') {
      // Check for serialized Firestore timestamp with _seconds
      if ('_seconds' in date && typeof date._seconds === 'number') {
        return new Date(date._seconds * 1000);
      }
      
      // Check for Firestore timestamp with seconds property
      if ('seconds' in date && typeof date.seconds === 'number') {
        return new Date(date.seconds * 1000);
      }
      
      // Check for Firestore timestamp with toDate method (client-side SDK)
      if (typeof date.toDate === 'function') {
        try {
          return date.toDate();
        } catch {
          // If toDate fails, try other methods
        }
      }
      
      // Check if it's already a Date object
      if (date instanceof Date) {
        return isNaN(date.getTime()) ? null : date;
      }
      
      // Try to parse as regular object (might have timestamp properties)
      if ('toISOString' in date && typeof date.toISOString === 'function') {
        return date as Date;
      }
    }
    
    // Handle string dates (ISO format or other)
    if (typeof date === 'string') {
      const parsed = new Date(date);
      return isNaN(parsed.getTime()) ? null : parsed;
    }
    
    // Handle number (Unix timestamp in seconds or milliseconds)
    if (typeof date === 'number') {
      // If number is less than year 2000 in milliseconds, assume it's in seconds
      const timestamp = date < 946684800000 ? date * 1000 : date;
      const parsed = new Date(timestamp);
      return isNaN(parsed.getTime()) ? null : parsed;
    }
    
    return null;
  } catch (error) {
    console.warn('Error parsing date:', error, date);
    return null;
  }
}

/**
 * Format a date to a readable string
 * @param date - Date in any format
 * @param options - Intl.DateTimeFormatOptions
 * @returns Formatted date string or empty string if invalid
 */
export function formatDate(
  date: any,
  options: Intl.DateTimeFormatOptions = {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }
): string {
  const dateObj = parseDate(date);
  if (!dateObj) return '';

  try {
    return new Intl.DateTimeFormat('en-US', options).format(dateObj);
  } catch (error) {
    console.warn('Error formatting date:', error, date);
    return '';
  }
}

/**
 * Format a date to locale date string (short format)
 * @param date - Date in any format
 * @returns Formatted date string or 'Unknown date' if invalid
 */
export function formatDateShort(date: any): string {
  const formatted = formatDate(date, {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
  return formatted || 'Unknown date';
}

/**
 * Format a date to locale date string (long format with time)
 * @param date - Date in any format
 * @returns Formatted date string or 'Unknown date' if invalid
 */
export function formatDateTime(date: any): string {
  const formatted = formatDate(date, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short'
  });
  return formatted || 'Unknown date';
}

/**
 * Get ISO string from date
 * @param date - Date in any format
 * @returns ISO string or undefined if invalid
 */
export function getISODateString(date: any): string | undefined {
  const dateObj = parseDate(date);
  if (!dateObj) return undefined;
  return dateObj.toISOString();
}
