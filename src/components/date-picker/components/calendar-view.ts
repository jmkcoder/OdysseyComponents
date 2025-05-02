import { IDateFormatter } from '../services/date-formatter';
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
    
    for (let row = 0; row < 6; row++) {
      calendarContent += '<tr class="date-picker-row">';
      
      for (let col = 0; col < 7; col++) {
        const isToday = this.isSameDate(currentDate, new Date());
        const isSelected = this.isSameDate(currentDate, this.config.selectedDate);
        const isPrevMonth = currentDate.getMonth() < month || (currentDate.getMonth() === 11 && month === 0);
        const isNextMonth = currentDate.getMonth() > month || (currentDate.getMonth() === 0 && month === 11);
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
          
        // Build accessibility attributes
        const ariaLabel = this.buildAriaLabel(currentDate, isToday, isSelected, isDisabled, hasEvents, isInRange);
        
        let tabIndex = "0";
        
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
    // Ensure date is not null before formatting
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
    // Add click handlers to date cells
    const dateCells = container.querySelectorAll('.date-picker-cell:not(.weekday)');
    dateCells.forEach(cell => {
      cell.addEventListener('click', (e) => {
        // Don't handle clicks on disabled dates
        if (cell.classList.contains('disabled')) {
          return;
        }
        
        // Get the date from the data-date attribute and call the callback
        const dateValue = cell.getAttribute('data-date');
        if (dateValue) {
          const date = this.config.formatter.parse(dateValue);
          if (date && !isNaN(date.getTime())) {
            e.preventDefault();
            e.stopPropagation();
            
            // Store reference to the clicked cell before potentially re-rendering
            const clickedCell = cell as HTMLElement;
            
            // Call the date selection callback
            this.callbacks.onDateSelect(date);
            
            // Ensure focus is maintained on the cell after selection
            setTimeout(() => {
              // Try to focus the original cell if it's still in the DOM
              if (clickedCell && document.body.contains(clickedCell)) {
                clickedCell.focus();
              } else {
                // If the original cell is no longer available (e.g. due to re-render),
                // find and focus the cell with the same date
                const updatedCell = container.querySelector(`[data-date="${dateValue}"]`) as HTMLElement;
                if (updatedCell) {
                  updatedCell.focus();
                }
              }
            }, 100);
          }
        }
      });
    });
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
