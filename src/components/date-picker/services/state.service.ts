import { IDateFormatter } from './date-formatter.interface';
import { DateUtils } from '../../../utilities/date-utils';

export type DatePickerViewMode = 'calendar' | 'months' | 'years';
export type DatePickerSelectionMode = 'single' | 'range';

/**
 * Interface for state change listeners
 */
export interface StateChangeListener {
  onStateChange: () => void;
}

/**
 * State service for date picker
 * Manages all state changes and notifies listeners
 */
export class StateService {
  private _selectedDate: Date | null = null;
  private _viewDate: Date = new Date();
  private _isOpen: boolean = false;
  private _currentView: DatePickerViewMode = 'calendar';
  private _events: Map<string, string[]> = new Map();
  private _format: string = 'yyyy-MM-dd';
  private _isRangeMode: boolean = false;
  private _rangeStart: Date | null = null;
  private _rangeEnd: Date | null = null;
  private _rangeSelectionInProgress: boolean = false;
  private _locale: string = navigator.language;
  private _minDate: Date | null = null;
  private _maxDate: Date | null = null;
  private _firstDayOfWeek: number = 0;
  private _disabledDates: Map<string, string> = new Map(); // Store disabled dates with optional reason
  private _disabledWeekdays: Set<number> = new Set(); // Store disabled weekdays (0-6, where 0 is Sunday)
  private _disabledMonths: Set<number> = new Set(); // Store disabled months (0-11, where 0 is January)
  
  private _listeners: StateChangeListener[] = [];
  private _formatter: IDateFormatter;
  
  constructor(formatter: IDateFormatter) {
    this._formatter = formatter;
  }
  
  /**
   * Add state change listener
   */
  public addListener(listener: StateChangeListener): void {
    this._listeners.push(listener);
  }
  
  /**
   * Remove state change listener
   */
  public removeListener(listener: StateChangeListener): void {
    const index = this._listeners.indexOf(listener);
    if (index !== -1) {
      this._listeners.splice(index, 1);
    }
  }
  
  /**
   * Notify all listeners of state change
   */
  private notifyListeners(): void {
    for (const listener of this._listeners) {
      listener.onStateChange();
    }
  }
  
  // Getters
  get selectedDate(): Date | null { return this._selectedDate; }
  get viewDate(): Date { return this._viewDate; }
  get isOpen(): boolean { return this._isOpen; }
  get currentView(): DatePickerViewMode { return this._currentView; }
  get events(): Map<string, string[]> { return this._events; }
  get format(): string { return this._format; }
  get isRangeMode(): boolean { return this._isRangeMode; }
  get rangeStart(): Date | null { return this._rangeStart; }
  get rangeEnd(): Date | null { return this._rangeEnd; }
  get rangeSelectionInProgress(): boolean { return this._rangeSelectionInProgress; }
  get locale(): string { return this._locale; }
  get minDate(): Date | null { return this._minDate; }
  get maxDate(): Date | null { return this._maxDate; }
  get firstDayOfWeek(): number { return this._firstDayOfWeek; }
  
  // Setters with notification
  set selectedDate(value: Date | null) {
    this._selectedDate = value;
    this.notifyListeners();
  }
  
  set viewDate(value: Date) {
    this._viewDate = value;
    this.notifyListeners();
  }
  
  set isOpen(value: boolean) {
    this._isOpen = value;
    this.notifyListeners();
  }
  
  set currentView(value: DatePickerViewMode) {
    this._currentView = value;
    this.notifyListeners();
  }
  
  set format(value: string) {
    this._format = value;
    this.notifyListeners();
  }
  
  set isRangeMode(value: boolean) {
    this._isRangeMode = value;
    this.notifyListeners();
  }
  
  set rangeStart(value: Date | null) {
    this._rangeStart = value;
    this.notifyListeners();
  }
  
  set rangeEnd(value: Date | null) {
    this._rangeEnd = value;
    this.notifyListeners();
  }
  
  set rangeSelectionInProgress(value: boolean) {
    this._rangeSelectionInProgress = value;
    this.notifyListeners();
  }
  
  set locale(value: string) {
    this._locale = value;
    this.notifyListeners();
  }
  
  set minDate(value: Date | null) {
    this._minDate = value;
    this.notifyListeners();
  }
  
  set maxDate(value: Date | null) {
    this._maxDate = value;
    this.notifyListeners();
  }
  
  set firstDayOfWeek(value: number) {
    this._firstDayOfWeek = value;
    this.notifyListeners();
  }
  
  /**
   * Navigation methods
   */
  public navigateToNextPeriod(): void {
    const newViewDate = new Date(this._viewDate);
    
    if (this._currentView === 'calendar') {
      newViewDate.setMonth(newViewDate.getMonth() + 1);
    } else if (this._currentView === 'months') {
      newViewDate.setFullYear(newViewDate.getFullYear() + 1);
    } else if (this._currentView === 'years') {
      newViewDate.setFullYear(newViewDate.getFullYear() + 15);
    }
    
    this.viewDate = newViewDate;
  }
  
