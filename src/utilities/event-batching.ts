/**
 * EventBatching utility
 * 
 * A utility for batching multiple state changes and dispatching a single event.
 * This helps improve performance and avoid redundant event dispatching.
 */

/**
 * Callback for handling batched events
 */
export type BatchedEventHandler<T = any> = (eventTypes: Set<string>, metadata?: T) => void;

/**
 * Configuration options for the EventBatcher
 */
export interface EventBatcherOptions {
  /**
   * Debounce time in milliseconds
   */
  debounceTime?: number;
}

/**
 * EventBatcher class for batching multiple events into a single callback
 */
export class EventBatcher<T = any> {
  private pendingEvent: boolean = false;
  private eventBatch: Set<string> = new Set();
  private eventBatchTimer: number | null = null;
  private debounceTime: number;
  private metadata?: T;
  private handler: BatchedEventHandler<T>;

  /**
   * Create a new EventBatcher
   * 
   * @param handler Function that will be called with all batched event types
   * @param options Configuration options
   */
  constructor(handler: BatchedEventHandler<T>, options: EventBatcherOptions = {}) {
    this.handler = handler;
    this.debounceTime = options.debounceTime || 100;
  }

  /**
   * Add an event type to the current batch
   * 
   * @param eventType Type/name of the event to add to the batch
   * @param immediate If true, process the batch immediately instead of waiting for the debounce
   */
  addEvent(eventType: string, immediate: boolean = false): void {
    this.eventBatch.add(eventType);
    
    // Start batching this event if not already batching
    if (!this.pendingEvent) {
      // Start a new event batch
      this.pendingEvent = true;
      
      if (immediate) {
        this.processBatch();
      } else {
        // Cancel any existing timer
        if (this.eventBatchTimer !== null) {
          window.clearTimeout(this.eventBatchTimer);
        }
        
        // Set timer to process the batch
        this.eventBatchTimer = window.setTimeout(() => {
          this.processBatch();
        }, this.debounceTime);
      }
    }
  }

  /**
   * Set metadata to be included with the batch
   * This can be used to pass additional information to the handler
   * 
   * @param data Any data to associate with this batch
   */
  setMetadata(data: T): void {
    this.metadata = data;
  }

  /**
   * Process the current batch of events
   */
  processBatch(): void {
    // Reset batch state
    this.pendingEvent = false;
    this.eventBatchTimer = null;
    
    // Call the handler with the collected event types
    if (this.eventBatch.size > 0) {
      this.handler(this.eventBatch, this.metadata);
    }
    
    // Clear the batch
    this.eventBatch.clear();
    this.metadata = undefined;
  }

  /**
   * Check if the batch contains a specific event type
   * 
   * @param eventType Type/name of the event to check for
   * @returns True if the batch contains the event type
   */
  has(eventType: string): boolean {
    return this.eventBatch.has(eventType);
  }

  /**
   * Clear all pending events without processing them
   */
  clear(): void {
    if (this.eventBatchTimer !== null) {
      window.clearTimeout(this.eventBatchTimer);
      this.eventBatchTimer = null;
    }
    this.pendingEvent = false;
    this.eventBatch.clear();
    this.metadata = undefined;
  }
}

/**
 * Create a simple batched event dispatcher that dispatches CustomEvents
 * 
 * @param element The HTML element to dispatch events on
 * @param eventName The name of the custom event to dispatch
 * @param options Configuration options
 * @returns An EventBatcher instance
 * 
 * @example
 * // Create a batched event dispatcher
 * const batchedDispatcher = createBatchedEventDispatcher(myElement, 'state-change');
 * 
 * // Add events to the batch
 * batchedDispatcher.addEvent('value-change');
 * batchedDispatcher.addEvent('selection-change');
 * 
 * // The handler will be called once with both event types after the debounce time
 */
export function createBatchedEventDispatcher<T = any>(
  element: HTMLElement,
  eventName: string,
  options: EventBatcherOptions = {}
): EventBatcher<T> {
  return new EventBatcher<T>((eventTypes, metadata) => {
    element.dispatchEvent(new CustomEvent(eventName, {
      detail: {
        eventTypes: Array.from(eventTypes),
        ...(metadata || {})
      },
      bubbles: true,
      composed: true
    }));
  }, options);
}