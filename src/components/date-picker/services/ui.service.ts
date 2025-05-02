import { CalendarView, FooterView, HeaderView, MonthView, YearView } from '../components';
import { IDateFormatter } from './date-formatter/date-formatter.interface';
import { StateService } from './state.service';
import { KeyboardNavigationService } from './keyboard-navigation.service';
import { CalendarService } from './calendar.service';
import { CalendarViewMode, UIUpdaterService } from './ui-updater.service';

/**
 * Service responsible for rendering the UI components
 */
export class UIService{
  private state: StateService;
  private formatter: IDateFormatter;
  private keyboardNavigation: KeyboardNavigationService;
  private calendarContainer: HTMLElement | undefined;
  private headerContainer: HTMLElement | undefined;
  private footerContainer: HTMLElement | undefined;
  private dialogElement: HTMLElement | undefined;
  private inputElement: HTMLInputElement | undefined;
  private cleanupKeyboardHandlers: (() => void) | null = null;

  constructor(state: StateService, formatter: IDateFormatter) {
    this.state = state;
    this.formatter = formatter;
    this.keyboardNavigation = new KeyboardNavigationService(this.getCalendarService());
  }

  /**
   * Initialize UI service with necessary DOM elements
   */
  public initialize(
    calendarContainer: HTMLElement,
    headerContainer: HTMLElement,
    footerContainer: HTMLElement,
    dialogElement: HTMLElement,
    inputElement: HTMLInputElement
  ) {
    this.calendarContainer = calendarContainer;
    this.headerContainer = headerContainer;
    this.footerContainer = footerContainer;
    this.dialogElement = dialogElement;
    this.inputElement = inputElement;

    // Register as listener to re-render when state changes
    this.state.addListener({
      onStateChange: () => {
        this.updateUI();
      }
    });

    // Setup keyboard navigation for the calendar
    this.setupKeyboardNavigation();

    // Initialize focus trap for dialog
    this.initializeFocusTrap();
  }

  /**
   * Update the UI based on current state
   */
  public updateUI(): void {
    this.updateInputValue();
    this.renderCurrentView();
    this.renderHeader();
    this.renderFooter();
    this.updateDialogVisibility();

    // When open state changes, update keyboard navigation handlers
    this.setupGlobalListeners();
  }

  /**
   * Get the dialog element for use with keyboard navigation
   */
  public getDialog(containerElement?: HTMLElement): HTMLElement | null {
    return this.dialogElement || null;
  }

  /**
   * Helper method to get a CalendarService from the state service
   * for use with keyboard navigation
   */
  private getCalendarService() {
    var service = new CalendarService();
    service.isDateDisabled = (date: Date) => this.state.isDateDisabled(date);
    service.getFirstDayOfWeekValue = () => this.state.firstDayOfWeek;

    return service;
  }

  /**
   * Setup keyboard navigation
   */
  private setupKeyboardNavigation(): void {
    if (!this.dialogElement || !this.calendarContainer) return;

    // Use the keyboardNavigation service to setup keyboard navigation
    this.keyboardNavigation.setupKeyboardNavigation(
      this.dialogElement,
      this.getCalendarService(),
      this, // Pass this UIService as the UIUpdaterService
      {
        onDateChange: (date: Date) => {
          this.state.viewDate = date;
        },
        onSelectDate: (date: Date) => {
          this.handleDateSelect(date);
        },
        onPrevMonth: () => {
          this.handlePrevMonth();
        },
        onNextMonth: () => {
          this.handleNextMonth();
        },
        onClose: () => {
          this.handleCloseClick();
        },
        // Add callbacks for month and year selection
        onSelectMonth: (monthIndex: number) => {
          this.handleMonthSelect(monthIndex);
        },
        onSelectYear: (year: number) => {
          this.handleYearSelect(year);
        },
        // Add callback to get current view mode
        getCurrentViewMode: () => {
          return this.state.currentView;
        }
      }
    );
  }

