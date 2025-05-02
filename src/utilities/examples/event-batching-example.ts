/**
 * This file demonstrates how to use the EventBatcher utility in a real-world component.
 * In this example, we'll create a simple form component that batches change events.
 */

import { EventBatcher, createBatchedEventDispatcher } from '../event-batching';

/**
 * A simple form component that demonstrates event batching
 */
export class BatchedFormComponent extends HTMLElement {
  private inputElements: Map<string, HTMLInputElement> = new Map();
  private eventBatcher: EventBatcher<{
    changedFields: { [key: string]: any };
    previousValues: { [key: string]: any };
  }>;
  private previousValues: { [key: string]: any } = {};
  
  constructor() {
    super();
    
    // Create the event batcher with a custom handler
    this.eventBatcher = new EventBatcher((eventTypes, metadata) => {
      // Handle all batched events at once
      if (eventTypes.size > 0) {
        this.handleBatchedChanges(eventTypes, metadata);
      }
    }, { debounceTime: 150 });
    
    // Alternatively, we could use the helper function:
    // this.eventBatcher = createBatchedEventDispatcher(this, 'form-change', { debounceTime: 150 });
  }
  
  connectedCallback() {
    // Create the form structure
    this.innerHTML = `
      <div class="form-container">
        <div class="form-field">
          <label for="name">Name:</label>
          <input type="text" id="name" name="name">
        </div>
        <div class="form-field">
          <label for="email">Email:</label>
          <input type="email" id="email" name="email">
        </div>
        <div class="form-field">
          <label for="age">Age:</label>
          <input type="number" id="age" name="age">
        </div>
      </div>
    `;
    
    // Get all input elements
    const inputs = this.querySelectorAll('input');
    
    // Set up event listeners for each input
    inputs.forEach(input => {
      this.inputElements.set(input.name, input);
      this.previousValues[input.name] = input.value;
      
      // Listen for input events
      input.addEventListener('input', (e) => this.handleInputChange(e));
    });
  }
  
  /**
   * Handle individual input changes
   */
  private handleInputChange(e: Event) {
    const input = e.target as HTMLInputElement;
    const name = input.name;
    const value = input.value;
    
    // Store the changed field and previous value
    const changedFields = { 
      [name]: value 
    };
    
    const previousValues = { 
      [name]: this.previousValues[name] 
    };
    
    // Update previous value for next change
    this.previousValues[name] = value;
    
    // Set metadata for this batch
    this.eventBatcher.setMetadata({
      changedFields,
      previousValues
    });
    
    // Add the event to the batch
    this.eventBatcher.addEvent(`change:${name}`);
  }
  
  /**
   * Handle all batched changes
   */
  private handleBatchedChanges(
    eventTypes: Set<string>, 
    metadata?: {
      changedFields: { [key: string]: any };
      previousValues: { [key: string]: any };
    }
  ) {
    // Create a comprehensive change event with all changed fields
    this.dispatchEvent(new CustomEvent('form-change', {
      bubbles: true,
      composed: true,
      detail: {
        changedFields: metadata?.changedFields || {},
        previousValues: metadata?.previousValues || {},
        // Convert event types like 'change:name' to just 'name' for the changed fields list
        changedFieldNames: Array.from(eventTypes)
          .filter(type => type.startsWith('change:'))
          .map(type => type.substring(7))
      }
    }));
  }
  
  /**
   * Get the current form values
   */
  getFormValues() {
    const values: { [key: string]: any } = {};
    this.inputElements.forEach((input, name) => {
      values[name] = input.value;
    });
    return values;
  }
  
  /**
   * Set form values programmatically
   * This demonstrates how to batch programmatic changes
   */
  setFormValues(values: { [key: string]: any }) {
    const changedFields: { [key: string]: any } = {};
    const previousValues: { [key: string]: any } = {};
    
    // Update each input if it exists
    Object.entries(values).forEach(([name, value]) => {
      const input = this.inputElements.get(name);
      if (input) {
        previousValues[name] = input.value;
        input.value = value.toString();
        changedFields[name] = value;
        
        // Store the new value for next change
        this.previousValues[name] = value.toString();
        
        // Add each change to the batch
        this.eventBatcher.addEvent(`change:${name}`);
      }
    });
    
    // Set the metadata for this batch
    if (Object.keys(changedFields).length > 0) {
      this.eventBatcher.setMetadata({
        changedFields,
        previousValues
      });
    }
  }
}

// Define the custom element
customElements.define('batched-form', BatchedFormComponent);

/**
 * Usage example:
 * 
 * <batched-form id="my-form"></batched-form>
 * 
 * <script>
 *   const form = document.getElementById('my-form');
 *   
 *   // Listen for batched form changes
 *   form.addEventListener('form-change', (e) => {
 *     console.log('Form changed:', e.detail.changedFieldNames);
 *     console.log('New values:', e.detail.changedFields);
 *     console.log('Previous values:', e.detail.previousValues);
 *   });
 *   
 *   // Set multiple values at once - events will be batched
 *   form.setFormValues({
 *     name: 'John Doe',
 *     email: 'john@example.com',
 *     age: 30
 *   });
 * </script>
 */