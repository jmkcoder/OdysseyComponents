import { InternationalizationService } from '../../../../../services';
import { IDateParserStrategy } from '../date-parser-strategy.interface';
import { DateParseCache } from '../date-parse-cache';

/**
 * Strategy for parsing dates with explicit formats like 'yyyy-MM-dd'
 */
export class FormatBasedDateParser implements IDateParserStrategy {
  constructor(private readonly i18nService: InternationalizationService) {}

  canParse(format?: string): boolean {
    return !!format && format !== 'locale';
  }
  
  parse(dateStr: string, format?: string): Date | null {
    if (!dateStr || !format) return null;
    
    // Force consistent formatting by explicitly handling common formats
    // This ensures dates like "03-04-2025" are always parsed the same way
    if (format.includes('-')) {
      // Handle explicit formats with dash separator
      if (format === 'dd-MM-yyyy' && dateStr.includes('-')) {
        // European format (day-month-year)
        const parts = dateStr.split('-');
        if (parts.length === 3) {
          const day = parseInt(parts[0], 10);
          const month = parseInt(parts[1], 10) - 1;
          let year = parseInt(parts[2], 10);
          
          // Handle two-digit years by making them current century
          if (year < 100) {
            const currentYear = new Date().getFullYear();
            const currentCentury = Math.floor(currentYear / 100) * 100;
            year = currentCentury + year;
          }
          
          if (!isNaN(day) && !isNaN(month) && !isNaN(year) && 
              day >= 1 && day <= 31 && month >= 0 && month <= 11) {
            return new Date(year, month, day, 12, 0, 0);
          }
        }
      } else if (format === 'MM-dd-yyyy' && dateStr.includes('-')) {
        // US format (month-day-year)
        const parts = dateStr.split('-');
        if (parts.length === 3) {
          const month = parseInt(parts[0], 10) - 1;
          const day = parseInt(parts[1], 10);
          let year = parseInt(parts[2], 10);
          
          // Handle two-digit years by making them current century
          if (year < 100) {
            const currentYear = new Date().getFullYear();
            const currentCentury = Math.floor(currentYear / 100) * 100;
            year = currentCentury + year;
          }
          
          if (!isNaN(day) && !isNaN(month) && !isNaN(year) && 
              day >= 1 && day <= 31 && month >= 0 && month <= 11) {
            return new Date(year, month, day, 12, 0, 0);
          }
        }
      } else if (format === 'yyyy-MM-dd' && dateStr.includes('-')) {
        // ISO format (year-month-day)
        const parts = dateStr.split('-');
        if (parts.length === 3) {
          let year = parseInt(parts[0], 10);
          const month = parseInt(parts[1], 10) - 1;
          const day = parseInt(parts[2], 10);
          
          // Handle two-digit years by making them current century
          if (year < 100) {
            const currentYear = new Date().getFullYear();
            const currentCentury = Math.floor(currentYear / 100) * 100;
            year = currentCentury + year;
          }
          
          if (!isNaN(day) && !isNaN(month) && !isNaN(year) && 
              day >= 1 && day <= 31 && month >= 0 && month <= 11) {
            return new Date(year, month, day, 12, 0, 0);
          }
        }
      }
    }
    
    // Support any other format with 'yy' for two-digit years
    if (format.includes('yy') && !format.includes('yyyy')) {
      // This is specifically for formats with two-digit years like dd-MM-yy
      const isYearFirst = format.indexOf('y') === 0;
      const isDayFirst = format.indexOf('d') < format.indexOf('M'); 
      
      // Get separator
      let formatSeparator = format.replace(/[a-zA-Z]/g, '')[0];
      if (!formatSeparator || formatSeparator === ' ') {
        for (const sep of ['-', '/', '.', ' ']) {
          if (dateStr.includes(sep)) {
            formatSeparator = sep;
            break;
          }
        }
      }
      formatSeparator = formatSeparator || '-';
      
      const parts = dateStr.split(formatSeparator).map(part => part.trim());
      if (parts.length === 3) {
        let yearPart: number, monthPart: number, dayPart: number;
        let yearPartIndex = 2; // Default position
        
        if (isYearFirst) {
          yearPartIndex = 0;
          yearPart = parseInt(parts[0], 10);
          monthPart = parseInt(parts[1], 10) - 1;
          dayPart = parseInt(parts[2], 10);
        } else if (isDayFirst) {
          yearPart = parseInt(parts[2], 10);
          monthPart = parseInt(parts[1], 10) - 1;
          dayPart = parseInt(parts[0], 10);
        } else {
          yearPart = parseInt(parts[2], 10);
          monthPart = parseInt(parts[0], 10) - 1;
          dayPart = parseInt(parts[1], 10);
        }
        
        // Always treat two-digit years as current century
        if (yearPart < 100) {
          const currentYear = new Date().getFullYear();
          const currentCentury = Math.floor(currentYear / 100) * 100;
          yearPart = currentCentury + yearPart;
        }
        
        if (!isNaN(yearPart) && !isNaN(monthPart) && !isNaN(dayPart) &&
            monthPart >= 0 && monthPart <= 11 && dayPart >= 1 && dayPart <= 31) {
          // Create the date with noon time to avoid timezone issues
          const resultDate = new Date(yearPart, monthPart, dayPart, 12, 0, 0);
          
          // Cache this date for consistent formatting later
          const cacheKey = `${dateStr}_${format}`;
          DateParseCache.getInstance().set(cacheKey, resultDate);
          DateParseCache.getInstance().set(dateStr, resultDate);
          
          return resultDate;
        }
        return null;
      }
    }
    
    // Standard parsing logic for other formats
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

      // Handle two-digit years
      if (yearPart < 100) {
        // First, determine the current century
        const currentYear = new Date().getFullYear();
        const currentCentury = Math.floor(currentYear / 100) * 100;
        
        // Always interpret two-digit years as current century + yearPart
        yearPart = currentCentury + yearPart;
      }

      // Validate the parsed date parts
      if (isNaN(yearPart) || isNaN(monthPart) || isNaN(dayPart)) {
        return null;
      }

      // Check for valid month and day ranges
      if (monthPart < 0 || monthPart > 11 || dayPart < 1 || dayPart > 31) {
        return null;
      }
      
      // Create the date with noon time to avoid timezone issues
      const resultDate = new Date(yearPart, monthPart, dayPart, 12, 0, 0);
      
      // Cache this date for consistent formatting later
      const cacheKey = `${dateStr}_${format}`;
      DateParseCache.getInstance().set(cacheKey, resultDate);
      // Also cache without format for consistency
      DateParseCache.getInstance().set(dateStr, resultDate);
      
      return resultDate;
    }
    
    return null;
  }
}