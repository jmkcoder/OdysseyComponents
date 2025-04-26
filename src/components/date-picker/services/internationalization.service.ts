/**
 * Service responsible for internationalization and date formatting
 */
export class InternationalizationService {
  private _locale: string = 'en-US';
  private _dateFormatter: Intl.DateTimeFormat | undefined;
  private _monthFormatter: Intl.DateTimeFormat | undefined;
  private _weekdayFormatter: Intl.DateTimeFormat | undefined;
  private _weekdayLongFormatter: Intl.DateTimeFormat | undefined;
  private _shortMonthFormatter: Intl.DateTimeFormat | undefined;
  private _longMonthFormatter: Intl.DateTimeFormat | undefined;

  constructor(locale: string = 'en-US') {
    this._locale = locale;
    this.initFormatters();
  }

  /**
   * Initialize the formatters based on locale
   */
  private initFormatters(): void {
    this._dateFormatter = new Intl.DateTimeFormat(this._locale, { 
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    this._monthFormatter = new Intl.DateTimeFormat(this._locale, { 
      month: 'long', 
      year: 'numeric' 
    });
    
    this._weekdayFormatter = new Intl.DateTimeFormat(this._locale, { 
      weekday: 'narrow'
    });
    
    this._weekdayLongFormatter = new Intl.DateTimeFormat(this._locale, { 
      weekday: 'long'
    });
    
    this._shortMonthFormatter = new Intl.DateTimeFormat(this._locale, {
      month: 'short'
    });
    
    this._longMonthFormatter = new Intl.DateTimeFormat(this._locale, {
      month: 'long'
    });
  }

  /**
   * Set locale for formatting
   */
  setLocale(locale: string): void {
    this._locale = locale;
    this.initFormatters();
  }

  /**
   * Get current locale
   */
  getLocale(): string {
    return this._locale;
  }
  
  /**
   * Get month name by index (0=Jan, 1=Feb, etc.)
   * @param monthIndex Month index (0-11)
   * @param short Whether to return short month name
   * @returns Localized month name
   */
  getMonthName(monthIndex: number, short: boolean = false): string {
    if (monthIndex < 0 || monthIndex > 11) {
      return '';
    }
    
    // Create a date for the first day of the specified month in 2023
    const date = new Date(2023, monthIndex, 1);
    
    // Format using the appropriate formatter
    return short 
      ? (this._shortMonthFormatter?.format(date) ?? '') 
      : (this._longMonthFormatter?.format(date) ?? '');
  }

  /**
   * Format date to localized string
   */
  formatDate(date: Date): string {
    return this._dateFormatter?.format(date) ?? '';
  }

  /**
   * Format month and year
   */
  formatMonthYear(yearOrDate: number | Date, month?: number): string {
    if (yearOrDate instanceof Date) {
      return this._monthFormatter?.format(yearOrDate) ?? '';
    } else if (typeof month === 'number') {
      const date = new Date(yearOrDate, month);
      return this._monthFormatter?.format(date) ?? '';
    }
    return '';
  }

  /**
   * Format weekday (narrow)
   */
  formatWeekday(date: Date): string {
    return this._weekdayFormatter?.format(date) ?? '';
  }

  /**
   * Format weekday (long)
   */
  formatWeekdayLong(date: Date): string {
    return this._weekdayLongFormatter?.format(date) ?? '';
  }

  /**
   * Format weekday narrow by index (0=Sunday, 1=Monday, etc.)
   */
  formatWeekdayNarrow(dayIndex: number): string {
    // Create a date for the specified day of the week
    // Starting with Sunday, January 1, 2023
    const date = new Date(2023, 0, 1 + dayIndex);
    return this._weekdayFormatter?.format(date) ?? '';
  }

  /**
   * Get array of localized weekday names based on first day setting
   */
  getWeekdayNames(firstDayOfWeek: number = 0): string[] {
    const weekdays: string[] = [];
    // Start from Jan 1, 2023 (a Sunday)
    const baseDate = new Date(2023, 0, 1);
    
    for (let i = 0; i < 7; i++) {
      const day = (i + firstDayOfWeek) % 7;
      const weekdayDate = new Date(baseDate);
      weekdayDate.setDate(baseDate.getDate() + day);
      weekdays.push(this.formatWeekday(weekdayDate));
    }
    
    return weekdays;
  }
  
  /**
   * Get array of localized long weekday names based on first day setting
   */
  getWeekdayLongNames(firstDayOfWeek: number = 0): string[] {
    const weekdays: string[] = [];
    // Start from Jan 1, 2023 (a Sunday)
    const baseDate = new Date(2023, 0, 1);
    
    for (let i = 0; i < 7; i++) {
      const day = (i + firstDayOfWeek) % 7;
      const weekdayDate = new Date(baseDate);
      weekdayDate.setDate(baseDate.getDate() + day);
      weekdays.push(this.formatWeekdayLong(weekdayDate));
    }
    
    return weekdays;
  }

  /**
   * Translate a key to the current locale
   */
  translate(key: string): string {
    const translations: Record<string, Record<string, string>> = {
      'en-US': {
        selectDate: 'Select a date',
        dateInput: 'Date input',
        calendar: 'Calendar',
        previousMonth: 'Previous month',
        nextMonth: 'Next month',
        today: 'Today',
        clear: 'Clear',
        close: 'Close',
        selected: 'Selected',
        event: 'event',
        events: 'events',
        // New translations for month/year view
        selectMonthYear: 'Select month and year',
        selectYear: 'Select year',
        back: 'Back',
        yearRange: 'Year range',
        previousYear: 'Previous year',
        nextYear: 'Next year',
        previousYearRange: 'Previous years',
        nextYearRange: 'Next years'
      },
      'fr-FR': {
        selectDate: 'Sélectionnez une date',
        dateInput: 'Entrée de date',
        calendar: 'Calendrier',
        previousMonth: 'Mois précédent',
        nextMonth: 'Mois suivant',
        today: "Aujourd'hui",
        clear: 'Effacer',
        close: 'Fermer',
        selected: 'Sélectionné',
        event: 'événement',
        events: 'événements',
        // New translations for month/year view
        selectMonthYear: 'Sélectionnez mois et année',
        selectYear: 'Sélectionnez année',
        back: 'Retour',
        yearRange: 'Plage d\'années',
        previousYear: 'Année précédente',
        nextYear: 'Année suivante',
        previousYearRange: 'Années précédentes',
        nextYearRange: 'Années suivantes'
      },
      'es-ES': {
        selectDate: 'Seleccione una fecha',
        dateInput: 'Entrada de fecha',
        calendar: 'Calendario',
        previousMonth: 'Mes anterior',
        nextMonth: 'Mes siguiente',
        today: 'Hoy',
        clear: 'Borrar',
        close: 'Cerrar',
        selected: 'Seleccionado',
        event: 'evento',
        events: 'eventos',
        // New translations for month/year view
        selectMonthYear: 'Seleccione mes y año',
        selectYear: 'Seleccione año',
        back: 'Volver',
        yearRange: 'Rango de años',
        previousYear: 'Año anterior',
        nextYear: 'Año siguiente',
        previousYearRange: 'Años anteriores',
        nextYearRange: 'Años siguientes'
      },
      'de-DE': {
        selectDate: 'Datum auswählen',
        dateInput: 'Datumseingabe',
        calendar: 'Kalender',
        previousMonth: 'Vorheriger Monat',
        nextMonth: 'Nächster Monat',
        today: 'Heute',
        clear: 'Löschen',
        close: 'Schließen',
        selected: 'Ausgewählt',
        event: 'Ereignis',
        events: 'Ereignisse',
        // New translations for month/year view
        selectMonthYear: 'Monat und Jahr auswählen',
        selectYear: 'Jahr auswählen',
        back: 'Zurück',
        yearRange: 'Jahresbereich',
        previousYear: 'Vorheriges Jahr',
        nextYear: 'Nächstes Jahr',
        previousYearRange: 'Vorherige Jahre',
        nextYearRange: 'Nächste Jahre'
      },
      'ja-JP': {
        selectDate: '日付を選択',
        dateInput: '日付入力',
        calendar: 'カレンダー',
        previousMonth: '前月',
        nextMonth: '翌月',
        today: '今日',
        clear: 'クリア',
        close: '閉じる',
        selected: '選択済み',
        event: 'イベント',
        events: 'イベント',
        // New translations for month/year view
        selectMonthYear: '月と年を選択',
        selectYear: '年を選択',
        back: '戻る',
        yearRange: '年範囲',
        previousYear: '前年',
        nextYear: '翌年',
        previousYearRange: '前の年範囲',
        nextYearRange: '次の年範囲'
      }
    };
    
    // Get translations for current locale or fallback to en-US
    const localeTranslations = translations[this._locale] || translations['en-US'];
    
    // Return the translation or the key itself as fallback
    return localeTranslations[key] || key;
  }
}