  public navigateToPreviousPeriod(): void {
    const newViewDate = new Date(this._viewDate);
    
    if (this._currentView === 'calendar') {
      newViewDate.setMonth(newViewDate.getMonth() - 1);
    } else if (this._currentView === 'months') {
      newViewDate.setFullYear(newViewDate.getFullYear() - 1);
    } else if (this._currentView === 'years') {
      newViewDate.setFullYear(newViewDate.getFullYear() - 15);
    }
    
    this.viewDate = newViewDate;
  }
  
  /**
   * Event handling methods
   */
  public addEvent(date: Date, eventName: string): void {
    const dateKey = this._formatter.format(date, 'yyyy-MM-dd');
    
    if (!this._events.has(dateKey)) {
      this._events.set(dateKey, []);
    }
    
    this._events.get(dateKey)!.push(eventName);
    this.notifyListeners();
  }
  
  public clearEvents(date: Date): void {
    const dateKey = this._formatter.format(date, 'yyyy-MM-dd');
    this._events.delete(dateKey);
    this.notifyListeners();
  }
  
  /**
   * Get events for a specific date
   * @param dateKey Date key in yyyy-MM-dd format
   * @returns Array of event strings for the date or empty array if none
   */
  public getEvents(dateKey: string): string[] {
    return this._events.get(dateKey) || [];
  }
  
  /**
   * Date selection methods
   */
  public resetRangeSelection(): void {
    this._rangeStart = null;
    this._rangeEnd = null;
    this._rangeSelectionInProgress = false;
    this.notifyListeners();
  }
  
  public selectSingleDate(date: Date): void {
    if (!this.isDateDisabled(date)) {
      this._selectedDate = date;
      this.notifyListeners();
    }
  }
  
  public selectRangeDate(date: Date): void {
    // Check if date is disabled
    if (this.isDateDisabled(date)) {
      return;
    }
    
    if (!this._rangeSelectionInProgress) {
      this.resetRangeSelection();
      this._rangeStart = date;
      this._rangeSelectionInProgress = true;
    } else {
      if (this.isSameDate(date, this._rangeStart!)) {
        this._rangeEnd = new Date(this._rangeStart!);
        this._rangeSelectionInProgress = false;
      } else {
        if (date < this._rangeStart!) {
          this._rangeEnd = new Date(this._rangeStart!);
          this._rangeStart = date;
        } else {
          this._rangeEnd = date;
        }
        this._rangeSelectionInProgress = false;
      }
    }
    
    this.notifyListeners();
  }
  
  /**
   * Utility methods
   */
  public isDateDisabled(date: Date): boolean {
    // First check min/max dates using DateUtils
    const isDisabledByMinMax = DateUtils.isDateDisabled(date, this._minDate, this._maxDate);
    if (isDisabledByMinMax) {
      return true;
    }
    
    // Check if date's weekday is disabled
    if (this._disabledWeekdays.has(date.getDay())) {
      return true;
    }
    
    // Check if date's month is disabled
    if (this._disabledMonths.has(date.getMonth())) {
      return true;
    }
    
    // Check if date is in custom disabled dates
    const dateKey = this._formatter.format(date, 'yyyy-MM-dd');
    if (this._disabledDates.has(dateKey)) {
      return true;
    }
    
    return false;
  }
  
  public isSameDate(date1: Date | null, date2: Date | null): boolean {
    if (!date1 || !date2) return false;
    return DateUtils.isSameDay(date1, date2);
  }
  
  public hasEventsOnDate(date: Date): boolean {
    const dateKey = this._formatter.format(date, 'yyyy-MM-dd');
    return this._events.has(dateKey) && this._events.get(dateKey)!.length > 0;
  }
  
  public isDateInRange(date: Date): boolean {
    if (!this._isRangeMode || !this._rangeStart || !this._rangeEnd) return false;
    if (this.isDateDisabled(date)) return false;
    
    return date >= this._rangeStart && date <= this._rangeEnd;
  }

  /**
   * Add a disabled date
   * @param date The date to disable
   * @param reason Optional reason for disabling (e.g., "Public Holiday - Christmas")
   */
  public addDisabledDate(date: Date, reason: string = ''): void {
    const dateKey = this._formatter.format(date, 'yyyy-MM-dd');
    this._disabledDates.set(dateKey, reason);
    this.notifyListeners();
  }

  /**
   * Remove a disabled date
   * @param date The date to enable
   */
  public removeDisabledDate(date: Date): void {
    const dateKey = this._formatter.format(date, 'yyyy-MM-dd');
    this._disabledDates.delete(dateKey);
    this.notifyListeners();
  }

  /**
   * Add multiple disabled dates at once
   * @param dates Array of dates to disable
   * @param reason Optional shared reason for all dates
   */
  public addDisabledDates(dates: Date[], reason: string = ''): void {
    dates.forEach(date => this.addDisabledDate(date, reason));
  }

