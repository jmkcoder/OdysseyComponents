import { CalendarViewMode } from './ui-updater.service';
import { EventBatcher, createBatchedEventDispatcher } from '../../../utilities/event-batching';

/**
 * Interface for the DateChangeEvent metadata
 */
export interface DateChangeEventMetadata {
  stateService: any;
  formatter: any;
  lastSelectedDate: string | null;
  dateChangePrevented: boolean;
  updateLastSelectedValue: (value: string | null) => void;
  isInitializing?: boolean; // Flag to indicate component is initializing
}

/**
 * Service responsible for dispatching custom events
 */
export class EventDispatcherService {
  private _host: HTMLElement;
  private _pendingEvents: Map<string, any> = new Map();
  private _eventBatchTimer: number | null = null;
  private _dateChangeDebounceTime: number = 100; // Default debounce time in ms
  private _eventBatcher: EventBatcher<DateChangeEventMetadata>;
  private _isInitializing: boolean = true; // Track initialization state
  private _suppressEvents: boolean = false; // Flag to completely suppress event dispatching

  constructor(host: HTMLElement) {
    this._host = host;
    
    // Initialize the EventBatcher for date change events
    this._eventBatcher = new EventBatcher<DateChangeEventMetadata>(
      this.handleBatchedEvents.bind(this), 
      { debounceTime: this._dateChangeDebounceTime }
    );
    
    // Set initialization state to complete after a small delay
    setTimeout(() => {
      this._isInitializing = false;
    }, 200); // Increased from 100ms to 200ms to ensure all initialization is complete
  }

  /**
   * Set the initialization state
   */
  setInitializing(value: boolean): void {
    this._isInitializing = value;
  }

  /**
   * Check if the service is in initialization state
   */
  isInitializing(): boolean {
    return this._isInitializing;
  }

  /**
   * Temporarily suppress all event dispatching
   */
  suppressEvents(value: boolean = true): void {
    this._suppressEvents = value;
  }

  /**
   * Set the element to dispatch events on
   */
  setElement(element: HTMLElement): void {
    this._host = element;
  }

  /**
   * Set the debounce time for batched events
   */
  setDebounceTime(time: number): void {
    this._dateChangeDebounceTime = time;
  }

  /**
   * Add an event to the batch queue
   * @param eventName The name of the event
   * @param detail The event details
   * @param immediate Whether to dispatch the event immediately
   */
  private queueEvent(eventName: string, detail: any = null, immediate: boolean = false): void {
    // Skip event dispatching completely if suppressed
    if (this._suppressEvents) {
      return;
    }
    
    // Skip date-change events during initialization
    if ((this._isInitializing || this._suppressEvents) && eventName === 'date-change') {
      return;
    }
    
    // Store event in the pending map
    this._pendingEvents.set(eventName, { 
      detail,
      timestamp: Date.now()
    });

    // If immediate flag is set, dispatch right away
    if (immediate) {
      this.processEventQueue();
      return;
    }

    // Cancel any existing timer
    if (this._eventBatchTimer !== null) {
      window.clearTimeout(this._eventBatchTimer);
    }

    // Set timer to process the batch
    this._eventBatchTimer = window.setTimeout(() => {
      this.processEventQueue();
    }, this._dateChangeDebounceTime);
  }

  /**
   * Process all pending events in the queue
   */
  private processEventQueue(): void {
    // Skip processing if events are suppressed
    if (this._suppressEvents) {
      this._pendingEvents.clear();
      this._eventBatchTimer = null;
      return;
    }

    // Clear the timer
    this._eventBatchTimer = null;

    // Process each event
    this._pendingEvents.forEach((eventInfo, eventName) => {
      // Skip date-change events during initialization
      if ((this._isInitializing || this._suppressEvents) && eventName === 'date-change') {
        return;
      }
      
      const { detail } = eventInfo;
      
      // Create and dispatch the event
      const event = new CustomEvent(eventName, {
        bubbles: true,
        composed: true,
        detail
      });

      this._host.dispatchEvent(event);
    });

    // Clear the queue
    this._pendingEvents.clear();
  }

  /**
   * Dispatch a focused date change event
   */
  dispatchFocusDateEvent(date: Date): void {
    this.queueEvent('focus-date', {
      date: new Date(date) // Create a new Date to avoid reference issues
    }, true);
  }
  
