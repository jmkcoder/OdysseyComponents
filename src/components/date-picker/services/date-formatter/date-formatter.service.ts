import { IDateFormatter } from './date-formatter.interface';
import { IDateParserStrategy } from './date-parser-strategy.interface';
import { InternationalizationService } from '../../../../services';
import { DateTokenFormatter } from './date-token-formatter';
import { DateParseCache } from './date-parse-cache';
import { 
  FormatBasedDateParser,
  LocaleBasedDateParser,
  ISODateParser,
  CommonFormatsDateParser 
} from './parsers';

/**
 * DateFormatter service implementation
 * Following the Single Responsibility Principle by delegating to specialized classes
 * and Open/Closed Principle by using the Strategy Pattern for date parsing
 */
export class DateFormatter implements IDateFormatter {
  /**
   * Internationalization service reference
   * @private
   */
  private readonly i18nService: InternationalizationService;
  
  /**
   * Parser strategies
   * @private
   */
  private readonly parserStrategies: IDateParserStrategy[];
  
  /**
   * Token formatter for date formatting
   * @private
   */
  private readonly tokenFormatter: DateTokenFormatter;
  
  /**
   * Parse cache for consistent date parsing
   * @private
   */
  private readonly parseCache: DateParseCache;

  /**
   * Constructor
   * @param locale Default locale to use when none is specified
   */
  constructor(locale?: string) {
    // Get the internationalization service instance, passing in the locale if specified
    this.i18nService = InternationalizationService.getInstance(locale);
    this.tokenFormatter = new DateTokenFormatter(this.i18nService);
    this.parseCache = DateParseCache.getInstance();
    
    // Initialize parser strategies in order of precedence
    this.parserStrategies = [
      new FormatBasedDateParser(this.i18nService),
      new LocaleBasedDateParser(this.i18nService),
      new ISODateParser(),
      new CommonFormatsDateParser()
    ];
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
    return this.tokenFormatter.format(date, format, locale);
  }

  /**
   * Parse a string into a Date object
   * @param dateStr The date string to parse
   * @param format Optional format of the input string
   * @returns A Date object or null if parsing fails
   */
  parse(dateStr: string, format?: string): Date | null {
    if (!dateStr) return null;
    
    // First check for date strings that have been successfully parsed before
    const cacheKey = `${dateStr}_${format || ''}`;
    if (this.parseCache.has(cacheKey)) {
      return this.parseCache.get(cacheKey)!;
    }
    
    try {
      // ALWAYS try to parse with explicit format first if provided
      // This is critical for consistency between calendar and manual input
      if (format) {
        const formatBasedParser = this.parserStrategies[0]; // FormatBasedDateParser
        if (formatBasedParser.canParse(format)) {
          const result = formatBasedParser.parse(dateStr, format);
          if (result) {
            // Store in cache with the specific format
            this.parseCache.set(cacheKey, result);
            // Also store with just the dateStr to ensure consistent parsing
            // even when format is not provided in future calls
            this.parseCache.set(dateStr, result);
            return result;
          }
        }
      }
      
      // For dates with dashes, we need special handling to ensure consistency
      if (dateStr.includes('-') && dateStr.split('-').length === 3) {
        // Check if we have this in the cache without format (from previous format-based parse)
        if (this.parseCache.has(dateStr)) {
          return this.parseCache.get(dateStr)!;
        }
        
        // For dash-separated dates without format, prioritize ISO parser
        const isoParser = this.parserStrategies[2]; // ISODateParser
        const result = isoParser.parse(dateStr);
        if (result) {
          this.parseCache.set(dateStr, result);
          return result;
        }
      }
      
      // For other cases, fallback to standard parsing with strategies in priority order
      for (const strategy of this.parserStrategies) {
        if (strategy.canParse(format)) {
          const result = strategy.parse(dateStr, format);
          if (result) {
            this.parseCache.set(cacheKey, result);
            // When no format is specified and we successfully parse,
            // also cache with just the dateStr
            if (!format) {
              this.parseCache.set(dateStr, result);
            }
            return result;
          }
        }
      }
      
      // If no strategy worked, return null
      return null;
    } catch (e) {
      throw new Error(`Failed to parse date string: ${dateStr}`);
    }
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