import './date-picker.scss';
import { DateFormatterProvider, IDateFormatter } from './services';
import { InternationalizationService } from '../../services';
import { defineCustomElement } from '../../utilities/define-custom-element';

export class DatePicker extends HTMLElement {
  // State variables
  private selectedDate: Date | null = null;
  private viewDate: Date = new Date();
  private isOpen: boolean = false;
  private currentView: 'calendar' | 'months' | 'years' = 'calendar';
  private events: Map<string, string[]> = new Map();
  private format: string = 'yyyy-MM-dd';
  private isRangeMode: boolean = false;
  private rangeStart: Date | null = null;
  private rangeEnd: Date | null = null;
  private rangeSelectionInProgress: boolean = false;
  private locale: string = navigator.language;
  
  // DOM Elements References
  private inputElement!: HTMLInputElement;
  private calendarElement!: HTMLDivElement;
  private dialogElement!: HTMLDivElement;
  
  // Services
  private formatter: IDateFormatter;
  private i18nService: InternationalizationService;
  
  constructor() {
    super();
    // Get services
    this.i18nService = InternationalizationService.getInstance();
    this.formatter = DateFormatterProvider.getFormatter(this.locale);
    this.initializeComponent();
  }
  
  static get observedAttributes() {
    return [
      'placeholder', 
      'value', 
      'disabled', 
      'format',
      'theme',
      'first-day-of-week',
      'min-date',
      'max-date',
      'mode',
      'start-date',
      'end-date',
      'locale'
    ];
  }
  
  attributeChangedCallback(name: string, oldValue: string, newValue: string) {
    if (oldValue === newValue) return;
    
    switch (name) {
      case 'placeholder':
        if (this.inputElement) {
          this.inputElement.placeholder = newValue;
        }
        break;
      case 'value':
        this.setDateFromString(newValue);
        break;
      case 'disabled':
        if (this.inputElement) {
          this.inputElement.disabled = newValue !== null;
        }
        break;
      case 'format':
        this.format = newValue || 'yyyy-MM-dd';
        this.updateInputValue();
        break;
      case 'theme':
        this.setAttribute('data-theme', newValue);
        break;
      case 'locale':
        // Update locale for both services
        this.locale = newValue || navigator.language;
        this.i18nService.locale = this.locale;
        // Force re-fetch formatter with new locale
        this.formatter = DateFormatterProvider.getFormatter(this.locale);
        this.updateInputValue();
        this.renderCalendar();
        break;
      case 'mode':
        this.isRangeMode = newValue === 'range';
        this.resetRangeSelection();
        this.updateInputValue();
        break;
      case 'start-date':
        if (this.isRangeMode && newValue) {
          try {
            const startDate = this.formatter.parse(newValue);
            if (!isNaN(startDate.getTime())) {
              this.rangeStart = startDate;
              this.updateInputValue();
              this.renderCalendar();
            }
          } catch (e) {
            console.error("Error parsing start date:", e);
          }
        }
        break;
      case 'end-date':
        if (this.isRangeMode && newValue) {
          try {
            const endDate = this.formatter.parse(newValue);
            if (!isNaN(endDate.getTime())) {
              this.rangeEnd = endDate;
              this.updateInputValue();
              this.renderCalendar();
            }
          } catch (e) {
            console.error("Error parsing end date:", e);
          }
        }
        break;
      case 'first-day-of-week':
        // Re-render calendar if first day of week changed
        this.renderCalendar();
        break;
    }
  }
  
