import { CalendarService } from './calendar.service';
import { UIUpdaterService } from './ui-updater.service';
import { UIService } from './ui.service';

/**
 * Service responsible for keyboard navigation and accessibility
 */
export class KeyboardNavigationService {
  private calendarService: CalendarService;

  constructor(calendarService: CalendarService) {
    this.calendarService = calendarService;
  }

  /**
   * Handle keyboard navigation within the calendar
   * @returns new date if navigation should occur, null otherwise
   */
  handleKeyDown(
    e: KeyboardEvent,
    currentDate: Date,
    isOpen: boolean,
    firstDayOfWeek: number
  ): 
  { 
    newDate?: Date, 
    action?: 'select' | 'close' | 'focusOnly' | 'none',
    tabDirection?: 'forward' | 'backward' | 'none'
  } 
  {
    if (!isOpen) return { action: 'none' };
    
    const focusedDate = new Date(currentDate);
    let newDate: Date | undefined;
    let action: 'select' | 'close' | 'focusOnly' | 'none' = 'focusOnly';
    let tabDirection: 'forward' | 'backward' | 'none' = 'none';

    switch (e.key) {
      case 'ArrowLeft':
        // Previous day (move backward)
        e.preventDefault();
        newDate = new Date(focusedDate);
        newDate.setDate(focusedDate.getDate() - 1);
        break;
        
      case 'ArrowRight':
        // Next day (move forward)
        e.preventDefault();
        newDate = new Date(focusedDate);
        newDate.setDate(focusedDate.getDate() + 1);
        break;
        
      case 'ArrowUp':
        // Previous week (move up)
        e.preventDefault();
        newDate = new Date(focusedDate);
        newDate.setDate(focusedDate.getDate() - 7);
        break;
        
      case 'ArrowDown':
        // Next week (move down)
        e.preventDefault();
        newDate = new Date(focusedDate);
        newDate.setDate(focusedDate.getDate() + 7);
        break;
        
      case 'Home':
        // First day of the current week
        newDate = new Date(focusedDate);
        const dayOfWeek = focusedDate.getDay();
        const diff = (dayOfWeek - firstDayOfWeek + 7) % 7;
        newDate.setDate(focusedDate.getDate() - diff);
        e.preventDefault();
        break;
        
      case 'End':
        // Last day of the current week
        newDate = new Date(focusedDate);
        const currentDayOfWeek = focusedDate.getDay();
        const daysToAdd = (6 - currentDayOfWeek + firstDayOfWeek) % 7;
        newDate.setDate(focusedDate.getDate() + daysToAdd);
        e.preventDefault();
        break;
        
      case 'PageUp':
        // Previous month
        newDate = new Date(focusedDate);
        if (e.shiftKey) {
          // Previous year if Shift key is pressed
          newDate.setFullYear(focusedDate.getFullYear() - 1);
        } else {
          const currentDate = focusedDate.getDate();
          newDate.setMonth(focusedDate.getMonth() - 1);
          
          // Handle case when the previous month doesn't have as many days
          const newMonthMaxDays = new Date(newDate.getFullYear(), newDate.getMonth() + 1, 0).getDate();
          if (currentDate > newMonthMaxDays) {
            newDate.setDate(newMonthMaxDays);
          }
        }
        e.preventDefault();
        break;
        
      case 'PageDown':
        // Next month
        newDate = new Date(focusedDate);
        if (e.shiftKey) {
          // Next year if Shift key is pressed
          newDate.setFullYear(focusedDate.getFullYear() + 1);
        } else {
          const currentDate = focusedDate.getDate();
          newDate.setMonth(focusedDate.getMonth() + 1);
          
          // Handle case when the next month doesn't have as many days
          const newMonthMaxDays = new Date(newDate.getFullYear(), newDate.getMonth() + 1, 0).getDate();
          if (currentDate > newMonthMaxDays) {
            newDate.setDate(newMonthMaxDays);
          }
        }
        e.preventDefault();
        break;
        
      case 'Enter':
      case ' ': // Space
        // Select the focused date
        action = 'select';
        e.preventDefault();
        break;
        
      case 'Escape':
        // Close the calendar
        action = 'close';
        e.preventDefault();
        break;
        
      case 'Tab':
        // Just allow normal tabbing (focus trap is handled separately)
        tabDirection = e.shiftKey ? 'backward' : 'forward';
        action = 'none';
        break;
        
      default:
        action = 'none';
        break;
    }
    
    return { newDate, action, tabDirection };
  }

