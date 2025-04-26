import { IDateFormatter } from './date-formatter.interface';
import { InternationalizationService } from '../../../services';

/**
 * DateFormatter service implementation
 * Following the Single Responsibility Principle by focusing only on date formatting
 * and Open/Closed Principle by being easily extensible without modifying the code
 */
export class DateFormatter implements IDateFormatter {
  /**
   * Internationalization service reference
   * @private
   */
  private readonly i18nService: InternationalizationService;

  /**
   * Constructor
   * @param locale Default locale to use when none is specified
   */
  constructor(locale?: string) {
    // Get the internationalization service instance, passing in the locale if specified
    this.i18nService = InternationalizationService.getInstance(locale);
  }

  /**
   * Format a date according to the specified format string
   * @param date The date to format
   * @param format The format string to use
   * @param locale The locale to use for formatting (defaults to current locale in i18nService)
   * @returns The formatted date string
   */
  format(date: Date | null, format: string, locale?: string): string {
    if (!date) return '';
    
    // If the format is a named format pattern from Intl.DateTimeFormat
    if (['short', 'medium', 'long', 'full'].includes(format)) {
      return this.i18nService.formatDate(date, format, locale);
    }

    // Use the custom format pattern approach
    const useLocale = locale || this.i18nService.locale;
    
    // Get date components
    const year = date.getFullYear();
    const month = date.getMonth(); // 0-based
    const day = date.getDate();
    const dayOfWeek = date.getDay();
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const seconds = date.getSeconds();
    const milliseconds = date.getMilliseconds();
    
    // Initialize result with the format string
    let result = format;

    // If the format is 'locale', use the locale default pattern
    if (format === 'locale') {
      result = this.i18nService.getDateFormatPattern(useLocale);
    }
    
    // IMPORTANT: Order of replacements matters - we have to replace longer tokens first
    // and use exact token matching to avoid partial replacements within words
    
    // Create a function to safely replace tokens with values
    const replaceToken = (token: string, value: string) => {
      // Create a regex that matches the exact token
      const regex = new RegExp(token, 'g');
      result = result.replace(regex, value);
    };
    
    // Month names (full and abbreviated)
    if (result.includes('MMMM')) {
      const fullMonthName = new Date(year, month, 1).toLocaleString(useLocale, { month: 'long' });
      replaceToken('MMMM', fullMonthName);
    }
    
    if (result.includes('MMM')) {
      const shortMonthName = new Date(year, month, 1).toLocaleString(useLocale, { month: 'short' });
      replaceToken('MMM', shortMonthName);
    }
    
    // Weekday names (full, abbreviated, and narrow)
    if (result.includes('EEEE')) {
      const fullDayName = new Date(year, month, day).toLocaleString(useLocale, { weekday: 'long' });
      replaceToken('EEEE', fullDayName);
    }
    
    if (result.includes('EEE')) {
      const shortDayName = new Date(year, month, day).toLocaleString(useLocale, { weekday: 'short' });
      replaceToken('EEE', shortDayName);
    }
    
    if (result.includes('E')) {
      const narrowDayName = new Date(year, month, day).toLocaleString(useLocale, { weekday: 'narrow' });
      // We need to be careful with single character tokens
      // Only replace if it's a standalone token
      result = result.replace(/\bE\b/g, narrowDayName);
    }
    
    // Year formats
    if (result.includes('yyyy')) {
      replaceToken('yyyy', year.toString());
    } else if (result.includes('yy')) {
      const twoDigitYear = year.toString().slice(-2);
      replaceToken('yy', twoDigitYear);
    }
    
    // Month formats
    if (result.includes('MM')) {
      const twoDigitMonth = (month + 1).toString().padStart(2, '0');
      replaceToken('MM', twoDigitMonth);
    } else if (result.includes('M') && !result.includes('MMM')) {
      // Be careful with single character tokens
      // Either use a word boundary or ensure we're not replacing part of a longer token
      result = result.replace(/\bM\b/g, (month + 1).toString());
    }
    
    // Day formats
    if (result.includes('dd')) {
      const twoDigitDay = day.toString().padStart(2, '0');
      replaceToken('dd', twoDigitDay);
    } else if (result.includes('d') && !result.includes('dd')) {
      // Be careful with single character tokens
      result = result.replace(/\bd\b/g, day.toString());
    }
    
    // Time formats: Hours
    if (result.includes('HH')) {
      const twoDigitHour24 = hours.toString().padStart(2, '0');
      replaceToken('HH', twoDigitHour24);
    } else if (result.includes('H')) {
      result = result.replace(/\bH\b/g, hours.toString());
    }
    
    if (result.includes('hh')) {
      const hour12 = hours % 12 || 12;
      const twoDigitHour = hour12.toString().padStart(2, '0');
      replaceToken('hh', twoDigitHour);
    } else if (result.includes('h')) {
      const hour12 = hours % 12 || 12;
      result = result.replace(/\bh\b/g, hour12.toString());
    }
    
    // Minutes
    if (result.includes('mm')) {
      const twoDigitMinutes = minutes.toString().padStart(2, '0');
      replaceToken('mm', twoDigitMinutes);
    } else if (result.includes('m') && !result.includes('mm')) {
      result = result.replace(/\bm\b/g, minutes.toString());
    }
    
    // Seconds
    if (result.includes('ss')) {
      const twoDigitSeconds = seconds.toString().padStart(2, '0');
      replaceToken('ss', twoDigitSeconds);
    } else if (result.includes('s') && !result.includes('ss')) {
      result = result.replace(/\bs\b/g, seconds.toString());
    }
    
    // Milliseconds
    if (result.includes('SSS')) {
      const threeDigitMs = milliseconds.toString().padStart(3, '0');
      replaceToken('SSS', threeDigitMs);
    }
    
    // AM/PM indicator - Use a more specific pattern to match standalone 'a' token only
    if (result.includes('a')) {
      // Use localized AM/PM format
      const ampm = hours >= 12 ? 
        new Intl.DateTimeFormat(useLocale, { hour: 'numeric', hour12: true })
          .formatToParts(new Date(2023, 0, 1, 14))
          .find(part => part.type === 'dayPeriod')?.value || 'PM' : 
        new Intl.DateTimeFormat(useLocale, { hour: 'numeric', hour12: true })
          .formatToParts(new Date(2023, 0, 1, 10))
          .find(part => part.type === 'dayPeriod')?.value || 'AM';
      
      // Use a more robust pattern matching to handle standalone 'a'
      // This way the 'a' in 'samedi' (Saturday in French) won't be replaced
      result = result.replace(/(?:^|\s)a(?:$|\s)/g, (match) => {
        // Preserve the space before/after the 'a'
        if (match.startsWith(' ') && match.endsWith(' ')) return ` ${ampm} `;
        if (match.startsWith(' ')) return ` ${ampm}`;
        if (match.endsWith(' ')) return `${ampm} `;
        return ampm;
      });
    }
    
    // Quarter of year
    if (result.includes('Q')) {
      const quarter = Math.floor(month / 3) + 1;
      result = result.replace(/\bQ\b/g, quarter.toString());
    }
    
    // Day of year
    if (result.includes('DDD')) {
      const start = new Date(year, 0, 0);
      const diff = (date.getTime() - start.getTime());
      const oneDay = 1000 * 60 * 60 * 24;
      const dayOfYear = Math.floor(diff / oneDay).toString().padStart(3, '0');
      replaceToken('DDD', dayOfYear);
    } else if (result.includes('D') && !result.includes('DD') && !result.includes('DDD')) {
      const start = new Date(year, 0, 0);
      const diff = (date.getTime() - start.getTime());
      const oneDay = 1000 * 60 * 60 * 24;
      const dayOfYear = Math.floor(diff / oneDay).toString();
      result = result.replace(/\bD\b/g, dayOfYear);
    }
    
    // ISO week number
    if (result.includes('w')) {
      const firstDayOfYear = new Date(year, 0, 1);
      const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
      const weekNumber = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
      result = result.replace(/\bw\b/g, weekNumber.toString());
    }
    
    return result;
  }

