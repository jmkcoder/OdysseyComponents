import './date-picker.scss';
import { DateFormatterProvider, IDateFormatter } from './services';
import { InternationalizationService } from '../../services';
import { defineCustomElement } from '../../utilities/define-custom-element';
import { StateService } from './services/state.service';
import { UIService } from './services/ui.service';

/**
 * DatePicker web component
 * 
 * A customizable date picker component that supports both single date selection
 * and date range selection with internationalization support.
 * 
 * @example
 * <odyssey-date-picker 
 *   placeholder="Select a date"
 *   format="yyyy-MM-dd"
 *   value="2025-04-26"
 *   locale="en-US">
 * </odyssey-date-picker>
 * 
 * @example With custom input
 * <odyssey-date-picker>
 *   <input type="text" slot="input" class="my-custom-input">
 * </odyssey-date-picker>
 */
export class DatePicker extends HTMLElement implements EventListenerObject {
  // DOM Elements References
  private inputElement!: HTMLInputElement;
  private inputWrapperElement!: HTMLDivElement;
  private calendarElement!: HTMLDivElement;
  private dialogElement!: HTMLDivElement;
  private headerElement!: HTMLDivElement;
  private footerElement!: HTMLDivElement;
  private defaultInputElement!: HTMLInputElement;
  
  // Services
  private formatter: IDateFormatter;
  private i18nService: InternationalizationService;
  private stateService: StateService;
  private uiService: UIService;
  
  constructor() {
    super();
    
    // Initialize services
    this.i18nService = InternationalizationService.getInstance();
    this.formatter = DateFormatterProvider.getFormatter(this.i18nService.locale);
    this.stateService = new StateService(this.formatter);
    this.uiService = new UIService(this.stateService, this.formatter);
    
    // Initialize the component
    this.initializeComponent();
  }
  
  static get observedAttributes() {
    return [
      'placeholder', 
      'value', 
      'disabled', 
      'format',
      'theme',
      'first-day-of-week',
      'min-date',
      'max-date',
      'mode',
      'start-date',
      'end-date',
      'locale'
    ];
  }
  
  attributeChangedCallback(name: string, oldValue: string, newValue: string) {
    if (oldValue === newValue) return;
    
    switch (name) {
      case 'placeholder':
        if (this.inputElement) {
          this.inputElement.placeholder = newValue;
        }
        break;
      case 'value':
        this.setDateFromString(newValue);
        break;
      case 'disabled':
        if (this.inputElement) {
          this.inputElement.disabled = newValue !== null;
        }
        break;
      case 'format':
        this.stateService.format = newValue || 'yyyy-MM-dd';
        break;
      case 'theme':
        this.setAttribute('data-theme', newValue);
        break;
      case 'locale':
        // Update locale for all services
        const locale = newValue || navigator.language;
        this.i18nService.locale = locale;
        this.stateService.locale = locale;
        this.formatter = DateFormatterProvider.getFormatter(locale);
        break;
      case 'min-date':
        try {
          this.stateService.minDate = newValue ? this.formatter.parse(newValue) : null;
        } catch (e) {
          console.error("Error parsing min date:", e);
        }
        break;
      case 'max-date':
        try {
          this.stateService.maxDate = newValue ? this.formatter.parse(newValue) : null;
        } catch (e) {
          console.error("Error parsing max date:", e);
        }
        break;
      case 'mode':
        this.stateService.isRangeMode = newValue === 'range';
        if (this.stateService.isRangeMode) {
          this.stateService.resetRangeSelection();
        }
        break;
      case 'start-date':
        if (this.stateService.isRangeMode && newValue) {
          try {
            const startDate = this.formatter.parse(newValue);
            if (!isNaN(startDate.getTime())) {
              this.stateService.rangeStart = startDate;
              this.stateService.viewDate = new Date(startDate);
            }
          } catch (e) {
            console.error("Error parsing start date:", e);
          }
        }
        break;
      case 'end-date':
        if (this.stateService.isRangeMode && newValue) {
          try {
            const endDate = this.formatter.parse(newValue);
            if (!isNaN(endDate.getTime())) {
              this.stateService.rangeEnd = endDate;
            }
          } catch (e) {
            console.error("Error parsing end date:", e);
          }
        }
        break;
      case 'first-day-of-week':
        const dayValue = parseInt(newValue, 10);
        if (!isNaN(dayValue) && dayValue >= 0 && dayValue <= 6) {
          this.stateService.firstDayOfWeek = dayValue;
        }
        break;
    }
  }
  
