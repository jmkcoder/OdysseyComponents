/**
 * Interface for date formatting service
 * Following the Interface Segregation Principle by providing
 * focused methods for date formatting operations
 */
export interface IDateFormatter {
  /**
   * Format a date according to the specified format string
   * @param date The date to format
   * @param format The format string to use
   * @param locale The locale to use for formatting
   * @returns The formatted date string
   */
  format(date: Date | null, format: string, locale?: string): string;
  
  /**
   * Parse a string into a Date object
   * @param dateStr The date string to parse
   * @param format Optional format of the input string
   * @returns A Date object
   */
  parse(dateStr: string, format?: string): Date | null;
  
  /**
   * Get the name of a month in the specified locale
   * @param monthIndex Zero-based month index (0-11)
   * @param format Format of the month name ('long' or 'short')
   * @param locale The locale to use
   * @returns The localized month name
   */
  getMonthName(monthIndex: number, format?: 'long' | 'short', locale?: string): string;
  
  /**
   * Get an array of all month names
   * @param format Format of the month names ('long' or 'short')
   * @param locale The locale to use
   * @returns Array of localized month names
   */
  getMonthNames(format?: 'long' | 'short', locale?: string): string[];
  
  /**
   * Get the name of a weekday in the specified locale
   * @param dayIndex Zero-based day index (0-6, where 0 is Sunday)
   * @param format Format of the weekday name ('long', 'short', or 'narrow')
   * @param locale The locale to use
   * @returns The localized weekday name
   */
  getWeekdayName(dayIndex: number, format?: 'long' | 'short' | 'narrow', locale?: string): string;
  
  /**
   * Get an array of all weekday names
   * @param format Format of the weekday names ('long', 'short', or 'narrow')
   * @param locale The locale to use
   * @returns Array of localized weekday names
   */
  getWeekdayNames(format?: 'long' | 'short' | 'narrow', locale?: string): string[];
}