  /**
   * Clear all disabled dates
   */
  public clearDisabledDates(): void {
    this._disabledDates.clear();
    this.notifyListeners();
  }

  /**
   * Get whether a date has a custom disabled reason
   * @param date The date to check
   * @returns The reason string or null if not disabled
   */
  public getDisabledDateReason(date: Date): string | null {
    // Check min/max date constraints first
    if (this._minDate && date < this._minDate) {
      return "Before minimum allowed date";
    }
    
    if (this._maxDate && date > this._maxDate) {
      return "After maximum allowed date";
    }
    
    // Check if weekday is disabled
    if (this._disabledWeekdays.has(date.getDay())) {
      const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      return `Disabled weekday (${weekdays[date.getDay()]})`;
    }
    
    // Check if month is disabled
    if (this._disabledMonths.has(date.getMonth())) {
      const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                      'July', 'August', 'September', 'October', 'November', 'December'];
      return `Disabled month (${months[date.getMonth()]})`;
    }
    
    // Check if specific date is disabled with reason
    const dateKey = this._formatter.format(date, 'yyyy-MM-dd');
    return this._disabledDates.has(dateKey) ? this._disabledDates.get(dateKey)! : null;
  }

  /**
   * Add a disabled weekday (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
   * @param weekday The weekday to disable (0-6)
   */
  public addDisabledWeekday(weekday: number): void {
    if (weekday >= 0 && weekday <= 6) {
      this._disabledWeekdays.add(weekday);
      this.notifyListeners();
    }
  }

  /**
   * Remove a disabled weekday
   * @param weekday The weekday to enable (0-6)
   */
  public removeDisabledWeekday(weekday: number): void {
    this._disabledWeekdays.delete(weekday);
    this.notifyListeners();
  }

  /**
   * Add multiple disabled weekdays at once
   * @param weekdays Array of weekdays to disable (0-6)
   */
  public addDisabledWeekdays(weekdays: number[]): void {
    weekdays.forEach(weekday => {
      if (weekday >= 0 && weekday <= 6) {
        this._disabledWeekdays.add(weekday);
      }
    });
    this.notifyListeners();
  }

  /**
   * Clear all disabled weekdays
   */
  public clearDisabledWeekdays(): void {
    this._disabledWeekdays.clear();
    this.notifyListeners();
  }

  /**
   * Check if a weekday is disabled
   * @param weekday The weekday to check (0-6)
   * @returns True if the weekday is disabled
   */
  public isWeekdayDisabled(weekday: number): boolean {
    return this._disabledWeekdays.has(weekday);
  }

  /**
   * Get all disabled weekdays
   * @returns An array of disabled weekdays (0-6)
   */
  public getDisabledWeekdays(): number[] {
    return Array.from(this._disabledWeekdays);
  }

  /**
   * Add a disabled month (0 = January, 1 = February, ..., 11 = December)
   * @param month The month to disable (0-11)
   */
  public addDisabledMonth(month: number): void {
    if (month >= 0 && month <= 11) {
      this._disabledMonths.add(month);
      this.notifyListeners();
    }
  }

  /**
   * Remove a disabled month
   * @param month The month to enable (0-11)
   */
  public removeDisabledMonth(month: number): void {
    this._disabledMonths.delete(month);
    this.notifyListeners();
  }

  /**
   * Add multiple disabled months at once
   * @param months Array of months to disable (0-11)
   */
  public addDisabledMonths(months: number[]): void {
    months.forEach(month => {
      if (month >= 0 && month <= 11) {
        this._disabledMonths.add(month);
      }
    });
    this.notifyListeners();
  }

  /**
   * Clear all disabled months
   */
  public clearDisabledMonths(): void {
    this._disabledMonths.clear();
    this.notifyListeners();
  }

  /**
   * Check if a month is disabled
   * @param month The month to check (0-11)
   * @returns True if the month is disabled
   */
  public isMonthDisabled(month: number): boolean {
    return this._disabledMonths.has(month);
  }

  /**
   * Get all disabled months
   * @returns An array of disabled months (0-11)
   */
  public getDisabledMonths(): number[] {
    return Array.from(this._disabledMonths);
  }

  /**
   * Get all available (not disabled) dates within a range
   * @param startDate Range start date
   * @param endDate Range end date
   * @returns Array of available dates within the range
   */
  public getAvailableDatesInRange(startDate: Date | null, endDate: Date | null): Date[] {
    if (!startDate || !endDate) return [];
    
    const availableDates: Date[] = [];
    const current = new Date(startDate);
    const end = new Date(endDate);
    
    // Ensure end date is included in the loop
    end.setHours(23, 59, 59, 999);
    
    while (current <= end) {
      // Add date to array if it's not disabled
      if (!this.isDateDisabled(current)) {
        availableDates.push(new Date(current));
      }
      
      // Move to next day
      current.setDate(current.getDate() + 1);
    }
    
    return availableDates;
  }
}