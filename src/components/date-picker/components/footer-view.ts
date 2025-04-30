import { IDateFormatter } from '../services';

export interface FooterViewConfig {
  formatter: IDateFormatter;
  locale: string;
  selectedDate: Date | null;
  isRangeMode: boolean;
  rangeStart: Date | null;
  rangeEnd: Date | null;
  format: string;
  isTodayDisabled?: boolean; // Flag to indicate if today's date is disabled
}

export interface FooterViewCallbacks {
  onTodayClick: () => void;
  onClearClick: () => void;
  onCloseClick: () => void;
}

export class FooterView {
  private config: FooterViewConfig;
  private callbacks: FooterViewCallbacks;
  
  constructor(config: FooterViewConfig, callbacks: FooterViewCallbacks) {
    this.config = config;
    this.callbacks = callbacks;
  }
  
  public render(container: HTMLElement): void {
    const todayDisabled = this.config.isTodayDisabled ? 'disabled' : '';
    const todayAriaDisabled = this.config.isTodayDisabled ? 'aria-disabled="true"' : '';
    
    const footerContent = `
      <span class="date-picker-selected-date">${this.getSelectedDateText()}</span>
      <div class="date-picker-buttons">
        <button class="date-picker-btn today-btn ${this.config.isTodayDisabled ? 'disabled' : ''}" 
                tabindex="0" 
                aria-label="Today"
                ${todayAriaDisabled}
                ${todayDisabled}>Today</button>
        <button class="date-picker-btn clear-btn" tabindex="0" aria-label="Clear selection">Clear</button>
        <button class="date-picker-btn close-btn primary" tabindex="0" aria-label="Close date picker">Close</button>
      </div>
    `;
    
    container.innerHTML = footerContent;
    this.attachEventListeners(container);
  }
  
  private getSelectedDateText(): string {
    if (this.config.isRangeMode) {
      if (this.config.rangeStart && this.config.rangeEnd) {
        return `${this.formatDate(this.config.rangeStart)} - ${this.formatDate(this.config.rangeEnd)}`;
      } else if (this.config.rangeStart) {
        return `${this.formatDate(this.config.rangeStart)} - Select end date`;
      } else {
        return 'Select date range';
      }
    } else if (this.config.selectedDate) {
      return this.formatDate(this.config.selectedDate);
    }
    return '';
  }
  
  private formatDate(date: Date | null): string {
    if (!date) return '';
    return this.config.formatter.format(date, this.config.format, this.config.locale);
  }
  
  private attachEventListeners(container: HTMLElement): void {
    const todayBtn = container.querySelector('.today-btn') as HTMLElement;
    const clearBtn = container.querySelector('.clear-btn') as HTMLElement;
    const closeBtn = container.querySelector('.close-btn') as HTMLElement;
    
    // Mouse event listeners
    todayBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      // Skip if today button is disabled
      if (!this.config.isTodayDisabled) {
        this.callbacks.onTodayClick();
      }
    });
    
    clearBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.callbacks.onClearClick();
    });
    
    closeBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.callbacks.onCloseClick();
    });
    
    // Keyboard event listeners
    todayBtn?.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        // Skip if today button is disabled
        if (!this.config.isTodayDisabled) {
          this.callbacks.onTodayClick();
        }
      }
    });
    
    clearBtn?.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        this.callbacks.onClearClick();
      }
    });
    
    closeBtn?.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        this.callbacks.onCloseClick();
      }
    });
  }
}