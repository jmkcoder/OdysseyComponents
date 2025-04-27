import { IDateFormatter } from '../services';
import { DateUtils } from '../../../utilities/date-utils';

export interface CalendarViewConfig {
  formatter: IDateFormatter;
  locale: string;
  viewDate: Date;
  selectedDate: Date | null;
  rangeStart: Date | null;
  rangeEnd: Date | null;
  isRangeMode: boolean;
  minDate: Date | null;
  maxDate: Date | null;
  events: Map<string, string[]>;
  firstDayOfWeek: number;
}

export interface CalendarViewCallbacks {
  onDateSelect: (date: Date) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onShowMonthSelector: () => void;
  onShowYearSelector: () => void;
}

export class CalendarView {
  private config: CalendarViewConfig;
  private callbacks: CalendarViewCallbacks;
  
  constructor(config: CalendarViewConfig, callbacks: CalendarViewCallbacks) {
    this.config = config;
    this.callbacks = callbacks;
  }
  
  public render(container: HTMLElement): void {
    const year = this.config.viewDate.getFullYear();
    const month = this.config.viewDate.getMonth();
    
    // Get first day of month and last day of month
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    // Find the first day to display (might be from previous month)
    const firstDayOfWeek = this.config.firstDayOfWeek;
    let firstDisplayDay = new Date(firstDay);
    const firstDayWeekday = firstDay.getDay();
    
    let diff = firstDayWeekday - firstDayOfWeek;
    if (diff < 0) diff += 7;
    firstDisplayDay.setDate(firstDay.getDate() - diff);
    
    // Generate calendar grid - use a proper table for better accessibility
    let calendarContent = `
      <table class="date-picker-table" role="grid" aria-labelledby="date-picker-header-title" tabindex="0">
        <thead>
          <tr class="date-picker-row date-picker-weekdays">
    `;
    
    // Add weekday headers
    for (let i = 0; i < 7; i++) {
      const weekdayIndex = (firstDayOfWeek + i) % 7;
      const weekdayName = this.config.formatter.getWeekdayName(weekdayIndex, 'short', this.config.locale);
      calendarContent += `
        <th class="date-picker-cell weekday" scope="col" abbr="${this.config.formatter.getWeekdayName(weekdayIndex, 'long', this.config.locale)}">${weekdayName}</th>
      `;
    }
    calendarContent += '</tr></thead><tbody>';
    
    // Create date grid (6 rows max)
    let currentDate = new Date(firstDisplayDay);
    
    // Calculate current month display name for aria-label
    const monthName = this.config.formatter.getMonthName(month, 'long', this.config.locale);
    const calendarTitle = `${monthName} ${year}`;
    
    // Find the selected or today date to set initial focus
    const selectedDate = this.config.selectedDate;
    const today = new Date();
    
    // Keep track of the cell that should be initially focusable
    let initialFocusableCell = false;
    let isSelectedOrTodayCellFound = false;
    
    for (let row = 0; row < 6; row++) {
      calendarContent += '<tr class="date-picker-row">';
      
      for (let col = 0; col < 7; col++) {
        const isToday = this.isSameDate(currentDate, new Date());
        const isSelected = this.isSameDate(currentDate, this.config.selectedDate);
        const isPrevMonth = currentDate.getMonth() < month || (currentDate.getMonth() === 11 && month === 0);
        const isNextMonth = currentDate.getMonth() > month || (currentDate.getMonth() === 0 && month === 11);
        const isOtherMonth = isPrevMonth || isNextMonth;
        const hasEvents = this.hasEventsOnDate(currentDate);
        const isRangeStart = this.config.isRangeMode && this.isSameDate(currentDate, this.config.rangeStart);
        const isRangeEnd = this.config.isRangeMode && this.isSameDate(currentDate, this.config.rangeEnd);
        const isInRange = this.config.isRangeMode && this.isDateInRange(currentDate);
        const isDisabled = this.isDateDisabled(currentDate);
        
        // Build CSS classes
        let cellClass = 'date-picker-cell';
        if (isToday) cellClass += ' today';
        if (isSelected && !this.config.isRangeMode) cellClass += ' selected';
        if (isPrevMonth) cellClass += ' prev-month other-month';
        if (isNextMonth) cellClass += ' next-month other-month';
        if (hasEvents) cellClass += ' has-events';
        if (isRangeStart) cellClass += ' range-start';
        if (isRangeEnd) cellClass += ' range-end';
        if (isInRange) cellClass += ' in-range';
        if (isDisabled) cellClass += ' disabled';
        
        // Generate accessible labels
        const day = currentDate.getDate();
        const formattedDate = this.config.formatter.format(currentDate, 'full', this.config.locale);
        const monthLabel = isOtherMonth ? 
          this.config.formatter.getMonthName(currentDate.getMonth(), 'long', this.config.locale) : 
          '';
          
        // Build accessibility attributes
        const ariaLabel = this.buildAriaLabel(currentDate, isToday, isSelected, isDisabled, hasEvents, isInRange);
        
        // Only make one cell focusable with tabindex="0" - either selected or today's date or first available
        // All other cells have tabindex="-1" so they're still focusable via arrow keys but not via tab
        let tabIndex = "-1";
        
        // Make selected date focusable
        if (isSelected && !isDisabled && !isOtherMonth) {
          tabIndex = "0";
          isSelectedOrTodayCellFound = true;
        }
        
        // If no selected date, make today's date focusable
        if (!isSelectedOrTodayCellFound && isToday && !isDisabled && !isOtherMonth) {
          tabIndex = "0";
          isSelectedOrTodayCellFound = true;
        }
        
        // If neither selected nor today's date, make the first available date focusable
        if (!isSelectedOrTodayCellFound && !isDisabled && !isOtherMonth && !initialFocusableCell) {
          tabIndex = "0";
          initialFocusableCell = true;
        }
        
        const dateKey = this.formatDate(currentDate, 'yyyy-MM-dd');
        
        // Generate the date cell - wrap the content in a div for better styling
        calendarContent += `
          <td 
            class="${cellClass}" 
            role="gridcell"
            tabindex="${tabIndex}" 
            aria-label="${ariaLabel}"
            aria-selected="${isSelected || isRangeStart || isRangeEnd ? 'true' : 'false'}"
            ${isDisabled ? 'aria-disabled="true"' : ''}
            data-date="${dateKey}">
            <div class="date-cell-content">
              ${day}
              ${hasEvents ? '<span class="event-indicator"></span>' : ''}
            </div>
          </td>
        `;
        
        // Move to next day
        currentDate.setDate(currentDate.getDate() + 1);
      }
      
      calendarContent += '</tr>';
    }
    
    calendarContent += '</tbody></table>';
    
    container.innerHTML = calendarContent;
    
    // Add title to the calendar for ARIA
    const headerTitle = document.querySelector('.date-picker-header-title');
    if (headerTitle) {
      headerTitle.setAttribute('id', 'date-picker-header-title');
    }
    
    this.attachEventListeners(container);
  }
  
