export interface YearViewConfig {
  viewDate: Date;
}

export interface YearViewCallbacks {
  onYearSelect: (year: number) => void;
}

export class YearView {
  private config: YearViewConfig;
  private callbacks: YearViewCallbacks;
  
  constructor(config: YearViewConfig, callbacks: YearViewCallbacks) {
    this.config = config;
    this.callbacks = callbacks;
  }
  
  public render(container: HTMLElement): void {
    const currentYear = this.config.viewDate.getFullYear();
    const startYear = currentYear - (currentYear % 12) - 3;
    
    let yearsContent = '<div class="date-picker-years-grid">';
    
    for (let i = 0; i < 5; i++) {
      yearsContent += '<div class="date-picker-row">';
      
      for (let j = 0; j < 3; j++) {
        const yearValue = startYear + i * 3 + j;
        const isSelected = currentYear === yearValue;
        const isCurrent = new Date().getFullYear() === yearValue;
        
        let cellClass = 'date-picker-cell year-cell';
        if (isSelected) cellClass += ' selected';
        if (isCurrent) cellClass += ' current';
        
        yearsContent += `
          <div class="${cellClass}" tabindex="0" data-year="${yearValue}">
            ${yearValue}
          </div>
        `;
      }
      
      yearsContent += '</div>';
    }
    
    yearsContent += '</div>';
    container.innerHTML = yearsContent;
    
    this.attachEventListeners(container);
  }
  
  private attachEventListeners(container: HTMLElement): void {
    const yearCells = container.querySelectorAll('.year-cell');
    yearCells.forEach(cell => {
      cell.addEventListener('click', () => {
        const yearValue = parseInt((cell as HTMLElement).dataset.year || '0', 10);
        this.callbacks.onYearSelect(yearValue);
      });
    });
  }
}