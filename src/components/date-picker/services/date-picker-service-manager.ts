import { CalendarService } from './calendar.service';
import { EventDispatcherService } from './event-dispatcher.service';
import { InternationalizationService } from './internationalization.service';
import { KeyboardNavigationService } from './keyboard-navigation.service';
import { ThemeService } from './theme.service';
import { CalendarViewMode, UIUpdaterService } from './ui-updater.service';

/**
 * Service manager for the date picker component
 * Coordinates all services and provides a centralized API
 */
export class DatePickerServiceManager {
  private _element: HTMLElement;
  private _container: HTMLElement | null = null;
  private _isOpen: boolean = false;
  
  // Date state
  private _selectedDate: Date | null = null;
  private _focusedDate: Date;
  private _currentMonth: number;
  private _currentYear: number;
  private _disabled: boolean = false;
  private _required: boolean = false;
  private _updatingAttribute: boolean = false; // Flag to prevent recursive attribute updates
  
  // UI state
  private _currentViewMode: CalendarViewMode = CalendarViewMode.DAYS;
  
  // Services
  private _calendarService: CalendarService;
  private _i18nService: InternationalizationService;
  private _themeService: ThemeService;
  private _uiUpdaterService: UIUpdaterService;
  private _keyboardService: KeyboardNavigationService;
  private _eventDispatcherService: EventDispatcherService;
  
  // Event handlers
  private _documentClickHandler: (e: MouseEvent) => void;

  constructor(element: HTMLElement) {
    this._element = element;
    
    // Initialize date state with today's date
    const today = new Date();
    this._currentMonth = today.getMonth();
    this._currentYear = today.getFullYear();
    this._focusedDate = today;
    
    // Initialize services
    this._calendarService = new CalendarService();
    this._i18nService = new InternationalizationService();
    this._themeService = new ThemeService();
    this._uiUpdaterService = new UIUpdaterService();
    this._keyboardService = new KeyboardNavigationService(this._calendarService);
    this._eventDispatcherService = new EventDispatcherService(element);
    
    // Bind document click handler
    this._documentClickHandler = this.handleDocumentClick.bind(this);
  }
  
  /**
   * Initialize the date picker
   */
  initialize(): void {
    // Initialize from element attributes
    this.initializeFromAttributes();
    
    // Initialize theme
    this._themeService.initializeTheme(this._element);
    
    // Add Material Icons if needed
    this._uiUpdaterService.addMaterialIcons();
    
    // Render the component
    this.render();
    
    // Set up events
    this.setupEvents();
    
    // Start observing theme changes
    this._themeService.observeParentThemeChanges(this._element);
  }
  
  /**
   * Initialize component from attributes
   */
  private initializeFromAttributes(): void {
    // Set locale
    const localeAttr = this._element.getAttribute('locale');
    if (localeAttr) {
      this._i18nService.setLocale(localeAttr);
    }
    
    // Set first day of week
    const firstDayAttr = this._element.getAttribute('first-day-of-week');
    if (firstDayAttr) {
      const day = parseInt(firstDayAttr, 10);
      if (!isNaN(day) && day >= 0 && day <= 6) {
        this._calendarService.setFirstDayOfWeek(day);
      }
    }
    
    // Set min date
    const minDateAttr = this._element.getAttribute('min-date');
    if (minDateAttr) {
      const minDate = this._calendarService.parseDate(minDateAttr);
      if (minDate) {
        this._calendarService.setMinDate(minDate);
      }
    }
    
    // Set max date
    const maxDateAttr = this._element.getAttribute('max-date');
    if (maxDateAttr) {
      const maxDate = this._calendarService.parseDate(maxDateAttr);
      if (maxDate) {
        this._calendarService.setMaxDate(maxDate);
      }
    }
    
    // Set initial value
    const valueAttr = this._element.getAttribute('value');
    if (valueAttr) {
      const value = this._calendarService.parseDate(valueAttr);
      if (value) {
        this._selectedDate = value;
        this._currentMonth = value.getMonth();
        this._currentYear = value.getFullYear();
        this._focusedDate = new Date(value);
      }
    }
    
    // Set disabled state
    this._disabled = this._element.hasAttribute('disabled');
    
    // Set required state
    this._required = this._element.hasAttribute('required');
    
    // Set events if provided
    const eventsAttr = this._element.getAttribute('events');
    if (eventsAttr) {
      try {
        const eventsData = JSON.parse(eventsAttr);
        this._calendarService.addEvents(eventsData);
      } catch (e) {
        console.error('Invalid events format:', e);
      }
    }
  }
  
