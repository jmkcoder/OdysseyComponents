import { IDateFormatter } from '../services';

export interface MonthViewConfig {
  formatter: IDateFormatter;
  locale: string;
  viewDate: Date;
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
    let monthsContent = '<div class="date-picker-months-grid">';
    const monthNames = this.getMonthNames('short');
    const currentYear = this.config.viewDate.getFullYear();
    const currentMonth = new Date().getFullYear() === currentYear ? new Date().getMonth() : -1;
    const selectedMonth = this.config.viewDate.getMonth();
    
    for (let i = 0; i < 4; i++) {
      monthsContent += '<div class="date-picker-row">';
      
      for (let j = 0; j < 3; j++) {
        const monthIndex = i * 3 + j;
        const isSelected = selectedMonth === monthIndex;
        const isCurrent = currentMonth === monthIndex;
        
        let cellClass = 'date-picker-cell month-cell';
        if (isSelected) cellClass += ' selected';
        if (isCurrent) cellClass += ' current';
        
        monthsContent += `
          <div class="${cellClass}" tabindex="0" data-month="${monthIndex}">
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
      cell.addEventListener('click', () => {
        const monthIndex = parseInt((cell as HTMLElement).dataset.month || '0', 10);
        this.callbacks.onMonthSelect(monthIndex);
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