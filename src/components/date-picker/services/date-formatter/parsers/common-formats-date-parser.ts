import { IDateParserStrategy } from '../date-parser-strategy.interface';

/**
 * Strategy for parsing other common date formats
 */
export class CommonFormatsDateParser implements IDateParserStrategy {
  canParse(format?: string): boolean {
    return !format; // This is a fallback strategy
  }
  
  parse(dateStr: string): Date | null {
    if (!dateStr) return null;
    
    // Handle specifically ambiguous formats with two-digit components
    // Example: "04-05-25" or "04/05/25"
    if (/^\d{1,2}[\-\/\.]\d{1,2}[\-\/\.]\d{1,2}$/.test(dateStr)) {
      // For ambiguous all-digit formats, require explicit format guidance
      // to prevent infinite switching between interpretations
      return null;
    }
    
    if ((dateStr.includes('.') || dateStr.includes('/')) && 
        (dateStr.split('.').length === 3 || dateStr.split('/').length === 3)) {
      const separator = dateStr.includes('.') ? '.' : '/';
      const [dayStr, monthStr, yearStr] = dateStr.split(separator);
      
      // For two digit years, add current century
      let year = parseInt(yearStr, 10);
      if (yearStr.length <= 2 && year < 100) {
        const currentYear = new Date().getFullYear();
        const currentCentury = Math.floor(currentYear / 100) * 100;
        year = currentCentury + year;
      }
      
      const day = parseInt(dayStr, 10);
      const month = parseInt(monthStr, 10) - 1; // Convert from 1-based to 0-based month
      
      // Validate the parsed date parts
      if (isNaN(year) || isNaN(month) || isNaN(day)) {
        return null;
      }

      // Check for valid month and day ranges
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
    
    // If dateStr matches pattern like MM/DD/YYYY or DD/MM/YYYY
    if (dateStr.match(/^\d{1,2}[\/\.\-]\d{1,2}[\/\.\-]\d{4}$/)) {
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
    
    // Last resort: try native Date parsing with noon time
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
      // Ignore parsing errors
    }
    
    return null;
  }
}