  /**
   * Find all focusable elements within a dialog
   */
  getFocusableElements(dialog: HTMLElement): HTMLElement[] {
    return Array.from(dialog.querySelectorAll(
      'button, [tabindex]:not([tabindex="-1"]), input, table[tabindex], td[tabindex="0"]'
    )) as HTMLElement[];
  }
  
  /**
   * Structure focusable elements into logical sections for navigation
   * This helps with understanding the tab flow through the dialog
   */
  getNavigationSections(dialog: HTMLElement): {
    headerElements: HTMLElement[],
    calendarElements: HTMLElement[],
    footerElements: HTMLElement[]
  } {
    const allElements = this.getFocusableElements(dialog);
    
    const headerElements = allElements.filter(el => {
      const header = dialog.querySelector('.date-picker-header');
      return header && header.contains(el);
    });
    
    const footerElements = allElements.filter(el => {
      const footer = dialog.querySelector('.date-picker-footer');
      return footer && footer.contains(el);
    });
    
    const calendarElements = allElements.filter(el => {
      const header = dialog.querySelector('.date-picker-header');
      const footer = dialog.querySelector('.date-picker-footer');
      return (!header || !header.contains(el)) && (!footer || !footer.contains(el));
    });
    
    return { headerElements, calendarElements, footerElements };
  }
  
  /**
   * Set up a focus trap for the dialog
   */
  handleFocusTrap(
    dialog: HTMLElement,
    activeElement: Element | null,
    tabDirection: 'forward' | 'backward'
  ): boolean {
    const focusableElements = this.getFocusableElements(dialog);
    if (!focusableElements.length) return false;
    
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    
    if (tabDirection === 'backward' && activeElement === firstElement) {
      lastElement.focus();
      return true; // Prevented default
    } else if (tabDirection === 'forward' && activeElement === lastElement) {
      firstElement.focus();
      return true; // Prevented default
    }
    
    return false;
  }

