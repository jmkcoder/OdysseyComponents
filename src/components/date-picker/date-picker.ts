import './date-picker.scss';
import { DatePickerServiceManager } from './services/date-picker-service-manager';

/**
 * Accessible date picker web component following WAI-ARIA practices
 * 
 * Features:
 * - Keyboard navigation
 * - Screen reader support with ARIA attributes
 * - Multiple themes
 * - Internationalization
 * - Events and indicators
 * - Min/max date constraints
 */
export class DatePicker extends HTMLElement {
  // Service manager
  private _serviceManager: DatePickerServiceManager;
  
  // Define observed attributes for property reflection
  static get observedAttributes(): string[] {
    return [
      'value', 
      'min-date', 
      'max-date', 
      'locale', 
      'disabled', 
      'required',
      'theme',
      'first-day-of-week',
      'events'
    ];
  }

  constructor() {
    super();
    
    // Initialize service manager
    this._serviceManager = new DatePickerServiceManager(this);
  }

  /**
   * Component connected to DOM
   */
  connectedCallback(): void {
    // Initialize component
    this._serviceManager.initialize();
  }

  /**
   * Component disconnected from DOM
   */
  disconnectedCallback(): void {
    // Clean up resources
    this._serviceManager.destroy();
  }

  /**
   * Handle attribute changes
   */
  attributeChangedCallback(name: string, oldValue: string, newValue: string): void {
    if (oldValue === newValue) return;
    
    // Don't process attributes during initialization
    if (!this._serviceManager) return;
    
    switch (name) {
      case 'value':
        // We need to be careful when handling value attribute changes to avoid infinite loops
        if (newValue) {
          const parsedDate = new Date(newValue);
          if (!isNaN(parsedDate.getTime())) {
            // Use direct access to the service manager's internal methods if possible,
            // or let the service manager handle this recursion check
            this._serviceManager.setDate(parsedDate);
          }
        } else {
          this._serviceManager.setDate(null);
        }
        break;
        
      case 'min-date':
        if (newValue) {
          const parsedDate = new Date(newValue);
          if (!isNaN(parsedDate.getTime())) {
            this._serviceManager.setMinDate(parsedDate);
          }
        } else {
          this._serviceManager.setMinDate(null);
        }
        break;
        
      case 'max-date':
        if (newValue) {
          const parsedDate = new Date(newValue);
          if (!isNaN(parsedDate.getTime())) {
            this._serviceManager.setMaxDate(parsedDate);
          }
        } else {
          this._serviceManager.setMaxDate(null);
        }
        break;
        
      case 'locale':
        if (newValue) {
          this._serviceManager.setLocale(newValue);
        }
        break;
        
      case 'disabled':
        this._serviceManager.setDisabled(newValue !== null);
        break;
        
      case 'required':
        this._serviceManager.setRequired(newValue !== null);
        break;
        
      case 'theme':
        if (newValue) {
          this._serviceManager.setTheme(newValue);
        }
        break;
        
      case 'first-day-of-week':
        if (newValue) {
          const day = parseInt(newValue, 10);
          if (!isNaN(day) && day >= 0 && day <= 6) {
            this._serviceManager.setFirstDayOfWeek(day);
          }
        }
        break;
        
      case 'events':
        if (newValue) {
          try {
            const eventsData = JSON.parse(newValue);
            this._serviceManager.addEvents(eventsData);
          } catch (e) {
            console.error('Invalid events format:', e);
          }
        }
        break;
    }
  }
  
  // Public API methods
  
  /**
   * Open the calendar dialog
   */
  open(): void {
    this._serviceManager.openCalendar();
  }
  
  /**
   * Close the calendar dialog
   */
  close(): void {
    this._serviceManager.closeCalendar();
  }
  
  /**
   * Get the selected date
   */
  getDate(): Date | null {
    return this._serviceManager.getDate();
  }
  
  /**
   * Set the date programmatically
   */
  setDate(date: Date | null): void {
    this._serviceManager.setDate(date);
  }
  
  /**
   * Set the min date constraint
   */
  setMinDate(date: Date | null): void {
    this._serviceManager.setMinDate(date);
  }
  
  /**
   * Set the max date constraint
   */
  setMaxDate(date: Date | null): void {
    this._serviceManager.setMaxDate(date);
  }
  
  /**
   * Set the locale for internationalization
   */
  setLocale(locale: string): void {
    this._serviceManager.setLocale(locale);
  }
  
  /**
   * Add events to display on specific dates
   */
  addEvents(events: Record<string, string[]>): void {
    this._serviceManager.addEvents(events);
  }
  
  /**
   * Remove events from a specific date
   */
  removeEvents(date: string): void {
    this._serviceManager.removeEvents(date);
  }
  
  /**
   * Clear all events
   */
  clearEvents(): void {
    this._serviceManager.clearEvents();
  }
}

export const defineDatePicker = () => customElements.define('odyssey-date-picker', DatePicker);