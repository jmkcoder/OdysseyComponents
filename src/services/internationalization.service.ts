/**
 * Internationalization service for handling translations and locale-specific formatting
 * Follows the Singleton pattern to ensure consistent language across the application
 */

// Define a custom type for our named format options
interface DateFormatOptions {
  short: Intl.DateTimeFormatOptions;
  medium: Intl.DateTimeFormatOptions;
  long: Intl.DateTimeFormatOptions;
  full: Intl.DateTimeFormatOptions;
  [key: string]: Intl.DateTimeFormatOptions;
}

export class InternationalizationService {
  private static instance: InternationalizationService;
  private _locale: string;
  private _translations: Record<string, Record<string, string>> = {};
  private _dateTimeFormats: Record<string, DateFormatOptions> = {};
  
  // Cached formatters for improved performance
  private _dateFormatter: Intl.DateTimeFormat | undefined;
  private _monthFormatter: Intl.DateTimeFormat | undefined;
  private _weekdayFormatter: Intl.DateTimeFormat | undefined;
  private _weekdayLongFormatter: Intl.DateTimeFormat | undefined;
  private _shortMonthFormatter: Intl.DateTimeFormat | undefined;
  private _longMonthFormatter: Intl.DateTimeFormat | undefined;
  
  /**
   * Private constructor to enforce the Singleton pattern
   * @param locale Initial locale
   */
  private constructor(locale: string = navigator.language) {
    this._locale = locale;
    this._initializeDefaultDateTimeFormats();
    this._initializeDefaultTranslations();
    this._initFormatters();
  }
  
  /**
   * Get the singleton instance
   * @param locale Optional locale to set when first created
   */
  public static getInstance(locale?: string): InternationalizationService {
    if (!InternationalizationService.instance) {
      InternationalizationService.instance = new InternationalizationService(locale);
    }
    return InternationalizationService.instance;
  }
  
