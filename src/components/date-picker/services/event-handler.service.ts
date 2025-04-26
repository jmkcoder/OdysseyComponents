import { CalendarService } from './calendar.service';
import { UIUpdaterService } from './ui-updater.service';

interface EventCallbacks {
  onSelectDate: (date: Date) => void;
  onChangeMonth: (direction: 'prev' | 'next') => void;
  onDateChange: (date: Date) => void;
  onToggleDialog: () => void;
}

/**
 * Handles DOM events for the DatePicker component
 */
export class EventHandlerService {
  /**
   * Set up all event handlers for the component
   */
  setupEventHandlers(
    containerElement: HTMLElement,
    calendarService: CalendarService,
    uiUpdaterService: UIUpdaterService,
    callbacks: EventCallbacks
  ): void {
    this.setupInputEvents(containerElement, callbacks);
    this.setupCalendarEvents(containerElement, calendarService, callbacks);
  }

  /**
   * Set up events for the input field
   */
  private setupInputEvents(
    containerElement: HTMLElement,
    callbacks: EventCallbacks
  ): void {
    // Find input and toggle elements
    const input = containerElement.querySelector('.date-picker-input') as HTMLInputElement;
    const inputWrapper = containerElement.querySelector('.date-picker-input-wrapper') as HTMLElement;
    
    if (input && inputWrapper) {
      // Click on input or wrapper opens calendar
      inputWrapper.addEventListener('click', callbacks.onToggleDialog);
      
      // Enter or space on input opens calendar
      input.addEventListener('keydown', (e: KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          callbacks.onToggleDialog();
        }
      });
    }
  }

  /**
   * Set up events for the calendar dialog
   */
  private setupCalendarEvents(
    containerElement: HTMLElement,
    calendarService: CalendarService,
    callbacks: EventCallbacks
  ): void {
    const dialog = containerElement.querySelector('.date-picker-dialog') as HTMLElement;
    if (!dialog) return;
    
    // Month navigation
    const prevMonthBtn = dialog.querySelector('.prev-month-btn') as HTMLElement;
    const nextMonthBtn = dialog.querySelector('.next-month-btn') as HTMLElement;
    
    if (prevMonthBtn) {
      prevMonthBtn.addEventListener('click', () => {
        callbacks.onChangeMonth('prev');
      });
    }
    
    if (nextMonthBtn) {
      nextMonthBtn.addEventListener('click', () => {
        callbacks.onChangeMonth('next');
      });
    }
    
    // Date selection
    dialog.addEventListener('click', (e: Event) => {
      const target = e.target as HTMLElement;
      const dateCell = target.closest('.date-picker-cell') as HTMLElement;
      
      if (dateCell && !dateCell.classList.contains('disabled')) {
        const dateValue = dateCell.dataset.date;
        if (dateValue) {
          const date = new Date(dateValue);
          if (!isNaN(date.getTime())) {
            callbacks.onSelectDate(date);
          }
        }
      }
    });
    
    // Action buttons
    const todayBtn = dialog.querySelector('.today-btn') as HTMLElement;
    const clearBtn = dialog.querySelector('.clear-btn') as HTMLElement;
    const closeBtn = dialog.querySelector('.close-btn') as HTMLElement;
    
    if (todayBtn) {
      todayBtn.addEventListener('click', () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        // Only select if not disabled
        if (!calendarService.isDateDisabled(today)) {
          callbacks.onSelectDate(today);
        } else {
          // Just navigate to today's month
          callbacks.onDateChange(today);
        }
      });
    }
    
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        // Use null to clear the date
        callbacks.onSelectDate(null as any);
      });
    }
    
    if (closeBtn) {
      closeBtn.addEventListener('click', callbacks.onToggleDialog);
    }
  }
}