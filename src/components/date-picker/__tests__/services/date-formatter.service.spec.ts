import { DateFormatter } from '../../services/date-formatter.service';

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
      expect(result.getFullYear()).toBe(2025);
      expect(result.getMonth()).toBe(3); // April (0-based)
      expect(result.getDate()).toBe(15);
    });

    it('should handle invalid date strings', () => {
      const invalidDateStr = 'not-a-date';
      
      try {
        dateFormatter.parse(invalidDateStr);
        fail('Expected an error to be thrown');
      } catch (error) {
        expect(error).toBeDefined();
      }
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