  /**
   * Setup global event listeners for keyboard navigation
   */
  private setupGlobalListeners(): void {
    // Clean up previous listeners if they exist
    if (this.cleanupKeyboardHandlers) {
      this.cleanupKeyboardHandlers();
      this.cleanupKeyboardHandlers = null;
    }

    // Setup new handlers if dialog is open
    if (this.state.isOpen && this.dialogElement) {
      this.cleanupKeyboardHandlers = this.keyboardNavigation.setupGlobalListeners(
        this.dialogElement,
        this.state.isOpen,
        this.handleCloseClick.bind(this)
      );
    }
  }

  /**
   * Focus a specific date cell in the calendar
   * @param date The date to focus
   * @param setFocus Whether to actually set DOM focus on the element (true) or just highlight it visually (false)
   */
  private focusDateCell(date: Date, setFocus: boolean = true): void {
    if (!this.dialogElement) return;

    // Format the date to match the data-date attribute format (YYYY-MM-DD)
    const dateString = [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, '0'),
      String(date.getDate()).padStart(2, '0')
    ].join('-');

    // Try to find the cell by data-date attribute
    const cell = this.dialogElement.querySelector(`.date-picker-cell[data-date="${dateString}"]`) as HTMLElement;

    if (cell) {
      // Add visual highlighting (if needed)
      const allCells = this.dialogElement.querySelectorAll('.date-picker-cell');
      allCells.forEach(c => {
        c.classList.remove('focused');
        if (c !== cell) {
          c.setAttribute('tabindex', '-1');
        }
      });
      
      cell.classList.add('focused');
      cell.setAttribute('tabindex', '0');
      
      // Only actually focus the element if setFocus is true
      if (setFocus) {
        cell.focus();
        
        // Dispatch focus-date event
        const datePicker = this.dialogElement.closest('odyssey-date-picker') as any;
        if (datePicker && datePicker.eventDispatcherService) {
          datePicker.eventDispatcherService.dispatchFocusDateEvent(date);
        }
      }
    }
  }

  /**
   * Initialize focus trap within the dialog
   */
  private initializeFocusTrap(): void {
    if (!this.dialogElement) return;

    // Set tabindex on the dialog to make it focusable
    this.dialogElement.setAttribute('tabindex', '-1');
    this.dialogElement.setAttribute('role', 'dialog');
    this.dialogElement.setAttribute('aria-modal', 'true');
    this.dialogElement.setAttribute('aria-label', 'Date picker');

    // Add aria-labelledby reference to the header title
    const headerTitle = document.createElement('span');
    headerTitle.className = 'date-picker-header-title';
    headerTitle.id = 'date-picker-header-title';
    headerTitle.setAttribute('aria-live', 'polite');

    // Insert the title element if it doesn't exist
    const header = this.dialogElement.querySelector('.date-picker-header');
    if (header && !header.querySelector('#date-picker-header-title')) {
      header.appendChild(headerTitle);
    }

    // Update header title text when view changes
    this.state.addListener({
      onStateChange: () => {
        this.updateHeaderTitle();
      }
    });

    // When the dialog gets focus, determine where to set initial focus
    this.dialogElement.addEventListener('focus', (e) => {
      if (e.target === this.dialogElement) {
        // If dialog itself is focused, move focus to appropriate element
        const firstButton = this.dialogElement.querySelector('.prev-month') as HTMLElement;
        if (firstButton) {
          firstButton.focus();
        }
      }
    });

    // Add global event listener for Escape key
    this.dialogElement.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        this.handleCloseClick();
      }
    });
  }

  /**
   * Update the title in the header for screen readers
   */
  private updateHeaderTitle(): void {
    const titleEl = document.getElementById('date-picker-header-title');
    if (!titleEl) return;

    const titleText = this.getHeaderTitleText();
    titleEl.textContent = titleText;
  }

  /**
   * Get appropriate header title text based on current view and state
   */
  private getHeaderTitleText(): string {
    const monthName = this.formatter.getMonthName(
      this.state.viewDate.getMonth(),
      'long',
      this.state.locale
    );
    const year = this.state.viewDate.getFullYear();

    if (this.state.currentView === 'calendar') {
      return `${monthName} ${year}`;
    } else if (this.state.currentView === 'months') {
      return `Select month, ${year}`;
    } else {
      // Years view
      const currentYear = this.state.viewDate.getFullYear();
      const startYear = currentYear - (currentYear % 12) - 3;
      const endYear = startYear + 14;
      return `Select year, ${startYear} - ${endYear}`;
    }
  }

  /**
   * Render the current active view (calendar, month, or year)
   */
  private renderCurrentView(): void {
    if (!this.calendarContainer) return;

    // Clear previous content
    this.calendarContainer.innerHTML = '';

    switch (this.state.currentView) {
      case 'calendar':
        this.renderCalendarView();
        break;
      case 'months':
        this.renderMonthView();
        break;
      case 'years':
        this.renderYearView();
        break;
    }
  }

  /**
   * Render the calendar view
   */
  private renderCalendarView(): void {
    const calendarView = new CalendarView(
      {
        formatter: this.formatter,
        locale: this.state.locale,
        viewDate: this.state.viewDate,
        selectedDate: this.state.selectedDate,
        rangeStart: this.state.rangeStart,
        rangeEnd: this.state.rangeEnd,
        isRangeMode: this.state.isRangeMode,
        minDate: this.state.minDate,
        maxDate: this.state.maxDate,
        events: this.state.events,
        firstDayOfWeek: this.state.firstDayOfWeek
      },
      {
        onDateSelect: this.handleDateSelect.bind(this),
        onPrevMonth: this.handlePrevMonth.bind(this),
        onNextMonth: this.handleNextMonth.bind(this),
        onShowMonthSelector: this.handleShowMonthSelector.bind(this),
        onShowYearSelector: this.handleShowYearSelector.bind(this)
      }
    );

    calendarView.render(this.calendarContainer!);

    // Add role attributes for accessibility
    const calendarTable = this.calendarContainer?.querySelector('.date-picker-table');
    if (calendarTable) {
      calendarTable.setAttribute('role', 'grid');
      calendarTable.setAttribute('aria-labelledby', 'date-picker-header-title');
    }
  }

  /**
   * Render the month selection view
   */
  private renderMonthView(): void {
    const monthView = new MonthView(
      {
        formatter: this.formatter,
        locale: this.state.locale,
        viewDate: this.state.viewDate,
        selectedDate: this.state.selectedDate  // Pass selected date to determine which month to highlight
      },
      {
        onMonthSelect: this.handleMonthSelect.bind(this)
      }
    );

    monthView.render(this.calendarContainer!);
  }

  /**
   * Render the year selection view
   */
  private renderYearView(): void {
    const yearView = new YearView(
      {
        viewDate: this.state.viewDate,
        selectedDate: this.state.selectedDate  // Pass selected date to determine which year to highlight
      },
      {
        onYearSelect: this.handleYearSelect.bind(this)
      }
    );

    yearView.render(this.calendarContainer!);
  }

  /**
   * Render the header component
   */
  private renderHeader(): void {
    if (!this.headerContainer) return;

    const headerView = new HeaderView(
      {
        formatter: this.formatter,
        locale: this.state.locale,
        viewDate: this.state.viewDate,
        currentView: this.state.currentView as CalendarViewMode
      },
      {
        onPrevClick: this.handlePrevMonth.bind(this),
        onNextClick: this.handleNextMonth.bind(this),
        onMonthSelectorClick: this.handleShowMonthSelector.bind(this),
        onYearSelectorClick: this.handleShowYearSelector.bind(this)
      }
    );

    headerView.render(this.headerContainer);

    // Make header buttons keyboard navigable
    const headerButtons = this.headerContainer?.querySelectorAll('button');
    headerButtons?.forEach((button: Element) => {
      if (!button.hasAttribute('tabindex')) {
        button.setAttribute('tabindex', '0');
      }
    });
  }

  /**
   * Render the footer component
   */
  private renderFooter(): void {
    if (!this.footerContainer) return;

    // Check if today's date is disabled
    const today = new Date();
    const isTodayDisabled = this.state.isDateDisabled(today);

    const footerView = new FooterView(
      {
        formatter: this.formatter,
        locale: this.state.locale,
        selectedDate: this.state.selectedDate,
        isRangeMode: this.state.isRangeMode,
        rangeStart: this.state.rangeStart,
        rangeEnd: this.state.rangeEnd,
        format: this.state.format,
        isTodayDisabled: isTodayDisabled
      },
      {
        onTodayClick: this.handleTodayClick.bind(this),
        onClearClick: this.handleClearClick.bind(this),
        onCloseClick: this.handleCloseClick.bind(this)
      }
    );

    footerView.render(this.footerContainer);

    // Make footer buttons keyboard navigable
    const footerButtons = this.footerContainer?.querySelectorAll('button');
    footerButtons?.forEach((button: Element) => {
      if (!button.hasAttribute('tabindex')) {
        button.setAttribute('tabindex', '0');
      }
    });
  }

  /**
   * Update the input field value based on current selection
   */
  private updateInputValue(): void {
    if (!this.inputElement) return;

    if (this.state.isRangeMode) {
      if (this.state.rangeStart && this.state.rangeEnd) {
        this.inputElement.value = `${this.formatDateByLocale(this.state.rangeStart)} - ${this.formatDateByLocale(this.state.rangeEnd)}`;
      } else if (this.state.rangeStart) {
        this.inputElement.value = `${this.formatDateByLocale(this.state.rangeStart)} - ...`;
      } else {
        this.inputElement.value = '';
      }
    } else if (this.state.selectedDate) {
      this.inputElement.value = this.formatDateByLocale(this.state.selectedDate);
    } else {
      this.inputElement.value = '';
    }
  }

  /**
   * Update dialog visibility based on isOpen state
   */
  private updateDialogVisibility(): void {
    if (!this.dialogElement) return;

    if (this.state.isOpen) {
      this.dialogElement.classList.add('open');

      // Access the parent DatePicker component to check if this is the initial open
      // We need to get access to the parent DatePicker component that contains our flags
      const datePicker = this.dialogElement.closest('odyssey-date-picker') as any;
      const isInitialOpen = datePicker && datePicker._calendarJustOpened;

      // Set initial focus after dialog is visible
      setTimeout(() => {
        if (isInitialOpen) {
          // Store current _dateChangePrevented value to restore it later
          const wasDateChangePrevented = datePicker._dateChangePrevented;
          
          // Set the flag to prevent date-change events during initial focus
          if (datePicker && datePicker._preventDateChangeOnFocus) {
            datePicker._dateChangePrevented = true;
          }
          
          // Focus strategy: First try to focus on a date cell in the calendar grid
          const currentMonth = this.dialogElement?.querySelector('.date-picker-calendar');
          if (currentMonth) {
            // Try to focus on the selected date if available
            if (this.state.selectedDate) {
              this.focusDateCell(this.state.selectedDate, true);
            } else if (this.state.isRangeMode && this.state.rangeStart) {
              this.focusDateCell(this.state.rangeStart, true);
            } else {
              // Try to focus today or the first available date
              const today = new Date();
              if (!this.state.isDateDisabled(today)) {
                this.focusDateCell(today, true);
              } else {
                // Focus the first available date cell (or a navigation button if no dates available)
                const firstCell = this.dialogElement?.querySelector(
                  '.date-picker-cell:not(.disabled):not(.other-month):not(.weekday)'
                ) as HTMLElement;

                if (firstCell) {
                  firstCell.focus();
                } else {
                  // If no dates are available, focus the header navigation button
                  const navButton = this.dialogElement?.querySelector('.date-picker-nav-btn') as HTMLElement;
                  if (navButton) {
                    navButton.focus();
                  } else {
                    // Last resort, focus the dialog itself
                    this.dialogElement?.focus();
                  }
                }
              }
            }
          }
          
          // Reset the flags after we've used them
          if (datePicker) {
            datePicker._calendarJustOpened = false;
            
            // Restore the previous _dateChangePrevented value after a short delay
            // to allow the focus event to complete
            setTimeout(() => {
              datePicker._dateChangePrevented = wasDateChangePrevented;
            }, 50);
          }
        }
      }, 50); // Small delay to ensure DOM is updated
    } else {
      this.dialogElement.classList.remove('open');
    }
  }

  /**
   * Format date using locale-specific format if available
   */
  private formatDateByLocale(date: Date | null): string {
    if (!date) return '';

    // Use explicit format if provided, always passing format and locale parameters
    return this.formatter.format(date, this.state.format, this.state.locale);
  }

  // Event handlers

  private handleDateSelect(date: Date): void {
    if (this.state.isRangeMode) {
      // For range mode, delegate to the DatePicker's handleRangeDateSelection method
      const datePicker = this.dialogElement?.closest('odyssey-date-picker') as any;
      if (datePicker && typeof datePicker.handleRangeDateSelection === 'function') {
        datePicker.handleRangeDateSelection(date);
      } else {
        // Fallback to standard range selection if handleRangeDateSelection isn't available
        this.state.selectRangeDate(date);
      }
    } else {
      this.state.selectSingleDate(date);
    }
  }

  private handlePrevMonth(): void {
    this.state.navigateToPreviousPeriod();
    
    // Get access to the parent DatePicker component to dispatch events
    const datePicker = this.dialogElement?.closest('odyssey-date-picker') as any;
    if (datePicker && datePicker.eventDispatcherService) {
      if (this.state.currentView === 'calendar') {
        datePicker.eventDispatcherService.dispatchMonthChangeEvent(
          this.state.viewDate.getFullYear(), 
          this.state.viewDate.getMonth()
        );
      } else if (this.state.currentView === 'months') {
        datePicker.eventDispatcherService.dispatchYearChangeEvent(
          this.state.viewDate.getFullYear()
        );
      }
    }
  }

  private handleNextMonth(): void {
    this.state.navigateToNextPeriod();
    
    // Get access to the parent DatePicker component to dispatch events
    const datePicker = this.dialogElement?.closest('odyssey-date-picker') as any;
    if (datePicker && datePicker.eventDispatcherService) {
      if (this.state.currentView === 'calendar') {
        datePicker.eventDispatcherService.dispatchMonthChangeEvent(
          this.state.viewDate.getFullYear(), 
          this.state.viewDate.getMonth()
        );
      } else if (this.state.currentView === 'months') {
        datePicker.eventDispatcherService.dispatchYearChangeEvent(
          this.state.viewDate.getFullYear()
        );
      }
    }
  }

  private handleShowMonthSelector(): void {
    this.state.currentView = 'months';
    
    // Get access to the parent DatePicker component to dispatch events
    const datePicker = this.dialogElement?.closest('odyssey-date-picker') as any;
    if (datePicker && datePicker.eventDispatcherService) {
      datePicker.eventDispatcherService.dispatchViewModeChangeEvent('months');
    }
  }

  private handleShowYearSelector(): void {
    this.state.currentView = 'years';
    
    // Get access to the parent DatePicker component to dispatch events
    const datePicker = this.dialogElement?.closest('odyssey-date-picker') as any;
    if (datePicker && datePicker.eventDispatcherService) {
      datePicker.eventDispatcherService.dispatchViewModeChangeEvent('years');
    }
  }

  private handleMonthSelect(monthIndex: number): void {
    // Create a new date based on the clicked month
    const newDate = new Date(this.state.viewDate);
    newDate.setMonth(monthIndex);
    
    // Update the viewDate to show the selected month, but don't change selectedDate
    this.state.viewDate = newDate;
    
    // Navigate to calendar view after selecting a month
    this.state.currentView = 'calendar';
    
    // Get access to the parent DatePicker component to dispatch events
    const datePicker = this.dialogElement?.closest('odyssey-date-picker') as any;
    if (datePicker && datePicker.eventDispatcherService) {
      datePicker.eventDispatcherService.dispatchMonthChangeEvent(newDate.getFullYear(), monthIndex);
      datePicker.eventDispatcherService.dispatchViewModeChangeEvent('calendar');
    }
  }

  private handleYearSelect(year: number): void {
    // Create a new date based on the clicked year
    const newDate = new Date(this.state.viewDate);
    newDate.setFullYear(year);
    
    // Update the viewDate to show the selected year, but don't change selectedDate
    this.state.viewDate = newDate;
    
    // Navigate to months view after selecting a year
    this.state.currentView = 'months';
    
    // Get access to the parent DatePicker component to dispatch events
    const datePicker = this.dialogElement?.closest('odyssey-date-picker') as any;
    if (datePicker && datePicker.eventDispatcherService) {
      datePicker.eventDispatcherService.dispatchYearChangeEvent(year);
      datePicker.eventDispatcherService.dispatchViewModeChangeEvent('months');
    }
  }

  private handleTodayClick(): void {
    const today = new Date();
    this.state.viewDate = today;

    // Only select today if it's within the allowed date range
    if (!this.state.isRangeMode && !this.state.isDateDisabled(today)) {
      this.state.selectedDate = today;
      
      // Get access to the parent DatePicker component to dispatch events
      const datePicker = this.dialogElement?.closest('odyssey-date-picker') as any;
      if (datePicker && datePicker.eventDispatcherService) {
        // Get any events for today
        const dateKey = this.formatter.format(today, 'yyyy-MM-dd');
        const eventsForDate = this.state.getEvents ? this.state.getEvents(dateKey) || [] : [];
        
        // Dispatch date change event for today selection
        datePicker.eventDispatcherService.dispatchDateChangeEvent(
          today,
          this.formatter.format(today, this.state.format),
          eventsForDate,
          'today-button'
        );
      }
    }
    
    // Always navigate back to the calendar view if we're not already there
    if (this.state.currentView !== 'calendar') {
      this.state.currentView = 'calendar';
      
      // Get access to the parent DatePicker component to dispatch view mode change event
      const datePicker = this.dialogElement?.closest('odyssey-date-picker') as any;
      if (datePicker && datePicker.eventDispatcherService) {
        datePicker.eventDispatcherService.dispatchViewModeChangeEvent('calendar');
      }
    }
  }

  private handleClearClick(): void {
    // Get access to the parent DatePicker component to dispatch events
    const datePicker = this.dialogElement?.closest('odyssey-date-picker') as any;
    
    if (this.state.isRangeMode) {
      // Only dispatch if there was a selection to clear
      const hadSelection = this.state.rangeStart !== null || this.state.rangeEnd !== null;
      
      this.state.resetRangeSelection();
      
      if (hadSelection && datePicker && datePicker.eventDispatcherService) {
        datePicker.eventDispatcherService.dispatchRangeClearEvent();
        datePicker._lastSelectedDate = null; // Reset the last selected date to prevent duplicate events
      }
    } else {
      // Only dispatch if there was a selection to clear
      const hadSelection = this.state.selectedDate !== null;
      
      this.state.selectedDate = null;
      
      if (hadSelection && datePicker && datePicker.eventDispatcherService) {
        datePicker.eventDispatcherService.dispatchDateClearEvent();
        datePicker._lastSelectedDate = null; // Reset the last selected date to prevent duplicate events
      }
    }
  }

  private handleCloseClick(): void {
    this.state.isOpen = false;
  }
}