  /**
   * Dispatch a focused month change event
   */
  dispatchFocusMonthEvent(year: number, month: number): void {
    this.queueEvent('focus-month', {
      year,
      month
    }, true);
  }
  
  /**
   * Dispatch a focused year change event
   */
  dispatchFocusYearEvent(year: number): void {
    this.queueEvent('focus-year', {
      year
    }, true);
  }

  /**
   * Dispatch a month change event
   */
  dispatchMonthChangeEvent(year: number, month: number): void {
    this.queueEvent('month-change', {
      year,
      month
    }, true);
  }

  /**
   * Dispatch a year change event
   */
  dispatchYearChangeEvent(year: number): void {
    this.queueEvent('year-change', {
      year
    }, true);
  }

  /**
   * Dispatch event when view mode changes (days, months, years)
   */
  dispatchViewModeChangeEvent(viewMode: CalendarViewMode): void {
    this.queueEvent('view-mode-change', {
      viewMode
    }, true);
  }

  /**
   * Dispatch event when events are added
   */
  dispatchEventsAddedEvent(events: Record<string, string[]>): void {
    this.queueEvent('events-added', {
      events
    }, true);
  }

  /**
   * Dispatch event when events are removed
   */
  dispatchEventsRemovedEvent(date: string): void {
    this.queueEvent('events-removed', {
      date
    }, true);
  }

  /**
   * Dispatch event when all events are cleared
   */
  dispatchEventsClearedEvent(): void {
    this.queueEvent('events-cleared', null, true);
  }

  /**
   * Dispatch mode change event
   */
  dispatchModeChangeEvent(mode: string): void {
    this.queueEvent('mode-change', {
      mode
    }, true);
  }

  /**
   * Dispatch range start event when the first date in a range is selected
   */
  dispatchRangeStartEvent(startDate: Date | null, formattedDate: string | null): void {
    this.queueEvent('range-start', {
      startDate,
      formattedDate
    }, true);
  }

  /**
   * Dispatch range complete event when both dates in a range are selected
   */
  dispatchRangeCompleteEvent(startDate: Date, endDate: Date, formattedRange: string): void {
    this.queueEvent('range-complete', {
      startDate,
      endDate,
      formattedRange
    }, true);
  }

  /**
   * Dispatch range clear event when a date range is cleared
   */
  dispatchRangeClearEvent(): void {
    this.queueEvent('range-clear', null, true);
  }

  /**
   * Dispatch a date change event for a single date selection
   */
  dispatchDateChangeEvent(date: Date, formattedDate: string, events: string[], source: string = 'calendar-selection'): void {
    this.queueEvent('date-change', {
      date: formattedDate,
      dateObj: new Date(date),
      events,
      hasEvents: events.length > 0,
      source
    });
  }

  /**
   * Dispatch a date change event for a date range selection
   */
  dispatchRangeChangeEvent(
    startDate: Date, 
    endDate: Date, 
    formattedStart: string, 
    formattedEnd: string, 
    availableDates: Date[],
    formattedDates: string[],
    source: string = 'calendar-selection'
  ): void {
    this.queueEvent('date-change', {
      rangeStart: formattedStart,
      rangeEnd: formattedEnd,
      availableDates: formattedDates,
      availableDatesObjects: availableDates,
      source
    });
  }

  /**
   * Dispatch a calendar open event
   */
  dispatchCalendarOpenEvent(): void {
    this.queueEvent('calendar-open', null, true);
  }

  /**
   * Dispatch a calendar close event
   */
  dispatchCalendarCloseEvent(): void {
    this.queueEvent('calendar-close', null, true);
  }

  /**
   * Dispatch a date clear event
   */
  dispatchDateClearEvent(): void {
    this.queueEvent('date-clear', null, true);
  }

