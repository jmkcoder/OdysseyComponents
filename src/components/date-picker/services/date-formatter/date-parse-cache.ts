/**
 * Cache for parsed dates to ensure consistency
 */
export class DateParseCache {
  private static instance: DateParseCache;
  private cache: Map<string, Date>;
  
  private constructor() {
    this.cache = new Map<string, Date>();
  }
  
  static getInstance(): DateParseCache {
    if (!DateParseCache.instance) {
      DateParseCache.instance = new DateParseCache();
    }
    return DateParseCache.instance;
  }
  
  get(key: string): Date | undefined {
    return this.cache.get(key);
  }
  
  set(key: string, value: Date): void {
    this.cache.set(key, value);
  }
  
  has(key: string): boolean {
    return this.cache.has(key);
  }
}