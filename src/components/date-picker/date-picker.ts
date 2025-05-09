import './date-picker.scss';
import { DateFormatterProvider, IDateFormatter } from './services/date-formatter';
import { InternationalizationService } from '../../services';
import { defineCustomElement } from '../../utilities/define-custom-element';
import { StateService } from './services/state.service';
import { UIService } from './services/ui.service';
import { EventDispatcherService } from './services/event-dispatcher.service';

/**
 * DatePicker web component
 * 
 * A customizable date picker component that supports both single date selection
 * and date range selection with internationalization support.
 * 
 * @example Basic usage
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
 * 
 * @example With direct text input
 * <odyssey-date-picker allow-input="true">
 * </odyssey-date-picker>
 * 
 * @example With custom calendar trigger (hiding default icon)
 * <div class="custom-date-picker-container">
 *   <odyssey-date-picker id="my-date-picker" show-icon="false">
 *   </odyssey-date-picker>
 *   <button id="calendar-btn">Open Calendar</button>
 * </div>
 * <script>
 *   document.getElementById('calendar-btn').addEventListener('click', () => {
 *     const datePicker = document.getElementById('my-date-picker');
 *     datePicker.toggleCalendar(); // Using the public API method
 *   });
 * </script>
 */
export class DatePicker extends HTMLElement implements EventListenerObject {
  public stateService: StateService;
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
  private uiService: UIService;
  private eventDispatcherService: EventDispatcherService;
  
  // State tracking for events
  private _wasOpen: boolean = false;
  private _dateChangeDebounceTime: number = 100; // Increased from 50ms to 100ms
  private _pendingChangeEvent: boolean = false; // Flag to track if an event is pending
  private _eventBatch: Set<string> = new Set(); // Track state change types in a batch
  private _eventBatchTimer: number | null = null; // Timer for batch processing
  private _lastSelectedDate: string | null = null; // Track the last selected date to prevent duplicate events
  private _dateChangePrevented: boolean = false; // Flag to prevent duplicate date-change events
  private _isInitializing: boolean = true; // Flag to prevent multiple events during initialization
  private _preventInputFocus: boolean = false; // Flag to prevent input focus when toggling calendar
  _calendarJustOpened: boolean = false; // Flag to indicate calendar was just opened
  private _preventDateChangeOnFocus: boolean = false; // Flag to prevent date-change when focusing on calendar cells
  
