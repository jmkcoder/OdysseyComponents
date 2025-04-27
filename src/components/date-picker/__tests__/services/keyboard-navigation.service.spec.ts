import { KeyboardNavigationService } from '../../services/keyboard-navigation.service';
import { CalendarService } from '../../services/calendar.service';
import { UIService } from '../../services/ui.service';
import { UIUpdaterService } from '../../services/ui-updater.service';

// Mock CalendarService 
class MockCalendarService {
  getFirstDayOfWeekValue = jest.fn().mockReturnValue(0); // Sunday as default
  isDateDisabled = jest.fn().mockReturnValue(false); // No date is disabled by default
  parseDate = jest.fn().mockImplementation((dateStr: string) => new Date(dateStr));
}

// Mock UI service
class MockUIService {
  getDialog = jest.fn().mockImplementation(() => document.createElement('div'));
}

// Mock UI Updater service
class MockUIUpdaterService {
  getDialog = jest.fn().mockImplementation(() => document.createElement('div'));
}

describe('KeyboardNavigationService', () => {
  let keyboardNavService: KeyboardNavigationService;
  let calendarService: MockCalendarService;
  let uiService: MockUIService;
  let uiUpdaterService: MockUIUpdaterService;
  
  // Helper function to create a date cell element
  function createDateCell(date: string, isDisabled = false, isOtherMonth = false) {
    const cell = document.createElement('td');
    cell.classList.add('date-picker-cell');
    cell.setAttribute('data-date', date);
    cell.setAttribute('tabindex', '0');
    if (isDisabled) cell.classList.add('disabled');
    if (isOtherMonth) cell.classList.add('other-month');
    return cell;
  }

  // Helper function to create a month cell element
  function createMonthCell(monthIndex: number, row: number, col: number) {
    const cell = document.createElement('td');
    cell.classList.add('month-cell');
    cell.setAttribute('data-month-index', monthIndex.toString());
    cell.setAttribute('data-row', row.toString());
    cell.setAttribute('data-col', col.toString());
    cell.setAttribute('tabindex', '0');
    return cell;
  }

  // Helper function to create a year cell element
  function createYearCell(year: number, row: number, col: number) {
    const cell = document.createElement('td');
    cell.classList.add('year-cell');
    cell.setAttribute('data-year', year.toString());
    cell.setAttribute('data-row', row.toString());
    cell.setAttribute('data-col', col.toString());
    cell.setAttribute('tabindex', '0');
    return cell;
  }

  beforeEach(() => {
    // Setup document body for DOM manipulation tests
    document.body.innerHTML = '';
    
    // Create a dialog structure
    const dialog = document.createElement('div');
    dialog.classList.add('date-picker-dialog');
    
    // Add header section
    const header = document.createElement('div');
    header.classList.add('date-picker-header');
    const headerTitle = document.createElement('div');
    headerTitle.classList.add('date-picker-header-title');
    headerTitle.textContent = 'April 2025';
    header.appendChild(headerTitle);
    dialog.appendChild(header);
    
    // Add calendar section
    const calendar = document.createElement('div');
    calendar.classList.add('date-picker-calendar');
    const table = document.createElement('table');
    table.classList.add('date-picker-table');
    calendar.appendChild(table);
    dialog.appendChild(calendar);
    
    // Add footer section
    const footer = document.createElement('div');
    footer.classList.add('date-picker-footer');
    dialog.appendChild(footer);

    document.body.appendChild(dialog);
    
    // Initialize mocks
    calendarService = new MockCalendarService();
    uiService = new MockUIService();
    uiUpdaterService = new MockUIUpdaterService();
    
    // Initialize service
    keyboardNavService = new KeyboardNavigationService(calendarService as unknown as CalendarService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('handleKeyDown', () => {
    it('should handle ArrowLeft key to navigate to previous day', () => {
      const currentDate = new Date(2025, 3, 15); // April 15, 2025
      const event = new KeyboardEvent('keydown', { key: 'ArrowLeft' });
      
      // Mock preventDefault
      Object.defineProperty(event, 'preventDefault', { value: jest.fn() });
      
      const result = keyboardNavService.handleKeyDown(event, currentDate, true, 0);
      
      expect(event.preventDefault).toHaveBeenCalled();
      expect(result.newDate).toEqual(new Date(2025, 3, 14)); // April 14, 2025
      expect(result.action).toBe('focusOnly');
    });

    it('should handle ArrowRight key to navigate to next day', () => {
      const currentDate = new Date(2025, 3, 15); // April 15, 2025
      const event = new KeyboardEvent('keydown', { key: 'ArrowRight' });
      
      // Mock preventDefault
      Object.defineProperty(event, 'preventDefault', { value: jest.fn() });
      
      const result = keyboardNavService.handleKeyDown(event, currentDate, true, 0);
      
      expect(event.preventDefault).toHaveBeenCalled();
      expect(result.newDate).toEqual(new Date(2025, 3, 16)); // April 16, 2025
      expect(result.action).toBe('focusOnly');
    });

    it('should handle ArrowUp key to navigate to previous week', () => {
      const currentDate = new Date(2025, 3, 15); // April 15, 2025
      const event = new KeyboardEvent('keydown', { key: 'ArrowUp' });
      
      // Mock preventDefault
      Object.defineProperty(event, 'preventDefault', { value: jest.fn() });
      
      const result = keyboardNavService.handleKeyDown(event, currentDate, true, 0);
      
      expect(event.preventDefault).toHaveBeenCalled();
      expect(result.newDate).toEqual(new Date(2025, 3, 8)); // April 8, 2025
      expect(result.action).toBe('focusOnly');
    });

    it('should handle ArrowDown key to navigate to next week', () => {
      const currentDate = new Date(2025, 3, 15); // April 15, 2025
      const event = new KeyboardEvent('keydown', { key: 'ArrowDown' });
      
      // Mock preventDefault
      Object.defineProperty(event, 'preventDefault', { value: jest.fn() });
      
      const result = keyboardNavService.handleKeyDown(event, currentDate, true, 0);
      
      expect(event.preventDefault).toHaveBeenCalled();
      expect(result.newDate).toEqual(new Date(2025, 3, 22)); // April 22, 2025
      expect(result.action).toBe('focusOnly');
    });

    it('should handle Home key to navigate to first day of week', () => {
      const currentDate = new Date(2025, 3, 15); // April 15, 2025 (Wednesday)
      const event = new KeyboardEvent('keydown', { key: 'Home' });
      
      // Mock preventDefault
      Object.defineProperty(event, 'preventDefault', { value: jest.fn() });
      
      // Test with firstDayOfWeek = 0 (Sunday)
      const result = keyboardNavService.handleKeyDown(event, currentDate, true, 0);
      
      expect(event.preventDefault).toHaveBeenCalled();
      expect(result.newDate?.getDay()).toBe(0); // Should be Sunday
      expect(result.action).toBe('focusOnly');
    });

    it('should handle End key to navigate to last day of week', () => {
      const currentDate = new Date(2025, 3, 15); // April 15, 2025 (Wednesday)
      const event = new KeyboardEvent('keydown', { key: 'End' });
      
      // Mock preventDefault
      Object.defineProperty(event, 'preventDefault', { value: jest.fn() });
      
      // Test with firstDayOfWeek = 0 (Sunday)
      const result = keyboardNavService.handleKeyDown(event, currentDate, true, 0);
      
      expect(event.preventDefault).toHaveBeenCalled();
      expect(result.newDate?.getDay()).toBe(6); // Should be Saturday
      expect(result.action).toBe('focusOnly');
    });

    it('should handle PageUp key to navigate to previous month', () => {
      const currentDate = new Date(2025, 3, 15); // April 15, 2025
      const event = new KeyboardEvent('keydown', { key: 'PageUp' });
      
      // Mock preventDefault
      Object.defineProperty(event, 'preventDefault', { value: jest.fn() });
      
      const result = keyboardNavService.handleKeyDown(event, currentDate, true, 0);
      
      expect(event.preventDefault).toHaveBeenCalled();
      expect(result.newDate).toEqual(new Date(2025, 2, 15)); // March 15, 2025
      expect(result.action).toBe('focusOnly');
    });

    it('should handle PageUp key with shift to navigate to previous year', () => {
      const currentDate = new Date(2025, 3, 15); // April 15, 2025
      const event = new KeyboardEvent('keydown', { key: 'PageUp', shiftKey: true });
      
      // Mock preventDefault
      Object.defineProperty(event, 'preventDefault', { value: jest.fn() });
      
      const result = keyboardNavService.handleKeyDown(event, currentDate, true, 0);
      
      expect(event.preventDefault).toHaveBeenCalled();
      expect(result.newDate).toEqual(new Date(2024, 3, 15)); // April 15, 2024
      expect(result.action).toBe('focusOnly');
    });

    it('should handle PageDown key to navigate to next month', () => {
      const currentDate = new Date(2025, 3, 15); // April 15, 2025
      const event = new KeyboardEvent('keydown', { key: 'PageDown' });
      
      // Mock preventDefault
      Object.defineProperty(event, 'preventDefault', { value: jest.fn() });
      
      const result = keyboardNavService.handleKeyDown(event, currentDate, true, 0);
      
      expect(event.preventDefault).toHaveBeenCalled();
      expect(result.newDate).toEqual(new Date(2025, 4, 15)); // May 15, 2025
      expect(result.action).toBe('focusOnly');
    });

    it('should handle PageDown key with shift to navigate to next year', () => {
      const currentDate = new Date(2025, 3, 15); // April 15, 2025
      const event = new KeyboardEvent('keydown', { key: 'PageDown', shiftKey: true });
      
      // Mock preventDefault
      Object.defineProperty(event, 'preventDefault', { value: jest.fn() });
      
      const result = keyboardNavService.handleKeyDown(event, currentDate, true, 0);
      
      expect(event.preventDefault).toHaveBeenCalled();
      expect(result.newDate).toEqual(new Date(2026, 3, 15)); // April 15, 2026
      expect(result.action).toBe('focusOnly');
    });

    it('should handle Enter key to select current date', () => {
      const currentDate = new Date(2025, 3, 15); // April 15, 2025
      const event = new KeyboardEvent('keydown', { key: 'Enter' });
      
      // Mock preventDefault
      Object.defineProperty(event, 'preventDefault', { value: jest.fn() });
      
      const result = keyboardNavService.handleKeyDown(event, currentDate, true, 0);
      
      expect(event.preventDefault).toHaveBeenCalled();
      expect(result.action).toBe('select');
    });

    it('should handle Space key to select current date', () => {
      const currentDate = new Date(2025, 3, 15); // April 15, 2025
      const event = new KeyboardEvent('keydown', { key: ' ' });
      
      // Mock preventDefault
      Object.defineProperty(event, 'preventDefault', { value: jest.fn() });
      
      const result = keyboardNavService.handleKeyDown(event, currentDate, true, 0);
      
      expect(event.preventDefault).toHaveBeenCalled();
      expect(result.action).toBe('select');
    });

    it('should handle Escape key to close the calendar', () => {
      const currentDate = new Date(2025, 3, 15); // April 15, 2025
      const event = new KeyboardEvent('keydown', { key: 'Escape' });
      
      // Mock preventDefault
      Object.defineProperty(event, 'preventDefault', { value: jest.fn() });
      
      const result = keyboardNavService.handleKeyDown(event, currentDate, true, 0);
      
      expect(event.preventDefault).toHaveBeenCalled();
      expect(result.action).toBe('close');
    });

    it('should handle Tab key for normal tabbing', () => {
      const currentDate = new Date(2025, 3, 15); // April 15, 2025
      const event = new KeyboardEvent('keydown', { key: 'Tab' });
      
      const result = keyboardNavService.handleKeyDown(event, currentDate, true, 0);
      
      expect(result.tabDirection).toBe('forward');
      expect(result.action).toBe('none');
    });

    it('should handle Shift+Tab key for backwards tabbing', () => {
      const currentDate = new Date(2025, 3, 15); // April 15, 2025
      const event = new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true });
      
      const result = keyboardNavService.handleKeyDown(event, currentDate, true, 0);
      
      expect(result.tabDirection).toBe('backward');
      expect(result.action).toBe('none');
    });

    it('should do nothing when calendar is not open', () => {
      const currentDate = new Date(2025, 3, 15); // April 15, 2025
      const event = new KeyboardEvent('keydown', { key: 'ArrowLeft' });
      
      const result = keyboardNavService.handleKeyDown(event, currentDate, false, 0);
      
      expect(result.action).toBe('none');
      expect(result.newDate).toBeUndefined();
    });
  });

  describe('getFocusableElements', () => {
    it('should return all focusable elements in the dialog', () => {
      // Setup DOM with focusable elements
      const dialog = document.createElement('div');
      
      // Add some focusable elements
      const button = document.createElement('button');
      const input = document.createElement('input');
      const tabDiv = document.createElement('div');
      tabDiv.setAttribute('tabindex', '0');
      const nonFocusableDiv = document.createElement('div');
      
      dialog.appendChild(button);
      dialog.appendChild(input);
      dialog.appendChild(tabDiv);
      dialog.appendChild(nonFocusableDiv);
      
      const result = keyboardNavService.getFocusableElements(dialog);
      
      // Should find 3 focusable elements
      expect(result.length).toBe(3);
      expect(result).toContain(button);
      expect(result).toContain(input);
      expect(result).toContain(tabDiv);
      expect(result).not.toContain(nonFocusableDiv);
    });
  });

  describe('getNavigationSections', () => {
    it('should structure focusable elements into logical sections', () => {
      // Setup DOM with header, calendar and footer sections
      const dialog = document.createElement('div');
      
      // Create header with focusable elements
      const header = document.createElement('div');
      header.classList.add('date-picker-header');
      const headerButton = document.createElement('button');
      header.appendChild(headerButton);
      dialog.appendChild(header);
      
      // Create calendar with focusable elements
      const calendar = document.createElement('div');
      calendar.classList.add('date-picker-calendar');
      const calendarCell = document.createElement('td');
      calendarCell.setAttribute('tabindex', '0');
      calendar.appendChild(calendarCell);
      dialog.appendChild(calendar);
      
      // Create footer with focusable elements
      const footer = document.createElement('div');
      footer.classList.add('date-picker-footer');
      const footerButton = document.createElement('button');
      footer.appendChild(footerButton);
      dialog.appendChild(footer);
      
      const result = keyboardNavService.getNavigationSections(dialog);
      
      expect(result.headerElements).toContain(headerButton);
      expect(result.calendarElements).toContain(calendarCell);
      expect(result.footerElements).toContain(footerButton);
    });
  });

  describe('handleFocusTrap', () => {
    it('should trap focus when tabbing forward from last element', () => {
      // Setup DOM with focusable elements
      const dialog = document.createElement('div');
      
      // Add some focusable elements
      const firstButton = document.createElement('button');
      firstButton.id = 'first';
      const lastButton = document.createElement('button');
      lastButton.id = 'last';
      
      dialog.appendChild(firstButton);
      dialog.appendChild(lastButton);
      
      // Mock focus method for elements
      firstButton.focus = jest.fn();
      lastButton.focus = jest.fn();
      
      // Test focus trap when last element is active and tabbing forward
      const result = keyboardNavService.handleFocusTrap(
        dialog,
        lastButton,
        'forward'
      );
      
      expect(result).toBe(true); // Should have prevented default
      expect(firstButton.focus).toHaveBeenCalled();
    });

    it('should trap focus when tabbing backward from first element', () => {
      // Setup DOM with focusable elements
      const dialog = document.createElement('div');
      
      // Add some focusable elements
      const firstButton = document.createElement('button');
      firstButton.id = 'first';
      const lastButton = document.createElement('button');
      lastButton.id = 'last';
      
      dialog.appendChild(firstButton);
      dialog.appendChild(lastButton);
      
      // Mock focus method for elements
      firstButton.focus = jest.fn();
      lastButton.focus = jest.fn();
      
      // Test focus trap when first element is active and tabbing backward
      const result = keyboardNavService.handleFocusTrap(
        dialog,
        firstButton,
        'backward'
      );
      
      expect(result).toBe(true); // Should have prevented default
      expect(lastButton.focus).toHaveBeenCalled();
    });

    it('should not trap focus when tabbing within elements', () => {
      // Setup DOM with focusable elements
      const dialog = document.createElement('div');
      
      // Add some focusable elements
      const firstButton = document.createElement('button');
      const middleButton = document.createElement('button');
      const lastButton = document.createElement('button');
      
      dialog.appendChild(firstButton);
      dialog.appendChild(middleButton);
      dialog.appendChild(lastButton);
      
      // Mock focus method for elements
      firstButton.focus = jest.fn();
      lastButton.focus = jest.fn();
      
      // Test regular tabbing with middle element active
      const result = keyboardNavService.handleFocusTrap(
        dialog,
        middleButton,
        'forward'
      );
      
      expect(result).toBe(false); // Should not have prevented default
      expect(firstButton.focus).not.toHaveBeenCalled();
      expect(lastButton.focus).not.toHaveBeenCalled();
    });
  });
  
  describe('findNearestEnabledDate', () => {
    it('should return the same date if it is not disabled', () => {
      const currentDate = new Date(2025, 3, 15);
      calendarService.isDateDisabled.mockReturnValue(false);
      
      const result = keyboardNavService.findNearestEnabledDate(currentDate);
      
      expect(result).toEqual(currentDate);
      expect(calendarService.isDateDisabled).toHaveBeenCalledWith(currentDate);
    });
    
    it('should find the next available date if current date is disabled', () => {
      const currentDate = new Date(2025, 3, 15);
      
      // Mock isDateDisabled to return true for current date, and then true for next day
      calendarService.isDateDisabled
        .mockReturnValueOnce(true) // First call for current date
        .mockReturnValueOnce(false); // Second call for next day
      
      const result = keyboardNavService.findNearestEnabledDate(currentDate);
      
      // Should find the next available date
      expect(result.getDate()).toBe(16); // April 16
    });
    
    it('should find the previous available date if current and next dates are disabled', () => {
      const currentDate = new Date(2025, 3, 15);
      
      // Mock isDateDisabled to return true for current date and next day, false for previous day
      calendarService.isDateDisabled
        .mockReturnValueOnce(true) // Current date
        .mockReturnValueOnce(true) // Next day
        .mockReturnValueOnce(false); // Previous day
      
      const result = keyboardNavService.findNearestEnabledDate(currentDate);
      
      // Should find the previous available date
      expect(result.getDate()).toBe(14); // April 14
    });
  });

  // Additional tests for setupKeyboardNavigation, setupTabOrder, etc.
  describe('setupTabOrder', () => {
    it('should set up proper tabindex attributes on elements', () => {
      const dialog = document.createElement('div');
      dialog.classList.add('date-picker-dialog');
      
      // Create header
      const header = document.createElement('div');
      header.classList.add('date-picker-header');
      const headerButton = document.createElement('button');
      header.appendChild(headerButton);
      dialog.appendChild(header);
      
      // Create calendar
      const calendar = document.createElement('div');
      calendar.classList.add('date-picker-calendar');
      const table = document.createElement('table');
      table.classList.add('date-picker-table');
      
      // Create date cells
      const selectedCell = createDateCell('2025-04-15', false, false);
      selectedCell.classList.add('selected');
      
      const todayCell = createDateCell('2025-04-27', false, false);
      todayCell.classList.add('today');
      
      const normalCell = createDateCell('2025-04-20', false, false);
      
      const disabledCell = createDateCell('2025-04-01', true, false);
      
      const otherMonthCell = createDateCell('2025-05-01', false, true);
      otherMonthCell.classList.add('other-month');
      
      const weekdayCell = document.createElement('th');
      weekdayCell.classList.add('date-picker-cell', 'weekday');
      
      table.append(weekdayCell, selectedCell, todayCell, normalCell, disabledCell, otherMonthCell);
      calendar.appendChild(table);
      dialog.appendChild(calendar);
      
      // Create footer
      const footer = document.createElement('div');
      footer.classList.add('date-picker-footer');
      const footerButton = document.createElement('button');
      footer.appendChild(footerButton);
      dialog.appendChild(footer);
      
      document.body.appendChild(dialog);
      
      // Call setupTabOrder (need to do this via the private method accessor)
      const setupTabOrderFn = (keyboardNavService as any).setupTabOrder.bind(keyboardNavService);
      setupTabOrderFn(dialog);
      
      // Check tabindex attributes
      // Header buttons should be in the tab sequence
      expect(headerButton.getAttribute('tabindex')).toBe('0');
      
      // Calendar table should be in the tab sequence
      expect(table.getAttribute('tabindex')).toBe('0');
      
      // Selected cell should be the only date cell in the tab sequence
      expect(selectedCell.getAttribute('tabindex')).toBe('0');
      expect(todayCell.getAttribute('tabindex')).toBe('-1');
      expect(normalCell.getAttribute('tabindex')).toBe('-1');
      expect(disabledCell.getAttribute('tabindex')).toBe('-1');
      expect(otherMonthCell.getAttribute('tabindex')).toBe('-1');
      
      // Footer buttons should be in the tab sequence
      expect(footerButton.getAttribute('tabindex')).toBe('0');
      
      // Clean up
      document.body.removeChild(dialog);
    });
  });
});