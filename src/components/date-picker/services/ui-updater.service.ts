import { CalendarService } from './calendar.service';
import { InternationalizationService } from './internationalization.service';

/**
 * Calendar view mode enum - represents different calendar view states
 */
export enum CalendarViewMode {
  DAYS = 'days',
  MONTHS = 'months',
  YEARS = 'years'
}

/**
 * Service responsible for UI updates and rendering
 */
export class UIUpdaterService {
  /**
   * Add Material Icons stylesheet if not already present
   */
  addMaterialIcons(): void {
    if (!document.querySelector('link[href*="material-icons"]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://fonts.googleapis.com/icon?family=Material+Icons';
      document.head.appendChild(link);
    }
  }
  
  /**
   * Render the complete date picker
   */
  renderDatePicker(
    hostElement: HTMLElement,
    selectedDate: Date | null,
    disabled: boolean,
    required: boolean,
    i18nService: InternationalizationService,
    calendarService: CalendarService,
    theme: string,
    onToggleCalendar: () => void
  ): void {
    // Add theme class to host element
    hostElement.classList.add('odyssey-date-picker');
    hostElement.setAttribute('data-theme', theme);
    
    // Create input wrapper
    const inputWrapper = document.createElement('div');
    inputWrapper.className = 'date-picker-input-wrapper';
    
    // Create input field
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'date-picker-input';
    input.readOnly = true;
    input.placeholder = disabled ? '' : i18nService.translate('selectDate');
    input.disabled = disabled;
    input.required = required;
    
    // Set input value if date is selected
    if (selectedDate) {
      input.value = i18nService.formatDate(selectedDate);
    }
    
    // Create calendar icon
    const icon = document.createElement('span');
    icon.className = 'date-picker-icon material-icons';
    icon.textContent = 'calendar_today';
    
    // Add input events
    if (!disabled) {
      inputWrapper.addEventListener('click', onToggleCalendar);
      input.addEventListener('keydown', (e: KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onToggleCalendar();
        }
      });
    }
    
    // Add required ARIA attributes for accessibility
    input.setAttribute('aria-label', i18nService.translate('dateInput'));
    input.setAttribute('role', 'textbox');
    
    if (required) {
      input.setAttribute('aria-required', 'true');
    }
    
    // Add components to the DOM
    inputWrapper.appendChild(input);
    inputWrapper.appendChild(icon);
    
    // Add dialog container (will be populated later)
    const dialogContainer = document.createElement('div');
    dialogContainer.className = 'date-picker-dialog';
    dialogContainer.setAttribute('role', 'dialog');
    dialogContainer.setAttribute('aria-modal', 'true');
    dialogContainer.setAttribute('aria-label', i18nService.translate('calendar'));
    dialogContainer.tabIndex = -1;
    
    // Clear host element and append new content
    hostElement.innerHTML = '';
    hostElement.appendChild(inputWrapper);
    hostElement.appendChild(dialogContainer);
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
    eventHandlers: {
      onPrevMonth: () => void;
      onNextMonth: () => void;
      onSelectDate: (date: Date) => void;
      onToday: () => void;
      onClear: () => void;
      onClose: () => void;
    },
    viewMode: CalendarViewMode = CalendarViewMode.DAYS
  ): void {
    // Get dialog element
    const dialog = this.getDialog(container);
    if (!dialog) return;
    
    // Update visibility using class instead of inline style
    if (isOpen) {
      dialog.classList.add('open');
    } else {
      dialog.classList.remove('open');
    }
    
    // If not open, no need to render the calendar
    if (!isOpen) return;
    
    // Start building the dialog content
    const content = document.createElement('div');
    
    // Create header
    const header = document.createElement('div');
    header.className = 'date-picker-header';
    
    // Previous button (function depends on view mode)
    const prevBtn = document.createElement('button');
    prevBtn.className = 'date-picker-nav-btn';
    
    switch (viewMode) {
      case CalendarViewMode.DAYS:
        prevBtn.setAttribute('aria-label', i18nService.translate('previousMonth'));
        prevBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          eventHandlers.onPrevMonth();
        });
        break;
      case CalendarViewMode.MONTHS:
        prevBtn.setAttribute('aria-label', i18nService.translate('previousYear'));
        prevBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.navigateYearView(container, year - 1, month, selectedDate, focusedDate, isOpen, i18nService, calendarService, eventHandlers);
        });
        break;
      case CalendarViewMode.YEARS:
        const yearRange = this.getYearRange(year);
        prevBtn.setAttribute('aria-label', i18nService.translate('previousYearRange'));
        prevBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.navigateYearRangeView(container, yearRange.start - 12, month, selectedDate, focusedDate, isOpen, i18nService, calendarService, eventHandlers);
        });
        break;
    }
    
    const prevIcon = document.createElement('span');
    prevIcon.className = 'material-icons';
    prevIcon.textContent = 'chevron_left';
    prevBtn.appendChild(prevIcon);
    
    // Month/Year selectors
    const monthYearContainer = document.createElement('div');
    monthYearContainer.className = 'date-picker-selectors';
    
    if (viewMode === CalendarViewMode.DAYS) {
      // Create separate month selector
      const monthSelector = document.createElement('button');
      monthSelector.className = 'date-picker-month-selector';
      monthSelector.textContent = i18nService.getMonthName(month, false);
      monthSelector.setAttribute('aria-label', i18nService.translate('selectMonth'));
      monthSelector.addEventListener('click', (e) => {
        e.stopPropagation();
        this.renderCalendarDialog(
          container,
          year,
          month,
          selectedDate,
          focusedDate,
          isOpen,
          i18nService,
          calendarService,
          eventHandlers,
          CalendarViewMode.MONTHS
        );
      });
      
      // Create separate year selector
      const yearSelector = document.createElement('button');
      yearSelector.className = 'date-picker-year-selector';
      yearSelector.textContent = year.toString();
      yearSelector.setAttribute('aria-label', i18nService.translate('selectYear'));
      yearSelector.addEventListener('click', (e) => {
        e.stopPropagation();
        this.renderCalendarDialog(
          container,
          year,
          month,
          selectedDate,
          focusedDate,
          isOpen,
          i18nService,
          calendarService,
          eventHandlers,
          CalendarViewMode.YEARS
        );
      });
      
      monthYearContainer.appendChild(monthSelector);
      monthYearContainer.appendChild(yearSelector);
    } else if (viewMode === CalendarViewMode.MONTHS) {
      // In month view, only show the year
      const yearSelector = document.createElement('button');
      yearSelector.className = 'date-picker-year-selector center';
      yearSelector.textContent = year.toString();
      yearSelector.setAttribute('aria-label', i18nService.translate('selectYear'));
      yearSelector.addEventListener('click', (e) => {
        e.stopPropagation();
        this.renderCalendarDialog(
          container,
          year,
          month,
          selectedDate,
          focusedDate,
          isOpen,
          i18nService,
          calendarService,
          eventHandlers,
          CalendarViewMode.YEARS
        );
      });
      
      monthYearContainer.appendChild(yearSelector);
    } else {
      // In years view, show the year range (non-clickable)
      const yearRange = this.getYearRange(year);
      const yearRangeText = document.createElement('div');
      yearRangeText.className = 'date-picker-year-range center';
      yearRangeText.textContent = `${yearRange.start} - ${yearRange.end}`;
      yearRangeText.setAttribute('aria-label', i18nService.translate('yearRange'));
      
      monthYearContainer.appendChild(yearRangeText);
    }
    
    // Next button (function depends on view mode)
    const nextBtn = document.createElement('button');
    nextBtn.className = 'date-picker-nav-btn';
    
    switch (viewMode) {
      case CalendarViewMode.DAYS:
        nextBtn.setAttribute('aria-label', i18nService.translate('nextMonth'));
        nextBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          eventHandlers.onNextMonth();
        });
        break;
      case CalendarViewMode.MONTHS:
        nextBtn.setAttribute('aria-label', i18nService.translate('nextYear'));
        nextBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.navigateYearView(container, year + 1, month, selectedDate, focusedDate, isOpen, i18nService, calendarService, eventHandlers);
        });
        break;
      case CalendarViewMode.YEARS:
        const yearRange = this.getYearRange(year);
        nextBtn.setAttribute('aria-label', i18nService.translate('nextYearRange'));
        nextBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.navigateYearRangeView(container, yearRange.end + 1, month, selectedDate, focusedDate, isOpen, i18nService, calendarService, eventHandlers);
        });
        break;
    }
    
    const nextIcon = document.createElement('span');
    nextIcon.className = 'material-icons';
    nextIcon.textContent = 'chevron_right';
    nextBtn.appendChild(nextIcon);
    
    // Add elements to header
    header.appendChild(prevBtn);
    header.appendChild(monthYearContainer);
    header.appendChild(nextBtn);
    content.appendChild(header);
    
    // Create calendar grid based on view mode
    switch (viewMode) {
      case CalendarViewMode.DAYS:
        content.appendChild(this.createDaysView(year, month, selectedDate, focusedDate, i18nService, calendarService, eventHandlers));
        break;
      case CalendarViewMode.MONTHS:
        content.appendChild(this.createMonthsView(year, month, selectedDate, container, focusedDate, isOpen, i18nService, calendarService, eventHandlers));
        break;
      case CalendarViewMode.YEARS:
        content.appendChild(this.createYearsView(year, month, selectedDate, container, focusedDate, isOpen, i18nService, calendarService, eventHandlers));
        break;
    }
    
    // Create footer with appropriate buttons for the view mode
    if (viewMode === CalendarViewMode.DAYS) {
      const footer = this.createFooter(selectedDate, i18nService, eventHandlers);
      content.appendChild(footer);
    } else {
      // For month and year views, add a cancel button to return to day view
      const footer = document.createElement('div');
      footer.className = 'date-picker-footer';
      
      const cancelBtn = document.createElement('button');
      cancelBtn.className = 'date-picker-btn primary';
      cancelBtn.textContent = i18nService.translate('cancel');
      cancelBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        // Return directly to day view
        this.renderCalendarDialog(
          container,
          year,
          month,
          selectedDate,
          focusedDate,
          isOpen,
          i18nService,
          calendarService,
          eventHandlers,
          CalendarViewMode.DAYS
        );
      });
      
      footer.appendChild(cancelBtn);
      content.appendChild(footer);
    }
    
    // Update the dialog content
    dialog.innerHTML = '';
    dialog.appendChild(content);
  }
  
  /**
   * Create days view (standard calendar view)
   */
  private createDaysView(
    year: number,
    month: number,
    selectedDate: Date | null,
    focusedDate: Date,
    i18nService: InternationalizationService,
    calendarService: CalendarService,
    eventHandlers: any
  ): HTMLElement {
    // Create calendar grid
    const calendar = document.createElement('div');
    calendar.className = 'date-picker-calendar';
    
    // Add weekday headers
    const weekdaysRow = document.createElement('div');
    weekdaysRow.className = 'date-picker-row date-picker-weekdays';
    
    const firstDayOfWeek = calendarService.getFirstDayOfWeekValue();
    
    for (let i = 0; i < 7; i++) {
      const dayIndex = (i + firstDayOfWeek) % 7;
      const weekdayCell = document.createElement('div');
      weekdayCell.className = 'date-picker-cell weekday';
      weekdayCell.textContent = i18nService.formatWeekdayNarrow(dayIndex);
      weekdaysRow.appendChild(weekdayCell);
    }
    
    calendar.appendChild(weekdaysRow);
    
    // Generate calendar days
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    
    // Calculate first day to display
    let firstDayToDisplay = new Date(firstDayOfMonth);
    const dayOfWeek = firstDayOfMonth.getDay();
    const diff = (dayOfWeek - firstDayOfWeek + 7) % 7;
    firstDayToDisplay.setDate(firstDayOfMonth.getDate() - diff);
    
    // Generate 6 weeks to ensure we always display enough days
    const weeks = 6;
    
    for (let week = 0; week < weeks; week++) {
      const weekRow = document.createElement('div');
      weekRow.className = 'date-picker-row';
      
      for (let day = 0; day < 7; day++) {
        const currentDate = new Date(firstDayToDisplay);
        currentDate.setDate(firstDayToDisplay.getDate() + (week * 7) + day);
        
        const dayCell = document.createElement('div');
        dayCell.className = 'date-picker-cell';
        dayCell.textContent = currentDate.getDate().toString();
        
        const isFocused = currentDate.getDate() === focusedDate.getDate() && 
                          currentDate.getMonth() === focusedDate.getMonth() && 
                          currentDate.getFullYear() === focusedDate.getFullYear();
        
        if (isFocused) {
          dayCell.tabIndex = 0;
          dayCell.classList.add('focused');
        } else {
          dayCell.tabIndex = -1;
        }
        
        if (currentDate.getMonth() !== month) {
          dayCell.classList.add(currentDate < firstDayOfMonth ? 'prev-month' : 'next-month');
          if (!calendarService.isDateDisabled(currentDate)) {
            const exactYear = currentDate.getFullYear();
            const exactMonth = currentDate.getMonth();
            const exactDay = currentDate.getDate();
            
            dayCell.addEventListener('click', (e) => {
              e.stopPropagation();
              eventHandlers.onSelectDate(new Date(exactYear, exactMonth, exactDay));
            });
          }
        } else if (calendarService.isDateDisabled(currentDate)) {
          dayCell.classList.add('disabled');
          dayCell.setAttribute('aria-disabled', 'true');
        } else {
          const exactYear = currentDate.getFullYear();
          const exactMonth = currentDate.getMonth();
          const exactDay = currentDate.getDate();
          
          dayCell.addEventListener('click', (e) => {
            e.stopPropagation();
            eventHandlers.onSelectDate(new Date(exactYear, exactMonth, exactDay));
          });
        }
        
        if (selectedDate && 
            currentDate.getDate() === selectedDate.getDate() && 
            currentDate.getMonth() === selectedDate.getMonth() && 
            currentDate.getFullYear() === selectedDate.getFullYear()) {
          dayCell.classList.add('selected');
        }
        
        if (currentDate.getDate() === today.getDate() && 
            currentDate.getMonth() === today.getMonth() && 
            currentDate.getFullYear() === today.getFullYear()) {
          dayCell.classList.add('today');
        }
        
        const dateKey = calendarService.formatDate(currentDate);
        const events = calendarService.getEvents(dateKey);
        
        if (events && events.length > 0) {
          const indicator = document.createElement('span');
          indicator.className = 'event-indicator';
          dayCell.appendChild(indicator);
          
          dayCell.setAttribute('aria-label', `${currentDate.getDate()}, ${events.length} ${
            events.length === 1 ? i18nService.translate('event') : i18nService.translate('events')
          }`);
        } else {
          dayCell.setAttribute('aria-label', currentDate.getDate().toString());
        }
        
        weekRow.appendChild(dayCell);
      }
      
      calendar.appendChild(weekRow);
    }
    
    return calendar;
  }
  
  /**
   * Create months view (month picker)
   */
  private createMonthsView(
    year: number,
    currentMonth: number,
    selectedDate: Date | null,
    container: HTMLElement,
    focusedDate: Date,
    isOpen: boolean,
    i18nService: InternationalizationService,
    calendarService: CalendarService,
    eventHandlers: any
  ): HTMLElement {
    const monthsGrid = document.createElement('div');
    monthsGrid.className = 'date-picker-months-grid';
    
    for (let row = 0; row < 4; row++) {
      const monthRow = document.createElement('div');
      monthRow.className = 'date-picker-row';
      
      for (let col = 0; col < 3; col++) {
        const monthIndex = row * 3 + col;
        const monthCell = document.createElement('div');
        monthCell.className = 'date-picker-cell month-cell';
        monthCell.textContent = i18nService.getMonthName(monthIndex, true);
        
        if (monthIndex === currentMonth) {
          monthCell.classList.add('current');
        }
        
        if (selectedDate && monthIndex === selectedDate.getMonth() && year === selectedDate.getFullYear()) {
          monthCell.classList.add('selected');
        }
        
        monthCell.addEventListener('click', (e) => {
          e.stopPropagation();
          // When selecting a month, return to days view with the selected month
          this.renderCalendarDialog(
            container,
            year,
            monthIndex,
            selectedDate,
            new Date(year, monthIndex, 1), // Set focused date to the first day of the selected month
            isOpen,
            i18nService,
            calendarService,
            eventHandlers,
            CalendarViewMode.DAYS
          );
        });
        
        monthCell.setAttribute('role', 'button');
        monthCell.setAttribute('aria-label', i18nService.getMonthName(monthIndex, false));
        
        monthRow.appendChild(monthCell);
      }
      
      monthsGrid.appendChild(monthRow);
    }
    
    return monthsGrid;
  }
  
  /**
   * Create years view (year picker)
   */
  private createYearsView(
    year: number,
    currentMonth: number,
    selectedDate: Date | null,
    container: HTMLElement,
    focusedDate: Date,
    isOpen: boolean,
    i18nService: InternationalizationService,
    calendarService: CalendarService,
    eventHandlers: any
  ): HTMLElement {
    const yearsGrid = document.createElement('div');
    yearsGrid.className = 'date-picker-years-grid';
    
    const yearRange = this.getYearRange(year);
    
    for (let row = 0; row < 4; row++) {
      const yearRow = document.createElement('div');
      yearRow.className = 'date-picker-row';
      
      for (let col = 0; col < 3; col++) {
        const index = row * 3 + col;
        const yearValue = yearRange.start + index;
        
        const yearCell = document.createElement('div');
        yearCell.className = 'date-picker-cell year-cell';
        yearCell.textContent = yearValue.toString();
        
        if (yearValue === new Date().getFullYear()) {
          yearCell.classList.add('today');
        }
        
        if (selectedDate && yearValue === selectedDate.getFullYear()) {
          yearCell.classList.add('selected');
        }
        
        if (yearValue === year) {
          yearCell.classList.add('current');
        }
        
        yearCell.addEventListener('click', (e) => {
          e.stopPropagation();
          // When selecting a year, return directly to days view with the selected year
          this.renderCalendarDialog(
            container,
            yearValue,
            currentMonth,
            selectedDate,
            new Date(yearValue, currentMonth, 1), // Set focused date to the first day of the current month in selected year
            isOpen,
            i18nService,
            calendarService,
            eventHandlers,
            CalendarViewMode.DAYS
          );
        });
        
        yearCell.setAttribute('role', 'button');
        yearCell.setAttribute('aria-label', yearValue.toString());
        
        yearRow.appendChild(yearCell);
      }
      
      yearsGrid.appendChild(yearRow);
    }
    
    return yearsGrid;
  }
  
  /**
   * Helper method to get the range of years to display
   */
  private getYearRange(currentYear: number): { start: number, end: number } {
    const start = Math.floor(currentYear / 12) * 12;
    const end = start + 11;
    
    return { start, end };
  }
  
  /**
   * Navigate year view
   */
  private navigateYearView(
    container: HTMLElement,
    year: number,
    month: number,
    selectedDate: Date | null,
    focusedDate: Date,
    isOpen: boolean,
    i18nService: InternationalizationService,
    calendarService: CalendarService,
    eventHandlers: any
  ): void {
    this.renderCalendarDialog(
      container,
      year,
      month,
      selectedDate,
      focusedDate,
      isOpen,
      i18nService,
      calendarService,
      eventHandlers,
      CalendarViewMode.MONTHS
    );
  }
  
  /**
   * Navigate year range view
   */
  private navigateYearRangeView(
    container: HTMLElement,
    year: number,
    month: number,
    selectedDate: Date | null,
    focusedDate: Date,
    isOpen: boolean,
    i18nService: InternationalizationService,
    calendarService: CalendarService,
    eventHandlers: any
  ): void {
    this.renderCalendarDialog(
      container,
      year,
      month,
      selectedDate,
      focusedDate,
      isOpen,
      i18nService,
      calendarService,
      eventHandlers,
      CalendarViewMode.YEARS
    );
  }
  
  /**
   * Convenience method to render month view
   */
  renderMonthView(
    container: HTMLElement,
    year: number,
    month: number,
    selectedDate: Date | null,
    focusedDate: Date,
    isOpen: boolean,
    i18nService: InternationalizationService,
    calendarService: CalendarService,
    eventHandlers: any
  ): void {
    this.renderCalendarDialog(
      container,
      year,
      month,
      selectedDate,
      focusedDate,
      isOpen,
      i18nService,
      calendarService,
      eventHandlers,
      CalendarViewMode.MONTHS
    );
  }
  
  /**
   * Convenience method to render year view
   */
  renderYearView(
    container: HTMLElement,
    year: number,
    month: number,
    selectedDate: Date | null,
    focusedDate: Date,
    isOpen: boolean,
    i18nService: InternationalizationService,
    calendarService: CalendarService,
    eventHandlers: any
  ): void {
    this.renderCalendarDialog(
      container,
      year,
      month,
      selectedDate,
      focusedDate,
      isOpen,
      i18nService,
      calendarService,
      eventHandlers,
      CalendarViewMode.YEARS
    );
  }
  
  /**
   * Create footer element with action buttons
   */
  private createFooter(
    selectedDate: Date | null,
    i18nService: InternationalizationService,
    eventHandlers: any
  ): HTMLElement {
    const footer = document.createElement('div');
    footer.className = 'date-picker-footer';
    
    const selectedDateText = document.createElement('div');
    selectedDateText.className = 'date-picker-selected-date';
    
    if (selectedDate) {
      selectedDateText.textContent = `${i18nService.translate('selected')}: ${i18nService.formatDate(selectedDate)}`;
    }
    
    footer.appendChild(selectedDateText);
    
    const buttons = document.createElement('div');
    buttons.className = 'date-picker-buttons';
    
    const todayBtn = document.createElement('button');
    todayBtn.className = 'date-picker-btn';
    todayBtn.textContent = i18nService.translate('today');
    todayBtn.addEventListener('click', eventHandlers.onToday);
    
    const clearBtn = document.createElement('button');
    clearBtn.className = 'date-picker-btn';
    clearBtn.textContent = i18nService.translate('clear');
    clearBtn.addEventListener('click', eventHandlers.onClear);
    
    const closeBtn = document.createElement('button');
    closeBtn.className = 'date-picker-btn primary';
    closeBtn.textContent = i18nService.translate('close');
    closeBtn.addEventListener('click', eventHandlers.onClose);
    
    buttons.appendChild(todayBtn);
    buttons.appendChild(clearBtn);
    buttons.appendChild(closeBtn);
    
    footer.appendChild(buttons);
    
    return footer;
  }
  
  /**
   * Update the input field value
   */
  updateInputValue(
    container: HTMLElement,
    date: Date | null,
    i18nService: InternationalizationService
  ): void {
    const input = this.getInputField(container);
    if (!input) return;
    
    if (date) {
      input.value = i18nService.formatDate(date);
    } else {
      input.value = '';
    }
  }
  
  /**
   * Focus on a date cell
   */
  focusDateCell(
    dialog: HTMLElement,
    date: Date,
    calendarService: CalendarService
  ): void {
    const cells = dialog.querySelectorAll('.date-picker-cell:not(.weekday):not(.month-cell):not(.year-cell)');
    
    if (calendarService.isDateDisabled(date)) {
      return;
    }
    
    for (const cell of Array.from(cells)) {
      const cellElement = cell as HTMLElement;
      const ariaLabel = cellElement.getAttribute('aria-label');
      
      if (ariaLabel && ariaLabel.startsWith(date.getDate().toString())) {
        cells.forEach(c => (c as HTMLElement).tabIndex = -1);
        cellElement.tabIndex = 0;
        
        cells.forEach(c => c.classList.remove('focused'));
        cellElement.classList.add('focused');
        
        cellElement.focus();
        break;
      }
    }
  }
  
  /**
   * Get the dialog element
   */
  getDialog(container: HTMLElement): HTMLElement | null {
    return container.querySelector('.date-picker-dialog');
  }
  
  /**
   * Get the input field
   */
  getInputField(container: HTMLElement): HTMLInputElement | null {
    return container.querySelector('.date-picker-input');
  }
}