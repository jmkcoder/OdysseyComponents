import { IDateParserStrategy } from '../date-parser-strategy.interface';

/**
 * Strategy for parsing ISO-like dates (yyyy-MM-dd)
 */
export class ISODateParser implements IDateParserStrategy {
  canParse(format?: string): boolean {
    return !format; // This is a fallback strategy
  }
  
  parse(dateStr: string): Date | null {
    if (!dateStr) return null;
    
    // If it's in ISO format (yyyy-MM-dd), use specialized parsing
    if (dateStr.includes('-') && dateStr.split('-').length === 3) {
      const [yearStr, monthStr, dayStr] = dateStr.split('-');
      
      // Handle ambiguous dates like 04-05-25 where all parts are 2 digits or less
      // Only apply this special handling when all parts are 2 digits or less (potential ambiguity)
      // But allow yyyy-MM-dd (4-digit year) format to be handled normally
      if (yearStr.length <= 2 && monthStr.length <= 2 && dayStr.length <= 2) {
        // When all components are 2 digits or less, avoid automatic parsing
        // to prevent infinite switching between interpretations
        return null;
      }
      
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
      return new Date(year, month, day, 12, 0, 0);
    }
    
    return null;
  }
}