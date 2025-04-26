import { CalendarViewMode } from './ui-updater.service';

/**
 * Service responsible for dispatching custom events
 */
export class EventDispatcherService {
  private _host: HTMLElement;

  constructor(host: HTMLElement) {
    this._host = host;
  }

  /**
   * Set the element to dispatch events on
   */
  setElement(element: HTMLElement): void {
    this._host = element;
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

    this._host.dispatchEvent(event);
  }

  /**
   * Dispatch an open event when calendar opens
   */
  dispatchOpenEvent(): void {
    const event = new CustomEvent('open', {
      bubbles: true,
      composed: true
    });

    this._host.dispatchEvent(event);
  }

  /**
   * Dispatch a close event when calendar closes
   */
  dispatchCloseEvent(): void {
    const event = new CustomEvent('close', {
      bubbles: true,
      composed: true
    });

    this._host.dispatchEvent(event);
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

    this._host.dispatchEvent(event);
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

    this._host.dispatchEvent(event);
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

    this._host.dispatchEvent(event);
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

    this._host.dispatchEvent(event);
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

    this._host.dispatchEvent(event);
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

    this._host.dispatchEvent(event);
  }

  /**
   * Dispatch event when all events are cleared
   */
  dispatchEventsClearedEvent(): void {
    const event = new CustomEvent('events-cleared', {
      bubbles: true,
      composed: true
    });

    this._host.dispatchEvent(event);
  }

  /**
   * Dispatch mode change event
   */
  dispatchModeChangeEvent(mode: string): void {
    const event = new CustomEvent('mode-change', {
      detail: {
        mode
      },
      bubbles: true,
      composed: true
    });

    this._host.dispatchEvent(event);
  }

  /**
   * Dispatch range start event when the first date in a range is selected
   */
  dispatchRangeStartEvent(startDate: Date | null, formattedDate: string | null): void {
    const event = new CustomEvent('range-start', {
      detail: {
        startDate,
        formattedDate
      },
      bubbles: true,
      composed: true
    });

    this._host.dispatchEvent(event);
  }

  /**
   * Dispatch range complete event when both dates in a range are selected
   */
  dispatchRangeCompleteEvent(startDate: Date, endDate: Date, formattedRange: string): void {
    const event = new CustomEvent('range-complete', {
      detail: {
        startDate,
        endDate,
        formattedRange
      },
      bubbles: true,
      composed: true
    });

    this._host.dispatchEvent(event);
  }

  /**
   * Dispatch range clear event when a date range is cleared
   */
  dispatchRangeClearEvent(): void {
    const event = new CustomEvent('range-clear', {
      bubbles: true,
      composed: true
    });

    this._host.dispatchEvent(event);
  }
}