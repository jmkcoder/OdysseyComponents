import { IDateFormatter } from '../services';

export interface FooterViewConfig {
  formatter: IDateFormatter;
  locale: string;
  selectedDate: Date | null;
  isRangeMode: boolean;
  rangeStart: Date | null;
  rangeEnd: Date | null;
  format: string;
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
    const footerContent = `
      <span class="date-picker-selected-date">${this.getSelectedDateText()}</span>
      <div class="date-picker-buttons">
        <button class="date-picker-btn today-btn">Today</button>
        <button class="date-picker-btn clear-btn">Clear</button>
        <button class="date-picker-btn close-btn primary">Close</button>
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
    container.querySelector('.today-btn')?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.callbacks.onTodayClick();
    });
    
    container.querySelector('.clear-btn')?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.callbacks.onClearClick();
    });
    
    container.querySelector('.close-btn')?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.callbacks.onCloseClick();
    });
  }
}