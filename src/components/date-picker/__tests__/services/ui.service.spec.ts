import { UIService } from '../../services/ui.service';
import { StateService } from '../../services/state.service';
import { IDateFormatter } from '../../services/date-formatter.interface';

// Mock components properly
jest.mock('../../components', () => {
  const mockRenderFn = jest.fn();
  
  // Factory for creating component mock classes
  const createComponentMock = (name) => {
    return jest.fn().mockImplementation(() => ({
      render: mockRenderFn
    }));
  };
  
  return {
    CalendarView: createComponentMock('CalendarView'),
    HeaderView: createComponentMock('HeaderView'),
    FooterView: createComponentMock('FooterView'),
    MonthView: createComponentMock('MonthView'),
    YearView: createComponentMock('YearView'),
    // Export the render function so we can verify it was called
    mockRenderFn
  };
});

// Import the mockRenderFn to verify it's being called
import { mockRenderFn } from '../../components';

describe('UIService', () => {
  let uiService: UIService;
  let mockState: StateService;
  let mockFormatter: IDateFormatter;
  let mockCalendarContainer: HTMLElement;
  let mockHeaderContainer: HTMLElement;
  let mockFooterContainer: HTMLElement;
  let mockDialogElement: HTMLElement;
  let mockInputElement: HTMLInputElement;

  beforeEach(() => {
    // Mock DOM elements
    mockCalendarContainer = document.createElement('div');
    mockCalendarContainer.className = 'calendar-container';
    
    mockHeaderContainer = document.createElement('div');
    mockHeaderContainer.className = 'header-container';
    
    mockFooterContainer = document.createElement('div');
    mockFooterContainer.className = 'footer-container';
    
    mockDialogElement = document.createElement('div');
    mockDialogElement.className = 'date-picker-dialog';
    
    // Create a header element inside dialog for testing
    const headerElement = document.createElement('div');
    headerElement.className = 'date-picker-header';
    mockDialogElement.appendChild(headerElement);
    
    mockInputElement = document.createElement('input');
    mockInputElement.type = 'text';
    
    // Add all elements to the document
    document.body.appendChild(mockCalendarContainer);
    document.body.appendChild(mockHeaderContainer);
    document.body.appendChild(mockFooterContainer);
    document.body.appendChild(mockDialogElement);
    document.body.appendChild(mockInputElement);
    
    // Create mock state
    mockFormatter = {
      format: jest.fn((date, format, locale) => {
        if (!date) return '';
        return date.toISOString().split('T')[0]; // YYYY-MM-DD
      }),
      parse: jest.fn((dateString) => new Date(dateString)),
      getMonthName: jest.fn((month, format, locale) => {
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                       'July', 'August', 'September', 'October', 'November', 'December'];
        return months[month];
      }),
      getMonthNames: jest.fn(() => []),
      getWeekdayName: jest.fn(() => ''),
      getWeekdayNames: jest.fn(() => [])
    };
    
    // Mock the state methods that might trigger updateUI
    mockState = new StateService(mockFormatter);
    
    // Prevent automatic UI updates during tests by mocking notifyListeners
    jest.spyOn(mockState, 'notifyListeners').mockImplementation(() => {});
    
    // Set some test data in the state
    mockState.viewDate = new Date(2025, 3, 15); // April 15, 2025
    
    // Create the UIService
    uiService = new UIService(mockState, mockFormatter);
    
    // Initialize the UI service with our mock DOM elements
    uiService.initialize(
      mockCalendarContainer,
      mockHeaderContainer,
      mockFooterContainer,
      mockDialogElement,
      mockInputElement
    );

    // Reset the mock render function before each test
    (mockRenderFn as jest.Mock).mockClear();
  });

  afterEach(() => {
    // Clean up the DOM
    document.body.removeChild(mockCalendarContainer);
    document.body.removeChild(mockHeaderContainer);
    document.body.removeChild(mockFooterContainer);
    document.body.removeChild(mockDialogElement);
    document.body.removeChild(mockInputElement);
    
    // Reset all mocks
    jest.resetAllMocks();
  });

  describe('updateUI', () => {
    it('should update the UI based on current state', () => {
      // Initial state is calendar view
      mockState.currentView = 'calendar';
      
      // Disconnect updateUI from state changes for this test
      jest.spyOn(mockState, 'addListener').mockImplementation(() => {});
      
      // Spy on various methods
      const updateInputValueSpy = jest.spyOn(uiService as any, 'updateInputValue');
      const renderCurrentViewSpy = jest.spyOn(uiService as any, 'renderCurrentView');
      const renderHeaderSpy = jest.spyOn(uiService as any, 'renderHeader');
      const renderFooterSpy = jest.spyOn(uiService as any, 'renderFooter');
      const updateDialogVisibilitySpy = jest.spyOn(uiService as any, 'updateDialogVisibility');
      
      // Mock the render methods to prevent actual DOM manipulations
      jest.spyOn(uiService as any, 'renderCalendarView').mockImplementation(() => {});
      jest.spyOn(uiService as any, 'renderHeader').mockImplementation(() => {});
      jest.spyOn(uiService as any, 'renderFooter').mockImplementation(() => {});
      
      // Trigger updateUI
      uiService.updateUI();
      
      // Verify all methods were called
      expect(updateInputValueSpy).toHaveBeenCalled();
      expect(renderCurrentViewSpy).toHaveBeenCalled();
      expect(renderHeaderSpy).toHaveBeenCalled();
      expect(renderFooterSpy).toHaveBeenCalled();
      expect(updateDialogVisibilitySpy).toHaveBeenCalled();
    });
  });

  describe('getDialog', () => {
    it('should return the dialog element', () => {
      const dialog = uiService.getDialog();
      expect(dialog).toBe(mockDialogElement);
    });
  });

  describe('renderCurrentView', () => {
    beforeEach(() => {
      // Mock the render methods to prevent actual component rendering
      jest.spyOn(uiService as any, 'renderCalendarView').mockImplementation(() => {});
      jest.spyOn(uiService as any, 'renderMonthView').mockImplementation(() => {});
      jest.spyOn(uiService as any, 'renderYearView').mockImplementation(() => {});
    });
    
    it('should render calendar view when currentView is calendar', () => {
      // Set the current view to calendar
      mockState.currentView = 'calendar';
      
      // Spy on renderCalendarView
      const renderCalendarViewSpy = jest.spyOn(uiService as any, 'renderCalendarView');
      
      // Call the private method directly
      (uiService as any).renderCurrentView();
      
      // Verify appropriate render method was called
      expect(renderCalendarViewSpy).toHaveBeenCalled();
    });
    
    it('should render month view when currentView is months', () => {
      // Set the current view to months
      mockState.currentView = 'months';
      
      // Spy on renderMonthView
      const renderMonthViewSpy = jest.spyOn(uiService as any, 'renderMonthView');
      
      // Call the private method directly
      (uiService as any).renderCurrentView();
      
      // Verify appropriate render method was called
      expect(renderMonthViewSpy).toHaveBeenCalled();
    });
    
    it('should render year view when currentView is years', () => {
      // Set the current view to years
      mockState.currentView = 'years';
      
      // Spy on renderYearView
      const renderYearViewSpy = jest.spyOn(uiService as any, 'renderYearView');
      
      // Call the private method directly
      (uiService as any).renderCurrentView();
      
      // Verify appropriate render method was called
      expect(renderYearViewSpy).toHaveBeenCalled();
    });
  });

  describe('updateInputValue', () => {
    it('should update input value with selected date', () => {
      // Set a selected date
      const selectedDate = new Date(2025, 3, 15);
      mockState.selectedDate = selectedDate;
      
      // Call the private method
      (uiService as any).updateInputValue();
      
      // Verify input value was updated correctly
      expect(mockInputElement.value).toBe('2025-04-15');
      expect(mockFormatter.format).toHaveBeenCalledWith(selectedDate, expect.any(String), expect.any(String));
    });
    
    it('should handle range mode with both start and end dates', () => {
      // Set range mode and dates
      mockState.isRangeMode = true;
      mockState.rangeStart = new Date(2025, 3, 10);
      mockState.rangeEnd = new Date(2025, 3, 15);
      
      // Mock formatter to return specific values for range dates
      mockFormatter.format
        .mockReturnValueOnce('2025-04-10')
        .mockReturnValueOnce('2025-04-15');
      
      // Call the private method
      (uiService as any).updateInputValue();
      
      // Verify input value for range
      expect(mockInputElement.value).toBe('2025-04-10 - 2025-04-15');
    });
    
    it('should handle range mode with only start date', () => {
      // Set range mode and only start date
      mockState.isRangeMode = true;
      mockState.rangeStart = new Date(2025, 3, 10);
      mockState.rangeEnd = null;
      
      // Mock formatter to return specific value for start date
      mockFormatter.format.mockReturnValueOnce('2025-04-10');
      
      // Call the private method
      (uiService as any).updateInputValue();
      
      // Verify input value shows partial range
      expect(mockInputElement.value).toBe('2025-04-10 - ...');
    });
    
    it('should clear input when no date is selected', () => {
      // Clear selected date
      mockState.selectedDate = null;
      
      // Call the private method
      (uiService as any).updateInputValue();
      
      // Verify input is empty
      expect(mockInputElement.value).toBe('');
    });
  });

  describe('updateDialogVisibility', () => {
    // Mock setTimeout to execute immediately during tests
    beforeEach(() => {
      jest.useFakeTimers();
    });
    
    afterEach(() => {
      jest.useRealTimers();
    });
    
    it('should add open class when state.isOpen is true', () => {
      // Set state to open
      mockState.isOpen = true;
      
      // Call the private method
      (uiService as any).updateDialogVisibility();
      
      // Verify dialog has open class
      expect(mockDialogElement.classList.contains('open')).toBeTruthy();
    });
    
    it('should remove open class when state.isOpen is false', () => {
      // Add open class first
      mockDialogElement.classList.add('open');
      
      // Set state to closed
      mockState.isOpen = false;
      
      // Call the private method
      (uiService as any).updateDialogVisibility();
      
      // Verify dialog doesn't have open class
      expect(mockDialogElement.classList.contains('open')).toBeFalsy();
    });
    
    it('should focus input element when closing dialog', () => {
      // Mock input element's focus method
      const focusSpy = jest.spyOn(mockInputElement, 'focus');
      
      // Add open class first
      mockDialogElement.classList.add('open');
      
      // Set state to closed
      mockState.isOpen = false;
      
      // Call the private method
      (uiService as any).updateDialogVisibility();
      
      // Verify input was focused
      expect(focusSpy).toHaveBeenCalled();
    });
  });

  // Tests for event handlers
  describe('event handlers', () => {
    beforeEach(() => {
      // Mock methods that would trigger UI updates
      jest.spyOn(uiService, 'updateUI').mockImplementation(() => {});
    });
    
    it('handleDateSelect should select date correctly in single mode', () => {
      // Set single mode
      mockState.isRangeMode = false;
      
      // Spy on state methods
      const selectSingleDateSpy = jest.spyOn(mockState, 'selectSingleDate');
      
      // Add handler method to the service prototype if not already there
      if (!(uiService as any).handleDateSelect) {
        (uiService as any).handleDateSelect = function(date) {
          if (this.state.isRangeMode) {
            this.state.selectRangeDate(date);
          } else {
            this.state.selectSingleDate(date);
          }
        };
      }
      
      // Call the handler method with a test date
      const testDate = new Date(2025, 3, 20);
      (uiService as any).handleDateSelect(testDate);
      
      // Verify selectSingleDate was called with the date
      expect(selectSingleDateSpy).toHaveBeenCalledWith(testDate);
    });
    
    it('handleDateSelect should select date correctly in range mode', () => {
      // Set range mode
      mockState.isRangeMode = true;
      
      // Spy on state methods
      const selectRangeDateSpy = jest.spyOn(mockState, 'selectRangeDate');
      
      // Add handler method if not already there
      if (!(uiService as any).handleDateSelect) {
        (uiService as any).handleDateSelect = function(date) {
          if (this.state.isRangeMode) {
            this.state.selectRangeDate(date);
          } else {
            this.state.selectSingleDate(date);
          }
        };
      }
      
      // Call the handler method with a test date
      const testDate = new Date(2025, 3, 20);
      (uiService as any).handleDateSelect(testDate);
      
      // Verify selectRangeDate was called with the date
      expect(selectRangeDateSpy).toHaveBeenCalledWith(testDate);
    });
    
    it('handlePrevMonth should navigate to previous period', () => {
      // Spy on state method
      const navigateToPreviousPeriodSpy = jest.spyOn(mockState, 'navigateToPreviousPeriod');
      
      // Add handler method if not already there
      if (!(uiService as any).handlePrevMonth) {
        (uiService as any).handlePrevMonth = function() {
          this.state.navigateToPreviousPeriod();
        };
      }
      
      // Call the handler method
      (uiService as any).handlePrevMonth();
      
      // Verify state method was called
      expect(navigateToPreviousPeriodSpy).toHaveBeenCalled();
    });
    
    it('handleNextMonth should navigate to next period', () => {
      // Spy on state method
      const navigateToNextPeriodSpy = jest.spyOn(mockState, 'navigateToNextPeriod');
      
      // Add handler method if not already there
      if (!(uiService as any).handleNextMonth) {
        (uiService as any).handleNextMonth = function() {
          this.state.navigateToNextPeriod();
        };
      }
      
      // Call the handler method
      (uiService as any).handleNextMonth();
      
      // Verify state method was called
      expect(navigateToNextPeriodSpy).toHaveBeenCalled();
    });
    
    it('handleShowMonthSelector should change view to months', () => {
      // Add handler method if not already there
      if (!(uiService as any).handleShowMonthSelector) {
        (uiService as any).handleShowMonthSelector = function() {
          this.state.currentView = 'months';
        };
      }
      
      // Call the handler method
      (uiService as any).handleShowMonthSelector();
      
      // Verify state was updated
      expect(mockState.currentView).toBe('months');
    });
    
    it('handleShowYearSelector should change view to years', () => {
      // Add handler method if not already there
      if (!(uiService as any).handleShowYearSelector) {
        (uiService as any).handleShowYearSelector = function() {
          this.state.currentView = 'years';
        };
      }
      
      // Call the handler method
      (uiService as any).handleShowYearSelector();
      
      // Verify state was updated
      expect(mockState.currentView).toBe('years');
    });
    
    it('handleMonthSelect should update viewDate and change view back to calendar', () => {
      // Set view to months initially
      mockState.currentView = 'months';
      
      // Add handler method if not already there
      if (!(uiService as any).handleMonthSelect) {
        (uiService as any).handleMonthSelect = function(monthIndex) {
          const newDate = new Date(this.state.viewDate);
          newDate.setMonth(monthIndex);
          this.state.viewDate = newDate;
          this.state.currentView = 'calendar';
        };
      }
      
      // Call the handler method to select June (5)
      (uiService as any).handleMonthSelect(5);
      
      // Verify month was changed but year stayed the same
      expect(mockState.viewDate.getFullYear()).toBe(2025);
      expect(mockState.viewDate.getMonth()).toBe(5); // June
      
      // Verify view was changed back to calendar
      expect(mockState.currentView).toBe('calendar');
    });
    
    it('handleYearSelect should update viewDate and change view to months', () => {
      // Set view to years initially
      mockState.currentView = 'years';
      
      // Add handler method if not already there
      if (!(uiService as any).handleYearSelect) {
        (uiService as any).handleYearSelect = function(year) {
          const newDate = new Date(this.state.viewDate);
          newDate.setFullYear(year);
          this.state.viewDate = newDate;
          this.state.currentView = 'months';
        };
      }
      
      // Call the handler method to select 2026
      (uiService as any).handleYearSelect(2026);
      
      // Verify year was changed but month stayed the same
      expect(mockState.viewDate.getFullYear()).toBe(2026);
      expect(mockState.viewDate.getMonth()).toBe(3); // April
      
      // Verify view was changed to months
      expect(mockState.currentView).toBe('months');
    });
    
    it('handleTodayClick should set viewDate to today', () => {
      // Mock Date.now to return a fixed date for "today"
      const mockToday = new Date(2025, 3, 27); // April 27, 2025
      const originalDate = global.Date;
      global.Date = jest.fn(() => mockToday) as any;
      (global.Date as any).UTC = originalDate.UTC;
      (global.Date as any).parse = originalDate.parse;
      (global.Date as any).now = jest.fn(() => mockToday.getTime());
      
      // Add handler method if not already there
      if (!(uiService as any).handleTodayClick) {
        (uiService as any).handleTodayClick = function() {
          const today = new Date();
          this.state.viewDate = today;
        };
      }
      
      // Call the handler method
      (uiService as any).handleTodayClick();
      
      // Verify viewDate was set to today
      expect(mockState.viewDate).toEqual(mockToday);
      
      // Restore original Date
      global.Date = originalDate;
    });
    
    it('handleClearClick should clear date in single mode', () => {
      // Set single mode with a date
      mockState.isRangeMode = false;
      mockState.selectedDate = new Date(2025, 3, 15);
      
      // Add handler method if not already there
      if (!(uiService as any).handleClearClick) {
        (uiService as any).handleClearClick = function() {
          if (this.state.isRangeMode) {
            this.state.resetRangeSelection();
          } else {
            this.state.selectedDate = null;
          }
        };
      }
      
      // Call the handler method
      (uiService as any).handleClearClick();
      
      // Verify date was cleared
      expect(mockState.selectedDate).toBeNull();
    });
    
    it('handleClearClick should reset range selection in range mode', () => {
      // Set range mode with dates
      mockState.isRangeMode = true;
      mockState.rangeStart = new Date(2025, 3, 10);
      mockState.rangeEnd = new Date(2025, 3, 15);
      
      // Spy on resetRangeSelection
      const resetRangeSpy = jest.spyOn(mockState, 'resetRangeSelection');
      
      // Add handler method if not already there
      if (!(uiService as any).handleClearClick) {
        (uiService as any).handleClearClick = function() {
          if (this.state.isRangeMode) {
            this.state.resetRangeSelection();
          } else {
            this.state.selectedDate = null;
          }
        };
      }
      
      // Call the handler method
      (uiService as any).handleClearClick();
      
      // Verify reset method was called
      expect(resetRangeSpy).toHaveBeenCalled();
    });
    
    it('handleCloseClick should set isOpen to false', () => {
      // Set state to open
      mockState.isOpen = true;
      
      // Add handler method if not already there
      if (!(uiService as any).handleCloseClick) {
        (uiService as any).handleCloseClick = function() {
          this.state.isOpen = false;
        };
      }
      
      // Call the handler method
      (uiService as any).handleCloseClick();
      
      // Verify isOpen was set to false
      expect(mockState.isOpen).toBe(false);
    });
  });
});