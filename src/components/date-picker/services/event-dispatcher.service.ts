import { CalendarViewMode } from './ui-updater.service';

/**
 * Service responsible for dispatching custom events
 */
export class EventDispatcherService {
  private _element: HTMLElement;

  constructor(element: HTMLElement) {
    this._element = element;
  }

  /**
   * Set the element to dispatch events on
   */
  setElement(element: HTMLElement): void {
    this._element = element;
  }

  /**
   * Dispatch a date selection change event
   */
  dispatchChangeEvent(date: Date | null, formattedDate: string | null, isoDate: string | null): void {
    const event = new CustomEvent('change', {
      bubbles: true,
      composed: true,
      detail: {
        date,
        formattedDate,
        isoDate
      }
    });

    this._element.dispatchEvent(event);
  }

  /**
   * Dispatch an open event when calendar opens
   */
  dispatchOpenEvent(): void {
    const event = new CustomEvent('open', {
      bubbles: true,
      composed: true
    });

    this._element.dispatchEvent(event);
  }

  /**
   * Dispatch a close event when calendar closes
   */
  dispatchCloseEvent(): void {
    const event = new CustomEvent('close', {
      bubbles: true,
      composed: true
    });

    this._element.dispatchEvent(event);
  }

  /**
   * Dispatch a focused date change event
   */
  dispatchFocusDateEvent(date: Date): void {
    const event = new CustomEvent('focus-date', {
      bubbles: true,
      composed: true,
      detail: {
        date: new Date(date) // Create a new Date to avoid reference issues
      }
    });

    this._element.dispatchEvent(event);
  }

  /**
   * Dispatch a month change event
   */
  dispatchMonthChangeEvent(year: number, month: number): void {
    const event = new CustomEvent('month-change', {
      bubbles: true,
      composed: true,
      detail: {
        year,
        month
      }
    });

    this._element.dispatchEvent(event);
  }

  /**
   * Dispatch a year change event
   */
  dispatchYearChangeEvent(year: number): void {
    const event = new CustomEvent('year-change', {
      bubbles: true,
      composed: true,
      detail: {
        year
      }
    });

    this._element.dispatchEvent(event);
  }

  /**
   * Dispatch event when view mode changes (days, months, years)
   */
  dispatchViewModeChangeEvent(viewMode: CalendarViewMode): void {
    const event = new CustomEvent('view-mode-change', {
      bubbles: true,
      composed: true,
      detail: {
        viewMode
      }
    });

    this._element.dispatchEvent(event);
  }

  /**
   * Dispatch event when events are added
   */
  dispatchEventsAddedEvent(events: Record<string, string[]>): void {
    const event = new CustomEvent('events-added', {
      bubbles: true,
      composed: true,
      detail: {
        events
      }
    });

    this._element.dispatchEvent(event);
  }

  /**
   * Dispatch event when events are removed
   */
  dispatchEventsRemovedEvent(date: string): void {
    const event = new CustomEvent('events-removed', {
      bubbles: true,
      composed: true,
      detail: {
        date
      }
    });

    this._element.dispatchEvent(event);
  }

  /**
   * Dispatch event when all events are cleared
   */
  dispatchEventsClearedEvent(): void {
    const event = new CustomEvent('events-cleared', {
      bubbles: true,
      composed: true
    });

    this._element.dispatchEvent(event);
  }
}