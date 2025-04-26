/**
 * Service for calendar-related calculations and date management
 */
export class CalendarService {
  private _firstDayOfWeek: number = 0; // 0 = Sunday, 1 = Monday, etc.
  private _minDate: Date | null = null;
  private _maxDate: Date | null = null;
  private _events: Map<string, string[]> = new Map();

  /**
   * Format a date as YYYY-MM-DD
   */
  formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Format a date to ISO string (YYYY-MM-DD)
   */
  formatISODate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  /**
   * Parse a date string in YYYY-MM-DD format
   */
  parseDate(dateString: string): Date | null {
    if (!dateString) return null;
    
    // Try to parse the date string
    const parts = dateString.split('-');
    if (parts.length !== 3) return null;
    
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1; // Months are 0-based in JS
    const day = parseInt(parts[2], 10);
    
    if (isNaN(year) || isNaN(month) || isNaN(day)) return null;
    
    const date = new Date(year, month, day);
    
    // Validate the date is valid
    if (date.getFullYear() !== year || date.getMonth() !== month || date.getDate() !== day) {
      return null;
    }
    
    return date;
  }

  /**
   * Parse an ISO date string (YYYY-MM-DD)
   */
  parseISODate(dateString: string): Date | null {
    return this.parseDate(dateString);
  }

  /**
   * Check if two dates are the same (ignoring time)
   */
  isSameDay(date1: Date, date2: Date): boolean {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  }

  /**
   * Add specified number of days to a date
   */
  addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }

  /**
   * Add specified number of months to a date
   */
  addMonths(date: Date, months: number): Date {
    const result = new Date(date);
    result.setMonth(result.getMonth() + months);
    
    // Handle edge case when adding months can skip to the next month
    // For example, Jan 31 + 1 month would be Mar 3 (in non-leap years)
    // We want it to be Feb 28/29 instead
    const originalDate = date.getDate();
    const newDate = result.getDate();
    
    if (originalDate !== newDate) {
      // Set to the last day of the previous month
      result.setDate(0);
    }
    
    return result;
  }

  /**
   * Get the first day of the month for a given date
   */
  getFirstDayOfMonth(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), 1);
  }

  /**
   * Get the last day of the month for a given date
   */
  getLastDayOfMonth(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0);
  }

  /**
   * Get the first day of the week containing the given date
   */
  getFirstDayOfWeek(date: Date): Date {
    const day = date.getDay(); // 0 = Sunday, 6 = Saturday
    return this.addDays(date, -day);
  }

  /**
   * Get the last day of the week containing the given date
   */
  getLastDayOfWeek(date: Date): Date {
    const day = date.getDay(); // 0 = Sunday, 6 = Saturday
    return this.addDays(date, 6 - day);
  }

  /**
   * Generate an array of dates for a given month to display in the calendar
   */
  generateCalendarDays(year: number, month: number): Date[] {
    const result: Date[] = [];
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    // Start from the first day of the week that contains the first day of the month
    let currentDate = this.getFirstDayOfWeek(firstDay);
    
    // Generate 6 weeks (42 days) to ensure we always have enough days
    // This covers all possible month layouts
    for (let i = 0; i < 42; i++) {
      result.push(new Date(currentDate));
      currentDate = this.addDays(currentDate, 1);
    }
    
    return result;
  }

  /**
   * Check if a date is today
   */
  isToday(date: Date): boolean {
    const today = new Date();
    return this.isSameDay(date, today);
  }

  /**
   * Check if a date is in the current month
   */
  isCurrentMonth(date: Date, currentMonth: Date): boolean {
    return (
      date.getMonth() === currentMonth.getMonth() &&
      date.getFullYear() === currentMonth.getFullYear()
    );
  }

  /**
   * Get today's date with time set to midnight
   */
  getToday(): Date {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
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
   * Get the first day of the week
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
    if (!date) return true;
    
    const testDate = new Date(date);
    testDate.setHours(0, 0, 0, 0);
    
    if (this._minDate && testDate < this._minDate) {
      return true;
    }
    
    if (this._maxDate && testDate > this._maxDate) {
      return true;
    }
    
    return false;
  }

  /**
   * Add events to specific dates
   */
  addEvents(events: Record<string, string[]>): void {
    if (!events) return;
    
    Object.entries(events).forEach(([dateStr, eventsList]) => {
      // Normalize the date string to YYYY-MM-DD
      const date = this.parseDate(dateStr);
      if (date) {
        const normalizedDateStr = this.formatDate(date);
        
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
    const date = this.parseDate(dateStr);
    if (date) {
      const normalizedDateStr = this.formatDate(date);
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
}