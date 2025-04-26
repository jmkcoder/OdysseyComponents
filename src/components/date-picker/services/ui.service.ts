import { CalendarView, FooterView, HeaderView, MonthView, YearView } from '../components';
import { IDateFormatter } from './date-formatter.interface';
import { StateService } from './state.service';

/**
 * Service responsible for rendering the UI components
 */
export class UIService {
  private state: StateService;
  private formatter: IDateFormatter;
  private calendarContainer: HTMLElement | undefined;
  private headerContainer: HTMLElement | undefined;
  private footerContainer: HTMLElement | undefined;
  private dialogElement: HTMLElement | undefined;
  private inputElement: HTMLInputElement | undefined;
  
  constructor(state: StateService, formatter: IDateFormatter) {
    this.state = state;
    this.formatter = formatter;
  }
  
  /**
   * Initialize UI service with necessary DOM elements
   */
  public initialize(
    calendarContainer: HTMLElement, 
    headerContainer: HTMLElement,
    footerContainer: HTMLElement,
    dialogElement: HTMLElement,
    inputElement: HTMLInputElement
  ) {
    this.calendarContainer = calendarContainer;
    this.headerContainer = headerContainer;
    this.footerContainer = footerContainer;
    this.dialogElement = dialogElement;
    this.inputElement = inputElement;
    
    // Register as listener to re-render when state changes
    this.state.addListener({
      onStateChange: () => {
        this.updateUI();
      }
    });
  }
  
  /**
   * Update the UI based on current state
   */
  public updateUI(): void {
    this.updateInputValue();
    this.renderCurrentView();
    this.renderHeader();
    this.renderFooter();
    this.updateDialogVisibility();
  }
  
  /**
   * Render the current active view (calendar, month, or year)
   */
  private renderCurrentView(): void {
    if (!this.calendarContainer) return;
    
    // Clear previous content
    this.calendarContainer.innerHTML = '';
    
    switch (this.state.currentView) {
      case 'calendar':
        this.renderCalendarView();
        break;
      case 'months':
        this.renderMonthView();
        break;
      case 'years':
        this.renderYearView();
        break;
    }
  }
  
  /**
   * Render the calendar view
   */
  private renderCalendarView(): void {
    const calendarView = new CalendarView(
      {
        formatter: this.formatter,
        locale: this.state.locale,
        viewDate: this.state.viewDate,
        selectedDate: this.state.selectedDate,
        rangeStart: this.state.rangeStart,
        rangeEnd: this.state.rangeEnd,
        isRangeMode: this.state.isRangeMode,
        minDate: this.state.minDate,
        maxDate: this.state.maxDate,
        events: this.state.events,
        firstDayOfWeek: this.state.firstDayOfWeek
      },
      {
        onDateSelect: this.handleDateSelect.bind(this),
        onPrevMonth: this.handlePrevMonth.bind(this),
        onNextMonth: this.handleNextMonth.bind(this),
        onShowMonthSelector: this.handleShowMonthSelector.bind(this),
        onShowYearSelector: this.handleShowYearSelector.bind(this)
      }
    );
    
    calendarView.render(this.calendarContainer!);
  }
  
  /**
   * Render the month selection view
   */
  private renderMonthView(): void {
    const monthView = new MonthView(
      {
        formatter: this.formatter,
        locale: this.state.locale,
        viewDate: this.state.viewDate
      },
      {
        onMonthSelect: this.handleMonthSelect.bind(this)
      }
    );
    
    monthView.render(this.calendarContainer!);
  }
  
  /**
   * Render the year selection view
   */
  private renderYearView(): void {
    const yearView = new YearView(
      {
        viewDate: this.state.viewDate
      },
      {
        onYearSelect: this.handleYearSelect.bind(this)
      }
    );
    
    yearView.render(this.calendarContainer!);
  }
  