  /**
   * Build an accessible aria-label for a date cell
   */
  private buildAriaLabel(
    date: Date, 
    isToday: boolean,
    isSelected: boolean,
    isDisabled: boolean,
    hasEvents: boolean,
    isInRange: boolean
  ): string {
    const formatter = this.config.formatter;
    const formattedDate = formatter.format(date, 'full', this.config.locale);
    let label = formattedDate;
    
    if (isToday) {
      label += ', Today';
    }
    
    if (isSelected) {
      label += ', Selected';
    }
    
    if (isDisabled) {
      label += ', Unavailable';
    }
    
    if (hasEvents) {
      const events = this.getEventsForDate(date);
      if (events.length > 0) {
        label += `, Has ${events.length} event${events.length > 1 ? 's' : ''}`;
      }
    }
    
    if (isInRange) {
      label += ', In selected range';
    }
    
    return label;
  }
  
  private attachEventListeners(container: HTMLElement): void {
    // Use the same specific selector as in handleDateCellKeyDown to ensure consistency
    const dateCells = container.querySelectorAll('td.date-picker-cell');
    const table = container.querySelector('.date-picker-table');
    
    dateCells.forEach(cell => {
      // Click event for mouse navigation
      cell.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent event from closing calendar
        
        const dateStr = (cell as HTMLElement).dataset.date;
        if (!dateStr || (cell as HTMLElement).classList.contains('disabled')) {
          return; // Skip disabled dates
        }
        
        const clickedDate = this.config.formatter.parse(dateStr);
        this.callbacks.onDateSelect(clickedDate);
        
        // After selection, update the tabindex values to focus the selected cell
        this.updateFocus(container, cell as HTMLElement);
      });
    });
  }
  
  /**
   * Update focus management - make only one cell focusable at a time
   */
  private updateFocus(container: HTMLElement, focusedCell: HTMLElement): void {
    // Reset all cells to tabindex="-1" (focusable with JS but not in tab order)
    const allCells = container.querySelectorAll('td.date-picker-cell');
    allCells.forEach(cell => {
      cell.setAttribute('tabindex', '-1');
    });
    
    // Make the target cell focusable via keyboard
    focusedCell.setAttribute('tabindex', '0');
  }
  
  private formatDate(date: Date, format: string): string {
    return this.config.formatter.format(date, format, this.config.locale);
  }
  
  private isSameDate(date1: Date | null, date2: Date | null): boolean {
    if (!date1 || !date2) return false;
    return DateUtils.isSameDay(date1, date2);
  }
  
  private hasEventsOnDate(date: Date): boolean {
    const dateKey = this.formatDate(date, 'yyyy-MM-dd');
    return this.config.events.has(dateKey) && this.config.events.get(dateKey)!.length > 0;
  }
  
  private getEventsForDate(date: Date): string[] {
    const dateKey = this.formatDate(date, 'yyyy-MM-dd');
    return this.config.events.get(dateKey) || [];
  }
  
  private isDateInRange(date: Date): boolean {
    if (this.isDateDisabled(date)) {
      return false;
    }
    
    if (!this.config.isRangeMode || !this.config.rangeStart) return false;
    if (!this.config.rangeEnd) return false;
    
    return date >= this.config.rangeStart && date <= this.config.rangeEnd;
  }
  
  private isDateDisabled(date: Date): boolean {
    return DateUtils.isDateDisabled(date, this.config.minDate, this.config.maxDate);
  }
}
