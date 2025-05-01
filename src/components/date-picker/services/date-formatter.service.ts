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
   * @returns A Date object or null if parsing fails
   */
  parse(dateStr: string, format?: string): Date | null {
    if (!dateStr) return null;
    
    try {
      return this.parseWithFormat(dateStr, format);
    } catch (e) {
      throw new Error(`Failed to parse date string: ${dateStr}`);
    }
  }

  /**
   * Internal parsing method that handles different format patterns
   * @param dateStr The date string to parse
   * @param format Optional format pattern
   * @returns A Date object or null if parsing fails
   */
  private parseWithFormat(dateStr: string, format?: string): Date | null {
    // Special handling for two-digit year formats (like dd-MM-yy)
    // Store the last successfully parsed format for consistent results
    // This helps prevent the date from switching back and forth
    const originalDateStr = dateStr;
    
    // If a specific format is provided, parse according to that format
    if (format && format !== 'locale') {
      // Determine the expected position of day, month, and year based on the format
      const isDayFirst = format.indexOf('d') < format.indexOf('M'); 
      const isYearFirst = format.indexOf('y') === 0;
      const isYearTwoDigit = format.includes('yy') && !format.includes('yyyy');

      // Get the separator from the format - look for common separators
      let formatSeparator = format.replace(/[a-zA-Z]/g, '')[0];
      if (!formatSeparator || formatSeparator === ' ') {
        // If we couldn't find a separator in the format, try to infer from dateStr
        for (const sep of ['-', '/', '.', ' ']) {
          if (dateStr.includes(sep)) {
            formatSeparator = sep;
            break;
          }
        }
      }
      // Default separator if we still don't have one
      formatSeparator = formatSeparator || '-';
      
      // Split the date string using the same separator as in the format
      const parts = dateStr.split(formatSeparator).map(part => part.trim());
      if (parts.length === 3) {
        let yearPart: number, monthPart: number, dayPart: number;

        if (isYearFirst) {
          // Format is year-month-day (e.g. yyyy-MM-dd or yy-MM-dd)
          yearPart = parseInt(parts[0], 10);
          monthPart = parseInt(parts[1], 10) - 1; // 0-based month
          dayPart = parseInt(parts[2], 10);
        } else if (isDayFirst) {
          // Format is day-month-year (e.g. dd-MM-yyyy or dd-MM-yy)
          dayPart = parseInt(parts[0], 10);
          monthPart = parseInt(parts[1], 10) - 1; // 0-based month
          yearPart = parseInt(parts[2], 10);
        } else {
          // Format is month-day-year (e.g. MM-dd-yyyy or MM-dd-yy)
          monthPart = parseInt(parts[0], 10) - 1; // 0-based month
          dayPart = parseInt(parts[1], 10);
          yearPart = parseInt(parts[2], 10);
        }

        // Handle two-digit years based on the format
        if (yearPart < 100) {
          if (isYearTwoDigit) {
            // If format explicitly uses 'yy', treat as 21st century date unless it would result in a future date > 30 years ahead
            const currentYear = new Date().getFullYear();
            const currentCentury = Math.floor(currentYear / 100) * 100;
            const fullYear = currentCentury + yearPart;
            
            // If resulting date would be > 30 years in the future, use previous century
            if (fullYear > currentYear + 30) {
              yearPart = fullYear - 100;
            } else {
              yearPart = fullYear;
            }
          } else {
            // Default behavior for formats that don't specify yy
            yearPart = yearPart + (yearPart > 50 ? 1900 : 2000);
          }
        }

        // Validate the parsed date parts
        if (isNaN(yearPart) || isNaN(monthPart) || isNaN(dayPart)) {
          return null;
        }

        // Check for valid month and day ranges
        if (monthPart < 0 || monthPart > 11 || dayPart < 1 || dayPart > 31) {
          return null;
        }

        // Store this successfully parsed date in a static map to ensure consistency
        // This helps prevent switching between different interpretations
        if (!DateFormatter._parsedDatesCache) {
          DateFormatter._parsedDatesCache = new Map<string, Date>();
        }
        
        const resultDate = new Date(yearPart, monthPart, dayPart, 12, 0, 0);
        DateFormatter._parsedDatesCache.set(originalDateStr, resultDate);
        
        return resultDate;
      }
    }
    
    // Before proceeding with fallback parsing, check if we've already parsed this string previously
    if (DateFormatter._parsedDatesCache?.has(originalDateStr)) {
      return DateFormatter._parsedDatesCache.get(originalDateStr)!;
    }
    
    // If it's in ISO format (yyyy-MM-dd), use specialized parsing
    if (dateStr.includes('-') && dateStr.split('-').length === 3) {
      const [yearStr, monthStr, dayStr] = dateStr.split('-');
      const year = parseInt(yearStr, 10);
      const month = parseInt(monthStr, 10) - 1; // Convert from 1-based to 0-based month
      const day = parseInt(dayStr, 10);
      
      // Special handling for ambiguous dates like 22-04-25
      // If both parts could be valid days, and this looks like it could be a dd-MM-yy format:
      if (yearStr.length === 2 && monthStr.length <= 2 && dayStr.length <= 2) {
        // Check if both the first and last segments could be days (1-31)
        const firstNum = parseInt(yearStr, 10);
        const lastNum = parseInt(dayStr, 10);
        
        if (firstNum >= 1 && firstNum <= 31 && lastNum >= 1 && lastNum <= 31) {
          // This might be a misinterpreted dd-MM-yy as yy-MM-dd
          // Don't try to interpret it without a format - return null to avoid confusion
          return null;
        }
      }
      
      // Validate the parsed date parts
      if (isNaN(year) || isNaN(month) || isNaN(day)) {
        return null;
      }

      // Check for valid month and day ranges
      if (month < 0 || month > 11 || day < 1 || day > 31) {
        return null;
      }
      
      // Use noon time to avoid timezone issues
      const resultDate = new Date(year, month, day, 12, 0, 0);
      
      // Cache the result
      if (!DateFormatter._parsedDatesCache) {
        DateFormatter._parsedDatesCache = new Map<string, Date>();
      }
      DateFormatter._parsedDatesCache.set(originalDateStr, resultDate);
      
      return resultDate;
    } 
    
    // Rest of the method remains the same...
    if ((dateStr.includes('.') || dateStr.includes('/')) && 
        (dateStr.split('.').length === 3 || dateStr.split('/').length === 3)) {
      const separator = dateStr.includes('.') ? '.' : '/';
      const [dayStr, monthStr, yearStr] = dateStr.split(separator);
      
      const day = parseInt(dayStr, 10);
      const month = parseInt(monthStr, 10) - 1; // Convert from 1-based to 0-based month
      const year = parseInt(yearStr, 10);
      
      // Validate the parsed date parts
      if (isNaN(year) || isNaN(month) || isNaN(day)) {
        return null;
      }

      // Check for valid month and day ranges - this helps disambiguate between MM/dd and dd/MM
      if (month < 0 || month > 11 || day < 1 || day > 31) {
        // Try the alternative interpretation (maybe it's MM/dd instead of dd/MM)
        const alternateMonth = parseInt(dayStr, 10) - 1;
        const alternateDay = parseInt(monthStr, 10);
        
        if (alternateMonth >= 0 && alternateMonth <= 11 && alternateDay >= 1 && alternateDay <= 31) {
          return new Date(year, alternateMonth, alternateDay, 12, 0, 0);
        }
        return null;
      }
      
      // Use noon time to avoid timezone issues
      return new Date(year, month, day, 12, 0, 0);
    }
    
    // If format is specified as 'locale', use the locale's date format for parsing
    if (format === 'locale') {
      const formatPattern = this.i18nService.getDateFormatPattern();
      const separator = this.i18nService.getDateSeparator();
      
      const parts = dateStr.split(separator);
      if (parts.length !== 3) return null;
      
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
      
      // Validate the parsed date parts
      if (isNaN(year) || isNaN(month) || isNaN(day)) {
        return null;
      }

      // Check for valid month and day ranges
      if (month < 0 || month > 11 || day < 1 || day > 31) {
        return null;
      }
      
      return new Date(year, month, day, 12, 0, 0);
    }
    
    // If no specific format is provided, try to intelligently guess the format
    if (dateStr.match(/^\d{1,2}[\/\.\-]\d{1,2}[\/\.\-]\d{4}$/)) {
      // This looks like either MM/DD/YYYY or DD/MM/YYYY
      const separator = dateStr.includes('/') ? '/' : (dateStr.includes('-') ? '-' : '.');
      const [first, second, third] = dateStr.split(separator);
      
      // Try both interpretations and use the one that produces a valid date
      // First try DD/MM/YYYY
      const day = parseInt(first, 10);
      const month = parseInt(second, 10) - 1;
      const year = parseInt(third, 10);
      
      if (day >= 1 && day <= 31 && month >= 0 && month <= 11) {
        return new Date(year, month, day, 12, 0, 0);
      }
      
      // If that doesn't work, try MM/DD/YYYY
      const altMonth = parseInt(first, 10) - 1;
      const altDay = parseInt(second, 10);
      
      if (altMonth >= 0 && altMonth <= 11 && altDay >= 1 && altDay <= 31) {
        return new Date(year, altMonth, altDay, 12, 0, 0);
      }
    }
    
    // If still no success, try the native parser with noon time
    try {
      const parsedDate = new Date(dateStr);
      if (!isNaN(parsedDate.getTime())) {
        return new Date(
          parsedDate.getFullYear(),
          parsedDate.getMonth(),
          parsedDate.getDate(),
          12, 0, 0
        );
      }
    } catch {
      // Ignore parsing errors and continue
    }
    
    // If all parsing attempts fail, return null
    return null;
  }
  
  // Static cache to help prevent inconsistent parsing of the same string
  private static _parsedDatesCache: Map<string, Date> | null = null;

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

  /**
   * Get all weekday names for a locale
   * @param format Format of the weekday names ('long', 'short', or 'narrow')
   * @param locale The locale to use
   * @returns Array of localized weekday names
   */
  getWeekdayNames(format: 'long' | 'short' | 'narrow' = 'short', locale?: string): string[] {
    const days = [];
    for (let i = 0; i < 7; i++) {
      days.push(this.getWeekdayName(i, format, locale));
    }
    return days;
  }
}