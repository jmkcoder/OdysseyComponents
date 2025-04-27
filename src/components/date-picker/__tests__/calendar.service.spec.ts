// filepath: d:\Projects\Odyssey\components\node-explorer\src\components\date-picker\__tests__\calendar.service.spec.ts
import { CalendarService, CalendarServiceOptions } from '../services/calendar.service';

describe('CalendarService', () => {
  let calendarService: CalendarService;
  const defaultOptions: CalendarServiceOptions = {
    firstDayOfWeek: 0, // Sunday
    locale: 'en-US',
    minDate: null,
    maxDate: null,
    disabledDates: [],
    disabledDaysOfWeek: []
  };

  beforeEach(() => {
    calendarService = new CalendarService(defaultOptions);
  });

  describe('initialization', () => {
    it('should initialize with default options', () => {
      expect(calendarService.getFirstDayOfWeekValue()).toBe(0);
    });

    it('should initialize with custom first day of week', () => {
      const mondayFirstCalendar = new CalendarService({
        ...defaultOptions,
        firstDayOfWeek: 1 // Monday
      });
      expect(mondayFirstCalendar.getFirstDayOfWeekValue()).toBe(1);
    });
  });

  describe('getMonthData', () => {
    it('should generate calendar data for a month', () => {
      const year = 2025;
      const month = 3; // April (0-indexed)

      const monthData = calendarService.getMonthData(year, month);
      
      expect(monthData).toBeDefined();
      expect(Array.isArray(monthData)).toBe(true);
      
      // Should have exactly 6 weeks
      expect(monthData.length).toBe(6);
      
      // Each week should have 7 days
      monthData.forEach(week => {
        expect(week.length).toBe(7);
      });
      
      // First day of the first week should be before or on April 1, 2025
      const firstDay = monthData[0][0].date;
      const firstDayOfMonth = new Date(2025, 3, 1);
      expect(firstDay <= firstDayOfMonth).toBe(true);
      
      // Last day of the last week should be after or on April 30, 2025
      const lastDay = monthData[5][6].date;
      const lastDayOfMonth = new Date(2025, 3, 30);
      expect(lastDay >= lastDayOfMonth).toBe(true);

      // Check that dates are continuous
      const daysInMonth = monthData.flat();
      for (let i = 1; i < daysInMonth.length; i++) {
        const prevDate = daysInMonth[i - 1].date;
        const currDate = daysInMonth[i].date;
        const diffTime = currDate.getTime() - prevDate.getTime();
        const diffDays = diffTime / (1000 * 60 * 60 * 24);
        expect(diffDays).toBe(1);
      }
    });
  });

  describe('getWeekdays', () => {
    it('should return 7 weekday names starting with Sunday for default settings', () => {
      const weekdays = calendarService.getWeekdays();
      
      expect(weekdays).toHaveLength(7);
      // In en-US locale with firstDayOfWeek 0, should start with Sunday
      expect(weekdays[0].toLowerCase()).toContain('sun');
    });

    it('should start with Monday when firstDayOfWeek is 1', () => {
      const mondayFirstCalendar = new CalendarService({
        ...defaultOptions,
        firstDayOfWeek: 1 // Monday
      });
      
      const weekdays = mondayFirstCalendar.getWeekdays();
      
      expect(weekdays).toHaveLength(7);
      // Should start with Monday
      expect(weekdays[0].toLowerCase()).toContain('mon');
    });

    it('should use the specified locale for weekday names', () => {
      const frenchCalendar = new CalendarService({
        ...defaultOptions,
        locale: 'fr-FR'
      });
      
      const weekdays = frenchCalendar.getWeekdays();
      
      expect(weekdays).toHaveLength(7);
      // In fr-FR locale with firstDayOfWeek 0, should start with dimanche (Sunday)
      expect(weekdays[0].toLowerCase()).toContain('dim');
    });
  });

  describe('getMonthName and getMonthNames', () => {
    it('should return the correct month name', () => {
      expect(calendarService.getMonthName(0).toLowerCase()).toContain('january');
      expect(calendarService.getMonthName(1).toLowerCase()).toContain('february');
      expect(calendarService.getMonthName(11).toLowerCase()).toContain('december');
    });

    it('should return all month names', () => {
      const monthNames = calendarService.getMonthNames();
      expect(monthNames).toHaveLength(12);
      expect(monthNames[0].toLowerCase()).toContain('january');
      expect(monthNames[11].toLowerCase()).toContain('december');
    });

    it('should use the specified locale for month names', () => {
      const frenchCalendar = new CalendarService({
        ...defaultOptions,
        locale: 'fr-FR'
      });
      
      expect(frenchCalendar.getMonthName(0).toLowerCase()).toContain('janvier');
      expect(frenchCalendar.getMonthName(11).toLowerCase()).toContain('décembre');
    });
  });

  describe('getFirstDayOfWeek and getLastDayOfWeek', () => {
    it('should get the first day of the week containing a date', () => {
      // April 15, 2025 is a Tuesday
      const date = new Date(2025, 3, 15);
      const firstDay = calendarService.getFirstDayOfWeek(date);
      
      // With firstDayOfWeek = 0 (Sunday), the first day of the week should be April 13, 2025
      expect(firstDay.getFullYear()).toBe(2025);
      expect(firstDay.getMonth()).toBe(3);
      expect(firstDay.getDate()).toBe(13);
      expect(firstDay.getDay()).toBe(0); // Sunday
    });

    it('should get the last day of the week containing a date', () => {
      // April 15, 2025 is a Tuesday
      const date = new Date(2025, 3, 15);
      const lastDay = calendarService.getLastDayOfWeek(date);
      
      // With firstDayOfWeek = 0 (Sunday), the last day of the week should be April 19, 2025
      expect(lastDay.getFullYear()).toBe(2025);
      expect(lastDay.getMonth()).toBe(3);
      expect(lastDay.getDate()).toBe(19);
      expect(lastDay.getDay()).toBe(6); // Saturday
    });

    it('should respect the configured first day of week', () => {
      const mondayFirstCalendar = new CalendarService({
        ...defaultOptions,
        firstDayOfWeek: 1 // Monday
      });
      
      // April 15, 2025 is a Tuesday
      const date = new Date(2025, 3, 15);
      const firstDay = mondayFirstCalendar.getFirstDayOfWeek(date);
      
      // With firstDayOfWeek = 1 (Monday), the first day of the week should be April 14, 2025
      expect(firstDay.getFullYear()).toBe(2025);
      expect(firstDay.getMonth()).toBe(3);
      expect(firstDay.getDate()).toBe(14);
      expect(firstDay.getDay()).toBe(1); // Monday
    });
  });

  describe('createDateRange', () => {
    it('should create a range of dates inclusive of start and end dates', () => {
      const startDate = new Date(2025, 3, 15); // April 15, 2025
      const endDate = new Date(2025, 3, 20);   // April 20, 2025
      
      const range = calendarService.createDateRange(startDate, endDate);
      
      // Should include 6 dates (15, 16, 17, 18, 19, 20)
      expect(range).toHaveLength(6);
      
      // First date should be the start date
      expect(range[0].getFullYear()).toBe(2025);
      expect(range[0].getMonth()).toBe(3);
      expect(range[0].getDate()).toBe(15);
      
      // Last date should be the end date
      expect(range[range.length - 1].getFullYear()).toBe(2025);
      expect(range[range.length - 1].getMonth()).toBe(3);
      expect(range[range.length - 1].getDate()).toBe(20);

      // Check that dates are continuous
      for (let i = 1; i < range.length; i++) {
        const prevDate = range[i - 1];
        const currDate = range[i];
        const diffTime = currDate.getTime() - prevDate.getTime();
        const diffDays = diffTime / (1000 * 60 * 60 * 24);
        expect(diffDays).toBe(1);
      }
    });

    it('should handle start date after end date by swapping them', () => {
      const startDate = new Date(2025, 3, 20);   // April 20, 2025
      const endDate = new Date(2025, 3, 15);     // April 15, 2025
      
      const range = calendarService.createDateRange(startDate, endDate);
      
      // Should include 6 dates (15, 16, 17, 18, 19, 20)
      expect(range).toHaveLength(6);
      
      // First date should be April 15
      expect(range[0].getFullYear()).toBe(2025);
      expect(range[0].getMonth()).toBe(3);
      expect(range[0].getDate()).toBe(15);
      
      // Last date should be April 20
      expect(range[range.length - 1].getFullYear()).toBe(2025);
      expect(range[range.length - 1].getMonth()).toBe(3);
      expect(range[range.length - 1].getDate()).toBe(20);
    });
  });

  describe('isDateDisabled', () => {
    it('should respect min date constraint', () => {
      const minDate = new Date(2025, 3, 15); // April 15, 2025
      const calendarWithMin = new CalendarService({
        ...defaultOptions,
        minDate
      });
      
      // Date before min date should be disabled
      const beforeMin = new Date(2025, 3, 14); // April 14, 2025
      expect(calendarWithMin.isDateDisabled(beforeMin)).toBe(true);
      
      // Min date itself should be selectable (not disabled)
      expect(calendarWithMin.isDateDisabled(new Date(minDate))).toBe(false);
      
      // Date after min date should be selectable
      const afterMin = new Date(2025, 3, 16); // April 16, 2025
      expect(calendarWithMin.isDateDisabled(afterMin)).toBe(false);
    });

    it('should respect max date constraint', () => {
      const maxDate = new Date(2025, 3, 15); // April 15, 2025
      const calendarWithMax = new CalendarService({
        ...defaultOptions,
        maxDate
      });
      
      // Date after max date should be disabled
      const afterMax = new Date(2025, 3, 16); // April 16, 2025
      expect(calendarWithMax.isDateDisabled(afterMax)).toBe(true);
      
      // Max date itself should be selectable (not disabled)
      expect(calendarWithMax.isDateDisabled(new Date(maxDate))).toBe(false);
      
      // Date before max date should be selectable
      const beforeMax = new Date(2025, 3, 14); // April 14, 2025
      expect(calendarWithMax.isDateDisabled(beforeMax)).toBe(false);
    });

    it('should respect disabled days of week', () => {
      // Disable weekends (Saturday = 6, Sunday = 0)
      const calendarWithDisabledWeekends = new CalendarService({
        ...defaultOptions,
        disabledDaysOfWeek: [0, 6]
      });
      
      // April 13, 2025 is a Sunday (day 0)
      const sunday = new Date(2025, 3, 13);
      expect(calendarWithDisabledWeekends.isDateDisabled(sunday)).toBe(true);
      
      // April 19, 2025 is a Saturday (day 6)
      const saturday = new Date(2025, 3, 19);
      expect(calendarWithDisabledWeekends.isDateDisabled(saturday)).toBe(true);
      
      // April 15, 2025 is a Tuesday (day 2)
      const tuesday = new Date(2025, 3, 15);
      expect(calendarWithDisabledWeekends.isDateDisabled(tuesday)).toBe(false);
    });

    it('should respect disabled specific dates', () => {
      const disabledDates = [
        new Date(2025, 3, 15), // April 15, 2025
        new Date(2025, 3, 20)  // April 20, 2025
      ];
      
      const calendarWithDisabledDates = new CalendarService({
        ...defaultOptions,
        disabledDates
      });
      
      // Disabled dates should be disabled
      expect(calendarWithDisabledDates.isDateDisabled(new Date(2025, 3, 15))).toBe(true);
      expect(calendarWithDisabledDates.isDateDisabled(new Date(2025, 3, 20))).toBe(true);
      
      // Other dates should be selectable
      expect(calendarWithDisabledDates.isDateDisabled(new Date(2025, 3, 16))).toBe(false);
    });
  });

  describe('event management', () => {
    it('should add events to dates', () => {
      const events = {
        '2025-04-15': ['Meeting', 'Lunch'],
        '2025-04-20': ['Birthday Party']
      };
      
      calendarService.addEvents(events);
      
      expect(calendarService.hasEvents('2025-04-15')).toBe(true);
      expect(calendarService.hasEvents('2025-04-20')).toBe(true);
      expect(calendarService.hasEvents('2025-04-16')).toBe(false);
      
      expect(calendarService.getEvents('2025-04-15')).toEqual(['Meeting', 'Lunch']);
      expect(calendarService.getEvents('2025-04-20')).toEqual(['Birthday Party']);
      expect(calendarService.getEvents('2025-04-16')).toEqual([]);
    });

    it('should remove events from a date', () => {
      const events = {
        '2025-04-15': ['Meeting', 'Lunch'],
        '2025-04-20': ['Birthday Party']
      };
      
      calendarService.addEvents(events);
      calendarService.removeEvents('2025-04-15');
      
      expect(calendarService.hasEvents('2025-04-15')).toBe(false);
      expect(calendarService.hasEvents('2025-04-20')).toBe(true);
    });

    it('should clear all events', () => {
      const events = {
        '2025-04-15': ['Meeting', 'Lunch'],
        '2025-04-20': ['Birthday Party']
      };
      
      calendarService.addEvents(events);
      calendarService.clearEvents();
      
      expect(calendarService.hasEvents('2025-04-15')).toBe(false);
      expect(calendarService.hasEvents('2025-04-20')).toBe(false);
    });

    it('should get events as object', () => {
      const events = {
        '2025-04-15': ['Meeting', 'Lunch'],
        '2025-04-20': ['Birthday Party']
      };
      
      calendarService.addEvents(events);
      
      const eventsObj = calendarService.getEventsAsObject();
      
      expect(eventsObj).toEqual(events);
    });
  });
});