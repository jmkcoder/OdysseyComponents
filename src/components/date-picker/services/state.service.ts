import { IDateFormatter } from './date-formatter.interface';

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
    if (this._minDate && date < this._minDate) {
      return true;
    }
    
    if (this._maxDate && date > this._maxDate) {
      return true;
    }
    
    return false;
  }
  
  public isSameDate(date1: Date | null, date2: Date | null): boolean {
    if (!date1 || !date2) return false;
    
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
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
}