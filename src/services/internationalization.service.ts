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
  
  /**
   * Private constructor to enforce the Singleton pattern
   * @param locale Initial locale
   */
  private constructor(locale: string = navigator.language) {
    this._locale = locale;
    this._initializeDefaultDateTimeFormats();
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