  /**
   * Initialize cached formatters for better performance
   */
  private _initFormatters(): void {
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
   * Initialize default date/time formats for common locales
   */
  private _initializeDefaultDateTimeFormats(): void {
    // Add default date time formats for various locales
    this._dateTimeFormats = {
      'en-US': {
        short: { year: 'numeric', month: 'numeric', day: 'numeric' },
        medium: { year: 'numeric', month: 'short', day: 'numeric' },
        long: { weekday: 'short', year: 'numeric', month: 'long', day: 'numeric' },
        full: { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }
      },
      'en-GB': {
        short: { year: 'numeric', month: 'numeric', day: 'numeric' },
        medium: { year: 'numeric', month: 'short', day: 'numeric' },
        long: { weekday: 'short', year: 'numeric', month: 'long', day: 'numeric' },
        full: { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }
      },
      'fr-FR': {
        short: { year: 'numeric', month: 'numeric', day: 'numeric' },
        medium: { year: 'numeric', month: 'short', day: 'numeric' },
        long: { weekday: 'short', year: 'numeric', month: 'long', day: 'numeric' },
        full: { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }
      },
      'de-DE': {
        short: { year: 'numeric', month: 'numeric', day: 'numeric' },
        medium: { year: 'numeric', month: 'short', day: 'numeric' },
        long: { weekday: 'short', year: 'numeric', month: 'long', day: 'numeric' },
        full: { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }
      },
      'es-ES': {
        short: { year: 'numeric', month: 'numeric', day: 'numeric' },
        medium: { year: 'numeric', month: 'short', day: 'numeric' },
        long: { weekday: 'short', year: 'numeric', month: 'long', day: 'numeric' },
        full: { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }
      },
      'ja-JP': {
        short: { year: 'numeric', month: 'numeric', day: 'numeric' },
        medium: { year: 'numeric', month: 'short', day: 'numeric' },
        long: { weekday: 'short', year: 'numeric', month: 'long', day: 'numeric' },
        full: { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }
      },
      'zh-CN': {
        short: { year: 'numeric', month: 'numeric', day: 'numeric' },
        medium: { year: 'numeric', month: 'short', day: 'numeric' },
        long: { weekday: 'short', year: 'numeric', month: 'long', day: 'numeric' },
        full: { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }
      },
      // Default format for any other locale
      'default': {
        short: { year: 'numeric', month: 'numeric', day: 'numeric' },
        medium: { year: 'numeric', month: 'short', day: 'numeric' },
        long: { weekday: 'short', year: 'numeric', month: 'long', day: 'numeric' },
        full: { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }
      }
    };
  }
  
  /**
   * Initialize default UI translations for date picker and other components
   */
  private _initializeDefaultTranslations(): void {
    // Add date picker UI translations
    const datepickerTranslations = {
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
    
    // Add translations for each locale
    Object.entries(datepickerTranslations).forEach(([locale, translations]) => {
      this.setTranslations(locale, translations);
    });
  }
  
  /**
   * Get the current locale
   */
  public get locale(): string {
    return this._locale;
  }
  
  /**
   * Set the current locale
   */
  public set locale(value: string) {
    this._locale = value;
    this._initFormatters();
  }
  
  /**
   * Set translations for a specific locale
   * @param locale Target locale
   * @param translations Dictionary of translations
   */
  public setTranslations(locale: string, translations: Record<string, string>): void {
    this._translations[locale] = { ...this._translations[locale], ...translations };
  }
  
  /**
   * Get a translated string
   * @param key Translation key
   * @param params Optional parameters for string interpolation
   * @param locale Optional locale (uses current locale if not specified)
   * @returns Translated string
   */
  public translate(key: string, params: Record<string, string> = {}, locale?: string): string {
    const useLocale = locale || this._locale;
    const translations = this._translations[useLocale] || this._translations['en-US'] || {};
    
    let result = translations[key] || key;
    
    // Replace parameters in the translation string
    Object.entries(params).forEach(([paramKey, paramValue]) => {
      result = result.replace(new RegExp(`{{${paramKey}}}`, 'g'), paramValue);
    });
    
    return result;
  }
  
  /**
   * Set a date/time format for a specific locale
   * @param locale Target locale
   * @param formatName Name of the format (e.g., 'short', 'medium', 'long', 'full')
   * @param formatOptions Intl.DateTimeFormatOptions object
   */
  public setDateTimeFormat(locale: string, formatName: string, formatOptions: Intl.DateTimeFormatOptions): void {
    if (!this._dateTimeFormats[locale]) {
      this._dateTimeFormats[locale] = {} as DateFormatOptions;
    }
    this._dateTimeFormats[locale][formatName] = formatOptions;
  }
  
  /**
   * Get date/time format options for a specific locale
   * @param locale Target locale
   * @param formatName Format name ('short', 'medium', 'long', 'full')
   * @returns DateTimeFormatOptions object
   */
  public getDateTimeFormat(locale: string, formatName: string = 'medium'): Intl.DateTimeFormatOptions {
    const localeFormats = this._dateTimeFormats[locale] || this._dateTimeFormats['default'];
    return localeFormats[formatName] || localeFormats['medium'];
  }
  
  /**
   * Format a date according to locale and specified format
   * @param date Date to format
   * @param formatName Format name ('short', 'medium', 'long', 'full') or Intl.DateTimeFormatOptions object
   * @param locale Optional locale (uses current locale if not specified)
   * @returns Formatted date string
   */
  public formatDate(date: Date, formatName: string | Intl.DateTimeFormatOptions = 'medium', locale?: string): string {
    if (!date) return '';
    
    const useLocale = locale || this._locale;
    let formatOptions: Intl.DateTimeFormatOptions;
    
    if (typeof formatName === 'string') {
      formatOptions = this.getDateTimeFormat(useLocale, formatName);
    } else {
      formatOptions = formatName;
    }
    
    return new Intl.DateTimeFormat(useLocale, formatOptions).format(date);
  }
  
  /**
   * Format month and year
   * @param yearOrDate Year or Date object
   * @param month Optional month index if year is provided as a number
   * @returns Formatted month and year string
   */
  public formatMonthYear(yearOrDate: number | Date, month?: number): string {
    if (yearOrDate instanceof Date) {
      return this._monthFormatter?.format(yearOrDate) ?? '';
    } else if (typeof month === 'number') {
      const date = new Date(yearOrDate, month);
      return this._monthFormatter?.format(date) ?? '';
    }
    return '';
  }
  
  /**
   * Format weekday (narrow format)
   * @param date Date to format
   * @returns Narrow weekday name
   */
  public formatWeekday(date: Date): string {
    return this._weekdayFormatter?.format(date) ?? '';
  }
  
  /**
   * Format weekday (long format)
   * @param date Date to format
   * @returns Long weekday name 
   */
  public formatWeekdayLong(date: Date): string {
    return this._weekdayLongFormatter?.format(date) ?? '';
  }
  
  /**
   * Get month name by index (0=Jan, 1=Feb, etc.)
   * @param monthIndex Month index (0-11)
   * @param short Whether to return short month name
   * @returns Localized month name
   */
  public getMonthName(monthIndex: number, short: boolean = false): string {
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
   * Format weekday narrow by index (0=Sunday, 1=Monday, etc.)
   * @param dayIndex Day index (0-6)
   * @returns Narrow weekday name
   */
  public formatWeekdayNarrow(dayIndex: number): string {
    // Create a date for the specified day of the week
    // Starting with Sunday, January 1, 2023
    const date = new Date(2023, 0, 1 + dayIndex);
    return this._weekdayFormatter?.format(date) ?? '';
  }
  
  /**
   * Get day abbreviation by index (0=Sunday, 1=Monday, etc.)
   * @param dayIndex Day index (0-6)
   * @returns Abbreviated day name
   */
  public getDayAbbr(dayIndex: number): string {
    return this.formatWeekdayNarrow(dayIndex);
  }
  
  /**
   * Get array of localized weekday names based on first day setting
   * @param firstDayOfWeek First day of week (0=Sunday, 1=Monday, etc.)
   * @returns Array of weekday names
   */
  public getWeekdayNames(firstDayOfWeek: number = 0): string[] {
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
   * @param firstDayOfWeek First day of week (0=Sunday, 1=Monday, etc.)
   * @returns Array of long weekday names
   */
  public getWeekdayLongNames(firstDayOfWeek: number = 0): string[] {
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
   * Get correct date separator for locale
   * @param locale Target locale
   * @returns Date separator character
   */
  public getDateSeparator(locale?: string): string {
    const useLocale = locale || this._locale;
    // Common separators by locale
    const separators: Record<string, string> = {
      'en-US': '/', // MM/DD/YYYY
      'en-GB': '/', // DD/MM/YYYY
      'fr-FR': '/', // DD/MM/YYYY
      'de-DE': '.', // DD.MM.YYYY
      'es-ES': '/', // DD/MM/YYYY
      'ja-JP': '/', // YYYY/MM/DD
      'zh-CN': '/', // YYYY/MM/DD
    };
    
    return separators[useLocale] || '/';
  }
  
  /**
   * Get date format pattern for a specified locale
   * @param locale Target locale
   * @returns Format pattern suitable for date formatting
   */
  public getDateFormatPattern(locale?: string): string {
    const useLocale = locale || this._locale;
    // Common date formats by locale
    const formats: Record<string, string> = {
      'en-US': 'MM/dd/yyyy', // US
      'en-GB': 'dd/MM/yyyy', // UK
      'fr-FR': 'dd/MM/yyyy', // France
      'de-DE': 'dd.MM.yyyy', // Germany
      'es-ES': 'dd/MM/yyyy', // Spain
      'ja-JP': 'yyyy/MM/dd', // Japan
      'zh-CN': 'yyyy/MM/dd', // China
    };
    
    return formats[useLocale] || 'MM/dd/yyyy';
  }
  
  /**
   * Get first day of week for a locale (0 = Sunday, 1 = Monday, etc.)
   * @param locale Target locale
   * @returns Number representing first day of week
   */
  public getFirstDayOfWeek(locale?: string): number {
    const useLocale = locale || this._locale;
    
    // First day of week by locale
    const firstDays: Record<string, number> = {
      'en-US': 0, // Sunday
      'en-GB': 1, // Monday
      'fr-FR': 1, // Monday
      'de-DE': 1, // Monday
      'es-ES': 1, // Monday
      'ja-JP': 0, // Sunday
      'zh-CN': 1, // Monday
    };
    
    return firstDays[useLocale] !== undefined ? firstDays[useLocale] : 1; // Default to Monday
  }
}