  /**
   * Render the date picker
   */
  render(): void {
    this._uiUpdaterService.renderDatePicker(
      this._element,
      this._selectedDate,
      this._disabled,
      this._required,
      this._i18nService,
      this._calendarService,
      this._themeService.getTheme(),
      this.toggleCalendar.bind(this)
    );
    
    // With Light DOM, the host element is directly used instead of a container
    this._container = this._element;
    
    // Render dialog (initially hidden)
    this._uiUpdaterService.renderCalendarDialog(
      this._element,
      this._currentYear,
      this._currentMonth,
      this._selectedDate,
      this._focusedDate,
      this._isOpen,
      this._i18nService,
      this._calendarService,
      {
        onPrevMonth: this.previousMonth.bind(this),
        onNextMonth: this.nextMonth.bind(this),
        onSelectDate: this.selectDate.bind(this),
        onToday: this.goToToday.bind(this),
        onClear: this.clearSelection.bind(this),
        onClose: this.closeCalendar.bind(this)
      },
      this._currentViewMode
    );
  }
  
  /**
   * Set up event listeners
   */
  setupEvents(): void {
    if (!this._container) return;
    
    const dialog = this._uiUpdaterService.getDialog(this._container);
    if (dialog) {
      // Keyboard navigation in dialog
      dialog.addEventListener('keydown', this.handleKeyDown.bind(this));
    }
    
    // Add document click listener for outside clicks
    document.addEventListener('click', this._documentClickHandler);
  }
  
  /**
   * Handle keyboard navigation
   */
  private handleKeyDown(e: KeyboardEvent): void {
    if (!this._isOpen) return;
    
    const dialog = this._container ? this._uiUpdaterService.getDialog(this._container) : null;
    if (!dialog) return;
    
    // Only handle keyboard navigation in day view
    if (this._currentViewMode === CalendarViewMode.DAYS) {
      const { newDate, action, tabDirection } = this._keyboardService.handleKeyDown(
        e,
        this._focusedDate,
        this._isOpen,
        this._calendarService.getFirstDayOfWeek(this._focusedDate).getDay()
      );
      
      if (newDate) {
        this.focusDate(newDate);
      }
      
      if (action === 'select') {
        this.selectDate(this._focusedDate);
      } else if (action === 'close') {
        this.closeCalendar();
      } else if (tabDirection && tabDirection !== 'none') {
        // Handle focus trap
        const wasPrevented = this._keyboardService.handleFocusTrap(
          dialog,
          document.activeElement,
          tabDirection
        );
        
        if (wasPrevented) {
          e.preventDefault();
        }
      }
    } else {
      // Handle Escape key to return to day view or close
      if (e.key === 'Escape') {
        if (this._currentViewMode === CalendarViewMode.YEARS) {
          this.setViewMode(CalendarViewMode.MONTHS);
          e.preventDefault();
        } else if (this._currentViewMode === CalendarViewMode.MONTHS) {
          this.setViewMode(CalendarViewMode.DAYS);
          e.preventDefault();
        } else {
          this.closeCalendar();
          e.preventDefault();
        }
      }
    }
  }
  
  /**
   * Handle clicks outside the date picker
   */
  private handleDocumentClick(e: MouseEvent): void {
    if (!this._isOpen || !this._container) return;
    
    const target = e.target as HTMLElement;
    
    // Check if the click is on a navigation button or within the datepicker
    const isDatepickerClick = this._container.contains(target);
    
    // Don't close when clicking inside the date picker
    if (!isDatepickerClick) {
      this.closeCalendar();
    }
  }
  
  /**
   * Clean up resources when component is removed
   */
  destroy(): void {
    // Remove document event listener
    document.removeEventListener('click', this._documentClickHandler);
    
    // Disconnect theme observer
    this._themeService.disconnectObserver();
  }
  
  /**
   * Toggle calendar visibility
   */
  toggleCalendar(): void {
    if (this._disabled) return;
    
    if (this._isOpen) {
      this.closeCalendar();
    } else {
      this.openCalendar();
    }
  }
  
