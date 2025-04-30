import { DateUtils } from '../date-utils';

describe('DateUtils', () => {
  describe('formatDate', () => {
    it('should format a date as YYYY-MM-DD', () => {
      const date = new Date(2025, 3, 15); // April 15, 2025
      const result = DateUtils.formatDate(date);
      
      expect(result).toBe('2025-04-15');
    });
  });

  describe('formatISODate', () => {
    it('should format a date to ISO string (YYYY-MM-DD)', () => {
      const date = new Date(2025, 3, 15); // April 15, 2025
      const result = DateUtils.formatISODate(date);
      
      expect(result).toBe('2025-04-15');
    });
  });

  describe('parseDate', () => {
    it('should parse ISO format date string (YYYY-MM-DD)', () => {
      const dateStr = '2025-04-15'; // April 15, 2025
      const result = DateUtils.parseDate(dateStr);
      
      expect(result).toBeInstanceOf(Date);
      expect(result.getFullYear()).toBe(2025);
      expect(result.getMonth()).toBe(3); // April (0-based)
      expect(result.getDate()).toBe(15);
    });

    it('should parse European format date string (DD-MM-YYYY)', () => {
      const dateStr = '15-04-2025'; // April 15, 2025
      const result = DateUtils.parseDate(dateStr);
      
      expect(result).toBeInstanceOf(Date);
      expect(result.getFullYear()).toBe(2025);
      expect(result.getMonth()).toBe(3); // April (0-based)
      expect(result.getDate()).toBe(15);
    });

    it('should parse European format with slash separator (DD/MM/YYYY)', () => {
      const dateStr = '15/04/2025'; // April 15, 2025
      const result = DateUtils.parseDate(dateStr);
      
      expect(result).toBeInstanceOf(Date);
      expect(result.getFullYear()).toBe(2025);
      expect(result.getMonth()).toBe(3);
      expect(result.getDate()).toBe(15);
    });

    it('should parse European format with dot separator (DD.MM.YYYY)', () => {
      const dateStr = '15.04.2025'; // April 15, 2025
      const result = DateUtils.parseDate(dateStr);
      
      expect(result).toBeInstanceOf(Date);
      expect(result.getFullYear()).toBe(2025);
      expect(result.getMonth()).toBe(3);
      expect(result.getDate()).toBe(15);
    });

    it('should handle ambiguous date formats', () => {
      // This could be either MM/DD/YYYY (US) or DD/MM/YYYY (EU)
      // Our implementation should choose one consistently
      const ambiguousDateStr = '01/04/2025';
      const result = DateUtils.parseDate(ambiguousDateStr);
      
      expect(result).toBeInstanceOf(Date);
      // Check that either April 1 or January 4 is parsed consistently
      const isApril1 = result.getMonth() === 3 && result.getDate() === 1;
      const isJanuary4 = result.getMonth() === 0 && result.getDate() === 4;
      expect(isApril1 || isJanuary4).toBe(true);
    });

    it('should return null for invalid date strings', () => {
      const invalidDateStr = 'not-a-date';
      const result = DateUtils.parseDate(invalidDateStr);
      
      expect(result).toBeNull();
    });

    it('should return null for invalid date parts', () => {
      // Invalid month (13)
      const invalidMonthStr = '2025-13-15';
      const invalidMonthResult = DateUtils.parseDate(invalidMonthStr);
      
      expect(invalidMonthResult).toBeNull();
      
      // Invalid day (32)
      const invalidDayStr = '2025-04-32';
      const invalidDayResult = DateUtils.parseDate(invalidDayStr);
      
      expect(invalidDayResult).toBeNull();
    });
  });

  describe('parseISODate', () => {
    it('should call parseDate method', () => {
      const dateStr = '2025-04-15';
      const parseDateSpy = jest.spyOn(DateUtils, 'parseDate');
      
      DateUtils.parseISODate(dateStr);
      
      expect(parseDateSpy).toHaveBeenCalledWith(dateStr);
      
      // Clean up spy
      parseDateSpy.mockRestore();
    });
  });

  describe('isSameDay', () => {
    it('should return true for dates on the same day', () => {
      const date1 = new Date(2025, 3, 15, 10, 30); // April 15, 2025, 10:30 AM
      const date2 = new Date(2025, 3, 15, 14, 45); // April 15, 2025, 2:45 PM
      
      expect(DateUtils.isSameDay(date1, date2)).toBe(true);
    });

    it('should return false for dates on different days', () => {
      const date1 = new Date(2025, 3, 15); // April 15, 2025
      const date2 = new Date(2025, 3, 16); // April 16, 2025
      
      expect(DateUtils.isSameDay(date1, date2)).toBe(false);
    });
  });

  describe('addDays', () => {
    it('should add the specified number of days to a date', () => {
      const startDate = new Date(2025, 3, 15); // April 15, 2025
      const result = DateUtils.addDays(startDate, 5);
      
      expect(result.getFullYear()).toBe(2025);
      expect(result.getMonth()).toBe(3);
      expect(result.getDate()).toBe(20); // April 20, 2025
    });

    it('should handle month boundaries', () => {
      const startDate = new Date(2025, 3, 28); // April 28, 2025
      const result = DateUtils.addDays(startDate, 5);
      
      expect(result.getFullYear()).toBe(2025);
      expect(result.getMonth()).toBe(4); // May
      expect(result.getDate()).toBe(3); // May 3, 2025
    });
  });

  describe('addMonths', () => {
    it('should add the specified number of months to a date', () => {
      const startDate = new Date(2025, 3, 15); // April 15, 2025
      const result = DateUtils.addMonths(startDate, 2);
      
      expect(result.getFullYear()).toBe(2025);
      expect(result.getMonth()).toBe(5); // June
      expect(result.getDate()).toBe(15); // June 15, 2025
    });

    it('should handle year boundaries', () => {
      const startDate = new Date(2025, 10, 15); // November 15, 2025
      const result = DateUtils.addMonths(startDate, 3);
      
      expect(result.getFullYear()).toBe(2026);
      expect(result.getMonth()).toBe(1); // February
      expect(result.getDate()).toBe(15); // February 15, 2026
    });

    it('should handle month end edge cases', () => {
      const startDate = new Date(2025, 0, 31); // January 31, 2025
      const result = DateUtils.addMonths(startDate, 1);
      
      expect(result.getFullYear()).toBe(2025);
      expect(result.getMonth()).toBe(1); // February
      // Should be the last day of February, not March 3rd
      expect(result.getDate()).toBeLessThanOrEqual(29); // February has 28 or 29 days
    });
  });

  describe('getFirstDayOfMonth', () => {
    it('should return the first day of the month', () => {
      const date = new Date(2025, 3, 15); // April 15, 2025
      const result = DateUtils.getFirstDayOfMonth(date);
      
      expect(result.getFullYear()).toBe(2025);
      expect(result.getMonth()).toBe(3);
      expect(result.getDate()).toBe(1); // April 1, 2025
    });
  });

  describe('getLastDayOfMonth', () => {
    it('should return the last day of the month', () => {
      const date = new Date(2025, 3, 15); // April 15, 2025
      const result = DateUtils.getLastDayOfMonth(date);
      
      expect(result.getFullYear()).toBe(2025);
      expect(result.getMonth()).toBe(3);
      expect(result.getDate()).toBe(30); // April 30, 2025
    });

    it('should correctly handle months with different lengths', () => {
      // February in a non-leap year (28 days)
      const febNonLeap = new Date(2025, 1, 15); 
      expect(DateUtils.getLastDayOfMonth(febNonLeap).getDate()).toBe(28);
      
      // February in a leap year (29 days)
      const febLeap = new Date(2024, 1, 15); 
      expect(DateUtils.getLastDayOfMonth(febLeap).getDate()).toBe(29);
      
      // Months with 31 days
      const january = new Date(2025, 0, 15);
      expect(DateUtils.getLastDayOfMonth(january).getDate()).toBe(31);
    });
  });

  describe('isToday', () => {
    it('should return true for today', () => {
      const today = new Date();
      expect(DateUtils.isToday(today)).toBe(true);
    });

    it('should return false for dates other than today', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      expect(DateUtils.isToday(yesterday)).toBe(false);
    });
  });

  describe('isCurrentMonth', () => {
    it('should return true for dates in the specified current month', () => {
      const currentMonth = new Date(2025, 3, 15); // April 15, 2025
      const dateInSameMonth = new Date(2025, 3, 28); // April 28, 2025
      
      expect(DateUtils.isCurrentMonth(dateInSameMonth, currentMonth)).toBe(true);
    });

    it('should return false for dates not in the current month', () => {
      const currentMonth = new Date(2025, 3, 15); // April 15, 2025
      const dateInDifferentMonth = new Date(2025, 4, 1); // May 1, 2025
      
      expect(DateUtils.isCurrentMonth(dateInDifferentMonth, currentMonth)).toBe(false);
    });
  });

  describe('isDateDisabled', () => {
    it('should return true when minDate constraint is violated', () => {
      const date = new Date(2025, 3, 10); // April 10, 2025
      const minDate = new Date(2025, 3, 15); // April 15, 2025
      
      expect(DateUtils.isDateDisabled(date, minDate)).toBe(true);
    });

    it('should return true when maxDate constraint is violated', () => {
      const date = new Date(2025, 3, 20); // April 20, 2025
      const maxDate = new Date(2025, 3, 15); // April 15, 2025
      
      expect(DateUtils.isDateDisabled(date, null, maxDate)).toBe(true);
    });

    it('should return false when date is within min and max constraints', () => {
      const date = new Date(2025, 3, 15); // April 15, 2025
      const minDate = new Date(2025, 3, 10); // April 10, 2025
      const maxDate = new Date(2025, 3, 20); // April 20, 2025
      
      expect(DateUtils.isDateDisabled(date, minDate, maxDate)).toBe(false);
    });

    it('should handle inclusive minimum date', () => {
      const date = new Date(2025, 3, 15); // April 15, 2025
      const minDate = new Date(2025, 3, 15); // April 15, 2025 (same day)
      
      expect(DateUtils.isDateDisabled(date, minDate)).toBe(false);
    });
  });
});