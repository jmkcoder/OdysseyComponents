import { InternationalizationService } from '../../../../services';

/**
 * Simple formatter class to handle date token replacements
 */
export class DateTokenFormatter {
  constructor(private readonly i18nService: InternationalizationService) {}
  
  /**
   * Format a date according to a pattern
   */
  format(date: Date, pattern: string, locale?: string): string {
    if (!date) return '';
    
    const useLocale = locale || this.i18nService.locale;
    let result = pattern;
    
    // If the format is a named format pattern from Intl.DateTimeFormat
    if (['short', 'medium', 'long', 'full'].includes(pattern)) {
      return this.i18nService.formatDate(date, pattern, locale);
    }
    
    // If the format is 'locale', use the locale default pattern
    if (pattern === 'locale') {
      result = this.i18nService.getDateFormatPattern(useLocale);
    }
    
    // Get date components
    const year = date.getFullYear();
    const month = date.getMonth(); // 0-based
    const day = date.getDate();
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const seconds = date.getSeconds();
    const milliseconds = date.getMilliseconds();
    
    // Replace tokens in the pattern with actual values
    result = this.replaceYearTokens(result, year);
    result = this.replaceMonthTokens(result, month, useLocale);
    result = this.replaceDayTokens(result, day, year, month, useLocale);
    result = this.replaceTimeTokens(result, hours, minutes, seconds, milliseconds, useLocale);
    
    return result;
  }
  
  private replaceYearTokens(pattern: string, year: number): string {
    let result = pattern;
    
    // Year formats
    if (result.includes('yyyy')) {
      result = result.replace(/yyyy/g, year.toString());
    } else if (result.includes('yy')) {
      const twoDigitYear = year.toString().slice(-2);
      result = result.replace(/yy/g, twoDigitYear);
    }
    
    return result;
  }
  
  private replaceMonthTokens(pattern: string, month: number, locale: string): string {
    let result = pattern;
    
    // Month names (full and abbreviated)
    if (result.includes('MMMM')) {
      const fullMonthName = new Date(2000, month, 1).toLocaleString(locale, { month: 'long' });
      result = result.replace(/MMMM/g, fullMonthName);
    }
    
    if (result.includes('MMM')) {
      const shortMonthName = new Date(2000, month, 1).toLocaleString(locale, { month: 'short' });
      result = result.replace(/MMM/g, shortMonthName);
    }
    
    // Month formats
    if (result.includes('MM')) {
      const twoDigitMonth = (month + 1).toString().padStart(2, '0');
      result = result.replace(/MM/g, twoDigitMonth);
    } else if (result.includes('M') && !result.includes('MMM')) {
      result = result.replace(/\bM\b/g, (month + 1).toString());
    }
    
    return result;
  }
  