  /**
   * Open calendar
   */
  openCalendar(): void {
    if (this._disabled || !this._container) return;
    
    this._isOpen = true;
    this._currentViewMode = CalendarViewMode.DAYS; // Always start in day view
    
    // If a date is selected, show that month instead of current month
    if (this._selectedDate) {
      this._currentMonth = this._selectedDate.getMonth();
      this._currentYear = this._selectedDate.getFullYear();
      this._focusedDate = new Date(this._selectedDate);
    }
    
    // Re-render to update calendar with current state
    this._uiUpdaterService.renderCalendarDialog(
      this._container,
      this._currentYear,
      this._currentMonth,
      this._selectedDate,
      this._focusedDate,
      this._isOpen,
      this._i18nService,
      this._calendarService,
      {
        onPrevMonth: this.previousMonth.bind(this),
        onNextMonth: this.nextMonth.bind(this),
        onSelectDate: this.selectDate.bind(this),
        onToday: this.goToToday.bind(this),
        onClear: this.clearSelection.bind(this),
        onClose: this.closeCalendar.bind(this)
      },
      this._currentViewMode
    );
    
    // Focus the dialog after render
    const dialog = this._uiUpdaterService.getDialog(this._container);
    if (dialog) {
      // Focus on the appropriate date cell after a brief delay
      setTimeout(() => {
        dialog.focus();
        
        // Only focus on dates when in day view
        if (this._currentViewMode === CalendarViewMode.DAYS) {
          // Focus on the selected date or today
          const dateToFocus = this._selectedDate || this._focusedDate;
          this.focusDate(dateToFocus);
        }
      }, 0);
    }
    
    // Dispatch open event
    this._eventDispatcherService.dispatchOpenEvent();
  }
  
  /**
   * Close calendar
   */
  closeCalendar(): void {
    if (!this._container) return;
    
    // Update state
    this._isOpen = false;
    // Reset to day view for next opening
    this._currentViewMode = CalendarViewMode.DAYS;
    
    // Update dialog visibility using the renderCalendarDialog method instead of direct style manipulation
    this._uiUpdaterService.renderCalendarDialog(
      this._container,
      this._currentYear,
      this._currentMonth,
      this._selectedDate,
      this._focusedDate,
      false, // isOpen = false
      this._i18nService,
      this._calendarService,
      {
        onPrevMonth: this.previousMonth.bind(this),
        onNextMonth: this.nextMonth.bind(this),
        onSelectDate: this.selectDate.bind(this),
        onToday: this.goToToday.bind(this),
        onClear: this.clearSelection.bind(this),
        onClose: this.closeCalendar.bind(this)
      },
      this._currentViewMode
    );
    
    // Return focus to input
    const inputField = this._uiUpdaterService.getInputField(this._container);
    if (inputField) {
      inputField.focus();
    }
    
    // Dispatch close event
    this._eventDispatcherService.dispatchCloseEvent();
  }
  
  /**
   * Navigate to the previous month or year depending on the view mode
   */
  previousMonth(): void {
    switch (this._currentViewMode) {
      case CalendarViewMode.DAYS:
        if (this._currentMonth === 0) {
          this._currentMonth = 11;
          this._currentYear--;
        } else {
          this._currentMonth--;
        }
        
        // Dispatch event
        this._eventDispatcherService.dispatchMonthChangeEvent(this._currentYear, this._currentMonth);
        break;
      
      case CalendarViewMode.MONTHS:
        // In months view, navigate to previous year
        this._currentYear--;
        // Dispatch event
        this._eventDispatcherService.dispatchYearChangeEvent(this._currentYear);
        break;
      
      case CalendarViewMode.YEARS:
        // In years view, navigate to previous year range
        const yearRange = this.getYearRange(this._currentYear);
        this._currentYear = yearRange.start - 12; // Go back by one range (12 years)
        break;
    }
    
    this.updateCalendarView();
    
    // Focus on the 1st of the new month or the closest available date
    if (this._currentViewMode === CalendarViewMode.DAYS) {
      this.focusDate(new Date(this._currentYear, this._currentMonth, 1));
    }
  }
  
  /**
   * Navigate to the next month or year depending on the view mode
   */
  nextMonth(): void {
    switch (this._currentViewMode) {
      case CalendarViewMode.DAYS:
        if (this._currentMonth === 11) {
          this._currentMonth = 0;
          this._currentYear++;
        } else {
          this._currentMonth++;
        }
        
        // Dispatch event
        this._eventDispatcherService.dispatchMonthChangeEvent(this._currentYear, this._currentMonth);
        break;
      
      case CalendarViewMode.MONTHS:
        // In months view, navigate to next year
        this._currentYear++;
        // Dispatch event
        this._eventDispatcherService.dispatchYearChangeEvent(this._currentYear);
        break;
      
      case CalendarViewMode.YEARS:
        // In years view, navigate to next year range
        const yearRange = this.getYearRange(this._currentYear);
        this._currentYear = yearRange.end + 1; // Go forward by one range
        break;
    }
    
    this.updateCalendarView();
    
    // Focus on the 1st of the new month or the closest available date
    if (this._currentViewMode === CalendarViewMode.DAYS) {
      this.focusDate(new Date(this._currentYear, this._currentMonth, 1));
    }
  }
  
