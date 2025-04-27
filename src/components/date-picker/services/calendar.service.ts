// Calendar Service for the date-picker component
import { areDatesEqual } from '../../../utilities/date-utils';

export interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  isDisabled: boolean;
  hasEvents: boolean;
}

export interface CalendarServiceOptions {
  firstDayOfWeek: number; // 0 = Sunday, 1 = Monday, etc.
  locale: string;
  minDate: Date | null;
  maxDate: Date | null;
  disabledDates: Date[];
  disabledDaysOfWeek: number[];
}

export class CalendarService {
  private options: CalendarServiceOptions;
  private events: { [key: string]: string[] } = {};

  constructor(options: CalendarServiceOptions) {
    this.options = {
      ...options
    };
  }

  /**
   * Gets the first day of week value (0-6)
   */
  getFirstDayOfWeekValue(): number {
    return this.options.firstDayOfWeek;
  }

  /**
   * Formats a date as YYYY-MM-DD string
   */
  private formatDateKey(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  /**
   * Returns a matrix of calendar days for a specific month
   * @param year The year
   * @param month The month (0-11)
   * @param selectedDate Optional selected date
   * @returns A 6x7 matrix representing weeks and days
   */
  getMonthData(year: number, month: number, selectedDate?: Date): CalendarDay[][] {
    const result: CalendarDay[][] = [];
    const today = new Date();
    
    // First day of the month
    const firstDayOfMonth = new Date(year, month, 1);
    
    // Last day of the month
    const lastDayOfMonth = new Date(year, month + 1, 0);
    
    // First day of the calendar grid (might be from previous month)
    const firstDayOfCalendar = this.getFirstDayOfCalendarGrid(firstDayOfMonth);
    
    // Create the calendar grid (6 weeks x 7 days)
    let currentDate = new Date(firstDayOfCalendar);
    
    for (let week = 0; week < 6; week++) {
      const weekDays: CalendarDay[] = [];
      
      for (let day = 0; day < 7; day++) {
        const isCurrentMonth = currentDate.getMonth() === month;
        const dateKey = this.formatDateKey(currentDate);
        
        weekDays.push({
          date: new Date(currentDate),
          isCurrentMonth,
          isToday: this.isSameDay(currentDate, today),
          isSelected: selectedDate ? this.isSameDay(currentDate, selectedDate) : false,
          isDisabled: this.isDateDisabled(currentDate),
          hasEvents: this.hasEvents(dateKey)
        });
        
        // Move to next day
        currentDate.setDate(currentDate.getDate() + 1);
      }
      
      result.push(weekDays);
    }
    
    return result;
  }

  /**
   * Get the first day that should appear on the calendar grid
   */
  private getFirstDayOfCalendarGrid(firstDayOfMonth: Date): Date {
    const firstDayOfWeek = this.options.firstDayOfWeek;
    const firstDay = new Date(firstDayOfMonth);
    const dayOfWeek = firstDayOfMonth.getDay();
    
    // Calculate how many days we need to go back
    const diff = (dayOfWeek - firstDayOfWeek + 7) % 7;
    firstDay.setDate(firstDayOfMonth.getDate() - diff);
    
    return firstDay;
  }

  /**
   * Checks if two dates represent the same day
   */
  private isSameDay(date1: Date, date2: Date): boolean {
    return areDatesEqual(date1, date2);
  }

  /**
   * Get the list of localized weekday names
   */
  getWeekdays(): string[] {
    const weekdays = [];
    const date = new Date(2021, 0, 3); // Use a Sunday as reference
    
    // Start with the configured first day of the week
    let dayIndex = this.options.firstDayOfWeek;
    
    // Generate 7 days starting from the first day of the week
    for (let i = 0; i < 7; i++) {
      date.setDate(3 + ((dayIndex + i) % 7));
      const formatter = new Intl.DateTimeFormat(this.options.locale, { weekday: 'short' });
      weekdays.push(formatter.format(date));
    }
    
    return weekdays;
  }

  /**
   * Get the localized name of a month
   */
  getMonthName(monthIndex: number): string {
    const date = new Date(2021, monthIndex, 1);
    return new Intl.DateTimeFormat(this.options.locale, { month: 'long' }).format(date);
  }

  /**
   * Get all localized month names
   */
  getMonthNames(): string[] {
    return Array.from({ length: 12 }, (_, i) => this.getMonthName(i));
  }

  /**
   * Get the first day of the week containing the given date
   */
  getFirstDayOfWeek(date: Date): Date {
    const result = new Date(date);
    const day = date.getDay();
    const diff = (day - this.options.firstDayOfWeek + 7) % 7;
    result.setDate(date.getDate() - diff);
    return result;
  }

  /**
   * Get the last day of the week containing the given date
   */
  getLastDayOfWeek(date: Date): Date {
    const firstDay = this.getFirstDayOfWeek(date);
    const result = new Date(firstDay);
    result.setDate(firstDay.getDate() + 6);
    return result;
  }

  /**
   * Create an array of dates from start to end (inclusive)
   */
  createDateRange(start: Date, end: Date): Date[] {
    const result: Date[] = [];
    
    // Ensure start date is before end date
    let startDate = new Date(start);
    let endDate = new Date(end);
    
    if (startDate > endDate) {
      [startDate, endDate] = [endDate, startDate];
    }
    
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      result.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return result;
  }

  /**
   * Check if a date is disabled based on the calendar options
   */
  isDateDisabled(date: Date): boolean {
    // Check min date
    if (this.options.minDate && date < this.options.minDate) {
      return true;
    }
    
    // Check max date
    if (this.options.maxDate && date > this.options.maxDate) {
      return true;
    }
    
    // Check disabled days of week
    if (this.options.disabledDaysOfWeek.includes(date.getDay())) {
      return true;
    }
    
    // Check specifically disabled dates
    return this.options.disabledDates.some(disabledDate => 
      this.isSameDay(date, disabledDate)
    );
  }

  /**
   * Add events to specific dates
   */
  addEvents(eventsMap: { [dateKey: string]: string[] }): void {
    for (const dateKey in eventsMap) {
      if (!this.events[dateKey]) {
        this.events[dateKey] = [];
      }
      this.events[dateKey].push(...eventsMap[dateKey]);
    }
  }

  /**
   * Check if a date has events
   */
  hasEvents(dateKey: string): boolean {
    return !!this.events[dateKey] && this.events[dateKey].length > 0;
  }

  /**
   * Get events for a specific date
   */
  getEvents(dateKey: string): string[] {
    return this.events[dateKey] || [];
  }

  /**
   * Remove all events for a specific date
   */
  removeEvents(dateKey: string): void {
    delete this.events[dateKey];
  }

  /**
   * Clear all events
   */
  clearEvents(): void {
    this.events = {};
  }

  /**
   * Get all events as an object
   */
  getEventsAsObject(): { [dateKey: string]: string[] } {
    return { ...this.events };
  }
}