  /**
   * Setup keyboard navigation for the date picker calendar dialog
   */
  setupKeyboardNavigation(
    containerElement: HTMLElement,
    calendarService: CalendarService,
    uiUpdater: UIUpdaterService | UIService,
    callbacks: {
      onDateChange: (date: Date) => void;
      onSelectDate: (date: Date) => void;
      onPrevMonth: () => void;
      onNextMonth: () => void;
      onClose: () => void;
      onSelectMonth?: (monthIndex: number) => void;
      onSelectYear?: (year: number) => void;
      getCurrentViewMode?: () => string;
    }
  ): void {
    // Get dialog element
    const dialog = uiUpdater.getDialog(containerElement);
    if (!dialog) return;
    
    // Get the first day of week setting
    const firstDayOfWeek = calendarService.getFirstDayOfWeekValue();
    
    // Initialize logical tab order - we'll do this on each render
    this.setupTabOrder(dialog);
    
    // Event listener for keyboard navigation
    dialog.addEventListener('keydown', (e: KeyboardEvent) => {
      // Handle tab key separately for focus trapping and logical navigation
      if (e.key === 'Tab') {
        // Allow normal tab behavior - we want to be able to tab out of the grid
        return;
      }
      
      // Handle Escape key to close the dialog
      if (e.key === 'Escape') {
        e.preventDefault();
        callbacks.onClose();
        return;
      }
      
      // Find the currently focused element
      const focusedElement = document.activeElement as HTMLElement;
      
      // Get current view mode
      const currentViewMode = callbacks.getCurrentViewMode ? callbacks.getCurrentViewMode() : 'calendar';
      
      if (currentViewMode === 'months') {
        this.handleMonthViewKeyDown(e, focusedElement, dialog, callbacks);
        return;
      } else if (currentViewMode === 'years') {
        this.handleYearViewKeyDown(e, focusedElement, dialog, callbacks);
        return;
      }
      
      // Skip arrow key handling if focus is on buttons or other interactive elements
      // that are not date cells
      if (focusedElement.tagName === 'BUTTON' || 
          !focusedElement.classList.contains('date-picker-cell')) {
        return;
      }
      
      // Handle calendar grid navigation for date cells
      let focusedDate: Date | null = this.getFocusedDate(focusedElement, calendarService);
      
      // Use the handleKeyDown method to determine what to do
      const { newDate, action } = this.handleKeyDown(
        e,
        focusedDate || new Date(),
        true, // calendar is open
        firstDayOfWeek
      );
      
      // Handle the result from handleKeyDown
      if (action === 'close') {
        callbacks.onClose();
        return;
      }
      
      if (newDate) {
        // Get the current view month/year info from the header or focused date
        const monthYearElement = dialog.querySelector('.date-picker-header-title');
        let viewYear = focusedDate ? focusedDate.getFullYear() : new Date().getFullYear();
        let viewMonth = focusedDate ? focusedDate.getMonth() : new Date().getMonth();
        
        if (monthYearElement) {
          const monthYearText = monthYearElement.textContent || '';
          
          // Extract month and year from the header if possible
          const monthNames = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
          ];
          
          monthNames.forEach((name, index) => {
            if (monthYearText.includes(name)) {
              viewMonth = index;
            }
          });
          
          const yearMatch = monthYearText.match(/\d{4}/);
          if (yearMatch) {
            viewYear = parseInt(yearMatch[0], 10);
          }
        }
        
        // Check if the new date is in the current month view
        const isInCurrentMonth = newDate.getMonth() === viewMonth && 
                                newDate.getFullYear() === viewYear;
        
        if (!isInCurrentMonth) {
          // If navigating to a different month, we need to update the view
          const viewDate = new Date(newDate);
          callbacks.onDateChange(viewDate);
          
          // After the view updates, we need to focus the correct day
          setTimeout(() => {
            this.focusDateCell(dialog, newDate);
          }, 50);
        } else {
          // If within the current month, directly focus the date cell
          this.focusDateCell(dialog, newDate);
          
          if (action === 'select') {
            // Only select if the date is not disabled
            if (!calendarService.isDateDisabled(newDate)) {
              callbacks.onSelectDate(newDate);
            }
          }
        }
      } else if (action === 'select' && focusedElement && focusedElement.classList.contains('date-picker-cell')) {
        // Handle selection on the focused cell
        if (focusedDate) {
          callbacks.onSelectDate(focusedDate);
        }
      }
    });
  }

  /**
   * Setup proper tab order for all focusable elements in the dialog
   * This creates a logical tab flow: header -> calendar -> footer
   */
  private setupTabOrder(dialog: HTMLElement): void {
    // Get all sections of the date picker
    const headerEl = dialog.querySelector('.date-picker-header');
    const calendarEl = dialog.querySelector('.date-picker-calendar');
    const footerEl = dialog.querySelector('.date-picker-footer');
    
    // Define the tab order sequence
    
    // 1. Header buttons get tabindex="0" to be in the tab sequence
    const headerButtons = headerEl?.querySelectorAll('button');
    headerButtons?.forEach(button => {
      button.setAttribute('tabindex', '0');
    });
    
    // 2. Calendar table gets tabindex="0" to be in the tab sequence
    const calendarTable = calendarEl?.querySelector('.date-picker-table');
    if (calendarTable) {
      calendarTable.setAttribute('tabindex', '0');
    }
    
    // 3. All date cells get tabindex="-1" so they're not in the tab sequence
    // Only one date cell should be keyboard focusable via arrow keys at a time
    const dateCells = calendarEl?.querySelectorAll('.date-picker-cell:not(.weekday)');
    dateCells?.forEach(cell => {
      // All cells start with tabindex="-1" so they're not in the tab order
      cell.setAttribute('tabindex', '-1');
    });
    
    // Find active/focusable date cell (selected or today or first available)
    let focusableCell = calendarEl?.querySelector('.date-picker-cell.selected') as HTMLElement;
    if (!focusableCell) {
      focusableCell = calendarEl?.querySelector('.date-picker-cell.today:not(.disabled):not(.other-month)') as HTMLElement;
    }
    if (!focusableCell) {
      focusableCell = calendarEl?.querySelector('.date-picker-cell:not(.disabled):not(.other-month):not(.weekday)') as HTMLElement;
    }
    
    // Make one cell keyboard focusable at a time
    if (focusableCell) {
      focusableCell.setAttribute('tabindex', '0'); // Set to 0 to make it focusable
    }
    
    // 4. Footer buttons get tabindex="0" to be in the tab sequence
    const footerButtons = footerEl?.querySelectorAll('button');
    footerButtons?.forEach(button => {
      button.setAttribute('tabindex', '0');
    });
  }

  /**
   * Find closest valid date (for disabled dates)
   */
  findNearestEnabledDate(date: Date): Date {
    let closestDate = new Date(date);
    let found = false;
    let offset = 0;
    
    // Try up to 366 days in either direction (a full year)
    while (!found && offset <= 366) {
      // Check current date
      if (!this.calendarService.isDateDisabled(closestDate)) {
        found = true;
        break;
      }
      
      // Try one day forward
      const nextDate = new Date(date);
      nextDate.setDate(date.getDate() + offset + 1);
      if (!this.calendarService.isDateDisabled(nextDate)) {
        closestDate = nextDate;
        found = true;
        break;
      }
      
      // Try one day backward
      const prevDate = new Date(date);
      prevDate.setDate(date.getDate() - offset - 1);
      if (!this.calendarService.isDateDisabled(prevDate)) {
        closestDate = prevDate;
        found = true;
        break;
      }
      
      offset++;
    }
    
    return closestDate;
  }

  /**
   * Get the date associated with a focused element
   */
  private getFocusedDate(element: HTMLElement | null, calendarService: CalendarService): Date | null {
    if (!element || !element.classList.contains('date-picker-cell')) {
      return null;
    }
    
    // Extract date from data-date attribute
    const dateAttr = element.getAttribute('data-date');
    if (dateAttr) {
      return calendarService.parseDate(dateAttr);
    }
    
    // If no date attribute, try to extract from the cell's text content
    const day = parseInt(element.textContent?.trim() || '0', 10);
    if (isNaN(day) || day <= 0) {
      return null;
    }
    
    // Get current view month/year
    const monthYearElement = document.querySelector('.date-picker-header-title');
    if (!monthYearElement) {
      return null;
    }
    
    const monthYearText = monthYearElement.textContent || '';
    const today = new Date();
    
    // This is an approximation - actual parsing would depend on locale formatting
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    
    let month = today.getMonth();
    let year = today.getFullYear();
    
    // Try to extract month and year from the header
    monthNames.forEach((name, index) => {
      if (monthYearText.includes(name)) {
        month = index;
      }
    });
    
    // Try to extract the year
    const yearMatch = monthYearText.match(/\d{4}/);
    if (yearMatch) {
      year = parseInt(yearMatch[0], 10);
    }
    
    return new Date(year, month, day);
  }
  
  /**
   * Focus a specific date cell in the calendar
   */
  private focusDateCell(dialog: HTMLElement, date: Date): void {
    // Format the date to match the data-date attribute format (YYYY-MM-DD)
    const year = date.getFullYear();
    const month = date.getMonth() + 1; // JavaScript months are 0-indexed
    const day = date.getDate();
    
    const dateString = [
      year,
      String(month).padStart(2, '0'),
      String(day).padStart(2, '0')
    ].join('-');
    
    // Try to find the cell by data-date attribute first
    let cell = dialog.querySelector(`.date-picker-cell[data-date="${dateString}"]`) as HTMLElement;
    
    if (!cell) {
      // If not found by data-date, try to find by day number within the current month view
      const cells = Array.from(dialog.querySelectorAll('.date-picker-cell:not(.weekday)'));
      
      // Find the cell with matching day number
      cell = cells.find(el => {
        const dayText = el.textContent?.trim();
        const isPrevMonth = el.classList.contains('prev-month');
        const isNextMonth = el.classList.contains('next-month');
        return dayText === String(day) && !isPrevMonth && !isNextMonth;
      }) as HTMLElement;
    }
    
    if (cell) {
      // Update tabindex for all date cells
      const allDateCells = dialog.querySelectorAll('.date-picker-cell:not(.weekday)');
      allDateCells.forEach(dateCell => dateCell.setAttribute('tabindex', '-1'));
      
      // Make this cell focusable
      cell.setAttribute('tabindex', '0');
      
      // Focus the cell
      cell.focus();
      
      // Ensure it's visible (scroll into view if needed)
      cell.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }
  
  /**
   * Handle keyboard navigation in month view
   */
  private handleMonthViewKeyDown(
    e: KeyboardEvent, 
    focusedElement: HTMLElement, 
    dialog: HTMLElement,
    callbacks: any
  ): void {
    // Skip if focus is not on a month cell
    if (!focusedElement || !focusedElement.classList.contains('month-cell')) {
      return;
    }

    // Get the current month index from the focused element
    const monthIndex = parseInt(focusedElement.getAttribute('data-month-index') || '0', 10);
    
    // Calculate row and column in a 4x3 grid (0-based)
    const row = Math.floor(monthIndex / 3);
    const col = monthIndex % 3;
    
    let newRow = row;
    let newCol = col;
    let shouldSelect = false;
    
    switch (e.key) {
      case 'ArrowLeft':
        e.preventDefault();
        newCol = Math.max(0, col - 1);
        break;
        
      case 'ArrowRight':
        e.preventDefault();
        newCol = Math.min(2, col + 1);
        break;
        
      case 'ArrowUp':
        e.preventDefault();
        newRow = Math.max(0, row - 1);
        break;
        
      case 'ArrowDown':
        e.preventDefault();
        newRow = Math.min(3, row + 1);
        break;
        
      case 'Home':
        e.preventDefault();
        newRow = 0;
        newCol = 0;
        break;
        
      case 'End':
        e.preventDefault();
        newRow = 3;
        newCol = 2;
        break;
        
      case 'PageUp':
        // Go to previous year
        e.preventDefault();
        if (callbacks.onPrevMonth) {
          callbacks.onPrevMonth(); // This will navigate to the previous year in month view
          
          // Focus the same month in the previous year
          setTimeout(() => {
            this.focusMonthCell(dialog, monthIndex);
          }, 50);
        }
        return;
        
      case 'PageDown':
        // Go to next year
        e.preventDefault();
        if (callbacks.onNextMonth) {
          callbacks.onNextMonth(); // This will navigate to the next year in month view
          
          // Focus the same month in the next year
          setTimeout(() => {
            this.focusMonthCell(dialog, monthIndex);
          }, 50);
        }
        return;
        
      case 'Enter':
      case ' ': // Space
        e.preventDefault();
        shouldSelect = true;
        break;
    }
    
    // Calculate the new month index based on row and column
    const newMonthIndex = newRow * 3 + newCol;
    
    // Only proceed if we actually moved
    if (newMonthIndex !== monthIndex || shouldSelect) {
      // Find and focus the month cell
      this.focusMonthCell(dialog, newMonthIndex);
      
      // If should select, trigger the select callback
      if (shouldSelect && callbacks.onSelectMonth) {
        callbacks.onSelectMonth(newMonthIndex);
      }
    }
  }

  /**
   * Focus a specific month cell in the months view
   */
  private focusMonthCell(dialog: HTMLElement, monthIndex: number): void {
    // First make all month cells non-focusable
    const allMonthCells = dialog.querySelectorAll('.month-cell');
    allMonthCells.forEach(cell => {
      cell.setAttribute('tabindex', '-1');
    });
    
    // Find the cell for the target month
    const monthCell = dialog.querySelector(`.month-cell[data-month-index="${monthIndex}"]`) as HTMLElement;
    
    if (monthCell) {
      // Make it focusable
      monthCell.setAttribute('tabindex', '0');
      
      // Focus it
      monthCell.focus();
    }
  }
  
  /**
   * Handle keyboard navigation in year view
   */
  private handleYearViewKeyDown(
    e: KeyboardEvent, 
    focusedElement: HTMLElement, 
    dialog: HTMLElement,
    callbacks: any
  ): void {
    // Skip if focus is not on a year cell
    if (!focusedElement || !focusedElement.classList.contains('year-cell')) {
      return;
    }

    // Get the current year from the focused element
    const year = parseInt(focusedElement.getAttribute('data-year') || '0', 10);
    
    // Find all year cells to determine the grid structure
    const yearCells = Array.from(dialog.querySelectorAll('.year-cell'));
    const yearsPerRow = 4; // Typical layout is 4 years per row (4x4 grid)
    
    // Find the index of the current year in the grid
    const yearIndex = yearCells.findIndex(cell => 
      parseInt(cell.getAttribute('data-year') || '0', 10) === year
    );
    
    if (yearIndex === -1) return; // Year not found in the grid
    
    // Calculate row and column (0-based)
    const row = Math.floor(yearIndex / yearsPerRow);
    const col = yearIndex % yearsPerRow;
    
    let newRow = row;
    let newCol = col;
    let shouldSelect = false;
    
    switch (e.key) {
      case 'ArrowLeft':
        e.preventDefault();
        newCol = Math.max(0, col - 1);
        break;
        
      case 'ArrowRight':
        e.preventDefault();
        newCol = Math.min(yearsPerRow - 1, col + 1);
        break;
        
      case 'ArrowUp':
        e.preventDefault();
        newRow = Math.max(0, row - 1);
        break;
        
      case 'ArrowDown':
        e.preventDefault();
        newRow = Math.min(3, row + 1); // Assuming 4 rows (0-3)
        break;
        
      case 'Home':
        e.preventDefault();
        if (e.ctrlKey) {
          // First year in the grid
          newRow = 0;
          newCol = 0;
        } else {
          // First year in the row
          newCol = 0;
        }
        break;
        
      case 'End':
        e.preventDefault();
        if (e.ctrlKey) {
          // Last year in the grid
          newRow = 3; // Assuming 4 rows (0-3)
          newCol = yearsPerRow - 1;
        } else {
          // Last year in the row
          newCol = yearsPerRow - 1;
        }
        break;
        
      case 'PageUp':
        // Go to previous decade
        e.preventDefault();
        if (callbacks.onPrevMonth) {
          callbacks.onPrevMonth(); // This will navigate to the previous decade in year view
          
          // Try to focus the same relative position in the new decade
          setTimeout(() => {
            this.focusYearCell(dialog, year - 12);
          }, 50);
        }
        return;
        
      case 'PageDown':
        // Go to next decade
        e.preventDefault();
        if (callbacks.onNextMonth) {
          callbacks.onNextMonth(); // This will navigate to the next decade in year view
          
          // Try to focus the same relative position in the new decade
          setTimeout(() => {
            this.focusYearCell(dialog, year + 12);
          }, 50);
        }
        return;
        
      case 'Enter':
      case ' ': // Space
        e.preventDefault();
        shouldSelect = true;
        break;
    }
    
    // Calculate the new index based on row and column
    const newYearIndex = newRow * yearsPerRow + newCol;
    
    // Only proceed if the index is within bounds and we actually moved
    if (newYearIndex !== yearIndex && newYearIndex >= 0 && newYearIndex < yearCells.length) {
      // Get the year from the cell at the new index
      const newYear = parseInt(yearCells[newYearIndex].getAttribute('data-year') || '0', 10);
      
      // Find and focus the year cell
      this.focusYearCell(dialog, newYear);
      
      // If should select, trigger the select callback
      if (shouldSelect && callbacks.onSelectYear) {
        callbacks.onSelectYear(newYear);
      }
    } else if (shouldSelect && callbacks.onSelectYear) {
      // If selection was triggered without movement
      callbacks.onSelectYear(year);
    }
  }

  /**
   * Focus a specific year cell in the years view
   */
  private focusYearCell(dialog: HTMLElement, year: number): void {
    // First make all year cells non-focusable
    const allYearCells = dialog.querySelectorAll('.year-cell');
    allYearCells.forEach(cell => {
      cell.setAttribute('tabindex', '-1');
    });
    
    // Find the cell for the target year
    const yearCell = dialog.querySelector(`.year-cell[data-year="${year}"]`) as HTMLElement;
    
    if (yearCell) {
      // Make it focusable
      yearCell.setAttribute('tabindex', '0');
      
      // Focus it
      yearCell.focus();
    } else {
      // If the exact year is not found, try to find the closest year
      const availableYears = Array.from(allYearCells).map(
        cell => parseInt(cell.getAttribute('data-year') || '0', 10)
      );
      
      if (availableYears.length > 0) {
        // Find the closest year to the target
        const closestYear = availableYears.reduce((prev, curr) => {
          return (Math.abs(curr - year) < Math.abs(prev - year)) ? curr : prev;
        });
        
        const closestYearCell = dialog.querySelector(`.year-cell[data-year="${closestYear}"]`) as HTMLElement;
        if (closestYearCell) {
          closestYearCell.setAttribute('tabindex', '0');
          closestYearCell.focus();
        }
      }
    }
  }
  
  /**
   * Add global event listeners for outside clicks and focus trapping
   */
  setupGlobalListeners(
    containerElement: HTMLElement,
    isOpen: boolean,
    onClose: () => void
  ): () => void {
    // Close dialog when clicking outside the date picker
    const handleOutsideClick = (event: MouseEvent) => {
      if (!isOpen) return;
      
      const target = event.target as Node;
      if (containerElement && !containerElement.contains(target)) {
        onClose();
      }
    };
    
    // Setup focus trapping within the dialog
    const handleTabKey = (event: KeyboardEvent) => {
      if (!isOpen || event.key !== 'Tab') return;
      
      const dialog = containerElement.querySelector('.date-picker-dialog');
      if (!dialog) return;
      
      // Get all focusable elements
      const focusableElements = dialog.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      
      if (focusableElements.length === 0) return;
      
      const firstElement = focusableElements[0] as HTMLElement;
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;
      
      // Handle tab and shift+tab to create a focus loop
      if (event.shiftKey) {
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    };
    
    // Add event listeners
    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleTabKey);
    
    // Return cleanup function
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleTabKey);
    };
  }
}