  /**
   * Update the calendar view when month/year changes
   */
  private updateCalendarView(): void {
    if (!this._container) return;
    
    this._uiUpdaterService.renderCalendarDialog(
      this._container,
      this._currentYear,
      this._currentMonth,
      this._selectedDate,
      this._focusedDate,
      this._isOpen,
      this._i18nService,
      this._calendarService,
      {
        onPrevMonth: this.previousMonth.bind(this),
        onNextMonth: this.nextMonth.bind(this),
        onSelectDate: this.selectDate.bind(this),
        onToday: this.goToToday.bind(this),
        onClear: this.clearSelection.bind(this),
        onClose: this.closeCalendar.bind(this)
      },
      this._currentViewMode
    );
  }
  
  /**
   * Set the view mode (days, months, years)
   */
  setViewMode(mode: CalendarViewMode): void {
    if (this._currentViewMode === mode) return;
    
    this._currentViewMode = mode;
    this.updateCalendarView();
    
    // Dispatch view mode change event
    this._eventDispatcherService.dispatchViewModeChangeEvent(mode);
  }
  
  /**
   * Get the current year range for the years view
   * This should match the calculation in the UI service
   */
  private getYearRange(year: number): { start: number; end: number } {
    const start = Math.floor(year / 12) * 12;
    const end = start + 11;
    return { start, end };
  }
  
  /**
   * Select a date
   */
  selectDate(date: Date): void {
    if (this._calendarService.isDateDisabled(date)) return;
    console.log('Selected date:', date);
    this._selectedDate = new Date(date);
    this._focusedDate = new Date(date);
    
    // When selecting a date from previous/next month, switch to that month
    this._currentMonth = date.getMonth();
    this._currentYear = date.getFullYear();
    
    if (this._container) {
      // Update input field
      this._uiUpdaterService.updateInputValue(
        this._container,
        this._selectedDate,
        this._i18nService
      );
      
      // Update the value attribute on the host element
      if (!this._updatingAttribute) {
        this._updatingAttribute = true;
        this._element.setAttribute('value', this._calendarService.formatDate(this._selectedDate));
        this._updatingAttribute = false;
      }
      
      // Update calendar view to highlight the selected date
      this.updateCalendarView();
    }
    
    // Dispatch change event
    this._eventDispatcherService.dispatchChangeEvent(
      this._selectedDate,
      this._i18nService.formatDate(this._selectedDate),
      this._calendarService.formatDate(this._selectedDate)
    );
  }
  
  /**
   * Clear date selection
   */
  clearSelection(): void {
    this._selectedDate = null;
    
    if (this._container) {
      // Clear input field
      this._uiUpdaterService.updateInputValue(
        this._container,
        null,
        this._i18nService
      );
      
      // Remove value attribute from host element
      this._element.removeAttribute('value');
      
      // Update calendar view
      this.updateCalendarView();
    }
    
    // Dispatch change event
    this._eventDispatcherService.dispatchChangeEvent(null, null, null);
  }
  
  /**
   * Go to today's date
   */
  goToToday(): void {
    const today = new Date();
    
    // Update view to current month/year
    this._currentMonth = today.getMonth();
    this._currentYear = today.getFullYear();
    
    // Update view
    this.updateCalendarView();
    
    // Focus on today
    this.focusDate(today);
    
    // Select today if it's not disabled
    if (!this._calendarService.isDateDisabled(today)) {
      this.selectDate(today);
    }
  }
  
  /**
   * Focus on a specific date
   */
  focusDate(date: Date): void {
    if (!this._container || !this._isOpen || this._currentViewMode !== CalendarViewMode.DAYS) return;
    
    const dialog = this._uiUpdaterService.getDialog(this._container);
    if (!dialog) return;
    
    // Update focused date
    this._focusedDate = new Date(date);
    
    // If the focused date is in a different month, switch to that month
    if (this._focusedDate.getMonth() !== this._currentMonth || 
        this._focusedDate.getFullYear() !== this._currentYear) {
      this._currentMonth = this._focusedDate.getMonth();
      this._currentYear = this._focusedDate.getFullYear();
      this.updateCalendarView();
    }
    
    // Focus on the date cell
    this._uiUpdaterService.focusDateCell(dialog, date, this._calendarService);
    
    // Dispatch focus event
    this._eventDispatcherService.dispatchFocusDateEvent(this._focusedDate);
  }
  
  // Public API methods (to be called from component)
  
