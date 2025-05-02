import { InternationalizationService } from '../../../../../services';
import { IDateParserStrategy } from '../date-parser-strategy.interface';

/**
 * Strategy for parsing dates using locale-specific format
 */
export class LocaleBasedDateParser implements IDateParserStrategy {
  constructor(private readonly i18nService: InternationalizationService) {}
  
  canParse(format?: string): boolean {
    return format === 'locale';
  }
  
  parse(dateStr: string, format?: string): Date | null {
    if (!dateStr) return null;
    
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
}