  constructor() {
    super();
    
    // Initialize services
    this.i18nService = InternationalizationService.getInstance();
    this.formatter = DateFormatterProvider.getFormatter(this.i18nService.locale);
    this.stateService = new StateService(this.formatter);
    this.uiService = new UIService(this.stateService, this.formatter);
    this.eventDispatcherService = new EventDispatcherService(this);
    
    // Completely suppress events during initialization
    this.eventDispatcherService.suppressEvents(true);
    
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
      'locale',
      'allow-input',
      'show-icon'
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
            if (startDate && !isNaN(startDate.getTime())) {
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
            if (endDate && !isNaN(endDate.getTime())) {
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
      case 'show-icon':
        this.updateIconVisibility();
        break;
    }
  }
  
  /**
   * Update the visibility of the calendar icon based on the 'show-icon' attribute
   */
  private updateIconVisibility(): void {
    const calendarIcon = this.querySelector('.date-picker-icon') as HTMLElement;
    if (calendarIcon) {
      if (this.hasAttribute('show-icon') && this.getAttribute('show-icon') === 'false') {
        calendarIcon.style.display = 'none';
      } else {
        calendarIcon.style.display = '';
      }
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
    
    // Create HTML structure with mobile close button
    this.innerHTML = `
        <div class="date-picker-input-wrapper">
          ${slottedInput ? '' : '<input type="text" class="date-picker-input" placeholder="Select date">'}
          <span class="date-picker-icon material-icons">calendar_today</span>
        </div>
        <div class="date-picker-dialog" tabindex="-1">
          <button type="button" class="mobile-close-btn">
            <span class="material-icons">close</span>
          </button>
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
    
    // Initialize responsive behavior
    this.initializeResponsiveBehavior();
  }
  
  /**
   * Initialize responsive behavior and touch gesture support
   */
  private initializeResponsiveBehavior(): void {
    const mobileCloseButton = this.querySelector('.mobile-close-btn') as HTMLButtonElement;
    if (mobileCloseButton) {
      mobileCloseButton.addEventListener('click', () => {
        this.stateService.isOpen = false;
      });
    }

    // Enhanced touch gesture support
    let touchStartY = 0;
    let touchStartX = 0;
    let initialTouchTime = 0;
    const minSwipeDistance = 70; // Minimum swipe distance in pixels
    const maxSwipeTime = 300; // Maximum time for swipe in milliseconds
    
    // Add touch gesture support for swiping to close the calendar
    this.dialogElement.addEventListener('touchstart', (e: TouchEvent) => {
      touchStartY = e.touches[0].clientY;
      touchStartX = e.touches[0].clientX;
      initialTouchTime = Date.now();
    }, { passive: false });

    this.dialogElement.addEventListener('touchmove', (e: TouchEvent) => {
      if (window.matchMedia('(max-width: 768px)').matches) {
        const touchY = e.touches[0].clientY;
        const touchX = e.touches[0].clientX;
        const deltaY = touchY - touchStartY;
        const deltaX = touchX - touchStartX;
        
        // Prevent pull-to-refresh when swiping inside the calendar dialog
        // This prevents the browser's native pull-to-refresh behavior
        if (deltaY > 0) {
          e.preventDefault();
        }
        
        // If swiping down, add a visual feedback by following the finger
        if (deltaY > 0 && Math.abs(deltaY) > Math.abs(deltaX)) {
          this.dialogElement.style.transform = `translateY(${deltaY / 3}px)`;
          this.dialogElement.style.opacity = `${1 - (deltaY / 400)}`;
        } 
        // If swiping horizontally in calendar view, provide visual feedback for month navigation
        else if (Math.abs(deltaX) > Math.abs(deltaY) && this.calendarElement.contains(e.target as Node)) {
          // Apply horizontal swipe effect regardless of which view is active
          this.calendarElement.style.transform = `translateX(${deltaX / 2}px)`;
          this.calendarElement.style.opacity = `${1 - (Math.abs(deltaX) / 500)}`;
        }
      }
    }, { passive: false });

    this.dialogElement.addEventListener('touchend', (e: TouchEvent) => {
      if (window.matchMedia('(max-width: 768px)').matches) {
        const touchEndY = e.changedTouches[0].clientY;
        const touchEndX = e.changedTouches[0].clientX;
        const touchEndTime = Date.now();
        
        const deltaY = touchEndY - touchStartY;
        const deltaX = touchEndX - touchStartX;
        const swipeTime = touchEndTime - initialTouchTime;
        
        // Reset the transform and opacity
        this.dialogElement.style.transform = '';
        this.dialogElement.style.opacity = '';
        this.calendarElement.style.transform = '';
        this.calendarElement.style.opacity = '';
        
        // Check if it's a vertical or horizontal swipe
        const isVerticalSwipe = Math.abs(deltaY) > Math.abs(deltaX);
        
        // Close on fast or long downward swipe
        if (isVerticalSwipe && deltaY > minSwipeDistance && 
            (swipeTime < maxSwipeTime || deltaY > window.innerHeight / 3)) {
          this.stateService.isOpen = false;
        } 
        // Navigate based on the current view
        else if (!isVerticalSwipe && Math.abs(deltaX) > minSwipeDistance && 
                swipeTime < maxSwipeTime &&
                this.calendarElement.contains(e.target as Node)) {
          
          // Handle horizontal swipes based on the active view
          switch (this.stateService.currentView) {
            case 'calendar':
              if (deltaX > 0) {
                // Swiping right - go to previous month with animation
                this.navigateWithAnimation('previous');
              } else {
                // Swiping left - go to next month with animation
                this.navigateWithAnimation('next');
              }
              break;
            case 'months':
              // For months view, navigate through years
              if (deltaX > 0) {
                // Previous year
                this.navigateWithAnimation('previous-year');
              } else {
                // Next year
                this.navigateWithAnimation('next-year');
              }
              break;
            case 'years':
              // For years view, navigate through decades
              if (deltaX > 0) {
                // Previous decade
                this.navigateWithAnimation('previous-decade');
              } else {
                // Next decade
                this.navigateWithAnimation('next-decade');
              }
              break;
          }
        }
      }
    });

    // Add extra accessibility features for mobile
    this.dialogElement.setAttribute('role', 'dialog');
    this.dialogElement.setAttribute('aria-modal', 'true');
    this.dialogElement.setAttribute('aria-label', 'Date picker calendar');

    // Handle orientation changes and viewport adjustments
    window.addEventListener('resize', this.handleViewportChanges.bind(this));
    window.addEventListener('orientationchange', this.handleViewportChanges.bind(this));
  }
  
  /**
   * Navigate to previous or next month with animation
   * @param direction 'previous' or 'next'
   */
  private navigateWithAnimation(direction: 'previous' | 'next' | 'previous-year' | 'next-year' | 'previous-decade' | 'next-decade'): void {
    // Create animation class on the calendar element
    const animationClass = direction.includes('previous') ? 'slide-right' : 'slide-left';
    this.calendarElement.classList.add(animationClass);
    
    // Use setTimeout to ensure animation is visible
    setTimeout(() => {
      if (direction === 'previous') {
        this.stateService.navigateToPreviousPeriod();
      } else if (direction === 'next') {
        this.stateService.navigateToNextPeriod();
      } else if (direction === 'previous-year') {
        this.stateService.navigateToPreviousPeriod();
      } else if (direction === 'next-year') {
        this.stateService.navigateToNextPeriod();
      } else if (direction === 'previous-decade') {
        this.stateService.navigateToPreviousPeriod();
      } else if (direction === 'next-decade') {
        this.stateService.navigateToNextPeriod();
      }
      
      // Remove animation class after animation completes
      setTimeout(() => {
        this.calendarElement.classList.remove(animationClass);
      }, 300);
    }, 50);
  }
  
  /**
   * Handle viewport changes or orientation changes
   */
  private handleViewportChanges(): void {
    // Adjust positioning for mobile view in case of orientation changes
    if (window.matchMedia('(max-width: 768px)').matches && this.stateService.isOpen) {
      // For mobile, ensure the calendar is correctly positioned and sized
      // Calculate safe area and ensure the calendar fits within viewport
      const viewHeight = window.innerHeight;
      
      // Adjust scrolling if needed
      if (this.calendarElement) {
        if (this.calendarElement.scrollHeight > viewHeight * 0.7) {
          this.calendarElement.style.maxHeight = `${viewHeight * 0.65}px`;
        } else {
          this.calendarElement.style.maxHeight = '';
        }
      }
      
      // Apply iOS safe area insets if available
      if (CSS.supports('padding-bottom: env(safe-area-inset-bottom)')) {
        this.dialogElement.style.paddingBottom = 'env(safe-area-inset-bottom)';
      }
    } else {
      // For desktop, reset any mobile-specific styles
      if (this.calendarElement) {
        this.calendarElement.style.maxHeight = '';
      }
      this.dialogElement.style.transform = '';
      this.dialogElement.style.opacity = '';
    }
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
          if (startDate && !isNaN(startDate.getTime())) {
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
          if (endDate && !isNaN(endDate.getTime())) {
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
    
    // Update icon visibility based on show-icon attribute
    this.updateIconVisibility();
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
        if (date && !isNaN(date.getTime())) {
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
      // Look for a separator between dates (dash, "to", or other common separators)
      let rangeParts: string[] = [];
      
      // Try standard dash separator first (most common)
      if (value.includes('-')) {
        rangeParts = value.split('-').map(part => part.trim());
      } 
      // Try "to" as separator
      else if (value.toLowerCase().includes('to')) {
        rangeParts = value.toLowerCase().split('to').map(part => part.trim());
      }
      // Try slash as separator (less common, but possible user input)
      else if (value.split('/').length > 2) {
        // This might be a complex case like "04/15/2025 / 04/26/2025"
        const separatorCount = value.indexOf('/') + value.indexOf('/', value.indexOf('/') + 1) + 1;
        if (separatorCount > 0) {
          rangeParts = [
              value.substring(0, separatorCount).trim(),
              value.substring(separatorCount + 1).trim()
          ];
        }
      }
      
      // If we couldn't parse it using known separators, try to infer based on the format pattern
      if (rangeParts.length !== 2) {
        // Get the expected length of a single date based on the format
        const sampleDate = new Date();
        const formattedSample = this.formatter.format(sampleDate, this.stateService.format);
        const expectedLength = formattedSample.length;
        
        // If the input is roughly twice the expected length, try to split in the middle
        if (value.length >= expectedLength * 1.8) {
          // Find a natural break point (space, comma, etc.) near the middle
          const midPoint = Math.floor(value.length / 2);
          
          let splitIndex = value.indexOf(' ', midPoint - 3);
          
          if (splitIndex === -1) {
            splitIndex = value.indexOf(',', midPoint - 3);
          }
          
          if (splitIndex === -1) {
            // No natural break point, just split in the middle
            splitIndex = midPoint;
          }
          
          rangeParts = [
            value.substring(0, splitIndex).trim(),
            value.substring(splitIndex).trim()
          ];
        }
      }
      
      // Try to intelligently split this based on the format
      if (rangeParts.length !== 2) {
        // Try to intelligently split this based on the format
        const formatParts = this.stateService.format.split('-');
        if (formatParts.length === 3) {
          // Count separators expected in a single date based on the format
          const expectedSeparators = formatParts.join('').split('').filter(c => /[^A-Za-z0-9]/.test(c)).length;
          
          // Find the position where the second date starts
          const separatorCount = [...value].reduce((count, char, index) => {
            if (/[^A-Za-z0-9]/.test(char)) count++;
            if (count === expectedSeparators + 1) return index;
            return count;
          }, 0);
          
          if (typeof separatorCount === 'number' && separatorCount > 0) {
            rangeParts = [
              value.substring(0, separatorCount).trim(),
              value.substring(separatorCount + 1).trim()
            ];
          }
        }
      }
      
      // Try to parse both parts as dates
      if (rangeParts.length === 2) {
        // First try parsing with the current display format
        let start = this.formatter.parse(rangeParts[0], this.stateService.format);
        let end = this.formatter.parse(rangeParts[1], this.stateService.format);
        
        // If that fails, fall back to the default parser
        if (!start || isNaN(start.getTime())) {
          start = this.formatter.parse(rangeParts[0]);
        }
        
        if (!end || isNaN(end.getTime())) {
          end = this.formatter.parse(rangeParts[1]);
        }
        
        if (start && !isNaN(start.getTime()) && end && !isNaN(end.getTime())) {
          // Check if this is actually a change from the current selection
          const isSameRange = 
            this.stateService.rangeStart && 
            this.stateService.rangeEnd &&
            this.stateService.rangeStart.getDate() === start.getDate() &&
            this.stateService.rangeStart.getMonth() === start.getMonth() &&
            this.stateService.rangeStart.getFullYear() === start.getFullYear() &&
            this.stateService.rangeEnd.getDate() === end.getDate() &&
            this.stateService.rangeEnd.getMonth() === end.getMonth() &&
            this.stateService.rangeEnd.getFullYear() === end.getFullYear();
          
          if (!isSameRange) {
            // Prevent event dispatching in processBatchedEvents since we'll dispatch our own
            this._dateChangePrevented = true;
            
            // Set the range values
            if (start > end) {
              this.stateService.rangeStart = end;
              this.stateService.rangeEnd = start;
            } else {
              this.stateService.rangeStart = start;
              this.stateService.rangeEnd = end;
            }
            this.stateService.viewDate = new Date(this.stateService.rangeStart);
            
            // Get available dates within the range
            const availableDates = this.getAvailableDatesInRange();
            const formattedDates = availableDates.map(date => 
              this.formatter.format(date, this.stateService.format)
            );
            
            // Update the last selected date to prevent duplicate events
            this._lastSelectedDate = `${this.formatter.format(this.stateService.rangeStart, 'yyyy-MM-dd')}-${this.formatter.format(this.stateService.rangeEnd, 'yyyy-MM-dd')}`;
            
            // Dispatch manual input event using the event dispatcher service
            this.eventDispatcherService.dispatchRangeChangeEvent(
              this.stateService.rangeStart,
              this.stateService.rangeEnd,
              this.formatter.format(this.stateService.rangeStart, this.stateService.format),
              this.formatter.format(this.stateService.rangeEnd, this.stateService.format),
              availableDates,
              formattedDates,
              'manual-input'
            );
          }
          
          this.clearDateInputError();
          return;
        }
      }
      
      // If we get here, we couldn't parse the input as a valid range
      console.warn("Could not parse input as date range:", value);
      this.showInvalidDateFormatFeedback();
      this.updateInputDisplay(); // Restore previous valid value
    } catch (e) {
      console.error("Error parsing date range:", e);
      this.showInvalidDateFormatFeedback();
      this.updateInputDisplay(); // Restore previous valid value
    }
  }
  
  private attachEventListeners() {
    // Get a reference to the calendar icon specifically
    const calendarIcon = this.querySelector('.date-picker-icon') as HTMLElement;
    if (calendarIcon) {
      // Add a dedicated click handler to the calendar icon
      calendarIcon.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent the event from reaching the document
        e.preventDefault(); // Prevent any default actions
        
        // Don't respond to clicks if the component is disabled
        if (this.hasAttribute('disabled')) {
          return;
        }
        
        this.toggleCalendar();
      });
    }
    
    // Listen for input click toggle events
    this.addEventListener('input-click-toggle', () => {
      this._eventBatch.add('toggle-only');
    });
    
    // Listen for clear button action events
    this.addEventListener('clear-action', () => {
      this._eventBatch.add('clear-action');
      // Reset last selected date to ensure the clear event is dispatched
      this._lastSelectedDate = null;
    });
    
    // Close calendar when clicking outside
    document.addEventListener('click', this);
    
    // Prevent clicks inside dialog from bubbling to document
    this.dialogElement.addEventListener('click', (e) => {
      e.stopPropagation();
    });
    
    // Handle direct input in the text field
    this.inputElement.addEventListener('input', (e) => this.handleInputChange(e));
    this.inputElement.addEventListener('blur', (e) => this.handleInputBlur(e));
    this.inputElement.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        this.handleInputBlur(e);
      }
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
   * Required implementation for EventListenerObject interface
   * Handles DOM events that this class is registered to listen for
   */
  handleEvent(event: Event): void {
    if (event.type === 'click') {
      // Only handle document clicks to close the calendar if it's already open
      if (event.currentTarget === document && !this.contains(event.target as Node)) {
        // Close calendar when clicking outside, but only if it's currently open
        if (this.stateService.isOpen) {
          this.stateService.isOpen = false;
        }
      }
    }
  }
  
  /**
   * Handle user input in the text field
   */
  private handleInputChange(e: Event): void {
    // Just allow typing - validation happens on blur
  }
  
  /**
   * Validate and process the input when focus is lost
   */
  private handleInputBlur(e: Event): void {
    const inputValue = this.inputElement.value.trim();
    
    if (!inputValue) {
      // Clear the selection if input is empty
      if (this.stateService.isRangeMode) {
        this.stateService.resetRangeSelection();
      } else {
        this.stateService.selectedDate = null;
      }
      return;
    }
    
    try {
      if (this.stateService.isRangeMode) {
        // Range mode handling - use the existing method
        this.setRangeFromString(inputValue);
      } else {
        // Single date handling
        // Always try to parse using the current format first to ensure consistency
        let date = this.formatter.parse(inputValue, this.stateService.format);
        
        // Only fall back to general parsing if the format-specific parse failed AND
        // the input doesn't contain dashes (to prevent format switching with dash-separated dates)
        if ((!date || isNaN(date.getTime())) && !inputValue.includes('-')) {
          date = this.formatter.parse(inputValue);
        }
        
        if (date && !isNaN(date.getTime())) {
          // Check if the date is disabled before setting it
          if (this.stateService.isDateDisabled(date)) {
            this.showDisabledDateFeedback(date);
          } else {
            // Check if this is actually a change
            const currentValue = this.stateService.selectedDate;
            const isSameDate = currentValue && 
              date.getDate() === currentValue.getDate() &&
              date.getMonth() === currentValue.getMonth() &&
              date.getFullYear() === currentValue.getFullYear();
            
            if (!isSameDate) {
              // Prevent event dispatching in processBatchedEvents
              this._dateChangePrevented = true;
              
              // Valid date, update state
              this.stateService.selectedDate = date;
              this.stateService.viewDate = new Date(date);
              
              // Get any events for the selected date
              const dateKey = this.formatter.format(date, 'yyyy-MM-dd');
              const eventsForDate = this.stateService.getEvents(dateKey) || [];
              
              // Update the last selected date to prevent duplicate events
              this._lastSelectedDate = dateKey;
              
              // Use the event dispatcher service for date changes from manual input
              this.eventDispatcherService.dispatchDateChangeEvent(
                date,
                this.formatter.format(date, this.stateService.format),
                eventsForDate,
                'manual-input'
              );
            }
            
            this.clearDateInputError();
          }
        } else {
          // Invalid date format, restore previous value
          this.showInvalidDateFormatFeedback();
          this.updateInputDisplay();
        }
      }
    } catch (e) {
      console.error("Error parsing input date:", e);
      // Invalid format, restore previous value
      this.showInvalidDateFormatFeedback();
      this.updateInputDisplay();
    }
  }
  
  /**
   * Display feedback when user tries to select a disabled date
   */
  private showDisabledDateFeedback(date: Date): void {
    // Get the reason why this date is disabled
    const reason = this.stateService.getDisabledDateReason(date);
    
    // Create or update the error message element
    let errorElement = this.querySelector('.date-picker-input-error');
    if (!errorElement) {
      errorElement = document.createElement('div');
      errorElement.className = 'date-picker-input-error';
      this.inputWrapperElement.insertAdjacentElement('afterend', errorElement);
    }
    
    // Add error class to the input
    this.inputElement.classList.add('date-picker-input-invalid');
    
    // Find the nearest available date as a suggestion
    const formattedDate = this.formatter.format(date, this.stateService.format);
    let suggestMessage = '';
    
    // Try to find a valid date within one week in either direction
    const today = new Date();
    const oneWeekForward = new Date(today);
    oneWeekForward.setDate(today.getDate() + 7);
    
    const nearestAvailableDate = this.findNearestAvailableDate(date);
    if (nearestAvailableDate) {
      const formattedNearestDate = this.formatter.format(nearestAvailableDate, this.stateService.format);
      suggestMessage = ` Try ${formattedNearestDate} instead.`;
    }
    
    // Set the error message with the reason and suggestion
    if (reason) {
      errorElement.textContent = `${formattedDate} can't be selected: ${reason}.${suggestMessage}`;
    } else {
      errorElement.textContent = `${formattedDate} is not available.${suggestMessage}`;
    }
    
    // Restore the previous value
    this.updateInputDisplay();
    
    // Auto-hide the error after 5 seconds
    setTimeout(() => {
      this.clearDateInputError();
    }, 5000);
  }
  
  /**
   * Display feedback for invalid date format
   */
  private showInvalidDateFormatFeedback(): void {
    // Create or update the error message element
    let errorElement = this.querySelector('.date-picker-input-error');
    if (!errorElement) {
      errorElement = document.createElement('div');
      errorElement.className = 'date-picker-input-error';
      this.inputWrapperElement.insertAdjacentElement('afterend', errorElement);
    }
    
    // Add error class to the input
    this.inputElement.classList.add('date-picker-input-invalid');
    
    // Create a sample date formatted in the current format to show as an example
    const today = new Date();
    const exampleDate = this.formatter.format(today, this.stateService.format);
    
    // Show a format hint with example
    errorElement.textContent = `Invalid date format. Please use format: ${this.stateService.format} (e.g., ${exampleDate})`;
    
    // Auto-hide the error after 5 seconds
    setTimeout(() => {
      this.clearDateInputError();
    }, 5000);
  }
  
  /**
   * Clear any input error state
   */
  private clearDateInputError(): void {
    const errorElement = this.querySelector('.date-picker-input-error');
    if (errorElement) {
      errorElement.remove();
    }
    
    this.inputElement.classList.remove('date-picker-input-invalid');
  }
  
  /**
   * Find the nearest available date to a given date
   * @param date The reference date
   * @returns The nearest available date or null if none found within reasonable range
   */
  private findNearestAvailableDate(date: Date): Date | null {
    const maxDays = 14; // Look up to 2 weeks in either direction
    const dateToCheck = new Date(date);
    
    // Check forward
    for (let i = 1; i <= maxDays; i++) {
      dateToCheck.setDate(date.getDate() + i);
      if (!this.stateService.isDateDisabled(dateToCheck)) {
        return new Date(dateToCheck);
      }
      
      // Also check backward on the same iteration
      dateToCheck.setDate(date.getDate() - i);
      if (!this.stateService.isDateDisabled(dateToCheck)) {
        return new Date(dateToCheck);
      }
      
      // Reset for next iteration
      dateToCheck.setTime(date.getTime());
    }
    
    return null; // No available date found within the range
  }
  
  /**
   * Update the input display to match the current state
   */
  private updateInputDisplay(): void {
    if (this.stateService.isRangeMode) {
      if (this.stateService.rangeStart && this.stateService.rangeEnd) {
        this.inputElement.value = `${this.formatter.format(this.stateService.rangeStart, this.stateService.format)} - ${
          this.formatter.format(this.stateService.rangeEnd, this.stateService.format)
        }`;
      } else {
        this.inputElement.value = '';
      }
    } else {
      if (this.stateService.selectedDate) {
        this.inputElement.value = this.formatter.format(this.stateService.selectedDate, this.stateService.format);
      } else {
        this.inputElement.value = '';
      }
    }
  }
  
  /**
   * Handle state changes and dispatch custom events
   */
  private handleStateChange(): void {
    // Update input display
    this.updateInputDisplay();
    
    // If we're still initializing, collect changes but don't dispatch events
    if (this._isInitializing) {
      // Don't start batching events yet
      return;
    }
    
    // Start batching this event if not already batching
    if (!this._pendingChangeEvent) {
      // Start a new event batch
      this._pendingChangeEvent = true;
      this._eventBatch.clear();
      
      // Cancel any existing timer
      if (this._eventBatchTimer !== null) {
        window.clearTimeout(this._eventBatchTimer);
      }
      
      // Set timer to process the batch
      this._eventBatchTimer = window.setTimeout(() => {
        this.processBatchedEvents();
      }, this._dateChangeDebounceTime); // Use the debounce time for proper batching
    }
    
    // Track the current state change
    if (this.stateService.isOpen !== this._wasOpen) {
      this._eventBatch.add('open-state');
    } else if (this.stateService.selectedDate) {
      this._eventBatch.add('date-selection');
    } else if (this.stateService.rangeStart || this.stateService.rangeEnd) {
      this._eventBatch.add('range-selection');
    }
    
    // Handle open/close events immediately (don't batch these)
    if (this.stateService.isOpen && !this._wasOpen) {
      this._wasOpen = true;
      this.eventDispatcherService.dispatchCalendarOpenEvent();
    } else if (!this.stateService.isOpen && this._wasOpen) {
      this._wasOpen = false;
      this.eventDispatcherService.dispatchCalendarCloseEvent();
    }
  }
  
  /**
   * Process all batched events and dispatch a single event
   */
  private processBatchedEvents(): void {
    // Reset batch state
    this._pendingChangeEvent = false;
    this._eventBatchTimer = null;
    
    // Use the event dispatcher service to process batched events
    this.eventDispatcherService.processBatchedEvents(
      this.stateService,
      this.formatter,
      this._lastSelectedDate,
      this._dateChangePrevented,
      this._eventBatch,
      (value: string | null) => {
        this._lastSelectedDate = value;
      },
      this._isInitializing // Pass the initialization state
    );
    
    // Update attributes based on current state
    if (this.stateService.isRangeMode) {
      if (this.stateService.rangeStart && this.stateService.rangeEnd) {
        this.setAttribute(
          'value', 
          `${this.formatter.format(this.stateService.rangeStart, this.stateService.format)} - ${
            this.formatter.format(this.stateService.rangeEnd, this.stateService.format)
          }`
        );
      } else if (!this.stateService.rangeStart && !this.stateService.rangeEnd) {
        this.removeAttribute('value');
      }
    } else {
      if (this.stateService.selectedDate) {
        const dateString = this.formatter.format(this.stateService.selectedDate, this.stateService.format);
        this.setAttribute('value', dateString);
      } else {
        this.removeAttribute('value');
      }
    }
    
    // Reset the date change prevention flag
    this._dateChangePrevented = false;
    
    // Clear the batch
    this._eventBatch.clear();
  }
  
  /**
   * Connected callback - called when the component is added to the DOM
   */
  connectedCallback() {
    // Block events during initialization with multiple flags
    this._dateChangePrevented = true;
    this._isInitializing = true;
    this.eventDispatcherService.suppressEvents(true);
    
    // Save the original values to restore if the user already provided them
    const initialSelectedDate = this.stateService.selectedDate ? new Date(this.stateService.selectedDate) : null;
    const initialRangeStart = this.stateService.rangeStart ? new Date(this.stateService.rangeStart) : null;
    const initialRangeEnd = this.stateService.rangeEnd ? new Date(this.stateService.rangeEnd) : null;
    
    // Create a sequence of operations that ensures all DOM operations are complete
    // BEFORE we enable events
    setTimeout(() => {
      // Update attributes silently
      if (this.stateService.selectedDate) {
        const dateString = this.formatter.format(this.stateService.selectedDate, this.stateService.format);
        this.setAttribute('value', dateString);
      } else if (this.stateService.isRangeMode && this.stateService.rangeStart && this.stateService.rangeEnd) {
        this.setAttribute(
          'value', 
          `${this.formatter.format(this.stateService.rangeStart, this.stateService.format)} - ${
            this.formatter.format(this.stateService.rangeEnd, this.stateService.format)
          }`
        );
      }
      
      // First update the display without enabling events
      this.updateInputDisplay();
      
      // In rare race conditions, a state change might have occurred during init
      // Reset to the saved initial values to prevent unwanted events
      if (initialSelectedDate) {
        this.stateService.selectedDate = initialSelectedDate;
      }
      
      if (initialRangeStart) {
        this.stateService.rangeStart = initialRangeStart;
      }
      
      if (initialRangeEnd) {
        this.stateService.rangeEnd = initialRangeEnd;
      }
      
      // Set the last selected date value to prevent initial change events
      if (this.stateService.selectedDate) {
        this._lastSelectedDate = this.formatter.format(this.stateService.selectedDate, 'yyyy-MM-dd');
      } else if (this.stateService.isRangeMode && this.stateService.rangeStart && this.stateService.rangeEnd) {
        this._lastSelectedDate = `${this.formatter.format(this.stateService.rangeStart, 'yyyy-MM-dd')}-${this.formatter.format(this.stateService.rangeEnd, 'yyyy-MM-dd')}`;
      }
      
      // Mark initialization as complete AFTER attribute changes
      setTimeout(() => {
        // Add a small delay before enabling events to prevent any race conditions
        setTimeout(() => {
          // Enable events after initialization
          this._isInitializing = false;
          this._dateChangePrevented = false;
          this.eventDispatcherService.suppressEvents(false);
          
          console.log('Date picker fully initialized, events enabled');
        }, 50);
      }, 100);
    }, 100);
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
    
    // Get any events for the selected date
    const dateKey = this.formatter.format(date, 'yyyy-MM-dd');
    const eventsForDate = this.stateService.getEvents(dateKey) || [];
    
    // Update the last selected date to prevent duplicate events
    this._lastSelectedDate = dateKey;
    
    // Dispatch date change event
    this.eventDispatcherService.dispatchDateChangeEvent(
      date,
      this.formatter.format(date, this.stateService.format),
      eventsForDate,
      'api-call'
    );
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
    
    // Get available dates within the range
    const availableDates = this.getAvailableDatesInRange();
    const formattedDates = availableDates.map(date => 
      this.formatter.format(date, this.stateService.format)
    );
    
    // Dispatch range complete event
    this.eventDispatcherService.dispatchRangeCompleteEvent(
      this.stateService.rangeStart,
      this.stateService.rangeEnd,
      `${this.formatter.format(this.stateService.rangeStart, this.stateService.format)} - ${
        this.formatter.format(this.stateService.rangeEnd, this.stateService.format)
      }`
    );
    
    // Also dispatch range change event
    this.eventDispatcherService.dispatchRangeChangeEvent(
      this.stateService.rangeStart,
      this.stateService.rangeEnd,
      this.formatter.format(this.stateService.rangeStart, this.stateService.format),
      this.formatter.format(this.stateService.rangeEnd, this.stateService.format),
      availableDates,
      formattedDates,
      'api-call'
    );
  }
  
  /**
   * Add an event to a specific date
   * @param date The date to add the event to
   * @param eventName Optional name for the event
   */
  public addEvent(date: Date, eventName: string = 'event') {
    this.stateService.addEvent(date, eventName);
    
    // Dispatch events-added event
    const dateKey = this.formatter.format(date, 'yyyy-MM-dd');
    const events = { [dateKey]: this.stateService.getEvents(dateKey) || [] };
    this.eventDispatcherService.dispatchEventsAddedEvent(events);
  }
  
  /**
   * Clear all events from a specific date
   * @param date The date to clear events from
   */
  public clearEvents(date: Date) {
    const dateKey = this.formatter.format(date, 'yyyy-MM-dd');
    
    // Only dispatch if there are events to remove
    if (this.stateService.getEvents(dateKey)?.length > 0) {
      this.stateService.clearEvents(date);
      
      // Dispatch events-removed event
      this.eventDispatcherService.dispatchEventsRemovedEvent(dateKey);
    }
  }
  
  /**
   * Add a disabled date (e.g., a public holiday or unavailable date)
   * @param date The date to disable
   * @param reason Optional reason for disabling (e.g., "Public Holiday - Christmas")
   */
  public addDisabledDate(date: Date, reason: string = '') {
    this.stateService.addDisabledDate(date, reason);
    // Trigger a UI refresh if the calendar is open
    if (this.stateService.isOpen) {
      this.uiService.updateUI();
    }
  }
  
  /**
   * Remove a previously disabled date
   * @param date The date to enable
   */
  public removeDisabledDate(date: Date) {
    this.stateService.removeDisabledDate(date);
    // Trigger a UI refresh if the calendar is open
    if (this.stateService.isOpen) {
      this.uiService.updateUI();
    }
  }
  
  /**
   * Add multiple disabled dates at once
   * @param dates Array of dates to disable
   * @param reason Optional shared reason for all dates (e.g., "Public Holidays")
   */
  public addDisabledDates(dates: Date[], reason: string = '') {
    this.stateService.addDisabledDates(dates, reason);
    // Trigger a UI refresh if the calendar is open
    if (this.stateService.isOpen) {
      this.uiService.updateUI();
    }
  }
  
  /**
   * Clear all disabled dates
   */
  public clearDisabledDates() {
    this.stateService.clearDisabledDates();
    // Trigger a UI refresh if the calendar is open
    if (this.stateService.isOpen) {
      this.uiService.updateUI();
    }
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

  /**
   * Toggle calendar visibility
   * Public method to allow developers to open/close the calendar programmatically
   */
  public toggleCalendar(): void {
    // Check if the component is disabled - don't open if it is
    if (this.hasAttribute('disabled') && !this.stateService.isOpen) {
      return; // Don't open calendar if the component is disabled
    }
    
    // Set a flag to indicate this is just a toggle operation
    // This prevents date-clear events from being triggered accidentally
    this._eventBatch.add('toggle-only');
    
    // Set flag to prevent input focus when toggling calendar
    this._preventInputFocus = true;
    
    const wasOpen = this.stateService.isOpen;
    
    // If we're opening the calendar, reset to calendar view and use current date if no date selected
    if (!wasOpen) {
      // Set flags to indicate calendar was just opened and to prevent date-change events
      this._calendarJustOpened = true;
      this._preventDateChangeOnFocus = true;
      
      // Always reset to calendar (day) view when opening
      this.stateService.currentView = 'calendar';
      
      // Set view date based on the following priority:
      // 1. Selected date (if exists)
      // 2. Range start date (if in range mode)
      // 3. Current date (if nothing is selected)
      if (this.stateService.selectedDate) {
        // Use the selected date for the view
        this.stateService.viewDate = new Date(this.stateService.selectedDate);
      } else if (this.stateService.isRangeMode && this.stateService.rangeStart) {
        // In range mode, use the range start date for the view
        this.stateService.viewDate = new Date(this.stateService.rangeStart);
      } else {
        // If no date is selected, use current date for viewing
        const today = new Date();
        this.stateService.viewDate = today;
      }
    }
    
    // Toggle the open state
    this.stateService.isOpen = !wasOpen;
    
    // Reset focus prevention flag after a short delay
    setTimeout(() => {
      this._preventInputFocus = false;
      // Also reset the date-change prevention flag
      this._preventDateChangeOnFocus = false;
    }, 100);
  }

  /**
   * Process a date selection in range mode
   * This is called when a date is clicked in range mode
   */
  public handleRangeDateSelection(date: Date): void {
    if (this.stateService.isDateDisabled(date)) {
      return;
    }

    if (!this.stateService.rangeSelectionInProgress) {
      // First date in range selection
      this.stateService.resetRangeSelection();
      this.stateService.rangeStart = date;
      this.stateService.rangeSelectionInProgress = true;
      
      // Dispatch range-start event
      this.eventDispatcherService.dispatchRangeStartEvent(
        date,
        this.formatter.format(date, this.stateService.format)
      );
    } else {
      // Second date in range selection
      if (this.stateService.isSameDate(date, this.stateService.rangeStart!)) {
        // Same date selected - make it a one-day range
        this.stateService.rangeEnd = new Date(this.stateService.rangeStart!);
      } else if (date < this.stateService.rangeStart!) {
        // Selected date is before start date - swap them
        this.stateService.rangeEnd = new Date(this.stateService.rangeStart!);
        this.stateService.rangeStart = date;
      } else {
        // Normal range selection
        this.stateService.rangeEnd = date;
      }
      
      this.stateService.rangeSelectionInProgress = false;
      
      // Get available dates in the range
      const availableDates = this.getAvailableDatesInRange();
      const formattedDates = availableDates.map(d => 
        this.formatter.format(d, this.stateService.format)
      );
      
      // Dispatch range-complete event
      this.eventDispatcherService.dispatchRangeCompleteEvent(
        this.stateService.rangeStart!,
        this.stateService.rangeEnd!,
        `${this.formatter.format(this.stateService.rangeStart!, this.stateService.format)} - ${
          this.formatter.format(this.stateService.rangeEnd!, this.stateService.format)
        }`
      );
      
      // Also dispatch range-change event
      this.eventDispatcherService.dispatchRangeChangeEvent(
        this.stateService.rangeStart!,
        this.stateService.rangeEnd!,
        this.formatter.format(this.stateService.rangeStart!, this.stateService.format),
        this.formatter.format(this.stateService.rangeEnd!, this.stateService.format),
        availableDates,
        formattedDates,
        'calendar-selection'
      );
      
      // Update the last selected date to prevent duplicate events
      this._lastSelectedDate = `${this.formatter.format(this.stateService.rangeStart!, 'yyyy-MM-dd')}-${
        this.formatter.format(this.stateService.rangeEnd!, 'yyyy-MM-dd')
      }`;
    }
  }
}

/**
 * Define the custom element
 */
export const defineDatePicker = () => defineCustomElement('odyssey-date-picker', DatePicker);