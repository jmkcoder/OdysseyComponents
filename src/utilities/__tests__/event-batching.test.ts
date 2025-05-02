import { EventBatcher, createBatchedEventDispatcher } from '../event-batching';

describe('EventBatcher', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('batches multiple events', () => {
    const mockHandler = jest.fn();
    const batcher = new EventBatcher(mockHandler);

    batcher.addEvent('type1');
    batcher.addEvent('type2');
    batcher.addEvent('type1'); // duplicate should be counted only once

    expect(mockHandler).not.toHaveBeenCalled();

    jest.runAllTimers();

    expect(mockHandler).toHaveBeenCalledTimes(1);
    const eventTypes = mockHandler.mock.calls[0][0];
    expect(eventTypes.size).toBe(2);
    expect(eventTypes.has('type1')).toBe(true);
    expect(eventTypes.has('type2')).toBe(true);
  });

  test('processes events immediately when immediate flag is true', () => {
    const mockHandler = jest.fn();
    const batcher = new EventBatcher(mockHandler);

    batcher.addEvent('type1');
    batcher.addEvent('type2', true); // immediate=true should process batch

    expect(mockHandler).toHaveBeenCalledTimes(1);
    const eventTypes = mockHandler.mock.calls[0][0];
    expect(eventTypes.size).toBe(2);
    expect(eventTypes.has('type1')).toBe(true);
    expect(eventTypes.has('type2')).toBe(true);

    // No more calls should happen when timers run
    jest.runAllTimers();
    expect(mockHandler).toHaveBeenCalledTimes(1);
  });

  test('clear cancels pending events', () => {
    const mockHandler = jest.fn();
    const batcher = new EventBatcher(mockHandler);

    batcher.addEvent('type1');
    batcher.addEvent('type2');
    batcher.clear();

    jest.runAllTimers();

    expect(mockHandler).not.toHaveBeenCalled();
  });

  test('passes metadata to handler', () => {
    const mockHandler = jest.fn();
    const batcher = new EventBatcher<{ value: number }>(mockHandler);

    batcher.addEvent('type1');
    batcher.setMetadata({ value: 42 });

    jest.runAllTimers();

    expect(mockHandler).toHaveBeenCalledTimes(1);
    const [eventTypes, metadata] = mockHandler.mock.calls[0];
    expect(eventTypes.has('type1')).toBe(true);
    expect(metadata).toEqual({ value: 42 });
  });
});

describe('createBatchedEventDispatcher', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('dispatches custom event after batching', () => {
    const element = document.createElement('div');
    const dispatchSpy = jest.spyOn(element, 'dispatchEvent');
    
    const batcher = createBatchedEventDispatcher(element, 'state-change');
    
    batcher.addEvent('value-change');
    batcher.addEvent('selection-change');
    
    jest.runAllTimers();
    
    expect(dispatchSpy).toHaveBeenCalledTimes(1);
    const event = dispatchSpy.mock.calls[0][0] as CustomEvent;
    
    expect(event.type).toBe('state-change');
    expect(event.detail.eventTypes).toContain('value-change');
    expect(event.detail.eventTypes).toContain('selection-change');
  });
  
  test('includes metadata in custom event detail', () => {
    const element = document.createElement('div');
    const dispatchSpy = jest.spyOn(element, 'dispatchEvent');
    
    const batcher = createBatchedEventDispatcher<{ count: number }>(element, 'state-change');
    
    batcher.addEvent('value-change');
    batcher.setMetadata({ count: 3 });
    
    jest.runAllTimers();
    
    expect(dispatchSpy).toHaveBeenCalledTimes(1);
    const event = dispatchSpy.mock.calls[0][0] as CustomEvent;
    
    expect(event.detail.count).toBe(3);
  });
});