  /**
   * Handler for processing batched events
   */
  private handleBatchedEvents(eventTypes: Set<string>, metadata?: DateChangeEventMetadata): void {
    if (!metadata) return;
    
    // Skip processing if events are suppressed
    if (this._suppressEvents) {
      return;
    }
    
    const { stateService, formatter, lastSelectedDate, dateChangePrevented, updateLastSelectedValue, isInitializing } = metadata;
    
    // Skip date-change event during initialization or if this was just an open/close action or toggle
    if (isInitializing || this._isInitializing || this._suppressEvents || 
        (eventTypes.size === 1 && eventTypes.has('open-state')) || 
        eventTypes.has('toggle-only')) {
      return;
    }
    
    // Get current value for comparison
    const getCurrentValue = () => {
      if (stateService.isRangeMode && stateService.rangeStart && stateService.rangeEnd) {
        return `${formatter.format(stateService.rangeStart, 'yyyy-MM-dd')}-${formatter.format(stateService.rangeEnd, 'yyyy-MM-dd')}`;
      } else if (!stateService.isRangeMode && stateService.selectedDate) {
        return formatter.format(stateService.selectedDate, 'yyyy-MM-dd');
      }
      return null;
    };

    // Check if this is the same date as the last event we dispatched
    const currentValue = getCurrentValue();
    const isDuplicate = lastSelectedDate === currentValue;
    const isManualInput = eventTypes.has('manual-input');
    const isClearAction = eventTypes.has('clear-action');
    const wasClearAction = isClearAction || 
                        (lastSelectedDate !== null && currentValue === null);
    
    // Handle range mode
    if (stateService.isRangeMode) {
      if (stateService.rangeStart && stateService.rangeEnd) {
        // Get available dates within the range
        const availableDates = stateService.getAvailableDatesInRange(stateService.rangeStart, stateService.rangeEnd);
        const formattedDates = availableDates.map((date: Date) => 
          formatter.format(date, stateService.format)
        );
        
        // Only dispatch if not a manual input and not a duplicate
        if (!isManualInput && !isDuplicate && !dateChangePrevented) {
          this.queueEvent('date-change', {
            rangeStart: formatter.format(stateService.rangeStart, stateService.format),
            rangeEnd: formatter.format(stateService.rangeEnd, stateService.format),
            availableDates: formattedDates,
            availableDatesObjects: availableDates,
            source: 'calendar-selection'
          });
        }
      } else if (!stateService.rangeStart && !stateService.rangeEnd && wasClearAction) {
        // Reset the last selected date
        updateLastSelectedValue(null);
        
        // Dispatch clear event
        this.queueEvent('date-clear', null, true);
      }
    } else {
      // Single date mode
      if (stateService.selectedDate) {
        // Get any events for the selected date
        const dateKey = formatter.format(stateService.selectedDate, 'yyyy-MM-dd');
        const eventsForDate = stateService.getEvents(dateKey) || [];
        
        // Only dispatch if not a manual input and not a duplicate
        if (!isManualInput && !isDuplicate && !dateChangePrevented) {
          this.queueEvent('date-change', {
            date: formatter.format(stateService.selectedDate, stateService.format),
            dateObj: new Date(stateService.selectedDate),
            events: eventsForDate,
            hasEvents: eventsForDate.length > 0,
            source: 'calendar-selection'
          });
        }
      } else if (wasClearAction) {
        // Reset the last selected date
        updateLastSelectedValue(null);
        
        // Dispatch clear event
        this.queueEvent('date-clear', null, true);
      }
    }
    
    // Update the last selected date value if not a clear action
    if (!isClearAction) {
      updateLastSelectedValue(currentValue);
    }

    // Process all queued events
    if (this._pendingEvents.size > 0) {
      this.processEventQueue();
    }
  }

  /**
   * Process batched events for the DatePicker component
   * This is used by the DatePicker component to handle date selection events
   */
  processBatchedEvents(
    stateService: any,
    formatter: any,
    lastSelectedDate: string | null,
    dateChangePrevented: boolean,
    eventBatch: Set<string>,
    updateLastSelectedValue: (value: string | null) => void,
    isInitializing: boolean = false
  ): void {
    // Skip processing during initialization
    if (isInitializing || this._isInitializing || this._suppressEvents) {
      return;
    }
    
    // Set metadata for the event batch
    const metadata: DateChangeEventMetadata = {
      stateService,
      formatter,
      lastSelectedDate,
      dateChangePrevented,
      updateLastSelectedValue,
      isInitializing
    };
    
    this._eventBatcher.setMetadata(metadata);
    
    // Add all event types from the incoming batch
    eventBatch.forEach(eventType => {
      this._eventBatcher.addEvent(eventType);
    });
    
    // Force processing the batch immediately
    this._eventBatcher.processBatch();
  }
}