  /**
   * Parse a string into a Date object
   * @param dateStr The date string to parse
   * @param format Optional format of the input string
   * @returns A Date object
   */
  parse(dateStr: string, format?: string): Date {
    // If it's in ISO format, use the built-in parsing
    if (dateStr.includes('-') && dateStr.split('-').length === 3) {
      const [yearStr, monthStr, dayStr] = dateStr.split('-');
      const year = parseInt(yearStr, 10);
      const month = parseInt(monthStr, 10) - 1; // Convert from 1-based to 0-based month
      const day = parseInt(dayStr, 10);
      
      // Use noon time to avoid timezone issues
      return new Date(year, month, day, 12, 0, 0);
    } 
    
    // If format is specified as 'locale', use the locale's date format for parsing
    if (format === 'locale') {
      const formatPattern = this.i18nService.getDateFormatPattern();
      const separator = this.i18nService.getDateSeparator();
      
      const parts = dateStr.split(separator);
      
      // Extract year, month, day based on the locale format pattern
      let year: number, month: number, day: number;
      
      // US format: MM/DD/YYYY
      if (formatPattern.startsWith('M')) {
        month = parseInt(parts[0], 10) - 1;
        day = parseInt(parts[1], 10);
        year = parseInt(parts[2], 10);
      }
      // YYYY/MM/DD format (Japan, China)
      else if (formatPattern.startsWith('y')) {
        year = parseInt(parts[0], 10);
        month = parseInt(parts[1], 10) - 1;
        day = parseInt(parts[2], 10);
      }
      // DD/MM/YYYY format (UK, Europe)
      else {
        day = parseInt(parts[0], 10);
        month = parseInt(parts[1], 10) - 1;
        year = parseInt(parts[2], 10);
      }
      
      return new Date(year, month, day, 12, 0, 0);
    }
    
    // If no specific format is provided, use the native parser with noon time
    const parsedDate = new Date(dateStr);
    if (!isNaN(parsedDate.getTime())) {
      return new Date(
        parsedDate.getFullYear(),
        parsedDate.getMonth(),
        parsedDate.getDate(),
        12, 0, 0
      );
    }
    
    // If parsing fails, throw an error
    throw new Error(`Failed to parse date string: ${dateStr}`);
  }