  /**
   * Render the header component
   */
  private renderHeader(): void {
    if (!this.headerContainer) return;
    
    const headerView = new HeaderView(
      {
        formatter: this.formatter,
        locale: this.state.locale,
        viewDate: this.state.viewDate,
        currentView: this.state.currentView
      },
      {
        onPrevClick: this.handlePrevMonth.bind(this),
        onNextClick: this.handleNextMonth.bind(this),
        onMonthSelectorClick: this.handleShowMonthSelector.bind(this),
        onYearSelectorClick: this.handleShowYearSelector.bind(this)
      }
    );
    
    headerView.render(this.headerContainer);
  }
  
  /**
   * Render the footer component
   */
  private renderFooter(): void {
    if (!this.footerContainer) return;
    
    const footerView = new FooterView(
      {
        formatter: this.formatter,
        locale: this.state.locale,
        selectedDate: this.state.selectedDate,
        isRangeMode: this.state.isRangeMode,
        rangeStart: this.state.rangeStart,
        rangeEnd: this.state.rangeEnd,
        format: this.state.format
      },
      {
        onTodayClick: this.handleTodayClick.bind(this),
        onClearClick: this.handleClearClick.bind(this),
        onCloseClick: this.handleCloseClick.bind(this)
      }
    );
    
    footerView.render(this.footerContainer);
  }
  
  /**
   * Update the input field value based on current selection
   */
  private updateInputValue(): void {
    if (!this.inputElement) return;
    
    if (this.state.isRangeMode) {
      if (this.state.rangeStart && this.state.rangeEnd) {
        this.inputElement.value = `${this.formatDateByLocale(this.state.rangeStart)} - ${this.formatDateByLocale(this.state.rangeEnd)}`;
      } else if (this.state.rangeStart) {
        this.inputElement.value = `${this.formatDateByLocale(this.state.rangeStart)} - ...`;
      } else {
        this.inputElement.value = '';
      }
    } else if (this.state.selectedDate) {
      this.inputElement.value = this.formatDateByLocale(this.state.selectedDate);
    } else {
      this.inputElement.value = '';
    }
  }
  
  /**
   * Update dialog visibility based on isOpen state
   */
  private updateDialogVisibility(): void {
    if (!this.dialogElement) return;
    
    if (this.state.isOpen) {
      this.dialogElement.classList.add('open');
      setTimeout(() => this.dialogElement!.focus(), 0);
    } else {
      this.dialogElement.classList.remove('open');
    }
  }
  
  /**
   * Format date using locale-specific format if available
   */
  private formatDateByLocale(date: Date | null): string {
    if (!date) return '';
    
    // Use explicit format if provided
    return this.formatter.format(date, this.state.format, this.state.locale);
  }
  
  // Event handlers
  
  private handleDateSelect(date: Date): void {
    if (this.state.isRangeMode) {
      this.state.selectRangeDate(date);
    } else {
      this.state.selectSingleDate(date);
    }
  }
  
  private handlePrevMonth(): void {
    this.state.navigateToPreviousPeriod();
  }
  
  private handleNextMonth(): void {
    this.state.navigateToNextPeriod();
  }
  
  private handleShowMonthSelector(): void {
    this.state.currentView = 'months';
  }
  
  private handleShowYearSelector(): void {
    this.state.currentView = 'years';
  }
  
  private handleMonthSelect(monthIndex: number): void {
    const newViewDate = new Date(this.state.viewDate);
    newViewDate.setMonth(monthIndex);
    this.state.viewDate = newViewDate;
    this.state.currentView = 'calendar';
  }
  
  private handleYearSelect(year: number): void {
    const newViewDate = new Date(this.state.viewDate);
    newViewDate.setFullYear(year);
    this.state.viewDate = newViewDate;
    this.state.currentView = 'months';
  }
  
  private handleTodayClick(): void {
    const today = new Date();
    this.state.viewDate = today;
    
    // Only select today if it's within the allowed date range
    if (!this.state.isRangeMode && !this.state.isDateDisabled(today)) {
      this.state.selectedDate = today;
    }
  }
  
  private handleClearClick(): void {
    if (this.state.isRangeMode) {
      this.state.resetRangeSelection();
    } else {
      this.state.selectedDate = null;
    }
  }
  
  private handleCloseClick(): void {
    this.state.isOpen = false;
  }
}