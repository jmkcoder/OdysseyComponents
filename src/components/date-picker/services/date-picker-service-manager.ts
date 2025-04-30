import { CalendarService } from './calendar.service';
import { EventDispatcherService } from './event-dispatcher.service';
import { InternationalizationService } from './internationalization.service';
import { KeyboardNavigationService } from './keyboard-navigation.service';
import { ThemeService } from './theme.service';
import { CalendarViewMode, UIUpdaterService } from './ui-updater.service';

/**
 * Selection mode for date picker
 */
export enum DatePickerSelectionMode {
  SINGLE = 'single',
  RANGE = 'range'
}

/**
 * Date range interface
 */
export interface DateRange {
  startDate: Date | null;
  endDate: Date | null;
}

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
  private _startDate: Date | null = null;
  private _endDate: Date | null = null;
  private _selectionMode: DatePickerSelectionMode = DatePickerSelectionMode.SINGLE;
  private _isSelectingRange: boolean = false; // True when user has selected start date but not end date
  private _focusedDate: Date;
  private _currentMonth: number;
  private _currentYear: number;
  private _yearRangeStart: number; // Store the start year of the current range in year view
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
    this._yearRangeStart = Math.floor(this._currentYear / 12) * 12; // Initialize year range based on current year
    
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
    
    // Set selection mode
    const modeAttr = this._element.getAttribute('mode');
    if (modeAttr && (modeAttr === 'single' || modeAttr === 'range')) {
      this._selectionMode = modeAttr as DatePickerSelectionMode;
    }
    
    // In single mode, use value attribute
    if (this._selectionMode === DatePickerSelectionMode.SINGLE) {
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
    } 
    // In range mode, use start-date and end-date attributes
    else {
      const startDateAttr = this._element.getAttribute('start-date');
      if (startDateAttr) {
        const startDate = this._calendarService.parseDate(startDateAttr);
        if (startDate) {
          this._startDate = startDate;
          
          // Use start date for current view if available
          this._currentMonth = startDate.getMonth();
          this._currentYear = startDate.getFullYear();
          this._focusedDate = new Date(startDate);
        }
      }
      
      const endDateAttr = this._element.getAttribute('end-date');
      if (endDateAttr) {
        const endDate = this._calendarService.parseDate(endDateAttr);
        if (endDate) {
          this._endDate = endDate;
          
          // If no start date was provided, use end date for view
          if (!this._startDate) {
            this._currentMonth = endDate.getMonth();
            this._currentYear = endDate.getFullYear();
            this._focusedDate = new Date(endDate);
          }
        }
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
      this.getDisplayValue(),
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
      this._selectionMode === DatePickerSelectionMode.SINGLE ? this._selectedDate : null,
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
      this._currentViewMode,
      this._selectionMode,
      this._startDate,
      this._endDate,
      this._isSelectingRange
    );
  }

  /**
   * Get the display value for the input field based on selection mode
   */
  private getDisplayValue(): string | Date | null {
    if (this._selectionMode === DatePickerSelectionMode.SINGLE) {
      return this._selectedDate;
    } else {
      // Format as range
      if (this._startDate && this._endDate) {
        const startFormatted = this._i18nService.formatDate(this._startDate);
        const endFormatted = this._i18nService.formatDate(this._endDate);
        return `${startFormatted} - ${endFormatted}`;
      } else if (this._startDate) {
        const startFormatted = this._i18nService.formatDate(this._startDate);
        return `${startFormatted} - ...`;
      } else {
        return null;
      }
    }
  }
  
  /**
   * Set up event listeners
   */
  setupEvents(): void {
    if (!this._container) return;
    
    // Add document click listener for outside clicks
    document.addEventListener('click', this._documentClickHandler);
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
    if (this._selectionMode === DatePickerSelectionMode.SINGLE && this._selectedDate) {
      this._currentMonth = this._selectedDate.getMonth();
      this._currentYear = this._selectedDate.getFullYear();
      this._focusedDate = new Date(this._selectedDate);
    } else if (this._selectionMode === DatePickerSelectionMode.RANGE && this._startDate) {
      this._currentMonth = this._startDate.getMonth();
      this._currentYear = this._startDate.getFullYear();
      this._focusedDate = new Date(this._startDate);
    }
    
    // Re-render to update calendar with current state
    this._uiUpdaterService.renderCalendarDialog(
      this._container,
      this._currentYear,
      this._currentMonth,
      this._selectionMode === DatePickerSelectionMode.SINGLE ? this._selectedDate : null,
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
        onClose: this.closeCalendar.bind(this),
        onViewModeChange: this.setViewMode.bind(this) // Add view mode change handler
      },
      this._currentViewMode,
      this._selectionMode,
      this._startDate,
      this._endDate,
      this._isSelectingRange
    );
    
    // Dispatch open event
    this._eventDispatcherService.dispatchOpenEvent();
  }
  
  /**
   * Close calendar
   */
  closeCalendar(): void {
    if (!this._container) return;
    
    // If in the middle of a range selection, cancel it if we're closing
    if (this._isSelectingRange) {
      this._isSelectingRange = false;
    }
    
    // Update state
    this._isOpen = false;
    // Reset to day view for next opening
    this._currentViewMode = CalendarViewMode.DAYS;
    
    // Update dialog visibility using the renderCalendarDialog method instead of direct style manipulation
    this._uiUpdaterService.renderCalendarDialog(
      this._container,
      this._currentYear,
      this._currentMonth,
      this._selectionMode === DatePickerSelectionMode.SINGLE ? this._selectedDate : null,
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
      this._currentViewMode,
      this._selectionMode,
      this._startDate,
      this._endDate,
      this._isSelectingRange
    );
    
    // Dispatch close event
    this._eventDispatcherService.dispatchCloseEvent();
  }
  
  /**
   * Navigate to the previous month or year depending on the view mode
   */
  previousMonth(): void {
    switch (this._currentViewMode) {
      case CalendarViewMode.DAYS:
        // In days view, navigate to the previous month
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
        // In years view, navigate to previous year range (12 years back)
        this._yearRangeStart -= 12;
        
        // Dispatch a custom year range change event
        this._eventDispatcherService.dispatchYearChangeEvent(this._currentYear);
        console.log(`Year range changed to: ${this._yearRangeStart}-${this._yearRangeStart + 11}`);
        break;
    }
    
    this.updateCalendarView();
  }
  
  /**
   * Navigate to the next month or year depending on the view mode
   */
  nextMonth(): void {
    switch (this._currentViewMode) {
      case CalendarViewMode.DAYS:
        // In days view, navigate to the next month
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
        // In years view, navigate to next year range (12 years forward)
        this._yearRangeStart += 12;
        
        // Dispatch a custom year range change event
        this._eventDispatcherService.dispatchYearChangeEvent(this._currentYear);
        console.log(`Year range changed to: ${this._yearRangeStart}-${this._yearRangeStart + 11}`);
        break;
    }
    
    this.updateCalendarView();
  }
  
  /**
   * Update the calendar view when month/year changes
   */
  private updateCalendarView(): void {
    if (!this._container) return;
    
    // In year view, pass the yearRangeStart to the UI updater
    const params: any = {
      onPrevMonth: this.previousMonth.bind(this),
      onNextMonth: this.nextMonth.bind(this),
      onSelectDate: this.selectDate.bind(this),
      onToday: this.goToToday.bind(this),
      onClear: this.clearSelection.bind(this),
      onClose: this.closeCalendar.bind(this),
      onViewModeChange: this.setViewMode.bind(this)
    };

    // If in year view, add the yearRangeStart as a custom parameter
    if (this._currentViewMode === CalendarViewMode.YEARS) {
      params.yearRangeStart = this._yearRangeStart;
    }
    
    this._uiUpdaterService.renderCalendarDialog(
      this._container,
      this._currentYear,
      this._currentMonth,
      this._selectionMode === DatePickerSelectionMode.SINGLE ? this._selectedDate : null,
      this._focusedDate,
      this._isOpen,
      this._i18nService,
      this._calendarService,
      params,
      this._currentViewMode,
      this._selectionMode,
      this._startDate,
      this._endDate,
      this._isSelectingRange
    );
  }
  
  /**
   * Set the view mode (days, months, years)
   */
  setViewMode(mode: CalendarViewMode): void {
    if (this._currentViewMode === mode) return;
    
    // Store the previous view mode before changing
    const prevViewMode = this._currentViewMode;
    
    // Update view mode
    this._currentViewMode = mode;
    
    // If switching to years view, update the year range start
    if (mode === CalendarViewMode.YEARS) {
      // Calculate the year range that contains the selected date or current year
      let yearToUse = this._currentYear;
      
      // Determine which year to highlight based on selection mode
      if (this._selectionMode === DatePickerSelectionMode.SINGLE && this._selectedDate) {
        yearToUse = this._selectedDate.getFullYear();
      } else if (this._selectionMode === DatePickerSelectionMode.RANGE && this._startDate) {
        yearToUse = this._startDate.getFullYear();
      }
      
      // Set the year range start to show the range containing the selected year
      this._yearRangeStart = Math.floor(yearToUse / 12) * 12;
      
      // Also update the current year to match the selected date for proper highlighting
      this._currentYear = yearToUse;
      
      console.log(`Setting year range to ${this._yearRangeStart}-${this._yearRangeStart + 11} for year ${yearToUse}`);
    }
    
    // Log to ensure view mode is properly updated
    console.log(`View mode changed: ${prevViewMode} -> ${mode}`);
    
    // Update calendar UI with new view mode
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
    
    if (this._selectionMode === DatePickerSelectionMode.SINGLE) {
      // Single date selection mode
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
      
      // Keep the calendar open - removed automatic closing
    } else {
      // Range selection mode
      console.log('Range selection:', date);
      
      if (!this._isSelectingRange) {
        // First date selection (start date)
        this._startDate = new Date(date);
        this._endDate = null;
        this._isSelectingRange = true;
        this._focusedDate = new Date(date);
        
        // Update the attributes
        if (!this._updatingAttribute) {
          this._updatingAttribute = true;
          this._element.setAttribute('start-date', this._calendarService.formatDate(this._startDate));
          this._element.removeAttribute('end-date');
          this._updatingAttribute = false;
        }
        
        // When selecting a date from previous/next month, switch to that month
        this._currentMonth = date.getMonth();
        this._currentYear = date.getFullYear();
        
        if (this._container) {
          // Update input field with partial range
          this._uiUpdaterService.updateInputValue(
            this._container,
            this.getDisplayValue(),
            this._i18nService
          );
          
          // Update calendar view
          this.updateCalendarView();
        }
        
        // Dispatch start date selection event
        this._eventDispatcherService.dispatchRangeStartEvent(
          this._startDate,
          this._i18nService.formatDate(this._startDate)
        );
      } else {
        // Second date selection (end date)
        const newEndDate = new Date(date);
        
        // Ensure start date comes before end date - swap if needed
        if (newEndDate < this._startDate!) {
          this._endDate = new Date(this._startDate!);
          this._startDate = new Date(newEndDate);
        } else {
          this._endDate = new Date(newEndDate);
        }
        
        this._isSelectingRange = false;
        this._focusedDate = new Date(this._endDate);
        
        // Update the attributes
        if (!this._updatingAttribute) {
          this._updatingAttribute = true;
          this._element.setAttribute('start-date', this._calendarService.formatDate(this._startDate!));
          this._element.setAttribute('end-date', this._calendarService.formatDate(this._endDate));
          this._updatingAttribute = false;
        }
        
        if (this._container) {
          // Update input field with full range
          this._uiUpdaterService.updateInputValue(
            this._container,
            this.getDisplayValue(),
            this._i18nService
          );
          
          // Update calendar view
          this.updateCalendarView();
        }
        
        // Dispatch range complete event
        this._eventDispatcherService.dispatchRangeCompleteEvent(
          this._startDate!,
          this._endDate,
          `${this._i18nService.formatDate(this._startDate!)} - ${this._i18nService.formatDate(this._endDate)}`
        );
        
        // Keep the calendar open - removed automatic closing
      }
    }
  }
  
  /**
   * Clear date selection
   */
  clearSelection(): void {
    if (this._selectionMode === DatePickerSelectionMode.SINGLE) {
      this._selectedDate = null;
      
      if (!this._updatingAttribute) {
        this._updatingAttribute = true;
        this._element.removeAttribute('value');
        this._updatingAttribute = false;
      }
    } else {
      this._startDate = null;
      this._endDate = null;
      this._isSelectingRange = false;
      
      if (!this._updatingAttribute) {
        this._updatingAttribute = true;
        this._element.removeAttribute('start-date');
        this._element.removeAttribute('end-date');
        this._updatingAttribute = false;
      }
    }
    
    if (this._container) {
      // Clear input field
      this._uiUpdaterService.updateInputValue(
        this._container,
        null,
        this._i18nService
      );
      
      // Update calendar view
      this.updateCalendarView();
    }
    
    // Dispatch clear event
    if (this._selectionMode === DatePickerSelectionMode.SINGLE) {
      this._eventDispatcherService.dispatchChangeEvent(null, null, null);
    } else {
      this._eventDispatcherService.dispatchRangeClearEvent();
    }
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
    if (!this._container || !this._isOpen) return;
    
    const dialog = this._uiUpdaterService.getDialog(this._container);
    if (!dialog) return;
    
    // Update focused date
    this._focusedDate = new Date(date);
    
    // Only attempt to focus date cells in day view
    if (this._currentViewMode === CalendarViewMode.DAYS) {
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
    // For month and year views, we just update the internal state
    else {
      console.log(`Focused date updated to ${date.toDateString()} in ${this._currentViewMode} view`);
    }
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
    if (this._updatingAttribute) {
      return; // Prevent recursive calls when updating from attribute change
    }
    
    this._calendarService.setMaxDate(date);
    
    if (date) {
      if (!this._updatingAttribute) {
        this._updatingAttribute = true;
        this._element.setAttribute('max-date', this._calendarService.formatDate(date));
        this._updatingAttribute = false;
      }
    } else {
      if (!this._updatingAttribute) {
        this._updatingAttribute = true;
        this._element.removeAttribute('max-date');
        this._updatingAttribute = false;
      }
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
        this.getDisplayValue(),
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
    this._element.setAttribute('data-theme', theme);
    
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
   * Get start date for range selection
   */
  getStartDate(): Date | null {
    return this._startDate ? new Date(this._startDate) : null;
  }
  
  /**
   * Get end date for range selection
   */
  getEndDate(): Date | null {
    return this._endDate ? new Date(this._endDate) : null;
  }
  
  /**
   * Get date range
   */
  getDateRange(): DateRange {
    return {
      startDate: this._startDate ? new Date(this._startDate) : null,
      endDate: this._endDate ? new Date(this._endDate) : null
    };
  }
  
  /**
   * Set selection mode
   */
  setSelectionMode(mode: 'single' | 'range'): void {
    const newMode = mode as DatePickerSelectionMode;
    
    if (this._selectionMode === newMode) return;
    
    this._selectionMode = newMode;
    this._element.setAttribute('mode', mode);
    
    // Clear existing selections when changing modes
    if (newMode === DatePickerSelectionMode.SINGLE) {
      this._startDate = null;
      this._endDate = null;
      this._isSelectingRange = false;
      
      if (!this._updatingAttribute) {
        this._updatingAttribute = true;
        this._element.removeAttribute('start-date');
        this._element.removeAttribute('end-date');
        this._updatingAttribute = false;
      }
    } else {
      this._selectedDate = null;
      
      if (!this._updatingAttribute) {
        this._updatingAttribute = true;
        this._element.removeAttribute('value');
        this._updatingAttribute = false;
      }
    }
    
    // Update UI
    if (this._container) {
      this._uiUpdaterService.updateInputValue(
        this._container,
        this.getDisplayValue(),
        this._i18nService
      );
      
      // Update calendar if open
      if (this._isOpen) {
        this.updateCalendarView();
      }
    }
    
    // Dispatch mode change event
    this._eventDispatcherService.dispatchModeChangeEvent(mode);
  }
  
  /**
   * Set date programmatically
   */
  setDate(date: Date | null): void {
    if (this._updatingAttribute) {
      return; // Prevent recursive calls when updating from attribute change
    }
    
    if (date) {
      this._selectedDate = new Date(date);
      
      if (!this._updatingAttribute) {
        this._updatingAttribute = true;
        this._element.setAttribute('value', this._calendarService.formatDate(this._selectedDate));
        this._updatingAttribute = false;
      }
    } else {
      this._selectedDate = null;
      
      if (!this._updatingAttribute) {
        this._updatingAttribute = true;
        this._element.removeAttribute('value');
        this._updatingAttribute = false;
      }
    }
    
    // Update UI
    if (this._container) {
      this._uiUpdaterService.updateInputValue(
        this._container,
        this.getDisplayValue(),
        this._i18nService
      );
      
      // Update calendar if open
      if (this._isOpen) {
        this.updateCalendarView();
      }
    }
    
    // Dispatch change event
    this._eventDispatcherService.dispatchChangeEvent(
      this._selectedDate,
      this._selectedDate ? this._i18nService.formatDate(this._selectedDate) : null,
      this._selectedDate ? this._calendarService.formatDate(this._selectedDate) : null
    );
  }
  
  /**
   * Set start date programmatically
   */
  setStartDate(date: Date | null): void {
    if (this._updatingAttribute) {
      return; // Prevent recursive calls when updating from attribute change
    }
    
    if (date) {
      this._startDate = new Date(date);
      
      // If we have both dates and end date is before start date, swap them
      if (this._endDate && this._endDate < this._startDate) {
        const temp = this._startDate;
        this._startDate = this._endDate;
        this._endDate = temp;
      }
      
      if (!this._updatingAttribute) {
        this._updatingAttribute = true;
        this._element.setAttribute('start-date', this._calendarService.formatDate(this._startDate));
        this._updatingAttribute = false;
      }
    } else {
      this._startDate = null;
      this._isSelectingRange = false;
      
      if (!this._updatingAttribute) {
        this._updatingAttribute = true;
        this._element.removeAttribute('start-date');
        this._updatingAttribute = false;
      }
    }
    
    // Update UI
    if (this._container) {
      this._uiUpdaterService.updateInputValue(
        this._container,
        this.getDisplayValue(),
        this._i18nService
      );
      
      // Update calendar if open
      if (this._isOpen) {
        this.updateCalendarView();
      }
    }
    
    // Dispatch event
    this._eventDispatcherService.dispatchRangeStartEvent(
      this._startDate,
      this._startDate ? this._i18nService.formatDate(this._startDate) : null
    );
    
    // If both start and end dates are set, dispatch range complete event
    if (this._startDate && this._endDate) {
      this._eventDispatcherService.dispatchRangeCompleteEvent(
        this._startDate,
        this._endDate,
        `${this._i18nService.formatDate(this._startDate)} - ${this._i18nService.formatDate(this._endDate)}`
      );
    }
  }
  
  /**
   * Set end date programmatically
   */
  setEndDate(date: Date | null): void {
    if (this._updatingAttribute) {
      return; // Prevent recursive calls when updating from attribute change
    }
    
    if (date) {
      this._endDate = new Date(date);
      
      // If we have both dates and end date is before start date, swap them
      if (this._startDate && this._endDate < this._startDate) {
        const temp = this._startDate;
        this._startDate = this._endDate;
        this._endDate = temp;
        
        if (!this._updatingAttribute) {
          this._updatingAttribute = true;
          this._element.setAttribute('start-date', this._calendarService.formatDate(this._startDate));
          this._updatingAttribute = false;
        }
      }
      
      if (!this._updatingAttribute) {
        this._updatingAttribute = true;
        this._element.setAttribute('end-date', this._calendarService.formatDate(this._endDate));
        this._updatingAttribute = false;
      }
      
      // Range selection is complete
      this._isSelectingRange = false;
    } else {
      this._endDate = null;
      
      if (!this._updatingAttribute) {
        this._updatingAttribute = true;
        this._element.removeAttribute('end-date');
        this._updatingAttribute = false;
      }
    }
    
    // Update UI
    if (this._container) {
      this._uiUpdaterService.updateInputValue(
        this._container,
        this.getDisplayValue(),
        this._i18nService
      );
      
      // Update calendar if open
      if (this._isOpen) {
        this.updateCalendarView();
      }
    }
    
    // If both start and end dates are set, dispatch range complete event
    if (this._startDate && this._endDate) {
      this._eventDispatcherService.dispatchRangeCompleteEvent(
        this._startDate,
        this._endDate,
        `${this._i18nService.formatDate(this._startDate)} - ${this._i18nService.formatDate(this._endDate)}`
      );
    }
  }
  
  /**
   * Set date range programmatically
   */
  setDateRange(startDate: Date | null, endDate: Date | null): void {
    if (this._updatingAttribute) {
      return; // Prevent recursive calls when updating from attribute change
    }
    
    // Clear existing range
    this._startDate = null;
    this._endDate = null;
    this._isSelectingRange = false;
    
    if (!this._updatingAttribute) {
      this._updatingAttribute = true;
      this._element.removeAttribute('start-date');
      this._element.removeAttribute('end-date');
      this._updatingAttribute = false;
    }
    
    // Set new range if provided
    if (startDate && endDate) {
      // Ensure start date is before end date
      if (endDate < startDate) {
        const temp = startDate;
        startDate = endDate;
        endDate = temp;
      }
      
      this._startDate = new Date(startDate);
      this._endDate = new Date(endDate);
      
      if (!this._updatingAttribute) {
        this._updatingAttribute = true;
        this._element.setAttribute('start-date', this._calendarService.formatDate(this._startDate));
        this._element.setAttribute('end-date', this._calendarService.formatDate(this._endDate));
        this._updatingAttribute = false;
      }
      
      // Dispatch range complete event
      this._eventDispatcherService.dispatchRangeCompleteEvent(
        this._startDate,
        this._endDate,
        `${this._i18nService.formatDate(this._startDate)} - ${this._i18nService.formatDate(this._endDate)}`
      );
    } else if (startDate) {
      // Only start date provided
      this._startDate = new Date(startDate);
      this._isSelectingRange = true;
      
      if (!this._updatingAttribute) {
        this._updatingAttribute = true;
        this._element.setAttribute('start-date', this._calendarService.formatDate(this._startDate));
        this._updatingAttribute = false;
      }
      
      // Dispatch start date event
      this._eventDispatcherService.dispatchRangeStartEvent(
        this._startDate,
        this._i18nService.formatDate(this._startDate)
      );
    } else {
      // Dispatch range clear event
      this._eventDispatcherService.dispatchRangeClearEvent();
    }
    
    // Update UI
    if (this._container) {
      this._uiUpdaterService.updateInputValue(
        this._container,
        this.getDisplayValue(),
        this._i18nService
      );
      
      // Update calendar if open
      if (this._isOpen) {
        this.updateCalendarView();
      }
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