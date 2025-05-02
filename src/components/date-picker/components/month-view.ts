import { IDateFormatter } from '../services/date-formatter';

export interface MonthViewConfig {
  formatter: IDateFormatter;
  locale: string;
  viewDate: Date;
  selectedDate?: Date | null; // Add selectedDate to determine which month to highlight
}

export interface MonthViewCallbacks {
  onMonthSelect: (monthIndex: number) => void;
}

export class MonthView {
  private config: MonthViewConfig;
  private callbacks: MonthViewCallbacks;
  
  constructor(config: MonthViewConfig, callbacks: MonthViewCallbacks) {
    this.config = config;
    this.callbacks = callbacks;
  }
  
  public render(container: HTMLElement): void {
    // Create months grid
    let monthsContent = '<div class="date-picker-months-grid" role="grid" aria-label="Month selection grid">';
    const monthNames = this.getMonthNames('short');
    const currentYear = this.config.viewDate.getFullYear();
    const currentMonth = new Date().getFullYear() === currentYear ? new Date().getMonth() : -1;
    
    // Always highlight the month from viewDate (the one shown in header)
    const selectedMonth = this.config.viewDate.getMonth();
    
    // Month grid is 4 rows x 3 columns
    const rows = 4;
    const cols = 3;
    
    for (let i = 0; i < rows; i++) {
      monthsContent += '<div class="date-picker-row" role="row">';
      
      for (let j = 0; j < cols; j++) {
        const monthIndex = i * cols + j;
        const isSelected = selectedMonth === monthIndex;
        const isCurrent = currentMonth === monthIndex;
        
        let cellClass = 'date-picker-cell month-cell';
        if (isSelected) cellClass += ' selected';
        if (isCurrent) cellClass += ' current';
        
        // Add tabindex="0" only to the selected month for keyboard navigation
        const tabIndex = isSelected ? '0' : '-1';
        
        monthsContent += `
          <div class="${cellClass}" 
               role="gridcell" 
               tabindex="${tabIndex}" 
               data-month="${monthIndex}" 
               data-month-index="${monthIndex}"
               data-row="${i}"
               data-col="${j}"
               aria-selected="${isSelected ? 'true' : 'false'}"
               aria-label="${monthNames[monthIndex]} ${currentYear}">
            ${monthNames[monthIndex]}
          </div>
        `;
      }
      
      monthsContent += '</div>';
    }
    
    monthsContent += '</div>';
    container.innerHTML = monthsContent;
    
    this.attachEventListeners(container);
  }
  
  private attachEventListeners(container: HTMLElement): void {
    const monthCells = container.querySelectorAll('.month-cell');
    monthCells.forEach(cell => {
      // Click event handler for selection
      cell.addEventListener('click', () => {
        const monthIndex = parseInt((cell as HTMLElement).dataset.month || '0', 10);
        this.callbacks.onMonthSelect(monthIndex);
      });
      
      // Focus event handler to dispatch focus-month event
      cell.addEventListener('focus', () => {
        const monthIndex = parseInt((cell as HTMLElement).dataset.monthIndex || '0', 10);
        
        // Find the year from header or from viewDate
        const currentYear = this.config.viewDate.getFullYear();
        
        // Get the parent date-picker component
        const datePicker = container.closest('odyssey-date-picker') as any;
        if (datePicker && datePicker.eventDispatcherService) {
          datePicker.eventDispatcherService.dispatchFocusMonthEvent(currentYear, monthIndex);
        }
      });
    });
  }
  
  private getMonthNames(format: 'long' | 'short' = 'long'): string[] {
    const months = [];
    for (let i = 0; i < 12; i++) {
      months.push(this.config.formatter.getMonthName(i, format, this.config.locale));
    }
    return months;
  }
}