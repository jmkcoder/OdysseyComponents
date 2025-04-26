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
    
    // Generate calendar grid
    let calendarContent = '<div class="date-picker-row date-picker-weekdays">';
    
    // Add weekday headers
    for (let i = 0; i < 7; i++) {
      const weekdayIndex = (firstDayOfWeek + i) % 7;
      const weekdayName = this.config.formatter.getWeekdayName(weekdayIndex, 'short', this.config.locale);
      calendarContent += `<div class="date-picker-cell weekday">${weekdayName}</div>`;
    }
    calendarContent += '</div>';
    
    // Create date grid (6 rows max)
    let currentDate = new Date(firstDisplayDay);
    
    for (let row = 0; row < 6; row++) {
      calendarContent += '<div class="date-picker-row">';
      
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
        if (isPrevMonth) cellClass += ' prev-month';
        if (isNextMonth) cellClass += ' next-month';
        if (hasEvents) cellClass += ' has-events';
        if (isRangeStart) cellClass += ' range-start';
        if (isRangeEnd) cellClass += ' range-end';
        if (isInRange) cellClass += ' in-range';
        if (isDisabled) cellClass += ' disabled';
        
        // Generate the date cell
        calendarContent += `
          <div 
            class="${cellClass}" 
            tabindex="0" 
            data-date="${this.formatDate(currentDate, 'yyyy-MM-dd')}">
            ${currentDate.getDate()}
            ${hasEvents ? '<span class="event-indicator"></span>' : ''}
          </div>
        `;
        
        // Move to next day
        currentDate.setDate(currentDate.getDate() + 1);
      }
      
      calendarContent += '</div>';
    }
    
    container.innerHTML = calendarContent;
    this.attachEventListeners(container);
  }
  
  private attachEventListeners(container: HTMLElement): void {
    const dateCells = container.querySelectorAll('.date-picker-cell:not(.weekday)');
    dateCells.forEach(cell => {
      if (!(cell as HTMLElement).classList.contains('disabled')) {
        cell.addEventListener('click', (e) => {
          e.stopPropagation(); // Prevent event from closing calendar
          const dateStr = (cell as HTMLElement).dataset.date;
          if (dateStr) {
            const clickedDate = this.config.formatter.parse(dateStr);
            this.callbacks.onDateSelect(clickedDate);
          }
        });
      }
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