  private initializeComponent() {
    // Create the main structure
    this.innerHTML = `
      <div class="odyssey-date-picker">
        <div class="date-picker-input-wrapper">
          <input type="text" class="date-picker-input" placeholder="Select date" readonly>
          <span class="date-picker-icon material-icons">calendar_today</span>
        </div>
        <div class="date-picker-dialog" tabindex="-1">
          <div class="date-picker-header">
            <button class="date-picker-nav-btn prev-month" aria-label="Previous month">
              <span class="material-icons">chevron_left</span>
            </button>
            <div class="date-picker-selectors">
              <button class="date-picker-month-selector"></button>
              <button class="date-picker-year-selector"></button>
            </div>
            <button class="date-picker-nav-btn next-month" aria-label="Next month">
              <span class="material-icons">chevron_right</span>
            </button>
          </div>
          <div class="date-picker-calendar"></div>
          <div class="date-picker-footer">
            <span class="date-picker-selected-date"></span>
            <div class="date-picker-buttons">
              <button class="date-picker-btn today-btn">Today</button>
              <button class="date-picker-btn clear-btn">Clear</button>
              <button class="date-picker-btn close-btn primary">Close</button>
            </div>
          </div>
        </div>
      </div>
    `;
    
    // Get references to DOM elements
    this.inputElement = this.querySelector('.date-picker-input') as HTMLInputElement;
    this.dialogElement = this.querySelector('.date-picker-dialog') as HTMLDivElement;
    this.calendarElement = this.querySelector('.date-picker-calendar') as HTMLDivElement;
    
    // Set initial values from attributes
    if (this.hasAttribute('placeholder')) {
      this.inputElement.placeholder = this.getAttribute('placeholder') || 'Select date';
    }
    
    if (this.hasAttribute('disabled')) {
      this.inputElement.disabled = true;
    }
    
    if (this.hasAttribute('format')) {
      this.format = this.getAttribute('format') || 'yyyy-MM-dd';
    }
    
    if (this.hasAttribute('theme')) {
      this.setAttribute('data-theme', this.getAttribute('theme') || '');
    }

    // Check for mode attribute
    if (this.hasAttribute('mode')) {
      this.isRangeMode = this.getAttribute('mode') === 'range';
    }
    
    // Support both start-date/end-date attributes for range mode
    if (this.isRangeMode) {
      if (this.hasAttribute('start-date')) {
        const startDateStr = this.getAttribute('start-date') || '';
        try {
          const startDate = this.formatter.parse(startDateStr);
          if (!isNaN(startDate.getTime())) {
            this.rangeStart = startDate;
            this.viewDate = new Date(this.rangeStart);
          }
        } catch (e) {
          console.error("Error parsing start date:", e);
        }
      }
      
      if (this.hasAttribute('end-date')) {
        const endDateStr = this.getAttribute('end-date') || '';
        try {
          const endDate = this.formatter.parse(endDateStr);
          if (!isNaN(endDate.getTime())) {
            this.rangeEnd = endDate;
          }
        } catch (e) {
          console.error("Error parsing end date:", e);
        }
      }
    } else if (this.hasAttribute('value')) {
      this.setDateFromString(this.getAttribute('value') || '');
    }
    
    // Attach event listeners
    this.attachEventListeners();
    
    // Render the initial calendar
    this.renderCalendar();
  }
  
  private attachEventListeners() {
    // Toggle calendar on input click
    this.querySelector('.date-picker-input-wrapper')?.addEventListener('click', (e) => {
      if (!this.inputElement.disabled) {
        this.toggleCalendar();
      }
    });
    
    // Close calendar when clicking outside
    document.addEventListener('click', (e: MouseEvent) => {
      if (this.isOpen && !this.contains(e.target as Node)) {
        this.closeCalendar();
      }
    });
    
    // Navigation buttons
    this.querySelector('.prev-month')?.addEventListener('click', (e) => {
      e.stopPropagation(); // Prevent event from closing calendar
      this.previousMonth();
    });
    
    this.querySelector('.next-month')?.addEventListener('click', (e) => {
      e.stopPropagation(); // Prevent event from closing calendar
      this.nextMonth();
    });
    
    // Month and year selectors
    this.querySelector('.date-picker-month-selector')?.addEventListener('click', (e) => {
      e.stopPropagation(); // Prevent event from closing calendar
      this.showMonthSelector();
    });
    
    this.querySelector('.date-picker-year-selector')?.addEventListener('click', (e) => {
      e.stopPropagation(); // Prevent event from closing calendar
      this.showYearSelector();
    });
    
    // Footer buttons
    this.querySelector('.today-btn')?.addEventListener('click', (e) => {
      e.stopPropagation(); // Prevent event from closing calendar
      this.goToToday();
    });
    
    this.querySelector('.clear-btn')?.addEventListener('click', (e) => {
      e.stopPropagation(); // Prevent event from closing calendar
      this.clearSelection();
    });
    
    this.querySelector('.close-btn')?.addEventListener('click', (e) => {
      e.stopPropagation(); // Not strictly needed, but for consistency
      this.closeCalendar();
    });
    
    // Prevent clicks inside dialog from bubbling to document
    this.dialogElement.addEventListener('click', (e) => {
      e.stopPropagation();
    });
    
    // Keyboard navigation
    this.dialogElement.addEventListener('keydown', (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          this.closeCalendar();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          if (e.ctrlKey) {
            this.previousMonth();
          } else {
            this.navigateDay(-1);
          }
          break;
        case 'ArrowRight':
          e.preventDefault();
          if (e.ctrlKey) {
            this.nextMonth();
          } else {
            this.navigateDay(1);
          }
          break;
        case 'ArrowUp':
          e.preventDefault();
          this.navigateDay(-7);
          break;
        case 'ArrowDown':
          e.preventDefault();
          this.navigateDay(7);
          break;
        case 'Enter':
          if (document.activeElement?.classList.contains('date-picker-cell')) {
            (document.activeElement as HTMLElement).click();
          }
          break;
      }
    });
    
