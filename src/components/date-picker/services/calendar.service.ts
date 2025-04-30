// Calendar Service for the date-picker component
import { areDatesEqual } from '../../../utilities/date-utils';
import { DateFormatter } from './date-formatter.service';

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
  private dateFormatter: DateFormatter;

  constructor(options: Partial<CalendarServiceOptions> = {}) {
    this.options = {
      firstDayOfWeek: 0,
      locale: 'en-US',
      minDate: null,
      maxDate: null,
      disabledDates: [],
      disabledDaysOfWeek: [],
      ...options
    };
    
    // Initialize date formatter
    this.dateFormatter = new DateFormatter(this.options.locale);
  }

  /**
   * Gets the first day of week value (0-6)
   */
  getFirstDayOfWeekValue(): number {
    return this.options.firstDayOfWeek;
  }

  /**
   * Sets the first day of the week
   */
  setFirstDayOfWeek(dayIndex: number): void {
    this.options.firstDayOfWeek = dayIndex;
  }

  /**
   * Formats a date as YYYY-MM-DD string
   */
  private formatDateKey(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  /**
   * Format date according to specified format
   */
  formatDate(date: Date | null, format: string = 'yyyy-mm-dd', locale?: string): string {
    if (!date) return '';
    
    const localeToUse = locale || this.options.locale;
    
    // Simple formatting implementation
    switch (format.toLowerCase()) {
      case 'yyyy-mm-dd':
        return this.formatDateKey(date);
      case 'mmmm yyyy':
        return new Intl.DateTimeFormat(localeToUse, { month: 'long', year: 'numeric' }).format(date);
      case 'mmm yyyy':
        return new Intl.DateTimeFormat(localeToUse, { month: 'short', year: 'numeric' }).format(date);
      case 'mmm':
        return new Intl.DateTimeFormat(localeToUse, { month: 'short' }).format(date);
      case 'yyyy':
        return date.getFullYear().toString();
      default:
        return new Intl.DateTimeFormat(localeToUse).format(date);
    }
  }

  /**
   * Parse a string date into a Date object
   * @param dateString The date string or Date object to parse
   * @param format Optional format string to use for parsing
   * @returns A Date object or null if parsing fails
   */
  parseDate(dateString: string | Date, format?: string): Date | null {
    if (!dateString) return null;
    if (dateString instanceof Date) return new Date(dateString);
    
    try {
      // Use the DateFormatter for consistent parsing across the application
      return this.dateFormatter.parse(dateString, format);
    } catch (e) {
      console.error('Error parsing date:', e);
      return null;
    }
  }

  /**
   * Returns a matrix of calendar days for a specific month
   * @param year The year
   * @param month The month (0-11)
   * @param selectedDate Optional selected date
   * @returns A 6x7 matrix representing weeks and days
   */
  getMonthData(year: number, month: number, selectedDate?: Date): CalendarDay[][] {
    // Create date for first day of the month
    const firstDay = new Date(year, month, 1);
    
    // Get the first day that should appear on the calendar grid
    const firstDayOnGrid = this.getFirstDayOfCalendarGrid(firstDay);
    
    // Today's date for highlighting
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Create calendar grid (6 weeks x 7 days)
    const calendarGrid: CalendarDay[][] = [];
    let currentDate = new Date(firstDayOnGrid);
    
    // Create 6 weeks
    for (let week = 0; week < 6; week++) {
      const weekData: CalendarDay[] = [];
      
      // Create 7 days per week
      for (let day = 0; day < 7; day++) {
        const date = new Date(currentDate);
        const isCurrentMonth = date.getMonth() === month;
        const isToday = this.isSameDay(date, today);
        const isSelected = selectedDate ? this.isSameDay(date, selectedDate) : false;
        const isDisabled = this.isDateDisabled(date);
        const hasEvents = this.hasEvents(this.formatDateKey(date));
        
        weekData.push({
          date,
          isCurrentMonth,
          isToday,
          isSelected,
          isDisabled,
          hasEvents
        });
        
        // Move to next day
        currentDate.setDate(currentDate.getDate() + 1);
      }
      
      calendarGrid.push(weekData);
    }
    
    return calendarGrid;
  }

  /**
   * Generate calendar days for a month
   */
  generateCalendarDays(year: number, month: number, selectedDate?: Date): CalendarDay[][] {
    return this.getMonthData(year, month, selectedDate);
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
   * Check if a date is today
   */
  isToday(date: Date): boolean {
    const today = new Date();
    return this.isSameDay(date, today);
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
    if (this.options.minDate) {
      // Set the minDate hours to 0 for consistent comparison
      const minDate = new Date(this.options.minDate);
      minDate.setHours(0, 0, 0, 0);
      
      // Set the check date hours to 0 for consistent comparison
      const checkDate = new Date(date);
      checkDate.setHours(0, 0, 0, 0);
      
      if (checkDate < minDate) return true;
    }
    
    // Check max date
    if (this.options.maxDate) {
      // Set the maxDate hours to 0 for consistent comparison
      const maxDate = new Date(this.options.maxDate);
      maxDate.setHours(0, 0, 0, 0);
      
      // Set the check date hours to 0 for consistent comparison
      const checkDate = new Date(date);
      checkDate.setHours(0, 0, 0, 0);
      
      if (checkDate > maxDate) return true;
    }
    
    // Check disabled days of week
    if (this.options.disabledDaysOfWeek.includes(date.getDay())) {
      return true;
    }
    
    // Check specific disabled dates
    return this.options.disabledDates.some(disabledDate => this.isSameDay(date, disabledDate));
  }

  /**
   * Set minimum selectable date
   */
  setMinDate(date: Date | null): void {
    this.options.minDate = date;
  }

  /**
   * Set maximum selectable date
   */
  setMaxDate(date: Date | null): void {
    this.options.maxDate = date;
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