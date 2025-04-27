import { EventDispatcherService } from '../../services/event-dispatcher.service';
import { CalendarViewMode } from '../../services/ui-updater.service';

describe('EventDispatcherService', () => {
  let eventDispatcherService: EventDispatcherService;
  let hostElement: HTMLElement;

  beforeEach(() => {
    // Create a host element
    hostElement = document.createElement('div');
    document.body.appendChild(hostElement);
    
    // Initialize the service with the host element
    eventDispatcherService = new EventDispatcherService(hostElement);
  });

  afterEach(() => {
    // Clean up
    if (hostElement.parentNode) {
      hostElement.parentNode.removeChild(hostElement);
    }
  });

  describe('setElement', () => {
    it('should update the host element', () => {
      // Create a new host element
      const newHostElement = document.createElement('span');
      
      // Set the new host element
      eventDispatcherService.setElement(newHostElement);
      
      // Dispatch an event to verify the host was changed
      const spy = jest.spyOn(newHostElement, 'dispatchEvent');
      eventDispatcherService.dispatchCloseEvent();
      
      expect(spy).toHaveBeenCalled();
    });
  });

  describe('dispatchChangeEvent', () => {
    it('should dispatch a change event with correct detail', () => {
      // Set up a listener to check the event
      const changeHandler = jest.fn();
      hostElement.addEventListener('change', changeHandler);
      
      // Test data
      const testDate = new Date(2025, 3, 15); // April 15, 2025
      const formattedDate = '04/15/2025';
      const isoDate = '2025-04-15';
      
      // Dispatch the event
      eventDispatcherService.dispatchChangeEvent(testDate, formattedDate, isoDate);
      
      // Verify the event was dispatched with correct details
      expect(changeHandler).toHaveBeenCalled();
      const eventDetail = changeHandler.mock.calls[0][0].detail;
      expect(eventDetail.date).toEqual(testDate);
      expect(eventDetail.formattedDate).toBe(formattedDate);
      expect(eventDetail.isoDate).toBe(isoDate);
    });
    
    it('should handle null date values', () => {
      // Set up a listener to check the event
      const changeHandler = jest.fn();
      hostElement.addEventListener('change', changeHandler);
      
      // Dispatch the event with null values
      eventDispatcherService.dispatchChangeEvent(null, null, null);
      
      // Verify the event was dispatched with null details
      expect(changeHandler).toHaveBeenCalled();
      const eventDetail = changeHandler.mock.calls[0][0].detail;
      expect(eventDetail.date).toBeNull();
      expect(eventDetail.formattedDate).toBeNull();
      expect(eventDetail.isoDate).toBeNull();
    });
  });

  describe('dispatchOpenEvent', () => {
    it('should dispatch open event', () => {
      // Set up a listener to check the event
      const openHandler = jest.fn();
      hostElement.addEventListener('open', openHandler);
      
      // Dispatch the event
      eventDispatcherService.dispatchOpenEvent();
      
      // Verify the event was dispatched
      expect(openHandler).toHaveBeenCalled();
    });
  });

  describe('dispatchCloseEvent', () => {
    it('should dispatch close event', () => {
      // Set up a listener to check the event
      const closeHandler = jest.fn();
      hostElement.addEventListener('close', closeHandler);
      
      // Dispatch the event
      eventDispatcherService.dispatchCloseEvent();
      
      // Verify the event was dispatched
      expect(closeHandler).toHaveBeenCalled();
    });
  });

  describe('dispatchFocusDateEvent', () => {
    it('should dispatch focus-date event with date detail', () => {
      // Set up a listener to check the event
      const focusHandler = jest.fn();
      hostElement.addEventListener('focus-date', focusHandler);
      
      // Test date
      const testDate = new Date(2025, 3, 15);
      
      // Dispatch the event
      eventDispatcherService.dispatchFocusDateEvent(testDate);
      
      // Verify the event was dispatched with correct details
      expect(focusHandler).toHaveBeenCalled();
      const eventDetail = focusHandler.mock.calls[0][0].detail;
      expect(eventDetail.date instanceof Date).toBe(true);
      expect(eventDetail.date.getFullYear()).toBe(2025);
      expect(eventDetail.date.getMonth()).toBe(3); // April
      expect(eventDetail.date.getDate()).toBe(15);
    });
    
    it('should create a new date instance to avoid reference issues', () => {
      // Set up a listener to check the event
      const focusHandler = jest.fn();
      hostElement.addEventListener('focus-date', focusHandler);
      
      // Test date
      const testDate = new Date(2025, 3, 15);
      
      // Dispatch the event
      eventDispatcherService.dispatchFocusDateEvent(testDate);
      
      // Verify a new date instance was created (not the same reference)
      const eventDetail = focusHandler.mock.calls[0][0].detail;
      expect(eventDetail.date).not.toBe(testDate);
      expect(eventDetail.date.getTime()).toBe(testDate.getTime());
    });
  });

  describe('dispatchMonthChangeEvent', () => {
    it('should dispatch month-change event with year and month details', () => {
      // Set up a listener to check the event
      const monthChangeHandler = jest.fn();
      hostElement.addEventListener('month-change', monthChangeHandler);
      
      // Test data
      const year = 2025;
      const month = 3; // April
      
      // Dispatch the event
      eventDispatcherService.dispatchMonthChangeEvent(year, month);
      
      // Verify the event was dispatched with correct details
      expect(monthChangeHandler).toHaveBeenCalled();
      const eventDetail = monthChangeHandler.mock.calls[0][0].detail;
      expect(eventDetail.year).toBe(year);
      expect(eventDetail.month).toBe(month);
    });
  });

  describe('dispatchYearChangeEvent', () => {
    it('should dispatch year-change event with year detail', () => {
      // Set up a listener to check the event
      const yearChangeHandler = jest.fn();
      hostElement.addEventListener('year-change', yearChangeHandler);
      
      // Test year
      const year = 2025;
      
      // Dispatch the event
      eventDispatcherService.dispatchYearChangeEvent(year);
      
      // Verify the event was dispatched with correct detail
      expect(yearChangeHandler).toHaveBeenCalled();
      const eventDetail = yearChangeHandler.mock.calls[0][0].detail;
      expect(eventDetail.year).toBe(year);
    });
  });

  describe('dispatchViewModeChangeEvent', () => {
    it('should dispatch view-mode-change event with viewMode detail', () => {
      // Set up a listener to check the event
      const viewModeChangeHandler = jest.fn();
      hostElement.addEventListener('view-mode-change', viewModeChangeHandler);
      
      // Test view mode
      const viewMode: CalendarViewMode = CalendarViewMode.MONTHS;
      
      // Dispatch the event
      eventDispatcherService.dispatchViewModeChangeEvent(viewMode);
      
      // Verify the event was dispatched with correct detail
      expect(viewModeChangeHandler).toHaveBeenCalled();
      const eventDetail = viewModeChangeHandler.mock.calls[0][0].detail;
      expect(eventDetail.viewMode).toBe(viewMode);
    });
  });

  describe('dispatchEventsAddedEvent', () => {
    it('should dispatch events-added event with events detail', () => {
      // Set up a listener to check the event
      const eventsAddedHandler = jest.fn();
      hostElement.addEventListener('events-added', eventsAddedHandler);
      
      // Test events data
      const events = {
        '2025-04-15': ['Meeting', 'Lunch'],
        '2025-04-16': ['Conference']
      };
      
      // Dispatch the event
      eventDispatcherService.dispatchEventsAddedEvent(events);
      
      // Verify the event was dispatched with correct detail
      expect(eventsAddedHandler).toHaveBeenCalled();
      const eventDetail = eventsAddedHandler.mock.calls[0][0].detail;
      expect(eventDetail.events).toEqual(events);
    });
  });

  describe('dispatchEventsRemovedEvent', () => {
    it('should dispatch events-removed event with date detail', () => {
      // Set up a listener to check the event
      const eventsRemovedHandler = jest.fn();
      hostElement.addEventListener('events-removed', eventsRemovedHandler);
      
      // Test date
      const dateString = '2025-04-15';
      
      // Dispatch the event
      eventDispatcherService.dispatchEventsRemovedEvent(dateString);
      
      // Verify the event was dispatched with correct detail
      expect(eventsRemovedHandler).toHaveBeenCalled();
      const eventDetail = eventsRemovedHandler.mock.calls[0][0].detail;
      expect(eventDetail.date).toBe(dateString);
    });
  });

  describe('dispatchEventsClearedEvent', () => {
    it('should dispatch events-cleared event', () => {
      // Set up a listener to check the event
      const eventsClearedHandler = jest.fn();
      hostElement.addEventListener('events-cleared', eventsClearedHandler);
      
      // Dispatch the event
      eventDispatcherService.dispatchEventsClearedEvent();
      
      // Verify the event was dispatched
      expect(eventsClearedHandler).toHaveBeenCalled();
    });
  });

  describe('dispatchModeChangeEvent', () => {
    it('should dispatch mode-change event with mode detail', () => {
      // Set up a listener to check the event
      const modeChangeHandler = jest.fn();
      hostElement.addEventListener('mode-change', modeChangeHandler);
      
      // Test mode
      const mode = 'range';
      
      // Dispatch the event
      eventDispatcherService.dispatchModeChangeEvent(mode);
      
      // Verify the event was dispatched with correct detail
      expect(modeChangeHandler).toHaveBeenCalled();
      const eventDetail = modeChangeHandler.mock.calls[0][0].detail;
      expect(eventDetail.mode).toBe(mode);
    });
  });

  describe('dispatchRangeStartEvent', () => {
    it('should dispatch range-start event with date and formatted date details', () => {
      // Set up a listener to check the event
      const rangeStartHandler = jest.fn();
      hostElement.addEventListener('range-start', rangeStartHandler);
      
      // Test data
      const startDate = new Date(2025, 3, 15);
      const formattedDate = '04/15/2025';
      
      // Dispatch the event
      eventDispatcherService.dispatchRangeStartEvent(startDate, formattedDate);
      
      // Verify the event was dispatched with correct details
      expect(rangeStartHandler).toHaveBeenCalled();
      const eventDetail = rangeStartHandler.mock.calls[0][0].detail;
      expect(eventDetail.startDate).toBe(startDate);
      expect(eventDetail.formattedDate).toBe(formattedDate);
    });
    
    it('should handle null values', () => {
      // Set up a listener to check the event
      const rangeStartHandler = jest.fn();
      hostElement.addEventListener('range-start', rangeStartHandler);
      
      // Dispatch the event with null values
      eventDispatcherService.dispatchRangeStartEvent(null, null);
      
      // Verify the event was dispatched with null details
      expect(rangeStartHandler).toHaveBeenCalled();
      const eventDetail = rangeStartHandler.mock.calls[0][0].detail;
      expect(eventDetail.startDate).toBeNull();
      expect(eventDetail.formattedDate).toBeNull();
    });
  });

  describe('dispatchRangeCompleteEvent', () => {
    it('should dispatch range-complete event with start, end, and formatted range details', () => {
      // Set up a listener to check the event
      const rangeCompleteHandler = jest.fn();
      hostElement.addEventListener('range-complete', rangeCompleteHandler);
      
      // Test data
      const startDate = new Date(2025, 3, 15);
      const endDate = new Date(2025, 3, 20);
      const formattedRange = '04/15/2025 - 04/20/2025';
      
      // Dispatch the event
      eventDispatcherService.dispatchRangeCompleteEvent(startDate, endDate, formattedRange);
      
      // Verify the event was dispatched with correct details
      expect(rangeCompleteHandler).toHaveBeenCalled();
      const eventDetail = rangeCompleteHandler.mock.calls[0][0].detail;
      expect(eventDetail.startDate).toBe(startDate);
      expect(eventDetail.endDate).toBe(endDate);
      expect(eventDetail.formattedRange).toBe(formattedRange);
    });
  });

  describe('dispatchRangeClearEvent', () => {
    it('should dispatch range-clear event', () => {
      // Set up a listener to check the event
      const rangeClearHandler = jest.fn();
      hostElement.addEventListener('range-clear', rangeClearHandler);
      
      // Dispatch the event
      eventDispatcherService.dispatchRangeClearEvent();
      
      // Verify the event was dispatched
      expect(rangeClearHandler).toHaveBeenCalled();
    });
  });
});