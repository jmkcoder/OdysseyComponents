import { IDateFormatter } from '../services';

export interface HeaderViewConfig {
  formatter: IDateFormatter;
  locale: string;
  viewDate: Date;
  currentView: 'calendar' | 'months' | 'years';
}

export interface HeaderViewCallbacks {
  onPrevClick: () => void;
  onNextClick: () => void;
  onMonthSelectorClick: () => void;
  onYearSelectorClick: () => void;
}

export class HeaderView {
  private config: HeaderViewConfig;
  private callbacks: HeaderViewCallbacks;
  
  constructor(config: HeaderViewConfig, callbacks: HeaderViewCallbacks) {
    this.config = config;
    this.callbacks = callbacks;
  }
  
  public render(container: HTMLElement): void {
    const headerContent = `
      <button class="date-picker-nav-btn prev-month" aria-label="Previous">
        <span class="material-icons">chevron_left</span>
      </button>
      <div class="date-picker-selectors">
        <button class="date-picker-month-selector">${this.getMonthText()}</button>
        <button class="date-picker-year-selector">${this.getYearText()}</button>
      </div>
      <button class="date-picker-nav-btn next-month" aria-label="Next">
        <span class="material-icons">chevron_right</span>
      </button>
    `;
    
    container.innerHTML = headerContent;
    this.attachEventListeners(container);
  }
  
  private getMonthText(): string {
    if (this.config.currentView === 'years') {
      // In years view, don't show month
      return '';
    }
    return this.config.formatter.getMonthName(
      this.config.viewDate.getMonth(), 
      'long', 
      this.config.locale
    );
  }
  
  private getYearText(): string {
    if (this.config.currentView === 'years') {
      // For years view, show range
      const currentYear = this.config.viewDate.getFullYear();
      const startYear = currentYear - (currentYear % 12) - 3;
      const endYear = startYear + 14;
      return `${startYear} - ${endYear}`;
    }
    return this.config.viewDate.getFullYear().toString();
  }
  
  private attachEventListeners(container: HTMLElement): void {
    container.querySelector('.prev-month')?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.callbacks.onPrevClick();
    });
    
    container.querySelector('.next-month')?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.callbacks.onNextClick();
    });
    
    container.querySelector('.date-picker-month-selector')?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.callbacks.onMonthSelectorClick();
    });
    
    container.querySelector('.date-picker-year-selector')?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.callbacks.onYearSelectorClick();
    });
  }
}