import { CalendarService } from './calendar.service';
import { DatePickerSelectionMode } from './date-picker-service-manager';
import { InternationalizationService } from './internationalization.service';

/**
 * Calendar view modes
 */
export enum CalendarViewMode {
  DAYS = 'days',
  MONTHS = 'months',
  YEARS = 'years'
}

/**
 * Service for updating the date picker UI
 */
export class UIUpdaterService {
  private _materialIconsAdded = false;
  
  /**
   * Add Material Icons if not already added
   */
  addMaterialIcons(): void {
    if (this._materialIconsAdded) return;
    
    // Check if already loaded
    const existingLink = document.querySelector('link[href*="material-icons"]');
    if (existingLink) {
      this._materialIconsAdded = true;
      return;
    }
    
    // Add link to Material Icons
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/icon?family=Material+Icons';
    document.head.appendChild(link);
    
    this._materialIconsAdded = true;
  }
  
  /**
   * Render the date picker input field
   */
  renderDatePicker(
    element: HTMLElement,
    selectedValue: string | Date | null,
    disabled: boolean,
    required: boolean,
    i18nService: InternationalizationService,
    calendarService: CalendarService,
    theme: string,
    onToggle: () => void
  ): void {
    // Clear any existing content
    element.innerHTML = '';
    
    // Create input container
    const inputContainer = document.createElement('div');
    inputContainer.classList.add('date-picker-input-wrapper');
    
    // Create input field
    const input = document.createElement('input');
    input.type = 'text';
    input.readOnly = true; // Make it read-only to prevent direct editing
    input.classList.add('date-picker-input');
    input.disabled = disabled;
    input.required = required;
    input.ariaLabel = 'Select date';
    
    // Format and set the input value
    if (selectedValue !== null) {
      if (selectedValue instanceof Date) {
        input.value = i18nService.formatDate(selectedValue);
      } else {
        input.value = selectedValue;
      }
    }
    
    // Create calendar icon
    const iconSpan = document.createElement('span');
    iconSpan.classList.add('date-picker-icon', 'material-icons');
    iconSpan.textContent = 'calendar_today';
    
    // Add click event to input to toggle calendar
    input.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (!disabled) {
        onToggle();
      }
    });
    
    // Append elements to input container
    inputContainer.appendChild(input);
    inputContainer.appendChild(iconSpan);
    
    // Append input container to element
    element.appendChild(inputContainer);
    
    // Add theme as data attribute
    if (theme) {
      element.setAttribute('data-theme', theme);
    }
    
    // Add base class
    element.classList.add('odyssey-date-picker');
  }
  
  /**
   * Render the calendar dialog
   */
  renderCalendarDialog(
    container: HTMLElement,
    year: number,
    month: number,
    selectedDate: Date | null,
    focusedDate: Date,
    isOpen: boolean,
    i18nService: InternationalizationService,
    calendarService: CalendarService,
    handlers: {
      onPrevMonth: () => void;
      onNextMonth: () => void;
      onSelectDate: (date: Date) => void;
      onToday: () => void;
      onClear: () => void;
      onClose: () => void;
      onViewModeChange?: (mode: CalendarViewMode) => void; // New handler for view mode changes
      yearRangeStart?: number; // Optional parameter for year range start
    },
    viewMode: CalendarViewMode = CalendarViewMode.DAYS,
    selectionMode: DatePickerSelectionMode = DatePickerSelectionMode.SINGLE,
    startDate: Date | null = null,
    endDate: Date | null = null,
    isSelectingRange: boolean = false
  ): void {
    // Find or create dialog
    let dialog = container.querySelector('.date-picker-dialog') as HTMLDivElement;
    
    if (!dialog) {
      dialog = document.createElement('div');
      dialog.classList.add('date-picker-dialog');
      dialog.setAttribute('role', 'dialog');
      dialog.setAttribute('aria-label', 'Date picker');
      dialog.setAttribute('tabindex', '-1');
      container.appendChild(dialog);
    }
    
    // Update dialog visibility
    if (isOpen) {
      dialog.classList.add('open');
    } else {
      dialog.classList.remove('open');
    }
    
    // If not open, no need to update content
    if (!isOpen) return;
    
    // Clear dialog content
    dialog.innerHTML = '';
    
    // Create header
    const header = document.createElement('div');
    header.classList.add('date-picker-header');
    
    // Create navigation components
    const prevButton = document.createElement('button');
    prevButton.type = 'button';
    prevButton.classList.add('date-picker-nav-btn');
    prevButton.ariaLabel = 'Previous';
    prevButton.innerHTML = '<span class="material-icons">chevron_left</span>';
    prevButton.addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault();
      handlers.onPrevMonth();
    });
    
    const selectors = document.createElement('div');
    selectors.classList.add('date-picker-selectors');
    
    // Month selector (always visible)
    const monthSelector = document.createElement('button');
    monthSelector.type = 'button';
    monthSelector.classList.add('date-picker-month-selector');
    monthSelector.textContent = i18nService.getMonthName(month);
    monthSelector.addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault();
      
      // Toggle between days view and months view
      if (viewMode === CalendarViewMode.DAYS) {
        // If in day view, go to month view
        if (handlers.onViewModeChange) {
          handlers.onViewModeChange(CalendarViewMode.MONTHS);
        }
        this.updateCalendarContent(dialog, year, month, selectedDate, focusedDate, i18nService, calendarService, handlers, CalendarViewMode.MONTHS, selectionMode, startDate, endDate, isSelectingRange);
      } else if (viewMode === CalendarViewMode.MONTHS) {
        // If in month view, go back to day view
        if (handlers.onViewModeChange) {
          handlers.onViewModeChange(CalendarViewMode.DAYS);
        }
        this.updateCalendarContent(dialog, year, month, selectedDate, focusedDate, i18nService, calendarService, handlers, CalendarViewMode.DAYS, selectionMode, startDate, endDate, isSelectingRange);
      } else if (viewMode === CalendarViewMode.YEARS) {
        // If in year view, go to month view
        if (handlers.onViewModeChange) {
          handlers.onViewModeChange(CalendarViewMode.DAYS);
        }
        this.updateCalendarContent(dialog, year, month, selectedDate, focusedDate, i18nService, calendarService, handlers, CalendarViewMode.DAYS, selectionMode, startDate, endDate, isSelectingRange);
      }
    });
    
    // Year selector
    const yearSelector = document.createElement('button');
    yearSelector.type = 'button';
    yearSelector.classList.add('date-picker-year-selector');
    
    if (viewMode === CalendarViewMode.DAYS) {
      yearSelector.textContent = year.toString();
    } else if (viewMode === CalendarViewMode.MONTHS) {
      yearSelector.textContent = year.toString();
    } else if (viewMode === CalendarViewMode.YEARS) {
      const yearRange = this.getYearRange(year);
      yearSelector.textContent = `${yearRange.start} - ${yearRange.end}`;
    }
    
    yearSelector.addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault();
      
      // Toggle between days view and years view
      if (viewMode === CalendarViewMode.DAYS || viewMode === CalendarViewMode.MONTHS) {
        // If in day or month view, go to year view
        if (handlers.onViewModeChange) {
          handlers.onViewModeChange(CalendarViewMode.YEARS);
        }
        this.updateCalendarContent(dialog, year, month, selectedDate, focusedDate, i18nService, calendarService, handlers, CalendarViewMode.YEARS, selectionMode, startDate, endDate, isSelectingRange);
      } else if (viewMode === CalendarViewMode.YEARS) {
        // If in year view, go back to day view
        if (handlers.onViewModeChange) {
          handlers.onViewModeChange(CalendarViewMode.DAYS);
        }
        this.updateCalendarContent(dialog, year, month, selectedDate, focusedDate, i18nService, calendarService, handlers, CalendarViewMode.DAYS, selectionMode, startDate, endDate, isSelectingRange);
      }
    });
    
    selectors.appendChild(monthSelector);
    selectors.appendChild(yearSelector);
    
    const nextButton = document.createElement('button');
    nextButton.type = 'button';
    nextButton.classList.add('date-picker-nav-btn');
    nextButton.ariaLabel = 'Next';
    nextButton.innerHTML = '<span class="material-icons">chevron_right</span>';
    nextButton.addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault();
      handlers.onNextMonth();
    });
    
    // Append navigation elements to header
    header.appendChild(prevButton);
    header.appendChild(selectors);
    header.appendChild(nextButton);
    
    dialog.appendChild(header);
    
    // Create content based on view mode
    this.updateCalendarContent(dialog, year, month, selectedDate, focusedDate, i18nService, calendarService, handlers, viewMode, selectionMode, startDate, endDate, isSelectingRange);
    
    // Create footer with actions
    const footer = document.createElement('div');
    footer.classList.add('date-picker-footer');
    
    const buttonsContainer = document.createElement('div');
    buttonsContainer.classList.add('date-picker-buttons');
    
    const todayButton = document.createElement('button');
    todayButton.type = 'button';
    todayButton.classList.add('date-picker-btn');
    todayButton.textContent = i18nService.translate('today');
    todayButton.addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault();
      handlers.onToday();
    });
    
    const clearButton = document.createElement('button');
    clearButton.type = 'button';
    clearButton.classList.add('date-picker-btn');
    clearButton.textContent = i18nService.translate('clear');
    clearButton.addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault();
      handlers.onClear();
    });
    
    const closeButton = document.createElement('button');
    closeButton.type = 'button';
    closeButton.classList.add('date-picker-btn', 'primary');
    closeButton.textContent = i18nService.translate('close');
    closeButton.addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault();
      handlers.onClose();
    });
    
    buttonsContainer.appendChild(todayButton);
    buttonsContainer.appendChild(clearButton);
    buttonsContainer.appendChild(closeButton);
    
    footer.appendChild(buttonsContainer);
    
    dialog.appendChild(footer);
    
    // Make dialog focusable
    dialog.setAttribute('tabindex', '0');
  }
  
  /**
   * Update calendar content based on view mode
   */
  private updateCalendarContent(
    dialog: HTMLDivElement,
    year: number,
    month: number,
    selectedDate: Date | null,
    focusedDate: Date,
    i18nService: InternationalizationService,
    calendarService: CalendarService,
    handlers: any,
    viewMode: CalendarViewMode,
    selectionMode: DatePickerSelectionMode,
    startDate: Date | null,
    endDate: Date | null,
    isSelectingRange: boolean
  ): void {
    // Remove existing content
    const existingContent = dialog.querySelector('.date-picker-calendar');
    if (existingContent) {
      existingContent.remove();
    }
    
    // Create content container
    const content = document.createElement('div');
    content.classList.add('date-picker-calendar');
    
    // Update header title if exists
    const monthSelector = dialog.querySelector('.date-picker-month-selector');
    if (monthSelector) {
      monthSelector.textContent = i18nService.getMonthName(month);
    }
    
    // Determine which year to actually use for selection highlighting
    let yearForHighlighting = year;
    if (selectionMode === DatePickerSelectionMode.SINGLE && selectedDate) {
      yearForHighlighting = selectedDate.getFullYear();
    } else if (selectionMode === DatePickerSelectionMode.RANGE && startDate) {
      yearForHighlighting = startDate.getFullYear();
    }
    
    // Update year selector text
    const yearSelector = dialog.querySelector('.date-picker-year-selector');
    if (yearSelector) {
      if (viewMode === CalendarViewMode.YEARS) {
        // Use the yearRangeStart parameter if provided by the service manager
        let yearRangeStart = handlers.yearRangeStart;
        if (yearRangeStart === undefined) {
          // Fall back to calculating based on the current year if not provided
          const yearRange = this.getYearRange(year);
          yearRangeStart = yearRange.start;
        }
        const yearRangeEnd = yearRangeStart + 11;
        yearSelector.textContent = `${yearRangeStart} - ${yearRangeEnd}`;
      } else {
        yearSelector.textContent = year.toString();
      }
    }
    
    // Render appropriate content based on view mode
    if (viewMode === CalendarViewMode.DAYS) {
      this.renderDaysView(
        content, 
        year, 
        month, 
        selectedDate, 
        focusedDate, 
        i18nService, 
        calendarService, 
        handlers.onSelectDate,
        selectionMode,
        startDate,
        endDate,
        isSelectingRange
      );
    } else if (viewMode === CalendarViewMode.MONTHS) {
      this.renderMonthsView(content, year, i18nService, month, (newMonth: number) => {
        // When selecting month, go back to days view with selected month
        if (handlers.onViewModeChange) {
          handlers.onViewModeChange(CalendarViewMode.DAYS);
        }
        this.updateCalendarContent(dialog, year, newMonth, selectedDate, focusedDate, i18nService, calendarService, handlers, CalendarViewMode.DAYS, selectionMode, startDate, endDate, isSelectingRange);
      });
    } else if (viewMode === CalendarViewMode.YEARS) {
      // Use provided yearRangeStart or calculate it
      let yearRangeStart = handlers.yearRangeStart;
      if (yearRangeStart === undefined) {
        // Fall back to calculating based on the current year if not provided
        const yearRange = this.getYearRange(yearForHighlighting);
        yearRangeStart = yearRange.start;
      }
      const yearRangeEnd = yearRangeStart + 11;
      
      // Log the year range being displayed
      console.log(`Rendering year range: ${yearRangeStart}-${yearRangeEnd}, highlighting year: ${yearForHighlighting}`);
      
      this.renderYearsView(content, yearRangeStart, yearRangeEnd, yearForHighlighting, (newYear: number) => {
        // When selecting year, go directly to days view with selected year
        if (handlers.onViewModeChange) {
          handlers.onViewModeChange(CalendarViewMode.DAYS);
        }
        this.updateCalendarContent(dialog, newYear, month, selectedDate, focusedDate, i18nService, calendarService, handlers, CalendarViewMode.DAYS, selectionMode, startDate, endDate, isSelectingRange);
      });
    }
    
    // Insert content into dialog after header
    const header = dialog.querySelector('.date-picker-header');
    if (header && header.nextSibling) {
      dialog.insertBefore(content, header.nextSibling);
    } else {
      dialog.appendChild(content);
    }
  }
  
  /**
   * Render the days view
   */
  private renderDaysView(
    container: HTMLDivElement,
    year: number,
    month: number,
    selectedDate: Date | null,
    focusedDate: Date,
    i18nService: InternationalizationService,
    calendarService: CalendarService,
    onSelectDate: (date: Date) => void,
    selectionMode: DatePickerSelectionMode,
    startDate: Date | null,
    endDate: Date | null,
    isSelectingRange: boolean
  ): void {
    // Create weekdays header row
    const weekdaysRow = document.createElement('div');
    weekdaysRow.classList.add('date-picker-row', 'date-picker-weekdays');
    
    // Get first day of week (numeric value, not a Date)
    const firstDayOfWeek = calendarService.getFirstDayOfWeekValue();
    
    // Add day names
    for (let i = 0; i < 7; i++) {
      const dayIndex = (firstDayOfWeek + i) % 7;
      const dayCell = document.createElement('div');
      dayCell.classList.add('date-picker-cell', 'weekday');
      dayCell.textContent = i18nService.getDayAbbr(dayIndex);
      weekdaysRow.appendChild(dayCell);
    }
    
    container.appendChild(weekdaysRow);
    
    // Generate calendar days
    const calendarDaysMatrix = calendarService.generateCalendarDays(year, month);
    
    // Create grid for days (6 weeks x 7 days)
    let week: HTMLDivElement | null = null;
    let dayCount = 0;
    
    // Function to check if date is in range
    const isInRange = (date: Date): boolean => {
      if (!startDate || !endDate) return false;
      
      const time = date.getTime();
      return time > startDate.getTime() && time < endDate.getTime();
    };
    
    // Flatten the matrix of calendar days
    const calendarDays = calendarDaysMatrix.flat();
    
    for (const calendarDay of calendarDays) {
      const currentDate = calendarDay.date; // Use the date property from CalendarDay
      
      // Create a new row for each week
      if (dayCount % 7 === 0) {
        if (week) {
          container.appendChild(week);
        }
        week = document.createElement('div');
        week.classList.add('date-picker-row');
      }
      
      // Create day cell
      const dayCell = document.createElement('div');
      dayCell.classList.add('date-picker-cell');
      
      // Set text content to day number
      dayCell.textContent = currentDate.getDate().toString();
      
      // Check if current month - using the isCurrentMonth property from CalendarDay
      if (!calendarDay.isCurrentMonth) {
        if (currentDate.getMonth() < month || 
          (currentDate.getMonth() === 11 && month === 0)) {
          dayCell.classList.add('prev-month');
        } else {
          dayCell.classList.add('next-month');
        }
      }
      
      // Check if day is today - using the isToday property from CalendarDay
      if (calendarDay.isToday) {
        dayCell.classList.add('today');
      }
      
      // Check if day is selected (single mode) or part of selected range (range mode)
      let isSelected = false;
      
      if (selectionMode === DatePickerSelectionMode.SINGLE && selectedDate) {
        // In single mode, check if this is the selected date
        isSelected = currentDate.getDate() === selectedDate.getDate() &&
                      currentDate.getMonth() === selectedDate.getMonth() &&
                      currentDate.getFullYear() === selectedDate.getFullYear();
      } else if (selectionMode === DatePickerSelectionMode.RANGE) {
        // In range mode, check if this is a boundary date
        if (startDate) {
          const isStartDate = currentDate.getDate() === startDate.getDate() &&
                             currentDate.getMonth() === startDate.getMonth() &&
                             currentDate.getFullYear() === startDate.getFullYear();
          if (isStartDate) {
            isSelected = true;
            dayCell.classList.add('range-start');
          }
        }
        
        if (endDate) {
          const isEndDate = currentDate.getDate() === endDate.getDate() &&
                           currentDate.getMonth() === endDate.getMonth() &&
                           currentDate.getFullYear() === endDate.getFullYear();
          if (isEndDate) {
            isSelected = true;
            dayCell.classList.add('range-end');
          }
        }
        
        // Check if day is in the selected range
        if (isInRange(currentDate)) {
          dayCell.classList.add('in-range');
        }
      }
      
      if (isSelected) {
        dayCell.classList.add('selected');
      }
      
      // Check if day is focused
      if (currentDate.getDate() === focusedDate.getDate() &&
          currentDate.getMonth() === focusedDate.getMonth() &&
          currentDate.getFullYear() === focusedDate.getFullYear()) {
        dayCell.classList.add('focused');
        dayCell.setAttribute('tabindex', '0');
      } else {
        dayCell.setAttribute('tabindex', '-1');
      }
      
      // Check if day is disabled
      if (calendarDay.isDisabled) {
        dayCell.classList.add('disabled');
      } else {
        // Add click event only if not disabled
        dayCell.addEventListener('click', (e) => {
          // Prevent the event from bubbling up which might cause the calendar to close
          e.stopPropagation();
          e.preventDefault();
          onSelectDate(new Date(currentDate));
        });
      }
      
      // Add events indicators if any
      const formattedDate = calendarService.formatDate(currentDate);
      const events = calendarService.getEvents(formattedDate);
      if (events && events.length > 0) {
        dayCell.classList.add('has-events');
        
        // Create event indicator
        const indicator = document.createElement('span');
        indicator.classList.add('event-indicator');
        dayCell.appendChild(indicator);
        
        // Add title attribute with event details
        dayCell.title = events.join(', ');
      }
      
      // Add ARIA attributes for accessibility
      dayCell.setAttribute('role', 'gridcell');
      dayCell.setAttribute('aria-label', i18nService.formatDate(currentDate));
      
      if (week) {
        week.appendChild(dayCell);
      }
      
      dayCount++;
    }
    
    // Append the last week
    if (week) {
      container.appendChild(week);
    }
  }
  
  /**
   * Render the months view
   */
  private renderMonthsView(
    container: HTMLDivElement,
    year: number,
    i18nService: InternationalizationService,
    currentMonth: number,
    onSelectMonth: (month: number) => void
  ): void {
    const monthsContainer = document.createElement('div');
    monthsContainer.classList.add('date-picker-months-grid');
    monthsContainer.setAttribute('role', 'grid');
    
    // Current date for highlighting today's month if in current year
    const today = new Date();
    const isCurrentYear = today.getFullYear() === year;
    
    // Create months grid (4x3)
    for (let row = 0; row < 4; row++) {
      const monthRow = document.createElement('div');
      monthRow.classList.add('date-picker-row');
      monthRow.setAttribute('role', 'row');
      
      for (let col = 0; col < 3; col++) {
        const monthIndex = row * 3 + col;
        const monthElement = document.createElement('div');
        monthElement.classList.add('date-picker-cell', 'month-cell');
        monthElement.setAttribute('role', 'gridcell');
        monthElement.setAttribute('data-month', monthIndex.toString());
        
        // Only add selected class if we're looking at the current month in the current view
        // This is the key fix: Only highlight the month if it's the selected month AND in the current year
        const currentDate = new Date();
        currentDate.setFullYear(year);
        currentDate.setMonth(monthIndex);
        
        if (monthIndex === currentMonth) {
          monthElement.classList.add('selected');
          monthElement.setAttribute('tabindex', '0');
        } else {
          monthElement.setAttribute('tabindex', '-1');
        }
        
        // Check if it's current month in current year
        if (isCurrentYear && today.getMonth() === monthIndex) {
          monthElement.classList.add('current');
        }
        
        monthElement.textContent = i18nService.getMonthName(monthIndex, true);
        
        // Add click handler
        monthElement.addEventListener('click', (e) => {
          // Prevent the event from bubbling up which might cause the calendar to close
          e.stopPropagation();
          e.preventDefault();
          onSelectMonth(monthIndex);
        });
        
        monthRow.appendChild(monthElement);
      }
      
      monthsContainer.appendChild(monthRow);
    }
    
    container.appendChild(monthsContainer);
  }
  
  /**
   * Render the years view
   */
  private renderYearsView(
    container: HTMLDivElement,
    startYear: number,
    endYear: number,
    currentYear: number,
    onSelectYear: (year: number) => void
  ): void {
    const yearsContainer = document.createElement('div');
    yearsContainer.classList.add('date-picker-years-grid');
    yearsContainer.setAttribute('role', 'grid');
    
    // Only highlight the year if it's within the current view range
    const shouldHighlight = currentYear >= startYear && currentYear <= endYear;
    
    // Create years grid (4x3)
    let yearIndex = startYear;
    
    for (let row = 0; row < 4; row++) {
      const yearRow = document.createElement('div');
      yearRow.classList.add('date-picker-row');
      yearRow.setAttribute('role', 'row');
      
      for (let col = 0; col < 3; col++) {
        if (yearIndex <= endYear) {
          const yearElement = document.createElement('div');
          yearElement.classList.add('date-picker-cell', 'year-cell');
          yearElement.setAttribute('role', 'gridcell');
          yearElement.setAttribute('data-year', yearIndex.toString());
          
          // Only highlight if the year is in the current view range
          const isSelected = shouldHighlight && (yearIndex === currentYear);
          
          if (isSelected) {
            yearElement.classList.add('selected');
            yearElement.setAttribute('tabindex', '0');
          } else {
            yearElement.setAttribute('tabindex', '-1');
          }
          
          // Check if it's current year
          const today = new Date();
          if (today.getFullYear() === yearIndex) {
            yearElement.classList.add('current');
          }
          
          // Store the actual year value to ensure we select the correct year
          const actualYear = yearIndex;
          yearElement.textContent = actualYear.toString();
          
          // Add click handler
          yearElement.addEventListener('click', (e) => {
            // Prevent the event from bubbling up which might cause the calendar to close
            e.stopPropagation();
            e.preventDefault();
            onSelectYear(actualYear);
          });
          
          // Store row and column for keyboard navigation
          yearElement.setAttribute('data-row', row.toString());
          yearElement.setAttribute('data-col', col.toString());
          yearElement.setAttribute('aria-selected', isSelected ? 'true' : 'false');
          yearElement.setAttribute('aria-label', `Year ${yearIndex}`);
          
          yearRow.appendChild(yearElement);
          yearIndex++;
        }
      }
      
      yearsContainer.appendChild(yearRow);
    }
    
    container.appendChild(yearsContainer);
  }
  
  /**
   * Calculate year range for the years view
   */
  private getYearRange(year: number): { start: number; end: number } {
    const start = Math.floor(year / 12) * 12;
    const end = start + 11;
    return { start, end };
  }
  
  /**
   * Get the calendar dialog element
   */
  getDialog(container: HTMLElement): HTMLElement | null {
    return container.querySelector('.date-picker-dialog');
  }
  
  /**
   * Get the input field element
   */
  getInputField(container: HTMLElement): HTMLInputElement | null {
    return container.querySelector('.date-picker-input');
  }
  
  /**
   * Update input field value
   */
  updateInputValue(
    container: HTMLElement,
    value: string | Date | null,
    i18nService: InternationalizationService
  ): void {
    const input = this.getInputField(container);
    if (!input) return;
    
    if (value === null) {
      input.value = '';
    } else if (value instanceof Date) {
      input.value = i18nService.formatDate(value);
    } else {
      input.value = value;
    }
  }
  
  /**
   * Focus on a specific date cell in the calendar
   */
  focusDateCell(
    dialog: HTMLElement,
    date: Date,
    calendarService: CalendarService
  ): void {
    const daysContainer = dialog.querySelector('.date-picker-calendar');
    if (!daysContainer) return;
    
    // First try to find by aria-label if available
    const formattedDate = calendarService.formatDate(date);
    let dateCell = dialog.querySelector(`.date-picker-cell[aria-label="${formattedDate}"]`) as HTMLElement;
    
    // Otherwise find by content and data attributes (only works for dates in current month)
    if (!dateCell) {
      const cells = dialog.querySelectorAll('.date-picker-cell:not(.weekday)');
      for (const cell of cells) {
        // Get text content as number
        const cellDate = parseInt(cell.textContent || '0', 10);
        
        // Check if the cell represents the current date
        if (cellDate === date.getDate() && 
            !cell.classList.contains('prev-month') && 
            !cell.classList.contains('next-month')) {
          dateCell = cell as HTMLElement;
          break;
        }
      }
    }
    
    if (dateCell) {
      // Remove focused class from all dates
      const allDays = dialog.querySelectorAll('.date-picker-cell:not(.weekday)');
      allDays.forEach(day => {
        day.classList.remove('focused');
        day.setAttribute('tabindex', '-1');
      });
      
      // Add focused class to selected date
      dateCell.classList.add('focused');
      dateCell.setAttribute('tabindex', '0');
      dateCell.focus();
    }
  }
}