    // Add listeners to detect keyboard focus within calendar cells
    this.calendarElement.addEventListener('focusin', (e) => {
      if ((e.target as HTMLElement).classList.contains('date-picker-cell')) {
        (e.target as HTMLElement).classList.add('focused');
      }
    });
    
    this.calendarElement.addEventListener('focusout', (e) => {
      if ((e.target as HTMLElement).classList.contains('date-picker-cell')) {
        (e.target as HTMLElement).classList.remove('focused');
      }
    });
  }
  
  // Calendar rendering methods
  private renderCalendar() {
    if (this.currentView === 'calendar') {
      this.renderDateView();
    } else if (this.currentView === 'months') {
      this.renderMonthsView();
    } else if (this.currentView === 'years') {
      this.renderYearsView();
    }
    
    this.updateHeaderText();
    this.updateSelectedDateText();
  }
  
  private renderDateView() {
    const year = this.viewDate.getFullYear();
    const month = this.viewDate.getMonth();
    
    // Get first day of month and last day of month
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    // Find the first day to display (might be from previous month)
    const firstDayOfWeek = this.getFirstDayOfWeek();
    let firstDisplayDay = new Date(firstDay);
    const firstDayWeekday = firstDay.getDay();
    
    let diff = firstDayWeekday - firstDayOfWeek;
    if (diff < 0) diff += 7;
    firstDisplayDay.setDate(firstDay.getDate() - diff);
    
    // Generate calendar grid
    let calendarContent = '<div class="date-picker-row date-picker-weekdays">';
    
    // Add weekday headers
    for (let i = 0; i < 7; i++) {
      const weekdayIndex = (firstDayOfWeek + i) % 7;
      const weekdayName = this.getWeekdayName(weekdayIndex, 'short');
      calendarContent += `<div class="date-picker-cell weekday">${weekdayName}</div>`;
    }
    calendarContent += '</div>';
    
    // Create date grid (6 rows max)
    let currentDate = new Date(firstDisplayDay);
    
    for (let row = 0; row < 6; row++) {
      calendarContent += '<div class="date-picker-row">';
      
      for (let col = 0; col < 7; col++) {
        const isToday = this.isSameDate(currentDate, new Date());
        const isSelected = this.isSelectedDate(currentDate);
        const isPrevMonth = currentDate.getMonth() < month || (currentDate.getMonth() === 11 && month === 0);
        const isNextMonth = currentDate.getMonth() > month || (currentDate.getMonth() === 0 && month === 11);
        const hasEvents = this.hasEventsOnDate(currentDate);
        const isRangeStart = this.isRangeMode && this.isSameDate(currentDate, this.rangeStart);
        const isRangeEnd = this.isRangeMode && this.isSameDate(currentDate, this.rangeEnd);
        const isInRange = this.isRangeMode && this.isDateInRange(currentDate);
        
        // Build CSS classes
        let cellClass = 'date-picker-cell';
        if (isToday) cellClass += ' today';
        if (isSelected && !this.isRangeMode) cellClass += ' selected';
        if (isPrevMonth) cellClass += ' prev-month';
        if (isNextMonth) cellClass += ' next-month';
        if (hasEvents) cellClass += ' has-events';
        if (isRangeStart) cellClass += ' range-start';
        if (isRangeEnd) cellClass += ' range-end';
        if (isInRange) cellClass += ' in-range';
        
        // Generate the date cell
        calendarContent += `
          <div 
            class="${cellClass}" 
            tabindex="0" 
            data-date="${this.formatDate(currentDate, 'yyyy-MM-dd')}">
            ${currentDate.getDate()}
            ${hasEvents ? '<span class="event-indicator"></span>' : ''}
          </div>
        `;
        
        // Move to next day
        currentDate.setDate(currentDate.getDate() + 1);
      }
      
      calendarContent += '</div>';
    }
    
    this.calendarElement.innerHTML = calendarContent;
    
    // Attach click events to date cells
    this.attachDateCellListeners();
  }
  
  private renderMonthsView() {
    // Create months grid
    let monthsContent = '<div class="date-picker-months-grid">';
    const monthNames = this.getMonthNames('short');
    const currentYear = this.viewDate.getFullYear();
    const currentMonth = new Date().getFullYear() === currentYear ? new Date().getMonth() : -1;
    
    for (let i = 0; i < 4; i++) {
      monthsContent += '<div class="date-picker-row">';
      
      for (let j = 0; j < 3; j++) {
        const monthIndex = i * 3 + j;
        const isSelected = this.viewDate.getMonth() === monthIndex;
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
    this.calendarElement.innerHTML = monthsContent;
    
    // Attach click events to month cells
    const monthCells = this.querySelectorAll('.month-cell');
    monthCells.forEach(cell => {
      cell.addEventListener('click', () => {
        const monthIndex = parseInt((cell as HTMLElement).dataset.month || '0', 10);
        this.viewDate.setMonth(monthIndex);
        this.currentView = 'calendar';
        this.renderCalendar();
      });
    });
  }
  
  private renderYearsView() {
    // Create years grid
    const currentYear = this.viewDate.getFullYear();
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
    
    // Add navigation for decades
    yearsContent += `
      <div style="display: flex; justify-content: space-between; padding: 0.5rem;">
        <button class="date-picker-btn prev-decade">« Prev</button>
        <button class="date-picker-btn next-decade">Next »</button>
      </div>
    `;
    
    this.calendarElement.innerHTML = yearsContent;
    
    // Attach click events to year cells
    const yearCells = this.querySelectorAll('.year-cell');
    yearCells.forEach(cell => {
      cell.addEventListener('click', () => {
        const yearValue = parseInt((cell as HTMLElement).dataset.year || '0', 10);
        this.viewDate.setFullYear(yearValue);
        this.currentView = 'months';
        this.renderCalendar();
      });
    });
    
    // Attach decade navigation events
    this.querySelector('.prev-decade')?.addEventListener('click', (e) => {
      e.stopPropagation(); // Prevent event from closing calendar
      this.viewDate.setFullYear(this.viewDate.getFullYear() - 10);
      this.renderYearsView();
      this.updateHeaderText();
    });
    
    this.querySelector('.next-decade')?.addEventListener('click', (e) => {
      e.stopPropagation(); // Prevent event from closing calendar
      this.viewDate.setFullYear(this.viewDate.getFullYear() + 10);
      this.renderYearsView();
      this.updateHeaderText();
    });
  }
  
  private attachDateCellListeners() {
    const dateCells = this.querySelectorAll('.date-picker-cell:not(.weekday)');
    dateCells.forEach(cell => {
      if (!(cell as HTMLElement).classList.contains('disabled')) {
        cell.addEventListener('click', (e) => {
          e.stopPropagation(); // Prevent event from closing calendar
          const dateStr = (cell as HTMLElement).dataset.date;
          if (dateStr) {
            const clickedDate = this.parseDateString(dateStr);
            this.handleDateSelection(clickedDate);
          }
        });
      }
    });
  }
  
  private handleDateSelection(date: Date) {
    if (this.isRangeMode) {
      this.handleRangeSelection(date);
    } else {
      this.selectedDate = date;
      this.dispatchChangeEvent();
      this.updateInputValue();
      this.renderCalendar();
    }
  }
  
  private handleRangeSelection(date: Date) {
    if (!this.rangeSelectionInProgress) {
      this.resetRangeSelection();
      this.rangeStart = date;
      this.rangeSelectionInProgress = true;
    } else {
      if (this.isSameDate(date, this.rangeStart)) {
        this.rangeEnd = new Date(this.rangeStart!);
        this.rangeSelectionInProgress = false;
        this.dispatchChangeEvent();
      } else {
        if (date < this.rangeStart!) {
          this.rangeEnd = new Date(this.rangeStart!);
          this.rangeStart = date;
        } else {
          this.rangeEnd = date;
        }
        this.rangeSelectionInProgress = false;
        this.dispatchChangeEvent();
      }
    }
    
    this.updateInputValue();
    this.renderCalendar();
  }
  
  private isDateInRange(date: Date): boolean {
    if (!this.isRangeMode || !this.rangeStart) return false;
    
    if (!this.rangeEnd) return false;
    
    return date >= this.rangeStart && date <= this.rangeEnd;
  }
  
  private resetRangeSelection() {
    this.rangeStart = null;
    this.rangeEnd = null;
    this.rangeSelectionInProgress = false;
  }
  
  private updateHeaderText() {
    const monthSelector = this.querySelector('.date-picker-month-selector') as HTMLElement;
    const yearSelector = this.querySelector('.date-picker-year-selector') as HTMLElement;
    
    if (this.currentView === 'calendar' || this.currentView === 'months') {
      monthSelector.textContent = this.getMonthName(this.viewDate.getMonth());
      yearSelector.textContent = this.viewDate.getFullYear().toString();
    } else if (this.currentView === 'years') {
      const currentYear = this.viewDate.getFullYear();
      const startYear = currentYear - (currentYear % 12) - 3;
      const endYear = startYear + 14;
      monthSelector.textContent = '';
      yearSelector.textContent = `${startYear} - ${endYear}`;
      yearSelector.classList.add('center');
    }
  }
  
  private updateSelectedDateText() {
    const selectedDateElement = this.querySelector('.date-picker-selected-date') as HTMLElement;
    
    if (this.isRangeMode) {
      if (this.rangeStart && this.rangeEnd) {
        selectedDateElement.textContent = `${this.formatDate(this.rangeStart)} - ${this.formatDate(this.rangeEnd)}`;
      } else if (this.rangeStart) {
        selectedDateElement.textContent = `${this.formatDate(this.rangeStart)} - Select end date`;
      } else {
        selectedDateElement.textContent = 'Select date range';
      }
    } else if (this.selectedDate) {
      selectedDateElement.textContent = this.formatDate(this.selectedDate);
    } else {
      selectedDateElement.textContent = '';
    }
  }
  
  private updateInputValue() {
    if (this.isRangeMode) {
      if (this.rangeStart && this.rangeEnd) {
        this.inputElement.value = `${this.formatDateByLocale(this.rangeStart)} - ${this.formatDateByLocale(this.rangeEnd)}`;
      } else if (this.rangeStart) {
        this.inputElement.value = `${this.formatDateByLocale(this.rangeStart)} - ...`;
      } else {
        this.inputElement.value = '';
      }
    } else if (this.selectedDate) {
      this.inputElement.value = this.formatDateByLocale(this.selectedDate);
    } else {
      this.inputElement.value = '';
    }
  }
  
  private formatDate(date: Date | null, format?: string, locale?: string): string {
    return this.formatter.format(date, format || this.format, locale || this.locale);
  }
  
  private formatDateByLocale(date: Date | null): string {
    if (!date) return '';
    
    // If user has explicitly set a format, use that
    if (this.hasAttribute('format')) {
      return this.formatDate(date);
    }
    
    // Otherwise use the locale-specific format
    return this.formatDate(date, 'locale');
  }
  
  private parseDateString(dateStr: string, format?: string): Date {
    return this.formatter.parse(dateStr, format);
  }
  
  private getMonthName(monthIndex: number, format: 'long' | 'short' = 'long'): string {
    return this.formatter.getMonthName(monthIndex, format, this.locale);
  }
  
  private getMonthNames(format: 'long' | 'short' = 'long'): string[] {
    const months = [];
    for (let i = 0; i < 12; i++) {
      months.push(this.getMonthName(i, format));
    }
    return months;
  }
  
  private getWeekdayName(dayIndex: number, format: 'long' | 'short' | 'narrow' = 'short'): string {
    return this.formatter.getWeekdayName(dayIndex, format, this.locale);
  }
  
  private getFirstDayOfWeek(): number {
    // First try to get from attribute
    const firstDayAttr = this.getAttribute('first-day-of-week');
    if (firstDayAttr && !isNaN(parseInt(firstDayAttr, 10))) {
      return parseInt(firstDayAttr, 10);
    }
    
    // Otherwise use i18n service to get locale-appropriate first day
    return this.i18nService.getFirstDayOfWeek(this.locale);
  }
  
  private isSameDate(date1: Date | null, date2: Date | null): boolean {
    if (!date1 || !date2) return false;
    
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  }
  
  private isSelectedDate(date: Date): boolean {
    return this.isSameDate(date, this.selectedDate);
  }
  
  private hasEventsOnDate(date: Date): boolean {
    const dateKey = this.formatDate(date, 'yyyy-MM-dd');
    return this.events.has(dateKey) && this.events.get(dateKey)!.length > 0;
  }
  
  private previousMonth() {
    const newViewDate = new Date(this.viewDate);
    newViewDate.setMonth(newViewDate.getMonth() - 1);
    this.viewDate = newViewDate;
    this.renderCalendar();
  }
  
  private nextMonth() {
    const newViewDate = new Date(this.viewDate);
    newViewDate.setMonth(newViewDate.getMonth() + 1);
    this.viewDate = newViewDate;
    this.renderCalendar();
  }
  
  private showMonthSelector() {
    this.currentView = 'months';
    this.renderCalendar();
  }
  
  private showYearSelector() {
    this.currentView = 'years';
    this.renderCalendar();
  }
  
  private navigateDay(offset: number) {
    const focusedElement = document.activeElement as HTMLElement;
    
    if (focusedElement && focusedElement.classList.contains('date-picker-cell')) {
      const dateStr = focusedElement.dataset.date;
      if (dateStr) {
        const currentDate = this.parseDateString(dateStr);
        const newDate = new Date(currentDate);
        newDate.setDate(newDate.getDate() + offset);
        
        if (newDate.getMonth() !== currentDate.getMonth()) {
          this.viewDate = newDate;
          this.renderCalendar();
          
          setTimeout(() => {
            const newDateStr = this.formatDate(newDate, 'yyyy-MM-dd');
            const newCell = this.querySelector(`[data-date="${newDateStr}"]`) as HTMLElement;
            if (newCell) newCell.focus();
          }, 0);
        } else {
          const newDateStr = this.formatDate(newDate, 'yyyy-MM-dd');
          const newCell = this.querySelector(`[data-date="${newDateStr}"]`) as HTMLElement;
          if (newCell) newCell.focus();
        }
      }
    } else {
      const todayCell = this.querySelector('.today') as HTMLElement;
      if (todayCell) todayCell.focus();
    }
  }
  
  private toggleCalendar() {
    if (this.isOpen) {
      this.closeCalendar();
    } else {
      this.openCalendar();
    }
  }
  
  private openCalendar() {
    if (this.isOpen) return;
    
    this.dialogElement.classList.add('open');
    this.isOpen = true;
    
    setTimeout(() => this.dialogElement.focus(), 0);
    
    this.dispatchEvent(new CustomEvent('calendar-open'));
  }
  
  private closeCalendar() {
    if (!this.isOpen) return;
    
    this.dialogElement.classList.remove('open');
    this.isOpen = false;
    
    this.currentView = 'calendar';
    
    this.dispatchEvent(new CustomEvent('calendar-close'));
  }
  
  private goToToday() {
    const today = new Date();
    this.viewDate = today;
    
    if (!this.isRangeMode) {
      this.selectedDate = today;
      this.dispatchChangeEvent();
      this.updateInputValue();
    }
    
    this.renderCalendar();
  }
  
  private clearSelection() {
    if (this.isRangeMode) {
      this.resetRangeSelection();
    } else {
      this.selectedDate = null;
    }
    
    this.updateInputValue();
    this.renderCalendar();
    this.dispatchChangeEvent();
  }
  
  private setDateFromString(value: string) {
    if (this.isRangeMode) {
      this.setRangeFromString(value);
    } else {
      try {
        const date = this.formatter.parse(value);
        if (!isNaN(date.getTime())) {
          this.selectedDate = date;
          this.viewDate = new Date(this.selectedDate);
          this.updateInputValue();
        }
      } catch (e) {
        console.error("Error parsing date:", e);
      }
    }
  }
  
  private setRangeFromString(value: string) {
    if (!value) {
      this.resetRangeSelection();
      return;
    }
    
    try {
      const rangeParts = value.split('-').map(part => part.trim());
      if (rangeParts.length === 2) {
        const start = this.formatter.parse(rangeParts[0]);
        const end = this.formatter.parse(rangeParts[1]);
        
        if (start && end && !isNaN(start.getTime()) && !isNaN(end.getTime())) {
          if (start > end) {
            this.rangeStart = end;
            this.rangeEnd = start;
          } else {
            this.rangeStart = start;
            this.rangeEnd = end;
          }
          this.viewDate = new Date(this.rangeStart);
          this.updateInputValue();
        }
      }
    } catch (e) {
      console.error("Error parsing date range:", e);
    }
  }
  
  private dispatchChangeEvent() {
    let detail;
    if (this.isRangeMode) {
      detail = {
        rangeStart: this.rangeStart ? this.formatDate(this.rangeStart) : null,
        rangeEnd: this.rangeEnd ? this.formatDate(this.rangeEnd) : null
      };
    } else {
      detail = {
        date: this.selectedDate ? this.formatDate(this.selectedDate) : null
      };
    }
    
    this.dispatchEvent(
      new CustomEvent('date-change', {
        detail,
        bubbles: true,
        composed: true
      })
    );
    
    if (this.isRangeMode) {
      if (this.rangeStart && this.rangeEnd) {
        this.setAttribute(
          'value', 
          `${this.formatDate(this.rangeStart)} - ${this.formatDate(this.rangeEnd)}`
        );
      }
    } else if (this.selectedDate) {
      this.setAttribute('value', this.formatDate(this.selectedDate));
    } else {
      this.removeAttribute('value');
    }
  }
  
  public setDate(date: Date) {
    if (this.isRangeMode) return;
    
    this.selectedDate = date;
    this.viewDate = new Date(this.selectedDate);
    this.updateInputValue();
    if (this.isOpen) this.renderCalendar();
    this.dispatchChangeEvent();
  }
  
  public setDateRange(startDate: Date, endDate: Date) {
    if (!this.isRangeMode) return;
    
    if (startDate > endDate) {
      this.rangeStart = endDate;
      this.rangeEnd = startDate;
    } else {
      this.rangeStart = startDate;
      this.rangeEnd = endDate;
    }
    
    this.viewDate = new Date(this.rangeStart);
    this.updateInputValue();
    if (this.isOpen) this.renderCalendar();
    this.dispatchChangeEvent();
  }
  
  public addEvent(date: Date, eventName: string = 'event') {
    const dateKey = this.formatDate(date, 'yyyy-MM-dd');
    
    if (!this.events.has(dateKey)) {
      this.events.set(dateKey, []);
    }
    
    this.events.get(dateKey)!.push(eventName);
    
    if (
      this.viewDate.getFullYear() === date.getFullYear() && 
      this.viewDate.getMonth() === date.getMonth() && 
      this.isOpen
    ) {
      this.renderCalendar();
    }
  }
  
  public clearEvents(date: Date) {
    const dateKey = this.formatDate(date, 'yyyy-MM-dd');
    this.events.delete(dateKey);
    
    if (
      this.viewDate.getFullYear() === date.getFullYear() && 
      this.viewDate.getMonth() === date.getMonth() && 
      this.isOpen
    ) {
      this.renderCalendar();
    }
  }
}

export const defineDatePicker = () => defineCustomElement('odyssey-date-picker', DatePicker);