  /**
   * Initialize component DOM structure and setup
   */
  private initializeComponent() {
    // Create the main structure
    this.classList.add('odyssey-date-picker');
    
    // First check if there's a slotted input before building the structure
    const slottedInput = this.querySelector('input[slot="input"]');
    
    // Create HTML structure
    this.innerHTML = `
        <div class="date-picker-input-wrapper">
          ${slottedInput ? '' : '<input type="text" class="date-picker-input" placeholder="Select date" readonly>'}
          <span class="date-picker-icon material-icons">calendar_today</span>
        </div>
        <div class="date-picker-dialog" tabindex="-1">
          <div class="date-picker-header"></div>
          <div class="date-picker-calendar"></div>
          <div class="date-picker-footer"></div>
        </div>
    `;
    
    // Get references to DOM elements
    this.inputWrapperElement = this.querySelector('.date-picker-input-wrapper') as HTMLDivElement;
    this.dialogElement = this.querySelector('.date-picker-dialog') as HTMLDivElement;
    this.calendarElement = this.querySelector('.date-picker-calendar') as HTMLDivElement;
    this.headerElement = this.querySelector('.date-picker-header') as HTMLDivElement;
    this.footerElement = this.querySelector('.date-picker-footer') as HTMLDivElement;
    
    // Handle input: either use slotted input or the default one
    if (slottedInput && slottedInput instanceof HTMLInputElement) {
      // Move the slotted input into the wrapper
      this.inputWrapperElement.insertBefore(slottedInput, this.inputWrapperElement.firstChild);
      this.inputElement = slottedInput;
      this.inputElement.removeAttribute('slot'); // No longer needed
      
      // Set readonly attribute to prevent direct typing
      this.inputElement.setAttribute('readonly', 'true');
    } else {
      this.inputElement = this.querySelector('.date-picker-input') as HTMLInputElement;
    }
    
    // Initialize UI service with DOM references
    this.uiService.initialize(
      this.calendarElement,
      this.headerElement,
      this.footerElement,
      this.dialogElement,
      this.inputElement
    );
    
    // Set initial values from attributes
    this.initializeFromAttributes();
    
    // Attach event listeners
    this.attachEventListeners();
    
    // Initial UI update
    this.uiService.updateUI();
  }
  
  /**
   * Initialize state from attributes
   */
  private initializeFromAttributes() {
    if (this.hasAttribute('placeholder')) {
      this.inputElement.placeholder = this.getAttribute('placeholder') || 'Select date';
    }
    
    if (this.hasAttribute('disabled')) {
      this.inputElement.disabled = true;
    }
    
    if (this.hasAttribute('format')) {
      this.stateService.format = this.getAttribute('format') || 'yyyy-MM-dd';
    }
    
    if (this.hasAttribute('theme')) {
      this.setAttribute('data-theme', this.getAttribute('theme') || '');
    }

    if (this.hasAttribute('min-date')) {
      try {
        const minDateStr = this.getAttribute('min-date') || '';
        this.stateService.minDate = this.formatter.parse(minDateStr);
      } catch (e) {
        console.error("Error parsing min date:", e);
      }
    }
    
    if (this.hasAttribute('max-date')) {
      try {
        const maxDateStr = this.getAttribute('max-date') || '';
        this.stateService.maxDate = this.formatter.parse(maxDateStr);
      } catch (e) {
        console.error("Error parsing max date:", e);
      }
    }

    // Check for mode attribute
    if (this.hasAttribute('mode')) {
      this.stateService.isRangeMode = this.getAttribute('mode') === 'range';
    }
    
    // Support both start-date/end-date attributes for range mode
    if (this.stateService.isRangeMode) {
      if (this.hasAttribute('start-date')) {
        const startDateStr = this.getAttribute('start-date') || '';
        try {
          const startDate = this.formatter.parse(startDateStr);
          if (!isNaN(startDate.getTime())) {
            this.stateService.rangeStart = startDate;
            this.stateService.viewDate = new Date(startDate);
          }
        } catch (e) {
          console.error("Error parsing start date:", e);
        }
      }
      
      if (this.hasAttribute('end-date')) {
        const endDateStr = this.getAttribute('end-date') || '';
        try {
          const endDate = this.formatter.parse(endDateStr);
          if (!isNaN(endDate.getTime())) {
            this.stateService.rangeEnd = endDate;
          }
        } catch (e) {
          console.error("Error parsing end date:", e);
        }
      }
    } else if (this.hasAttribute('value')) {
      this.setDateFromString(this.getAttribute('value') || '');
    }
    
    // Set first day of week
    if (this.hasAttribute('first-day-of-week')) {
      const dayValue = parseInt(this.getAttribute('first-day-of-week') || '0', 10);
      if (!isNaN(dayValue) && dayValue >= 0 && dayValue <= 6) {
        this.stateService.firstDayOfWeek = dayValue;
      }
    } else {
      this.stateService.firstDayOfWeek = this.i18nService.getFirstDayOfWeek(this.stateService.locale);
    }
  }
  
