import { DateUtils } from '../../../utilities/date-utils';

/**
 * Service for calendar-related calculations and date management
 */
export class CalendarService {
  private _firstDayOfWeek: number = 0; // 0 = Sunday, 1 = Monday, etc.
  private _minDate: Date | null = null;
  private _maxDate: Date | null = null;
  private _events: Map<string, string[]> = new Map();

  /**
   * Get the first day of the week containing the given date
   * @param date Optional date to determine the week
   * @returns Date object for the first day of the week
   */
  getFirstDayOfWeek(date?: Date): Date {
    const targetDate = date ? new Date(date) : new Date();
    const day = targetDate.getDay(); // 0 = Sunday, 6 = Saturday
    const diff = (day - this._firstDayOfWeek + 7) % 7;
    return DateUtils.addDays(targetDate, -diff);
  }

  /**
   * Get the last day of the week containing the given date
   */
  getLastDayOfWeek(date: Date): Date {
    const day = date.getDay(); // 0 = Sunday, 6 = Saturday
    return DateUtils.addDays(date, 6 - day);
  }

  /**
   * Generate an array of dates for a given month to display in the calendar
   */
  generateCalendarDays(year: number, month: number): Date[] {
    const result: Date[] = [];
    const firstDay = new Date(year, month, 1);
    
    // Start from the first day of the week that contains the first day of the month
    let currentDate = this.getFirstDayOfWeek(firstDay);
    
    // Generate 6 weeks (42 days) to ensure we always have enough days
    // This covers all possible month layouts
    for (let i = 0; i < 42; i++) {
      result.push(new Date(currentDate));
      currentDate = DateUtils.addDays(currentDate, 1);
    }
    
    return result;
  }

  /**
   * Check if a date is selectable based on min/max constraints
   */
  isDateSelectable(date: Date, minDate?: Date | null, maxDate?: Date | null): boolean {
    if (minDate && date < minDate) {
      return false;
    }
    if (maxDate && date > maxDate) {
      return false;
    }
    return true;
  }

  /**
   * Set the first day of the week
   */
  setFirstDayOfWeek(day: number): void {
    if (day >= 0 && day <= 6) {
      this._firstDayOfWeek = day;
    }
  }

  /**
   * Get the configured first day of the week value
   * @returns Number from 0 (Sunday) to 6 (Saturday)
   */
  getFirstDayOfWeekValue(): number {
    return this._firstDayOfWeek;
  }

  /**
   * Set the minimum selectable date
   */
  setMinDate(date: Date | null): void {
    if (date) {
      const minDate = new Date(date);
      minDate.setHours(0, 0, 0, 0);
      this._minDate = minDate;
    } else {
      this._minDate = null;
    }
  }

  /**
   * Set the maximum selectable date
   */
  setMaxDate(date: Date | null): void {
    if (date) {
      const maxDate = new Date(date);
      maxDate.setHours(0, 0, 0, 0);
      this._maxDate = maxDate;
    } else {
      this._maxDate = null;
    }
  }

  /**
   * Check if a date is disabled (outside min/max range)
   */
  isDateDisabled(date: Date): boolean {
    return DateUtils.isDateDisabled(date, this._minDate, this._maxDate);
  }

  /**
   * Add events to specific dates
   */
  addEvents(events: Record<string, string[]>): void {
    if (!events) return;
    
    Object.entries(events).forEach(([dateStr, eventsList]) => {
      // Normalize the date string to YYYY-MM-DD
      const date = DateUtils.parseDate(dateStr);
      if (date) {
        const normalizedDateStr = DateUtils.formatDate(date);
        
        // Get existing events or create new array
        const existingEvents = this._events.get(normalizedDateStr) || [];
        
        // Merge and deduplicate events
        const uniqueEvents = Array.from(new Set([...existingEvents, ...eventsList]));
        this._events.set(normalizedDateStr, uniqueEvents);
      }
    });
  }

  /**
   * Remove events from a specific date
   */
  removeEvents(dateStr: string): void {
    const date = DateUtils.parseDate(dateStr);
    if (date) {
      const normalizedDateStr = DateUtils.formatDate(date);
      this._events.delete(normalizedDateStr);
    }
  }

  /**
   * Clear all events
   */
  clearEvents(): void {
    this._events.clear();
  }

  /**
   * Check if a date has events
   */
  hasEvents(dateStr: string): boolean {
    const events = this._events.get(dateStr);
    return !!events && events.length > 0;
  }

  /**
   * Get events for a specific date
   */
  getEvents(dateStr: string): string[] {
    return this._events.get(dateStr) || [];
  }

  /**
   * Get all events as a plain object
   */
  getEventsAsObject(): Record<string, string[]> {
    const eventsObj: Record<string, string[]> = {};
    this._events.forEach((events, date) => {
      eventsObj[date] = events;
    });
    return eventsObj;
  }

  // Provide direct access to DateUtils methods that don't need internal state
  // This allows calling code to continue working without changes
  formatDate = DateUtils.formatDate;
  formatISODate = DateUtils.formatISODate;
  parseDate = DateUtils.parseDate;
  parseISODate = DateUtils.parseISODate;
  isSameDay = DateUtils.isSameDay;
  addDays = DateUtils.addDays;
  addMonths = DateUtils.addMonths;
  getFirstDayOfMonth = DateUtils.getFirstDayOfMonth;
  getLastDayOfMonth = DateUtils.getLastDayOfMonth;
  isToday = DateUtils.isToday;
  isCurrentMonth = DateUtils.isCurrentMonth;
  getToday = DateUtils.getToday;
}