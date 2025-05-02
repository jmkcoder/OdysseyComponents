import { IDateFormatter } from '../services/date-formatter';
import { CalendarViewMode } from '../services/ui-updater.service';

export interface HeaderViewConfig {
  formatter: IDateFormatter;
  locale: string;
  viewDate: Date;
  currentView: CalendarViewMode;
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
    // If in years view, create special centered header for year range
    if (this.config.currentView === CalendarViewMode.YEARS) {
      const headerContent = `
        <button class="date-picker-nav-btn prev-month" aria-label="Previous year range" tabindex="0">
          <span class="material-icons">chevron_left</span>
        </button>
        <div class="date-picker-selectors year-range-centered">
          <button class="date-picker-year-selector" tabindex="0">${this.getYearText()}</button>
        </div>
        <button class="date-picker-nav-btn next-month" aria-label="Next year range" tabindex="0">
          <span class="material-icons">chevron_right</span>
        </button>
      `;
      
      container.innerHTML = headerContent;
      
      // Add specific CSS for year view - keeping font size consistent
      const yearSelector = container.querySelector('.date-picker-year-selector') as HTMLElement;
      if (yearSelector) {
        yearSelector.style.flex = '1';
        yearSelector.style.textAlign = 'center';
        // Removed font-size modification
      }
      
      // Center the year range in the header
      const selectorsDiv = container.querySelector('.year-range-centered') as HTMLElement;
      if (selectorsDiv) {
        selectorsDiv.style.display = 'flex';
        selectorsDiv.style.justifyContent = 'center';
        selectorsDiv.style.flex = '1';
      }
    } else {
      // Standard header for calendar and month views
      const isMonthView = this.config.currentView === CalendarViewMode.MONTHS;
      const isYearView = !(this.config.currentView === CalendarViewMode.DAYS || this.config.currentView === CalendarViewMode.MONTHS);
      
      const headerContent = `
        <button class="date-picker-nav-btn prev-month" 
                aria-label="Previous ${this.config.currentView === CalendarViewMode.DAYS ? 'month' : 'year'}" 
                tabindex="0">
          <span class="material-icons">chevron_left</span>
        </button>
        <div class="date-picker-selectors">
          <button class="date-picker-month-selector" 
                  aria-label="Select month" 
                  tabindex="0"
                  ${isMonthView ? 'aria-expanded="true"' : ''}>
            ${this.getMonthText()}
          </button>
          <button class="date-picker-year-selector" 
                  aria-label="Select year" 
                  tabindex="0"
                  ${isYearView ? 'aria-expanded="true"' : ''}>
            ${this.getYearText()}
          </button>
        </div>
        <button class="date-picker-nav-btn next-month" 
                aria-label="Next ${this.config.currentView === CalendarViewMode.DAYS ? 'month' : 'year'}" 
                tabindex="0">
          <span class="material-icons">chevron_right</span>
        </button>
      `;
      
      container.innerHTML = headerContent;
    }
    
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
      const startYear = currentYear - (currentYear % 12);
      const endYear = startYear + 11;
      return `${startYear} - ${endYear}`;
    }
    return this.config.viewDate.getFullYear().toString();
  }
  
  private attachEventListeners(container: HTMLElement): void {
    const prevButton = container.querySelector('.prev-month');
    const nextButton = container.querySelector('.next-month');
    const monthSelector = container.querySelector('.date-picker-month-selector');
    const yearSelector = container.querySelector('.date-picker-year-selector');
    
    prevButton?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.callbacks.onPrevClick();
    });
    
    nextButton?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.callbacks.onNextClick();
    });
    
    monthSelector?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.callbacks.onMonthSelectorClick();
    });
    
    yearSelector?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.callbacks.onYearSelectorClick();
    });

    // Add keyboard event listeners for accessibility
    (prevButton as HTMLElement)?.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        this.callbacks.onPrevClick();
      }
    });
    
    (nextButton as HTMLElement)?.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        this.callbacks.onNextClick();
      }
    });
    
    (monthSelector as HTMLElement)?.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        this.callbacks.onMonthSelectorClick();
      }
    });
    
    (yearSelector as HTMLElement)?.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        this.callbacks.onYearSelectorClick();
      }
    });
  }
}