/**
 * Strategy interface for parsing different date formats
 */
export interface IDateParserStrategy {
  /**
   * Check if this parser can handle the given format
   * @param format The format string or indicator
   * @returns True if this parser can handle the format
   */
  canParse(format?: string): boolean;
  
  /**
   * Parse a date string according to the format
   * @param dateStr The date string to parse
   * @param format The format to use for parsing
   * @returns Parsed date or null if parsing fails
   */
  parse(dateStr: string, format?: string): Date | null;
}