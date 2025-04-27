import { StateService } from '../../services/state.service';
import { IDateFormatter } from '../../services/date-formatter.interface';

describe('StateService', () => {
  let stateService: StateService;
  let mockFormatter: IDateFormatter;

  beforeEach(() => {
    // Create a mock formatter
    mockFormatter = {
      format: jest.fn((date, format) => {
        if (!date) return '';
        if (format === 'yyyy-MM-dd') {
          return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        }
        return date.toISOString();
      }),
      parse: jest.fn((dateString) => {
        if (!dateString) return new Date(NaN); // Return an invalid Date instead of null
        if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
          const [year, month, day] = dateString.split('-').map(Number);
          return new Date(year, month - 1, day);
        }
        return new Date(dateString);
      }),
      getMonthName: jest.fn(),
      getWeekdayName: jest.fn(),
    };

    // Initialize the service with mock formatter
    stateService = new StateService(mockFormatter);
  });

  describe('initialization', () => {
    it('should initialize with default state values', () => {
      expect(stateService.selectedDate).toBeNull();
      expect(stateService.viewDate).toBeInstanceOf(Date);
      expect(stateService.isOpen).toBe(false);
      expect(stateService.currentView).toBe('calendar');
    });
    
    it('should initialize with locale from navigator', () => {
      expect(stateService.locale).toBe(navigator.language);
    });
  });

  describe('state change listeners', () => {
    it('should notify listeners when state changes', () => {
      const listener = { onStateChange: jest.fn() };
      
      // Add listener
      stateService.addListener(listener);
      
      // Change state
      stateService.selectedDate = new Date(2025, 3, 15);
      
      // Verify listener was notified
      expect(listener.onStateChange).toHaveBeenCalled();
    });
    
    it('should remove listeners correctly', () => {
      const listener = { onStateChange: jest.fn() };
      
      // Add and remove listener
      stateService.addListener(listener);
      stateService.removeListener(listener);
      
      // Change state
      stateService.selectedDate = new Date(2025, 3, 15);
      
      // Verify listener was not notified
      expect(listener.onStateChange).not.toHaveBeenCalled();
    });
  });

  describe('date selection', () => {
    it('should update selected date', () => {
      const newDate = new Date(2025, 5, 20); // June 20, 2025
      stateService.selectedDate = newDate;
      
      expect(stateService.selectedDate).toBe(newDate);
    });
    
    it('should handle setting selected date to null', () => {
      // First set a date
      stateService.selectedDate = new Date(2025, 5, 20);
      
      // Then clear it
      stateService.selectedDate = null;
      
      expect(stateService.selectedDate).toBeNull();
    });

    it('should select single date', () => {
      const date = new Date(2025, 3, 15);
      stateService.selectSingleDate(date);
      
      expect(stateService.selectedDate).toEqual(date);
    });
    
    it('should not select disabled dates', () => {
      const date = new Date(2025, 3, 15);
      
      // Mock isDateDisabled to return true
      jest.spyOn(stateService, 'isDateDisabled').mockReturnValue(true);
      
      stateService.selectSingleDate(date);
      
      // Selected date should not change
      expect(stateService.selectedDate).toBeNull();
    });
  });

  describe('range selection', () => {
    it('should handle range selection start', () => {
      const date = new Date(2025, 3, 15);
      
      // Set range mode
      stateService.isRangeMode = true;
      stateService.selectRangeDate(date);
      
      expect(stateService.rangeStart).toEqual(date);
      expect(stateService.rangeEnd).toBeNull();
      expect(stateService.rangeSelectionInProgress).toBe(true);
    });
    
    it('should handle range selection completion', () => {
      const startDate = new Date(2025, 3, 15);
      const endDate = new Date(2025, 3, 20);
      
      // Set range mode
      stateService.isRangeMode = true;
      
      // Select start date
      stateService.selectRangeDate(startDate);
      
      // Select end date
      stateService.selectRangeDate(endDate);
      
      expect(stateService.rangeStart).toEqual(startDate);
      expect(stateService.rangeEnd).toEqual(endDate);
      expect(stateService.rangeSelectionInProgress).toBe(false);
    });
    
    it('should swap dates if end date is before start date', () => {
      const laterDate = new Date(2025, 3, 20);
      const earlierDate = new Date(2025, 3, 15);
      
      // Set range mode
      stateService.isRangeMode = true;
      
      // Select start date (the later one)
      stateService.selectRangeDate(laterDate);
      
      // Select end date (the earlier one)
      stateService.selectRangeDate(earlierDate);
      
      expect(stateService.rangeStart).toEqual(earlierDate);
      expect(stateService.rangeEnd).toEqual(laterDate);
    });
    
    it('should reset range selection', () => {
      const startDate = new Date(2025, 3, 15);
      const endDate = new Date(2025, 3, 20);
      
      // Set range mode and select range
      stateService.isRangeMode = true;
      stateService.selectRangeDate(startDate);
      stateService.selectRangeDate(endDate);
      
      // Reset range selection
      stateService.resetRangeSelection();
      
      expect(stateService.rangeStart).toBeNull();
      expect(stateService.rangeEnd).toBeNull();
      expect(stateService.rangeSelectionInProgress).toBe(false);
    });
  });

  describe('navigation', () => {
    describe('navigateToNextPeriod', () => {
      it('should move to next month in calendar view', () => {
        // Set up initial state
        const initialDate = new Date(2025, 3, 15); // April 15, 2025
        stateService.viewDate = initialDate;
        stateService.currentView = 'calendar';
        
        // Navigate to next period
        stateService.navigateToNextPeriod();
        
        // Should be May 2025
        expect(stateService.viewDate.getFullYear()).toBe(2025);
        expect(stateService.viewDate.getMonth()).toBe(4); // May
      });
      
      it('should move to next year in months view', () => {
        // Set up initial state
        const initialDate = new Date(2025, 3, 15); // April 15, 2025
        stateService.viewDate = initialDate;
        stateService.currentView = 'months';
        
        // Navigate to next period
        stateService.navigateToNextPeriod();
        
        // Should be April 2026
        expect(stateService.viewDate.getFullYear()).toBe(2026);
        expect(stateService.viewDate.getMonth()).toBe(3); // April
      });
      
      it('should move ahead 15 years in years view', () => {
        // Set up initial state
        const initialDate = new Date(2025, 3, 15); // April 15, 2025
        stateService.viewDate = initialDate;
        stateService.currentView = 'years';
        
        // Navigate to next period
        stateService.navigateToNextPeriod();
        
        // Should be April 2040
        expect(stateService.viewDate.getFullYear()).toBe(2040);
        expect(stateService.viewDate.getMonth()).toBe(3); // April
      });
    });
    
    describe('navigateToPreviousPeriod', () => {
      it('should move to previous month in calendar view', () => {
        // Set up initial state
        const initialDate = new Date(2025, 3, 15); // April 15, 2025
        stateService.viewDate = initialDate;
        stateService.currentView = 'calendar';
        
        // Navigate to previous period
        stateService.navigateToPreviousPeriod();
        
        // Should be March 2025
        expect(stateService.viewDate.getFullYear()).toBe(2025);
        expect(stateService.viewDate.getMonth()).toBe(2); // March
      });
      
      it('should move to previous year in months view', () => {
        // Set up initial state
        const initialDate = new Date(2025, 3, 15); // April 15, 2025
        stateService.viewDate = initialDate;
        stateService.currentView = 'months';
        
        // Navigate to previous period
        stateService.navigateToPreviousPeriod();
        
        // Should be April 2024
        expect(stateService.viewDate.getFullYear()).toBe(2024);
        expect(stateService.viewDate.getMonth()).toBe(3); // April
      });
      
      it('should move back 15 years in years view', () => {
        // Set up initial state
        const initialDate = new Date(2025, 3, 15); // April 15, 2025
        stateService.viewDate = initialDate;
        stateService.currentView = 'years';
        
        // Navigate to previous period
        stateService.navigateToPreviousPeriod();
        
        // Should be April 2010
        expect(stateService.viewDate.getFullYear()).toBe(2010);
        expect(stateService.viewDate.getMonth()).toBe(3); // April
      });
    });
  });

  describe('events management', () => {
    it('should add events to a date', () => {
      const date = new Date(2025, 3, 15);
      const eventName = 'Meeting';
      
      stateService.addEvent(date, eventName);
      
      const dateKey = '2025-04-15'; // This matches our mock formatter output
      const events = stateService.getEvents(dateKey);
      
      expect(events).toContain(eventName);
      expect(stateService.hasEventsOnDate(date)).toBe(true);
    });
    
    it('should clear events from a date', () => {
      const date = new Date(2025, 3, 15);
      
      // Add an event first
      stateService.addEvent(date, 'Meeting');
      
      // Clear events
      stateService.clearEvents(date);
      
      const dateKey = '2025-04-15';
      const events = stateService.getEvents(dateKey);
      
      expect(events.length).toBe(0);
      expect(stateService.hasEventsOnDate(date)).toBe(false);
    });
    
    it('should add multiple events to the same date', () => {
      const date = new Date(2025, 3, 15);
      
      stateService.addEvent(date, 'Meeting');
      stateService.addEvent(date, 'Lunch');
      
      const dateKey = '2025-04-15';
      const events = stateService.getEvents(dateKey);
      
      expect(events).toContain('Meeting');
      expect(events).toContain('Lunch');
      expect(events.length).toBe(2);
    });
  });

  describe('disabled dates', () => {
    it('should handle disabled dates', () => {
      const disabledDate = new Date(2025, 3, 15);
      const enabledDate = new Date(2025, 3, 16);
      const reason = 'Holiday';
      
      // Add disabled date with reason
      stateService.addDisabledDate(disabledDate, reason);
      
      // Check if dates are disabled
      expect(stateService.isDateDisabled(disabledDate)).toBe(true);
      expect(stateService.isDateDisabled(enabledDate)).toBe(false);
      
      // Check reason
      expect(stateService.getDisabledDateReason(disabledDate)).toBe(reason);
      expect(stateService.getDisabledDateReason(enabledDate)).toBeNull();
    });
    
    it('should handle multiple disabled dates', () => {
      const dates = [
        new Date(2025, 3, 15),
        new Date(2025, 3, 16)
      ];
      const reason = 'Weekend';
      
      // Add multiple disabled dates
      stateService.addDisabledDates(dates, reason);
      
      // Check if all dates are disabled
      expect(stateService.isDateDisabled(dates[0])).toBe(true);
      expect(stateService.isDateDisabled(dates[1])).toBe(true);
    });
    
    it('should clear disabled dates', () => {
      const date = new Date(2025, 3, 15);
      
      // Add disabled date
      stateService.addDisabledDate(date);
      
      // Clear disabled dates
      stateService.clearDisabledDates();
      
      // Date should no longer be disabled
      expect(stateService.isDateDisabled(date)).toBe(false);
    });
    
    it('should remove specific disabled date', () => {
      const date1 = new Date(2025, 3, 15);
      const date2 = new Date(2025, 3, 16);
      
      // Add disabled dates
      stateService.addDisabledDate(date1);
      stateService.addDisabledDate(date2);
      
      // Remove one date
      stateService.removeDisabledDate(date1);
      
      // Check status
      expect(stateService.isDateDisabled(date1)).toBe(false);
      expect(stateService.isDateDisabled(date2)).toBe(true);
    });
  });

  describe('disabled weekdays', () => {
    it('should handle disabled weekdays', () => {
      const sunday = 0;
      const monday = 1;
      
      // Disable Sunday
      stateService.addDisabledWeekday(sunday);
      
      // Check if weekdays are disabled
      expect(stateService.isWeekdayDisabled(sunday)).toBe(true);
      expect(stateService.isWeekdayDisabled(monday)).toBe(false);
      
      // Check if dates with these weekdays are disabled
      const sundayDate = new Date(2025, 3, 13); // April 13, 2025 is a Sunday
      const mondayDate = new Date(2025, 3, 14); // April 14, 2025 is a Monday
      
      expect(stateService.isDateDisabled(sundayDate)).toBe(true);
      expect(stateService.isDateDisabled(mondayDate)).toBe(false);
    });
    
    it('should handle multiple disabled weekdays', () => {
      const weekends = [0, 6]; // Sunday and Saturday
      
      // Add multiple disabled weekdays
      stateService.addDisabledWeekdays(weekends);
      
      // Check if all weekdays are disabled
      expect(stateService.isWeekdayDisabled(0)).toBe(true);
      expect(stateService.isWeekdayDisabled(6)).toBe(true);
      expect(stateService.isWeekdayDisabled(1)).toBe(false);
      
      // Get disabled weekdays
      const disabledWeekdays = stateService.getDisabledWeekdays();
      expect(disabledWeekdays).toContain(0);
      expect(disabledWeekdays).toContain(6);
      expect(disabledWeekdays.length).toBe(2);
    });
    
    it('should clear disabled weekdays', () => {
      const sunday = 0;
      
      // Add disabled weekday
      stateService.addDisabledWeekday(sunday);
      
      // Clear disabled weekdays
      stateService.clearDisabledWeekdays();
      
      // Weekday should no longer be disabled
      expect(stateService.isWeekdayDisabled(sunday)).toBe(false);
    });
    
    it('should remove specific disabled weekday', () => {
      const sunday = 0;
      const saturday = 6;
      
      // Add disabled weekdays
      stateService.addDisabledWeekday(sunday);
      stateService.addDisabledWeekday(saturday);
      
      // Remove one weekday
      stateService.removeDisabledWeekday(sunday);
      
      // Check status
      expect(stateService.isWeekdayDisabled(sunday)).toBe(false);
      expect(stateService.isWeekdayDisabled(saturday)).toBe(true);
    });
  });

  describe('disabled months', () => {
    it('should handle disabled months', () => {
      const january = 0;
      const february = 1;
      
      // Disable January
      stateService.addDisabledMonth(january);
      
      // Check if months are disabled
      expect(stateService.isMonthDisabled(january)).toBe(true);
      expect(stateService.isMonthDisabled(february)).toBe(false);
      
      // Check if dates in these months are disabled
      const januaryDate = new Date(2025, 0, 15); // January 15, 2025
      const februaryDate = new Date(2025, 1, 15); // February 15, 2025
      
      expect(stateService.isDateDisabled(januaryDate)).toBe(true);
      expect(stateService.isDateDisabled(februaryDate)).toBe(false);
    });
    
    it('should handle multiple disabled months', () => {
      const winterMonths = [11, 0, 1]; // December, January, February
      
      // Add multiple disabled months
      stateService.addDisabledMonths(winterMonths);
      
      // Check if all months are disabled
      expect(stateService.isMonthDisabled(11)).toBe(true);
      expect(stateService.isMonthDisabled(0)).toBe(true);
      expect(stateService.isMonthDisabled(1)).toBe(true);
      expect(stateService.isMonthDisabled(2)).toBe(false);
      
      // Get disabled months
      const disabledMonths = stateService.getDisabledMonths();
      expect(disabledMonths).toContain(11);
      expect(disabledMonths).toContain(0);
      expect(disabledMonths).toContain(1);
      expect(disabledMonths.length).toBe(3);
    });
    
    it('should clear disabled months', () => {
      const january = 0;
      
      // Add disabled month
      stateService.addDisabledMonth(january);
      
      // Clear disabled months
      stateService.clearDisabledMonths();
      
      // Month should no longer be disabled
      expect(stateService.isMonthDisabled(january)).toBe(false);
    });
    
    it('should remove specific disabled month', () => {
      const january = 0;
      const february = 1;
      
      // Add disabled months
      stateService.addDisabledMonth(january);
      stateService.addDisabledMonth(february);
      
      // Remove one month
      stateService.removeDisabledMonth(january);
      
      // Check status
      expect(stateService.isMonthDisabled(january)).toBe(false);
      expect(stateService.isMonthDisabled(february)).toBe(true);
    });
  });

  describe('available dates', () => {
    it('should get available dates in range', () => {
      const startDate = new Date(2025, 3, 10);
      const endDate = new Date(2025, 3, 20);
      
      // Disable some dates in the range
      stateService.addDisabledDate(new Date(2025, 3, 15));
      stateService.addDisabledDate(new Date(2025, 3, 16));
      
      // Add min/max date constraints
      stateService.minDate = new Date(2025, 3, 12);
      stateService.maxDate = new Date(2025, 3, 18);
      
      // Get available dates
      const availableDates = stateService.getAvailableDatesInRange(startDate, endDate);
      
      // Check results
      expect(availableDates.length).toBe(5); // 12, 13, 14, 17, 18 should be available
      
      // Verify all dates are within min/max and not disabled
      availableDates.forEach(date => {
        expect(date >= stateService.minDate!).toBe(true);
        expect(date <= stateService.maxDate!).toBe(true);
        expect(date.getFullYear()).toBe(2025);
        expect(date.getMonth()).toBe(3);
        expect([15, 16].includes(date.getDate())).toBe(false);
      });
    });
  });

  describe('date utilities', () => {
    it('should check if date is in range', () => {
      // Set up range
      stateService.isRangeMode = true;
      stateService.rangeStart = new Date(2025, 3, 10);
      stateService.rangeEnd = new Date(2025, 3, 20);
      
      // Test dates
      const inRangeDate = new Date(2025, 3, 15);
      const beforeRangeDate = new Date(2025, 3, 5);
      const afterRangeDate = new Date(2025, 3, 25);
      
      expect(stateService.isDateInRange(inRangeDate)).toBe(true);
      expect(stateService.isDateInRange(beforeRangeDate)).toBe(false);
      expect(stateService.isDateInRange(afterRangeDate)).toBe(false);
    });
    
    it('should check if two dates are the same', () => {
      const date1 = new Date(2025, 3, 15);
      const date2 = new Date(2025, 3, 15);
      const date3 = new Date(2025, 3, 16);
      
      expect(stateService.isSameDate(date1, date2)).toBe(true);
      expect(stateService.isSameDate(date1, date3)).toBe(false);
      expect(stateService.isSameDate(date1, null)).toBe(false);
      expect(stateService.isSameDate(null, null)).toBe(false);
    });
  });
});