  private attachEventListeners() {
    // Toggle calendar on input wrapper click
    this.inputWrapperElement?.addEventListener('click', this);
    
    // Close calendar when clicking outside
    document.addEventListener('click', this);
    
    // Prevent clicks inside dialog from bubbling to document
    this.dialogElement.addEventListener('click', (e) => {
      e.stopPropagation();
    });
    
    // Keyboard navigation
    this.dialogElement.addEventListener('keydown', (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          this.stateService.isOpen = false;
          break;
        // Other keyboard navigation is handled by the components
      }
    });
    
    // Connect the component to receive state change events for dispatching custom events
    this.stateService.addListener({
      onStateChange: () => this.handleStateChange()
    });
  }
  
  /**
   * Handle click events using EventListenerObject interface
   */
  handleEvent(e: Event): void {
    const target = e.target as Node;
    
    if (e.type === 'click') {
      if ((target as Element).closest('.date-picker-input-wrapper') && !this.inputElement.disabled) {
        this.toggleCalendar();
        e.stopPropagation();
      } else if (!this.contains(target) && this.stateService.isOpen) {
        this.stateService.isOpen = false;
      }
    }
  }
  
  /**
   * Handle state changes and dispatch custom events
   */
  private handleStateChange(): void {
    // Update attributes
    if (this.stateService.isRangeMode) {
      if (this.stateService.rangeStart && this.stateService.rangeEnd) {
        this.setAttribute(
          'value', 
          `${this.formatter.format(this.stateService.rangeStart, this.stateService.format)} - ${
            this.formatter.format(this.stateService.rangeEnd, this.stateService.format)
          }`
        );
        
        // Get available dates within the range (excluding disabled dates)
        const availableDates = this.getAvailableDatesInRange();
        const formattedDates = availableDates.map(date => 
          this.formatter.format(date, this.stateService.format)
        );
        
        // Dispatch range selection event with available dates
        this.dispatchEvent(
          new CustomEvent('date-change', {
            detail: {
              rangeStart: this.formatter.format(this.stateService.rangeStart, this.stateService.format),
              rangeEnd: this.formatter.format(this.stateService.rangeEnd, this.stateService.format),
              availableDates: formattedDates,
              availableDatesObjects: availableDates
            },
            bubbles: true,
            composed: true
          })
        );
      } else if (!this.stateService.rangeStart && !this.stateService.rangeEnd) {
        this.removeAttribute('value');
        
        // Dispatch clear event
        this.dispatchEvent(
          new CustomEvent('date-clear', {
            bubbles: true,
            composed: true
          })
        );
      }
    } else {
      if (this.stateService.selectedDate) {
        this.setAttribute('value', this.formatter.format(this.stateService.selectedDate, this.stateService.format));
        
        // Dispatch date selection event
        this.dispatchEvent(
          new CustomEvent('date-change', {
            detail: {
              date: this.formatter.format(this.stateService.selectedDate, this.stateService.format)
            },
            bubbles: true,
            composed: true
          })
        );
      } else {
        this.removeAttribute('value');
        
        // Dispatch clear event
        this.dispatchEvent(
          new CustomEvent('date-clear', {
            bubbles: true,
            composed: true
          })
        );
      }
    }
    
    // Dispatch open/close events
    if (this.stateService.isOpen && !this._wasOpen) {
      this._wasOpen = true;
      this.dispatchEvent(new CustomEvent('calendar-open', { bubbles: true }));
    } else if (!this.stateService.isOpen && this._wasOpen) {
      this._wasOpen = false;
      this.dispatchEvent(new CustomEvent('calendar-close', { bubbles: true }));
    }
  }
  
  private _wasOpen: boolean = false;
  
  /**
   * Toggle calendar visibility
   */
  private toggleCalendar(): void {
    this.stateService.isOpen = !this.stateService.isOpen;
  }
  
  /**
   * Set date from string value
   */
  private setDateFromString(value: string): void {
    if (this.stateService.isRangeMode) {
      this.setRangeFromString(value);
    } else {
      try {
        if (!value) {
          this.stateService.selectedDate = null;
          return;
        }
        
        const date = this.formatter.parse(value);
        if (!isNaN(date.getTime())) {
          this.stateService.selectedDate = date;
          this.stateService.viewDate = new Date(date);
        }
      } catch (e) {
        console.error("Error parsing date:", e);
      }
    }
  }
  
  /**
   * Set date range from string value
   */
  private setRangeFromString(value: string): void {
    if (!value) {
      this.stateService.resetRangeSelection();
      return;
    }
    
    try {
      const rangeParts = value.split('-').map(part => part.trim());
      if (rangeParts.length === 2) {
        const start = this.formatter.parse(rangeParts[0]);
        const end = this.formatter.parse(rangeParts[1]);
        
        if (start && end && !isNaN(start.getTime()) && !isNaN(end.getTime())) {
          if (start > end) {
            this.stateService.rangeStart = end;
            this.stateService.rangeEnd = start;
          } else {
            this.stateService.rangeStart = start;
            this.stateService.rangeEnd = end;
          }
          this.stateService.viewDate = new Date(this.stateService.rangeStart);
        }
      }
    } catch (e) {
      console.error("Error parsing date range:", e);
    }
  }
  
  /**
   * Clean up event listeners on disconnection
   */
  disconnectedCallback() {
    document.removeEventListener('click', this);
    this.inputWrapperElement?.removeEventListener('click', this);
  }
  
  // Public API methods
  
  /**
   * Set the selected date programmatically
   * @param date The date to set
   */
  public setDate(date: Date) {
    if (this.stateService.isRangeMode) return;
    
    this.stateService.selectedDate = date;
    this.stateService.viewDate = new Date(date);
  }
  
  /**
   * Set a date range programmatically
   * @param startDate Range start date
   * @param endDate Range end date
   */
  public setDateRange(startDate: Date, endDate: Date) {
    if (!this.stateService.isRangeMode) return;
    
    if (startDate > endDate) {
      this.stateService.rangeStart = endDate;
      this.stateService.rangeEnd = startDate;
    } else {
      this.stateService.rangeStart = startDate;
      this.stateService.rangeEnd = endDate;
    }
    
    this.stateService.viewDate = new Date(this.stateService.rangeStart);
  }
  
  /**
   * Add an event to a specific date
   * @param date The date to add the event to
   * @param eventName Optional name for the event
   */
  public addEvent(date: Date, eventName: string = 'event') {
    this.stateService.addEvent(date, eventName);
  }
  
  /**
   * Clear all events from a specific date
   * @param date The date to clear events from
   */
  public clearEvents(date: Date) {
    this.stateService.clearEvents(date);
  }
  
  /**
   * Add a disabled date (e.g., a public holiday or unavailable date)
   * @param date The date to disable
   * @param reason Optional reason for disabling (e.g., "Public Holiday - Christmas")
   */
  public addDisabledDate(date: Date, reason: string = '') {
    this.stateService.addDisabledDate(date, reason);
  }
  
  /**
   * Remove a previously disabled date
   * @param date The date to enable
   */
  public removeDisabledDate(date: Date) {
    this.stateService.removeDisabledDate(date);
  }
  
  /**
   * Add multiple disabled dates at once
   * @param dates Array of dates to disable
   * @param reason Optional shared reason for all dates (e.g., "Public Holidays")
   */
  public addDisabledDates(dates: Date[], reason: string = '') {
    this.stateService.addDisabledDates(dates, reason);
  }
  
  /**
   * Clear all disabled dates
   */
  public clearDisabledDates() {
    this.stateService.clearDisabledDates();
  }
  
  /**
   * Check if a date is disabled
   * @param date The date to check
   * @returns True if the date is disabled, false otherwise
   */
  public isDateDisabled(date: Date): boolean {
    return this.stateService.isDateDisabled(date);
  }
  
  /**
   * Get the reason a date is disabled (if any)
   * @param date The date to check
   * @returns The reason string or null if not disabled with a reason
   */
  public getDisabledDateReason(date: Date): string | null {
    return this.stateService.getDisabledDateReason(date);
  }

  /**
   * Disable a specific weekday for all months
   * @param weekday The weekday to disable (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
   */
  public disableWeekday(weekday: number): void {
    this.stateService.addDisabledWeekday(weekday);
  }

  /**
   * Enable a previously disabled weekday
   * @param weekday The weekday to enable (0-6)
   */
  public enableWeekday(weekday: number): void {
    this.stateService.removeDisabledWeekday(weekday);
  }

  /**
   * Disable multiple weekdays at once
   * @param weekdays Array of weekdays to disable (0-6)
   * @example
   * // Disable all weekends
   * datePicker.disableWeekdays([0, 6]);
   */
  public disableWeekdays(weekdays: number[]): void {
    this.stateService.addDisabledWeekdays(weekdays);
  }

  /**
   * Clear all disabled weekday settings
   */
  public clearDisabledWeekdays(): void {
    this.stateService.clearDisabledWeekdays();
  }

  /**
   * Check if a weekday is disabled
   * @param weekday The weekday to check (0-6)
   * @returns True if the weekday is disabled
   */
  public isWeekdayDisabled(weekday: number): boolean {
    return this.stateService.isWeekdayDisabled(weekday);
  }

  /**
   * Get all currently disabled weekdays
   * @returns Array of disabled weekdays (0-6)
   */
  public getDisabledWeekdays(): number[] {
    return this.stateService.getDisabledWeekdays();
  }

  /**
   * Disable a specific month
   * @param month The month to disable (0 = January, 1 = February, ..., 11 = December)
   */
  public disableMonth(month: number): void {
    this.stateService.addDisabledMonth(month);
  }

  /**
   * Enable a previously disabled month
   * @param month The month to enable (0-11)
   */
  public enableMonth(month: number): void {
    this.stateService.removeDisabledMonth(month);
  }

  /**
   * Disable multiple months at once
   * @param months Array of months to disable (0-11)
   * @example
   * // Disable winter months (for Northern Hemisphere)
   * datePicker.disableMonths([0, 1, 11]); // January, February, December
   */
  public disableMonths(months: number[]): void {
    this.stateService.addDisabledMonths(months);
  }

  /**
   * Clear all disabled month settings
   */
  public clearDisabledMonths(): void {
    this.stateService.clearDisabledMonths();
  }

  /**
   * Check if a month is disabled
   * @param month The month to check (0-11)
   * @returns True if the month is disabled
   */
  public isMonthDisabled(month: number): boolean {
    return this.stateService.isMonthDisabled(month);
  }

  /**
   * Get all currently disabled months
   * @returns Array of disabled months (0-11)
   */
  public getDisabledMonths(): number[] {
    return this.stateService.getDisabledMonths();
  }

  /**
   * Get all available (not disabled) dates within the currently selected range
   * @returns Array of available dates within the range, or empty array if no range is selected
   */
  public getAvailableDatesInRange(): Date[] {
    return this.stateService.getAvailableDatesInRange(this.stateService.rangeStart, this.stateService.rangeEnd);
  }
}

/**
 * Define the custom element
 */
export const defineDatePicker = () => defineCustomElement('odyssey-date-picker', DatePicker);