  /**
   * Set min date
   */
  setMinDate(date: Date | null): void {
    this._calendarService.setMinDate(date);
    
    if (date) {
      this._element.setAttribute('min-date', this._calendarService.formatDate(date));
    } else {
      this._element.removeAttribute('min-date');
    }
    
    // Update view if open
    if (this._isOpen) {
      this.updateCalendarView();
    }
  }
  
  /**
   * Set max date
   */
  setMaxDate(date: Date | null): void {
    this._calendarService.setMaxDate(date);
    
    if (date) {
      this._element.setAttribute('max-date', this._calendarService.formatDate(date));
    } else {
      this._element.removeAttribute('max-date');
    }
    
    // Update view if open
    if (this._isOpen) {
      this.updateCalendarView();
    }
  }
  
  /**
   * Set the locale
   */
  setLocale(locale: string): void {
    this._i18nService.setLocale(locale);
    this._element.setAttribute('locale', locale);
    
    // Update UI
    if (this._container) {
      this._uiUpdaterService.updateInputValue(
        this._container,
        this._selectedDate,
        this._i18nService
      );
      
      // Update calendar if open
      if (this._isOpen) {
        this.updateCalendarView();
      }
    }
  }
  
  /**
   * Set first day of week
   */
  setFirstDayOfWeek(day: number): void {
    if (day >= 0 && day <= 6) {
      this._calendarService.setFirstDayOfWeek(day);
      this._element.setAttribute('first-day-of-week', day.toString());
      
      // Update calendar if open
      if (this._isOpen) {
        this.updateCalendarView();
      }
    }
  }
  
  /**
   * Set disabled state
   */
  setDisabled(disabled: boolean): void {
    this._disabled = disabled;
    
    if (disabled) {
      this._element.setAttribute('disabled', '');
    } else {
      this._element.removeAttribute('disabled');
    }
    
    if (this._container) {
      // Get input element
      const input = this._uiUpdaterService.getInputField(this._container);
      if (input) {
        input.disabled = disabled;
      }
      
      // Close calendar if open and being disabled
      if (disabled && this._isOpen) {
        this.closeCalendar();
      }
    }
  }
  
  /**
   * Set required state
   */
  setRequired(required: boolean): void {
    this._required = required;
    
    if (required) {
      this._element.setAttribute('required', '');
    } else {
      this._element.removeAttribute('required');
    }
    
    if (this._container) {
      // Get input element
      const input = this._uiUpdaterService.getInputField(this._container);
      if (input) {
        input.required = required;
      }
    }
  }
  
  /**
   * Set theme
   */
  setTheme(theme: string): void {
    this._themeService.setTheme(this._element, theme);
    this._element.setAttribute('theme', theme);
    
    if (this._container) {
      this._themeService.setTheme(this._container, theme);
    }
  }
  
  /**
   * Get current selected date
   */
  getDate(): Date | null {
    return this._selectedDate ? new Date(this._selectedDate) : null;
  }
  
  /**
   * Set date programmatically
   */
  setDate(date: Date | null): void {
    if (this._updatingAttribute) {
      return; // Prevent recursive calls when updating from attribute change
    }
    
    if (date) {
      this.selectDate(date);
    } else {
      this.clearSelection();
    }
  }
  
  /**
   * Add events
   */
  addEvents(events: Record<string, string[]>): void {
    this._calendarService.addEvents(events);
    
    // Store events in attribute for persistence
    const eventsData = this._calendarService.getEventsAsObject();
    this._element.setAttribute('events', JSON.stringify(eventsData));
    
    // Update calendar if open
    if (this._isOpen) {
      this.updateCalendarView();
    }
    
    // Dispatch event
    this._eventDispatcherService.dispatchEventsAddedEvent(events);
  }
  
  /**
   * Remove events from a specific date
   */
  removeEvents(date: string): void {
    this._calendarService.removeEvents(date);
    
    // Update attribute
    const eventsData = this._calendarService.getEventsAsObject();
    this._element.setAttribute('events', JSON.stringify(eventsData));
    
    // Update calendar if open
    if (this._isOpen) {
      this.updateCalendarView();
    }
    
    // Dispatch event
    this._eventDispatcherService.dispatchEventsRemovedEvent(date);
  }
  
  /**
   * Clear all events
   */
  clearEvents(): void {
    this._calendarService.clearEvents();
    this._element.removeAttribute('events');
    
    // Update calendar if open
    if (this._isOpen) {
      this.updateCalendarView();
    }
    
    // Dispatch event
    this._eventDispatcherService.dispatchEventsClearedEvent();
  }
}