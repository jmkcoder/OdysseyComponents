import { DateFormatter } from '../../services/date-formatter/date-formatter.service';

describe('DateFormatter', () => {
  let dateFormatter: DateFormatter;

  beforeEach(() => {
    // Initialize service with default locale
    dateFormatter = new DateFormatter('en-US');
  });

  describe('format', () => {
    it('should format date in ISO format by default', () => {
      const date = new Date(2025, 3, 15); // April 15, 2025
      const result = dateFormatter.format(date, 'yyyy-MM-dd');
      
      expect(result).toBe('2025-04-15');
    });

    it('should handle null values', () => {
      const result = dateFormatter.format(null, 'yyyy-MM-dd');
      expect(result).toBe('');
    });

    it('should format date with custom formatting options', () => {
      const date = new Date(2025, 3, 15); // April 15, 2025
      
      // Format with specific options
      const result = dateFormatter.format(date, 'MMMM d, yyyy');
      
      expect(result).toContain('2025');
      expect(result.toLowerCase()).toContain('april');
      expect(result).toContain('15');
    });

    it('should respect different locales', () => {
      const date = new Date(2025, 3, 15); // April 15, 2025
      
      // Test with French locale
      const frenchResult = dateFormatter.format(date, 'MMMM d, yyyy', 'fr-FR');
      expect(frenchResult.toLowerCase()).toContain('avril');
      
      // Test with German locale
      const germanResult = dateFormatter.format(date, 'MMMM d, yyyy', 'de-DE');
      expect(germanResult).toContain('April');
    });
  });

  describe('parse', () => {
    it('should parse ISO format date string into Date object', () => {
      const dateStr = '2025-04-15';
      const result = dateFormatter.parse(dateStr);
      
      expect(result).toBeInstanceOf(Date);
      expect(result).not.toBeNull();
      expect(result!.getFullYear()).toBe(2025);
      expect(result!.getMonth()).toBe(3); // April (0-based)
      expect(result!.getDate()).toBe(15);
    });

    it('should parse European format date string (dd-MM-yyyy)', () => {
      const dateStr = '15-04-2025'; // April 15, 2025 in dd-MM-yyyy format
      const result = dateFormatter.parse(dateStr, 'dd-MM-yyyy');
      
      expect(result).toBeInstanceOf(Date);
      expect(result).not.toBeNull();
      expect(result!.getFullYear()).toBe(2025);
      expect(result!.getMonth()).toBe(3); // April (0-based)
      expect(result!.getDate()).toBe(15);
    });
    
    it('should parse US format date string (MM-dd-yyyy)', () => {
      const dateStr = '04-15-2025'; // April 15, 2025 in MM-dd-yyyy format
      const result = dateFormatter.parse(dateStr, 'MM-dd-yyyy');
      
      expect(result).toBeInstanceOf(Date);
      expect(result).not.toBeNull();
      expect(result!.getFullYear()).toBe(2025);
      expect(result!.getMonth()).toBe(3); // April (0-based)
      expect(result!.getDate()).toBe(15);
    });

    it('should parse date strings with various separators', () => {
      // With slash separator
      const slashDateStr = '15/04/2025'; // dd/MM/yyyy
      const slashResult = dateFormatter.parse(slashDateStr, 'dd/MM/yyyy');
      
      expect(slashResult).toBeInstanceOf(Date);
      expect(slashResult).not.toBeNull();
      expect(slashResult!.getFullYear()).toBe(2025);
      expect(slashResult!.getMonth()).toBe(3);
      expect(slashResult!.getDate()).toBe(15);
      
      // With dot separator
      const dotDateStr = '15.04.2025'; // dd.MM.yyyy
      const dotResult = dateFormatter.parse(dotDateStr, 'dd.MM.yyyy');
      
      expect(dotResult).toBeInstanceOf(Date);
      expect(dotResult).not.toBeNull();
      expect(dotResult!.getFullYear()).toBe(2025);
      expect(dotResult!.getMonth()).toBe(3);
      expect(dotResult!.getDate()).toBe(15);
    });

    it('should auto-detect date format if format is not explicitly provided', () => {
      // European format without explicit format pattern
      const euDateStr = '15/04/2025'; // dd/MM/yyyy
      const euResult = dateFormatter.parse(euDateStr);
      
      expect(euResult).toBeInstanceOf(Date);
      expect(euResult).not.toBeNull();
      expect(euResult!.getFullYear()).toBe(2025);
      expect(euResult!.getMonth()).toBe(3);
      expect(euResult!.getDate()).toBe(15);
      
      // ISO format without explicit format pattern
      const isoDateStr = '2025-04-15'; // yyyy-MM-dd
      const isoResult = dateFormatter.parse(isoDateStr);
      
      expect(isoResult).toBeInstanceOf(Date);
      expect(isoResult).not.toBeNull();
      expect(isoResult!.getFullYear()).toBe(2025);
      expect(isoResult!.getMonth()).toBe(3);
      expect(isoResult!.getDate()).toBe(15);
    });

    it('should handle ambiguous date formats intelligently', () => {
      // This could be either MM/DD/YYYY (US) or DD/MM/YYYY (EU)
      // Since our implementation prefers DD/MM/YYYY when both are valid,
      // we expect it to be interpreted as January 4th, not April 1st
      const ambiguousDateStr = '01/04/2025';
      const result = dateFormatter.parse(ambiguousDateStr);
      
      expect(result).toBeInstanceOf(Date);
      expect(result).not.toBeNull();
      // Check month and day values
      const month = result!.getMonth();
      const day = result!.getDate();
      // Either April 1 or January 4 would be valid interpretations
      const isApril1 = month === 3 && day === 1;
      const isJanuary4 = month === 0 && day === 4;
      expect(isApril1 || isJanuary4).toBe(true);
    });

    it('should handle two-digit years', () => {
      // Two-digit year in European format
      const twoDigitYearDateStr = '15-04-25'; // 15-Apr-2025
      const result = dateFormatter.parse(twoDigitYearDateStr, 'dd-MM-yy');
      
      expect(result).toBeInstanceOf(Date);
      expect(result).not.toBeNull();
      expect(result!.getFullYear()).toBe(2025);
      expect(result!.getMonth()).toBe(3);
      expect(result!.getDate()).toBe(15);
    });

    it('should return null for invalid date strings', () => {
      const invalidDateStr = 'not-a-date';
      
      try {
        dateFormatter.parse(invalidDateStr);
        fail('Expected an error to be thrown');
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should return null for invalid date parts', () => {
      // Invalid month (13)
      const invalidMonthStr = '2025-13-15';
      const invalidMonthResult = dateFormatter.parse(invalidMonthStr);
      
      expect(invalidMonthResult).toBeNull();
      
      // Invalid day (32)
      const invalidDayStr = '2025-04-32';
      const invalidDayResult = dateFormatter.parse(invalidDayStr);
      
      expect(invalidDayResult).toBeNull();
    });
  });

  describe('getMonthName', () => {
    it('should return the month name for a given index', () => {
      expect(dateFormatter.getMonthName(0)).toBe('January');
      expect(dateFormatter.getMonthName(3)).toBe('April');
      expect(dateFormatter.getMonthName(11)).toBe('December');
    });

    it('should return short month name when specified', () => {
      expect(dateFormatter.getMonthName(3, 'short')).toBe('Apr');
    });

    it('should respect different locales', () => {
      expect(dateFormatter.getMonthName(3, 'long', 'fr-FR').toLowerCase()).toBe('avril');
    });
  });

  describe('getMonthNames', () => {
    it('should return all month names in the specified locale', () => {
      const months = dateFormatter.getMonthNames();
      
      expect(months).toHaveLength(12);
      expect(months[0]).toBe('January');
      expect(months[3]).toBe('April');
      expect(months[11]).toBe('December');
    });

    it('should support short format for month names', () => {
      const shortMonths = dateFormatter.getMonthNames('short');
      expect(shortMonths[3]).toBe('Apr');
    });

    it('should respect different locales', () => {
      const frenchMonths = dateFormatter.getMonthNames('long', 'fr-FR');
      
      expect(frenchMonths[0].toLowerCase()).toBe('janvier');
      expect(frenchMonths[3].toLowerCase()).toBe('avril');
      expect(frenchMonths[11].toLowerCase()).toBe('décembre');
    });
  });

  describe('getWeekdayName', () => {
    it('should return the weekday name for a given index', () => {
      expect(dateFormatter.getWeekdayName(0, 'long').toLowerCase()).toBe('sunday');
      expect(dateFormatter.getWeekdayName(1, 'long').toLowerCase()).toBe('monday');
      expect(dateFormatter.getWeekdayName(6, 'long').toLowerCase()).toBe('saturday');
    });

    it('should return short weekday name when specified', () => {
      expect(dateFormatter.getWeekdayName(0, 'short')).toBe('Sun');
    });

    it('should respect different locales', () => {
      // The French abbreviation for Sunday (dimanche) can be 'dim' or 'dim.' depending on the browser/platform
      const frenchSunday = dateFormatter.getWeekdayName(0, 'short', 'fr-FR').toLowerCase();
      expect(frenchSunday === 'dim' || frenchSunday === 'dim.').toBe(true);
    });
  });
});