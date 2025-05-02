export interface YearViewConfig {
  viewDate: Date;
  selectedDate?: Date | null; // Add selectedDate property to decide what to highlight
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
    const startYear = currentYear - (currentYear % 12);
    
    let yearsContent = '<div class="date-picker-years-grid" role="grid" aria-label="Year selection grid">';
    
    // The year view renders a 4x3 grid (12 years)
    const rows = 4;
    const cols = 3;
    
    // Highlight the current year from viewDate (the one shown in header)
    const yearToHighlight = this.config.selectedDate?.getFullYear();
    
    for (let i = 0; i < rows; i++) {
      yearsContent += '<div class="date-picker-row" role="row">';
      
      for (let j = 0; j < cols; j++) {
        const yearValue = startYear + i * cols + j;
        const isSelected = yearValue === yearToHighlight;
        const isCurrent = new Date().getFullYear() === yearValue;
        
        let cellClass = 'date-picker-cell year-cell';
        if (isSelected) cellClass += ' selected';
        if (isCurrent) cellClass += ' current';
        
        // Add tabindex="0" only to the selected year for keyboard navigation
        // If no year is selected, make the first year focusable for keyboard access
        let tabIndex = "-1";
        
        if (isSelected) {
          tabIndex = "0";
        } else if (i === 0 && j === 0 && yearToHighlight === -1) {
          tabIndex = "0";
        }
        
        yearsContent += `
          <div class="${cellClass}" 
               role="gridcell" 
               tabindex="${tabIndex}" 
               data-year="${yearValue}"
               data-row="${i}"
               data-col="${j}"
               aria-selected="${isSelected ? 'true' : 'false'}"
               aria-label="Year ${yearValue}">
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
      // Click event handler for selection
      cell.addEventListener('click', () => {
        const yearValue = parseInt((cell as HTMLElement).dataset.year || '0', 10);
        this.callbacks.onYearSelect(yearValue);
      });

      // Focus event handler to dispatch focus-year event
      cell.addEventListener('focus', () => {
        const yearValue = parseInt((cell as HTMLElement).dataset.year || '0', 10);
        
        // Get the parent date-picker component
        const datePicker = container.closest('odyssey-date-picker') as any;
        if (datePicker && datePicker.eventDispatcherService) {
          datePicker.eventDispatcherService.dispatchFocusYearEvent(yearValue);
        }
      });
    });
  }

  /**
   * Update focus management - make only one cell focusable at a time
   */
  private updateFocus(container: HTMLElement, focusedCell: HTMLElement): void {
    // Reset all cells to tabindex="-1" (not in tab order)
    const allCells = container.querySelectorAll('.year-cell');
    allCells.forEach(cell => {
      cell.setAttribute('tabindex', '-1');
    });
    
    // Make the target cell focusable
    focusedCell.setAttribute('tabindex', '0');
  }
}