  /**
   * Get the name of a month in the specified locale
   * @param monthIndex Zero-based month index (0-11)
   * @param format Format of the month name ('long' or 'short')
   * @param locale The locale to use
   * @returns The localized month name
   */
  getMonthName(
    monthIndex: number, 
    format: 'long' | 'short' = 'long', 
    locale?: string
  ): string {
    const useLocale = locale || this.i18nService.locale;
    const date = new Date();
    date.setMonth(monthIndex);
    return date.toLocaleDateString(useLocale, { month: format });
  }

  /**
   * Get all month names for a locale
   * @param format Format of the month names ('long' or 'short')
   * @param locale The locale to use
   * @returns Array of localized month names
   */
  getMonthNames(format: 'long' | 'short' = 'long', locale?: string): string[] {
    const months = [];
    for (let i = 0; i < 12; i++) {
      months.push(this.getMonthName(i, format, locale));
    }
    return months;
  }

  /**
   * Get the name of a weekday in the specified locale
   * @param dayIndex Zero-based day index (0-6, where 0 is Sunday)
   * @param format Format of the weekday name ('long', 'short', or 'narrow')
   * @param locale The locale to use
   * @returns The localized weekday name
   */
  getWeekdayName(
    dayIndex: number, 
    format: 'long' | 'short' | 'narrow' = 'short', 
    locale?: string
  ): string {
    const useLocale = locale || this.i18nService.locale;
    const date = new Date();
    date.setDate(date.getDate() - date.getDay() + dayIndex);
    return date.toLocaleDateString(useLocale, { weekday: format });
  }
}