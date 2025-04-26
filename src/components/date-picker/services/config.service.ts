/**
 * Service for managing date picker configuration
 */
export class ConfigService {
  private config: Record<string, any> = {
    firstDayOfWeek: 0, // 0 for Sunday, 1 for Monday, etc.
    locale: 'en-US',
    dateFormat: 'MM/dd/yyyy',
    minDate: null,
    maxDate: null,
    theme: 'light',
    disabled: false,
    required: false
  };

  constructor(initialConfig: Record<string, any> = {}) {
    this.updateConfig(initialConfig);
  }

  /**
   * Get the entire configuration object
   */
  getConfig(): Record<string, any> {
    return {...this.config};
  }

  /**
   * Get a specific configuration value
   */
  getValue(key: string): any {
    return this.config[key];
  }

  /**
   * Update configuration with new values
   */
  updateConfig(newConfig: Record<string, any>): void {
    this.config = {
      ...this.config,
      ...newConfig
    };
  }

  /**
   * Set a specific configuration value
   */
  setValue(key: string, value: any): void {
    this.config[key] = value;
  }
}