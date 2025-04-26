import { CalendarService } from './calendar.service';
import { UIUpdaterService } from './ui-updater.service';

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
  ): { 
    newDate?: Date, 
    action?: 'select' | 'close' | 'focusOnly' | 'none',
    tabDirection?: 'forward' | 'backward' | 'none'
  } {
    if (!isOpen) return { action: 'none' };
    
    const focusedDate = new Date(currentDate);
    let newDate: Date | undefined;
    let action: 'select' | 'close' | 'focusOnly' | 'none' = 'focusOnly';
    let tabDirection: 'forward' | 'backward' | 'none' = 'none';
    
    switch (e.key) {
      case 'ArrowLeft':
        // Previous day
        newDate = new Date(focusedDate);
        newDate.setDate(focusedDate.getDate() - 1);
        e.preventDefault();
        break;
        
      case 'ArrowRight':
        // Next day
        newDate = new Date(focusedDate);
        newDate.setDate(focusedDate.getDate() + 1);
        e.preventDefault();
        break;
        
      case 'ArrowUp':
        // Previous week
        newDate = new Date(focusedDate);
        newDate.setDate(focusedDate.getDate() - 7);
        e.preventDefault();
        break;
        
      case 'ArrowDown':
        // Next week
        newDate = new Date(focusedDate);
        newDate.setDate(focusedDate.getDate() + 7);
        e.preventDefault();
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
      'button, [tabindex]:not([tabindex="-1"]), input'
    )) as HTMLElement[];
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
   * Handle keyboard navigation for the date picker calendar dialog
   */
  setupKeyboardNavigation(
    containerElement: HTMLElement,
    calendarService: CalendarService,
    uiUpdater: UIUpdaterService,
    callbacks: {
      onDateChange: (date: Date) => void;
      onSelectDate: (date: Date) => void;
      onPrevMonth: () => void;
      onNextMonth: () => void;
      onClose: () => void;
    }
  ): void {
    // Get dialog element
    const dialog = uiUpdater.getDialog(containerElement);
    if (!dialog) return;
    
    // Event listener for keyboard navigation
    dialog.addEventListener('keydown', (event: KeyboardEvent) => {
      const key = event.key;
      const ctrlKey = event.ctrlKey || event.metaKey;
      
      // Prevent default for arrow keys to avoid page scrolling
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter', 'Escape', 'Tab'].includes(key)) {
        event.preventDefault();
      }
      
      // Find the currently focused date
      const focusedElement = document.activeElement as HTMLElement;
      if (!focusedElement || !focusedElement.classList.contains('date-picker-cell')) {
        // If no cell is focused, focus on today or the selected date
        return;
      }
      
      // Extract current date from focused element
      const day = parseInt(focusedElement.textContent || '1', 10);
      const currentFocusedDate = calendarService.getToday();
      const focusedDate = new Date(currentFocusedDate);
      focusedDate.setDate(day);
      
      // Handle different keys
      switch (key) {
        case 'ArrowLeft': {
          // Previous day
          const newDate = new Date(focusedDate);
          newDate.setDate(focusedDate.getDate() - 1);
          callbacks.onDateChange(newDate);
          break;
        }
        case 'ArrowRight': {
          // Next day
          const newDate = new Date(focusedDate);
          newDate.setDate(focusedDate.getDate() + 1);
          callbacks.onDateChange(newDate);
          break;
        }
        case 'ArrowUp': {
          // Previous week
          const newDate = new Date(focusedDate);
          newDate.setDate(focusedDate.getDate() - 7);
          callbacks.onDateChange(newDate);
          break;
        }
        case 'ArrowDown': {
          // Next week
          const newDate = new Date(focusedDate);
          newDate.setDate(focusedDate.getDate() + 7);
          callbacks.onDateChange(newDate);
          break;
        }
        case 'PageUp': {
          // Previous month
          if (ctrlKey) {
            // Previous year
            const newDate = new Date(focusedDate);
            newDate.setFullYear(focusedDate.getFullYear() - 1);
            callbacks.onDateChange(newDate);
          } else {
            callbacks.onPrevMonth();
          }
          break;
        }
        case 'PageDown': {
          // Next month
          if (ctrlKey) {
            // Next year
            const newDate = new Date(focusedDate);
            newDate.setFullYear(focusedDate.getFullYear() + 1);
            callbacks.onDateChange(newDate);
          } else {
            callbacks.onNextMonth();
          }
          break;
        }
        case 'Home': {
          // First day of month
          const newDate = new Date(focusedDate);
          newDate.setDate(1);
          callbacks.onDateChange(newDate);
          break;
        }
        case 'End': {
          // Last day of month
          const newDate = new Date(focusedDate);
          newDate.setMonth(newDate.getMonth() + 1, 0);
          callbacks.onDateChange(newDate);
          break;
        }
        case 'Enter':
        case ' ': {
          // Select the focused date
          if (!calendarService.isDateDisabled(focusedDate)) {
            callbacks.onSelectDate(focusedDate);
          }
          break;
        }
        case 'Escape': {
          // Close the dialog
          callbacks.onClose();
          break;
        }
      }
    });
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