  private replaceDayTokens(pattern: string, day: number, year: number, month: number, locale: string): string {
    let result = pattern;
    
    // Weekday names (full, abbreviated, and narrow)
    if (result.includes('EEEE')) {
      const fullDayName = new Date(year, month, day).toLocaleString(locale, { weekday: 'long' });
      result = result.replace(/EEEE/g, fullDayName);
    }
    
    if (result.includes('EEE')) {
      const shortDayName = new Date(year, month, day).toLocaleString(locale, { weekday: 'short' });
      result = result.replace(/EEE/g, shortDayName);
    }
    
    if (result.includes('E')) {
      const narrowDayName = new Date(year, month, day).toLocaleString(locale, { weekday: 'narrow' });
      // We need to be careful with single character tokens
      result = result.replace(/\bE\b/g, narrowDayName);
    }
    
    // Day formats
    if (result.includes('dd')) {
      const twoDigitDay = day.toString().padStart(2, '0');
      result = result.replace(/dd/g, twoDigitDay);
    } else if (result.includes('d') && !result.includes('dd')) {
      result = result.replace(/\bd\b/g, day.toString());
    }
    
    // Day of year
    if (result.includes('DDD')) {
      const start = new Date(year, 0, 0);
      const diff = (new Date(year, month, day).getTime() - start.getTime());
      const oneDay = 1000 * 60 * 60 * 24;
      const dayOfYear = Math.floor(diff / oneDay).toString().padStart(3, '0');
      result = result.replace(/DDD/g, dayOfYear);
    } else if (result.includes('D') && !result.includes('DD') && !result.includes('DDD')) {
      const start = new Date(year, 0, 0);
      const diff = (new Date(year, month, day).getTime() - start.getTime());
      const oneDay = 1000 * 60 * 60 * 24;
      const dayOfYear = Math.floor(diff / oneDay).toString();
      result = result.replace(/\bD\b/g, dayOfYear);
    }
    
    // ISO week number
    if (result.includes('w')) {
      const firstDayOfYear = new Date(year, 0, 1);
      const pastDaysOfYear = (new Date(year, month, day).getTime() - firstDayOfYear.getTime()) / 86400000;
      const weekNumber = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
      result = result.replace(/\bw\b/g, weekNumber.toString());
    }
    
    // Quarter of year
    if (result.includes('Q')) {
      const quarter = Math.floor(month / 3) + 1;
      result = result.replace(/\bQ\b/g, quarter.toString());
    }
    
    return result;
  }
  
  private replaceTimeTokens(pattern: string, hours: number, minutes: number, seconds: number, milliseconds: number, locale: string): string {
    let result = pattern;
    
    // Time formats: Hours
    if (result.includes('HH')) {
      const twoDigitHour24 = hours.toString().padStart(2, '0');
      result = result.replace(/HH/g, twoDigitHour24);
    } else if (result.includes('H')) {
      result = result.replace(/\bH\b/g, hours.toString());
    }
    
    if (result.includes('hh')) {
      const hour12 = hours % 12 || 12;
      const twoDigitHour = hour12.toString().padStart(2, '0');
      result = result.replace(/hh/g, twoDigitHour);
    } else if (result.includes('h')) {
      const hour12 = hours % 12 || 12;
      result = result.replace(/\bh\b/g, hour12.toString());
    }
    
    // Minutes
    if (result.includes('mm')) {
      const twoDigitMinutes = minutes.toString().padStart(2, '0');
      result = result.replace(/mm/g, twoDigitMinutes);
    } else if (result.includes('m') && !result.includes('mm')) {
      result = result.replace(/\bm\b/g, minutes.toString());
    }
    
    // Seconds
    if (result.includes('ss')) {
      const twoDigitSeconds = seconds.toString().padStart(2, '0');
      result = result.replace(/ss/g, twoDigitSeconds);
    } else if (result.includes('s') && !result.includes('ss')) {
      result = result.replace(/\bs\b/g, seconds.toString());
    }
    
    // Milliseconds
    if (result.includes('SSS')) {
      const threeDigitMs = milliseconds.toString().padStart(3, '0');
      result = result.replace(/SSS/g, threeDigitMs);
    }
    
    // AM/PM indicator
    if (result.includes('a')) {
      // Use localized AM/PM format
      const ampm = hours >= 12 ? 
        new Intl.DateTimeFormat(locale, { hour: 'numeric', hour12: true })
          .formatToParts(new Date(2023, 0, 1, 14))
          .find(part => part.type === 'dayPeriod')?.value || 'PM' : 
        new Intl.DateTimeFormat(locale, { hour: 'numeric', hour12: true })
          .formatToParts(new Date(2023, 0, 1, 10))
          .find(part => part.type === 'dayPeriod')?.value || 'AM';
      
      // Use a more robust pattern matching to handle standalone 'a'
      result = result.replace(/(?:^|\s)a(?:$|\s)/g, (match) => {
        if (match.startsWith(' ') && match.endsWith(' ')) return ` ${ampm} `;
        if (match.startsWith(' ')) return ` ${ampm}`;
        if (match.endsWith(' ')) return `${ampm} `;
        return ampm;
      });
    }
    
    return result;
  }
}