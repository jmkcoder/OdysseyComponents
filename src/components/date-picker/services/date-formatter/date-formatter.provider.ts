import { IDateFormatter } from './date-formatter.interface';
import { DateFormatter } from './date-formatter.service';
import { InternationalizationService } from '../../../../services';

/**
 * DateFormatterProvider - A simple service provider/factory for date formatting services
 * Following the Dependency Inversion Principle by allowing the injection of any
 * implementation that satisfies the IDateFormatter interface
 */
export class DateFormatterProvider {
  private static instance: IDateFormatter;
  
  /**
   * Get the default DateFormatter instance (singleton)
   * @param locale Optional locale to use for formatting
   * @returns An instance of IDateFormatter
   */
  public static getFormatter(locale?: string): IDateFormatter {
    // If no locale is specified, get the current locale from the i18n service
    if (!locale && InternationalizationService.getInstance) {
      locale = InternationalizationService.getInstance().locale;
    }
    
    if (!DateFormatterProvider.instance) {
      DateFormatterProvider.instance = new DateFormatter(locale);
    }
    return DateFormatterProvider.instance;
  }
  
  /**
   * Set a custom formatter implementation
   * Useful for testing or providing alternative implementations
   * @param formatter A custom formatter instance that implements IDateFormatter
   */
  public static setFormatter(formatter: IDateFormatter): void {
    DateFormatterProvider.instance = formatter;
  }
}