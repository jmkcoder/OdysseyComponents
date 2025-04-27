import { CalendarService } from '../../services/calendar.service';

describe('CalendarService', () => {
  let calendarService: CalendarService;

  beforeEach(() => {
    // Initialize the service with default options
    calendarService = new CalendarService({
      firstDayOfWeek: 0, // Sunday
      locale: 'en-US',
      minDate: null,
      maxDate: null,
      disabledDates: [],
      disabledDaysOfWeek: []
    });
  });

  describe('getMonthData', () => {
    it('should generate calendar data for a given month', () => {
      // April 2025
      const result = calendarService.getMonthData(2025, 3);

      // April 2025 has 30 days, starting on Tuesday (2)
      expect(result.length).toBeGreaterThan(0);
      expect(result[0].length).toBe(7); // 7 days per week
      
      // First day of the month (April 1, 2025) is on row 0, column 2 (Tuesday)
      const firstDayCell = result.flat().find(cell => cell.date.getDate() === 1 && 
                                                    cell.date.getMonth() === 3 && 
                                                    cell.date.getFullYear() === 2025);
      expect(firstDayCell).toBeDefined();
      expect(firstDayCell?.isCurrentMonth).toBe(true);
      
      // Last day of the month (April 30, 2025) should be present
      const lastDayCell = result.flat().find(cell => cell.date.getDate() === 30 && 
                                                    cell.date.getMonth() === 3 && 
                                                    cell.date.getFullYear() === 2025);
      expect(lastDayCell).toBeDefined();
      expect(lastDayCell?.isCurrentMonth).toBe(true);
    });

    it('should handle different starting day of week', () => {
      // Reinitialize with Monday as first day of week
      calendarService = new CalendarService({
        firstDayOfWeek: 1, // Monday
        locale: 'en-US',
        minDate: null,
        maxDate: null,
        disabledDates: [],
        disabledDaysOfWeek: []
      });

      // April 2025
      const result = calendarService.getMonthData(2025, 3);

      // First column should be Monday, not Sunday
      expect(result[0][0].date.getDay()).toBe(1); // Monday
      expect(result[0][6].date.getDay()).toBe(0); // Sunday is at the end

      // Test that April 1, 2025 (which is a Tuesday) is positioned correctly
      // With Monday as first day, Tuesday should be at index 1
      const firstDayOfMonth = result.flat().find(cell => 
        cell.date.getDate() === 1 && 
        cell.date.getMonth() === 3 && 
        cell.date.getFullYear() === 2025
      );
      expect(firstDayOfMonth).toBeDefined();
      
      // Find the position of April 1 in the grid
      const firstDayRow = result.findIndex(row => 
        row.some(cell => cell.date.getDate() === 1 && cell.date.getMonth() === 3)
      );
      const firstDayCol = result[firstDayRow].findIndex(cell => 
        cell.date.getDate() === 1 && cell.date.getMonth() === 3
      );
      
      // Tuesday should be at index 1 (second column) when Monday is the first day of week
      expect(firstDayCol).toBe(1);
    });

    it('should mark days from previous and next months appropriately', () => {
      // April 2025
      const result = calendarService.getMonthData(2025, 3);
      
      // Days from previous month (March 2025) should be marked as not current month
      const previousMonthDay = result[0][0]; // First cell in the calendar grid
      expect(previousMonthDay.isCurrentMonth).toBe(false);
      expect(previousMonthDay.date.getMonth()).toBe(2); // March (0-based)
      
      // Days from next month (May 2025) should also be marked as not current month
      const lastRow = result[result.length - 1];
      const nextMonthDay = lastRow[lastRow.length - 1]; // Last cell in the calendar grid
      
      // If the last day of April doesn't fall on Saturday, there will be May days
      if (nextMonthDay.date.getMonth() === 4) {
        expect(nextMonthDay.isCurrentMonth).toBe(false);
      }
    });
  });

  describe('getWeekdays', () => {
    it('should return localized weekday names starting from the configured first day', () => {
      const weekdays = calendarService.getWeekdays();
      
      // With first day as Sunday (0)
      expect(weekdays.length).toBe(7);
      expect(weekdays[0].toLowerCase()).toContain('sun');
      expect(weekdays[1].toLowerCase()).toContain('mon');
      expect(weekdays[6].toLowerCase()).toContain('sat');
    });

    it('should handle different first day of week', () => {
      // Reinitialize with Monday as first day of week
      calendarService = new CalendarService({
        firstDayOfWeek: 1, // Monday
        locale: 'en-US',
        minDate: null,
        maxDate: null,
        disabledDates: [],
        disabledDaysOfWeek: []
      });

      const weekdays = calendarService.getWeekdays();
      
      // With first day as Monday (1)
      expect(weekdays.length).toBe(7);
      expect(weekdays[0].toLowerCase()).toContain('mon');
      expect(weekdays[6].toLowerCase()).toContain('sun');
    });
  });

  describe('getMonthName', () => {
    it('should return localized month name', () => {
      const monthName = calendarService.getMonthName(3); // April (0-based index)
      
      expect(monthName).toBe('April');
    });
    
    it('should handle different locale', () => {
      // Reinitialize with Spanish locale
      calendarService = new CalendarService({
        firstDayOfWeek: 0,
        locale: 'es-ES',
        minDate: null,
        maxDate: null,
        disabledDates: [],
        disabledDaysOfWeek: []
      });

      const monthName = calendarService.getMonthName(3); // April
      
      // This will be "abril" in Spanish
      expect(monthName.toLowerCase()).toContain('abr');
    });
  });

  describe('getMonthNames', () => {
    it('should return all localized month names', () => {
      const monthNames = calendarService.getMonthNames();
      
      expect(monthNames.length).toBe(12);
      expect(monthNames[0]).toBe('January');
      expect(monthNames[11]).toBe('December');
    });
  });

  describe('isDateDisabled', () => {
    it('should return false for enabled dates', () => {
      const date = new Date(2025, 3, 15); // April 15, 2025
      
      expect(calendarService.isDateDisabled(date)).toBe(false);
    });

    it('should return true for dates before minDate', () => {
      // Reinitialize with minDate constraint
      const minDate = new Date(2025, 3, 10); // April 10, 2025
      calendarService = new CalendarService({
        firstDayOfWeek: 0,
        locale: 'en-US',
        minDate: minDate,
        maxDate: null,
        disabledDates: [],
        disabledDaysOfWeek: []
      });

      // Date before minDate
      const beforeMinDate = new Date(2025, 3, 9); // April 9, 2025
      expect(calendarService.isDateDisabled(beforeMinDate)).toBe(true);
      
      // Date equal to minDate
      const equalToMinDate = new Date(2025, 3, 10); // April 10, 2025
      expect(calendarService.isDateDisabled(equalToMinDate)).toBe(false);
      
      // Date after minDate
      const afterMinDate = new Date(2025, 3, 11); // April 11, 2025
      expect(calendarService.isDateDisabled(afterMinDate)).toBe(false);
    });

    it('should return true for dates after maxDate', () => {
      // Reinitialize with maxDate constraint
      const maxDate = new Date(2025, 3, 20); // April 20, 2025
      calendarService = new CalendarService({
        firstDayOfWeek: 0,
        locale: 'en-US',
        minDate: null,
        maxDate: maxDate,
        disabledDates: [],
        disabledDaysOfWeek: []
      });

      // Date before maxDate
      const beforeMaxDate = new Date(2025, 3, 19); // April 19, 2025
      expect(calendarService.isDateDisabled(beforeMaxDate)).toBe(false);
      
      // Date equal to maxDate
      const equalToMaxDate = new Date(2025, 3, 20); // April 20, 2025
      expect(calendarService.isDateDisabled(equalToMaxDate)).toBe(false);
      
      // Date after maxDate
      const afterMaxDate = new Date(2025, 3, 21); // April 21, 2025
      expect(calendarService.isDateDisabled(afterMaxDate)).toBe(true);
    });

    it('should return true for specifically disabled dates', () => {
      // Reinitialize with specific disabled dates
      const disabledDate1 = new Date(2025, 3, 15); // April 15, 2025
      const disabledDate2 = new Date(2025, 3, 16); // April 16, 2025
      
      calendarService = new CalendarService({
        firstDayOfWeek: 0,
        locale: 'en-US',
        minDate: null,
        maxDate: null,
        disabledDates: [disabledDate1, disabledDate2],
        disabledDaysOfWeek: []
      });

      // Disabled specific dates
      expect(calendarService.isDateDisabled(new Date(2025, 3, 15))).toBe(true);
      expect(calendarService.isDateDisabled(new Date(2025, 3, 16))).toBe(true);
      
      // Enabled date
      expect(calendarService.isDateDisabled(new Date(2025, 3, 17))).toBe(false);
    });

    it('should return true for disabled days of week', () => {
      // Reinitialize with disabled days of week (Sunday and Saturday)
      calendarService = new CalendarService({
        firstDayOfWeek: 0,
        locale: 'en-US',
        minDate: null,
        maxDate: null,
        disabledDates: [],
        disabledDaysOfWeek: [0, 6] // Sunday and Saturday
      });

      // Sunday (April 13, 2025)
      expect(calendarService.isDateDisabled(new Date(2025, 3, 13))).toBe(true);
      
      // Saturday (April 19, 2025)
      expect(calendarService.isDateDisabled(new Date(2025, 3, 19))).toBe(true);
      
      // Wednesday (April 16, 2025) - not disabled
      expect(calendarService.isDateDisabled(new Date(2025, 3, 16))).toBe(false);
    });
  });

  describe('getFirstDayOfWeekValue', () => {
    it('should return the configured first day of week', () => {
      expect(calendarService.getFirstDayOfWeekValue()).toBe(0); // Sunday
      
      // Reinitialize with different first day
      calendarService = new CalendarService({
        firstDayOfWeek: 1, // Monday
        locale: 'en-US',
        minDate: null,
        maxDate: null,
        disabledDates: [],
        disabledDaysOfWeek: []
      });
      
      expect(calendarService.getFirstDayOfWeekValue()).toBe(1); // Monday
    });
  });

  describe('createDateRange', () => {
    it('should create a range between two dates', () => {
      const startDate = new Date(2025, 3, 5); // April 5, 2025
      const endDate = new Date(2025, 3, 10); // April 10, 2025
      
      const result = calendarService.createDateRange(startDate, endDate);
      
      // Should include all dates between start and end (inclusive)
      expect(result.length).toBe(6); // 6 days total including start and end dates
      
      // First date in range
      expect(result[0].getFullYear()).toBe(2025);
      expect(result[0].getMonth()).toBe(3);
      expect(result[0].getDate()).toBe(5);
      
      // Last date in range
      expect(result[5].getFullYear()).toBe(2025);
      expect(result[5].getMonth()).toBe(3);
      expect(result[5].getDate()).toBe(10);
    });

    it('should handle ranges that cross months', () => {
      const startDate = new Date(2025, 3, 28); // April 28, 2025
      const endDate = new Date(2025, 4, 3); // May 3, 2025
      
      const result = calendarService.createDateRange(startDate, endDate);
      
      expect(result.length).toBe(6); // 6 days total
      
      // First date in range
      expect(result[0].getMonth()).toBe(3); // April
      expect(result[0].getDate()).toBe(28);
      
      // Middle date at month boundary
      expect(result[2].getMonth()).toBe(3); // April
      expect(result[2].getDate()).toBe(30);
      
      // Next date at month boundary
      expect(result[3].getMonth()).toBe(4); // May
      expect(result[3].getDate()).toBe(1);
      
      // Last date in range
      expect(result[5].getMonth()).toBe(4); // May
      expect(result[5].getDate()).toBe(3);
    });

    it('should handle reversed date order', () => {
      const startDate = new Date(2025, 3, 10); // April 10, 2025
      const endDate = new Date(2025, 3, 5); // April 5, 2025 (earlier)
      
      const result = calendarService.createDateRange(startDate, endDate);
      
      // Should automatically sort dates
      expect(result.length).toBe(6); // 6 days total
      
      // First date in range (the earlier date)
      expect(result[0].getDate()).toBe(5);
      
      // Last date in range (the later date)
      expect(result[5].getDate()).toBe(10);
    });

    it('should handle single-day range', () => {
      const sameDate = new Date(2025, 3, 15); // April 15, 2025
      
      const result = calendarService.createDateRange(sameDate, sameDate);
      
      expect(result.length).toBe(1); // Just one day
      expect(result[0].getFullYear()).toBe(2025);
      expect(result[0].getMonth()).toBe(3);
      expect(result[0].getDate()).toBe(15);
    });
  });
});