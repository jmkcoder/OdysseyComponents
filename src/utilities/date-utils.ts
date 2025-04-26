/**
 * Utility class for date-related functions
 * Centralizes common date operations used across various components
 */
export class DateUtils {
  /**
   * Format a date as YYYY-MM-DD
   */
  static formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Format a date to ISO string (YYYY-MM-DD)
   */
  static formatISODate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  /**
   * Parse a date string in YYYY-MM-DD format
   */
  static parseDate(dateString: string): Date | null {
    if (!dateString) return null;
    
    // Try to parse the date string
    const parts = dateString.split('-');
    if (parts.length !== 3) return null;
    
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1; // Months are 0-based in JS
    const day = parseInt(parts[2], 10);
    
    if (isNaN(year) || isNaN(month) || isNaN(day)) return null;
    
    const date = new Date(year, month, day);
    
    // Validate the date is valid
    if (date.getFullYear() !== year || date.getMonth() !== month || date.getDate() !== day) {
      return null;
    }
    
    return date;
  }

  /**
   * Parse an ISO date string (YYYY-MM-DD)
   */
  static parseISODate(dateString: string): Date | null {
    return this.parseDate(dateString);
  }

  /**
   * Check if two dates are the same day (ignoring time)
   */
  static isSameDay(date1: Date, date2: Date): boolean {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  }

  /**
   * Add specified number of days to a date
   */
  static addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }

  /**
   * Add specified number of months to a date
   */
  static addMonths(date: Date, months: number): Date {
    const result = new Date(date);
    result.setMonth(result.getMonth() + months);
    
    // Handle edge case when adding months can skip to the next month
    // For example, Jan 31 + 1 month would be Mar 3 (in non-leap years)
    // We want it to be Feb 28/29 instead
    const originalDate = date.getDate();
    const newDate = result.getDate();
    
    if (originalDate !== newDate) {
      // Set to the last day of the previous month
      result.setDate(0);
    }
    
    return result;
  }

  /**
   * Get the first day of the month for a given date
   */
  static getFirstDayOfMonth(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), 1);
  }

  /**
   * Get the last day of the month for a given date
   */
  static getLastDayOfMonth(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0);
  }

  /**
   * Get today's date with time set to midnight
   */
  static getToday(): Date {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  }

  /**
   * Check if a date is today
   */
  static isToday(date: Date): boolean {
    const today = new Date();
    return this.isSameDay(date, today);
  }

  /**
   * Check if a date is in the current month
   */
  static isCurrentMonth(date: Date, currentMonth: Date): boolean {
    return (
      date.getMonth() === currentMonth.getMonth() &&
      date.getFullYear() === currentMonth.getFullYear()
    );
  }

  /**
   * Check if a date is disabled based on min/max constraints
   * Supports inclusive minimum date
   */
  static isDateDisabled(date: Date, minDate: Date | null = null, maxDate: Date | null = null): boolean {
    if (!date) return true;
    
    const testDate = new Date(date);
    testDate.setHours(0, 0, 0, 0);
    
    if (minDate) {
      // First check if it's the same day as min date (which should be allowed)
      if (this.isSameDay(testDate, minDate)) {
        return false;
      }
      
      // Otherwise check if it's less than min date
      if (testDate < minDate) {
        return true;
      }
    }
    
    if (maxDate && testDate > maxDate) {
      return true;
    }
    
    return false;
  }
}