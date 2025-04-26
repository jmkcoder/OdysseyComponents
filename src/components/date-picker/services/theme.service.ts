/**
 * Service responsible for theme handling and detection
 */
export class ThemeService {
  private _theme: string = 'light';
  private _observer: MutationObserver | null = null;
  private _themeMap = {
    light: 'light',
    dark: 'dark',
    minimal: 'minimal',
    'high-contrast': 'high-contrast'
  };

  constructor() {
    // Default to light theme
  }

  /**
   * Initialize theme from element attributes or detect from parent
   */
  initializeTheme(element: HTMLElement): void {
    this._theme = element.getAttribute('theme') || 
      this.detectThemeFromParentOrClass(element) || 
      'light';
    this.applyThemeClass(element);
  }

  /**
   * Apply theme class to element
   */
  applyThemeClass(element: HTMLElement): void {
    // Remove all theme classes first
    Object.keys(this._themeMap).forEach(theme => {
      element.classList.remove(theme);
    });
    
    // Add the current theme class
    element.classList.add(this._theme);
    element.setAttribute('data-theme', this._theme);
  }

  /**
   * Set theme and update element classes
   */
  setTheme(element: HTMLElement, theme: string): void {
    if (Object.keys(this._themeMap).includes(theme)) {
      this._theme = theme;
      this.applyThemeClass(element);
    }
  }

  /**
   * Get current theme
   */
  getTheme(): string {
    return this._theme;
  }

  /**
   * Observe parent element for theme changes
   */
  observeParentThemeChanges(element: HTMLElement): void {
    if (!element.parentElement) return;
    
    this._observer = new MutationObserver(mutations => {
      mutations.forEach(mutation => {
        if (mutation.type === 'attributes' && 
            (mutation.attributeName === 'class' || mutation.attributeName === 'theme')) {
          const detectedTheme = this.detectThemeFromParentOrClass(element);
          if (detectedTheme && detectedTheme !== this._theme) {
            this._theme = detectedTheme;
            this.applyThemeClass(element);
          }
        }
      });
    });
    
    // Start observing parent element
    this._observer.observe(element.parentElement, {
      attributes: true,
      attributeFilter: ['class', 'theme']
    });
  }

  /**
   * Disconnect observer when component is removed
   */
  disconnectObserver(): void {
    if (this._observer) {
      this._observer.disconnect();
      this._observer = null;
    }
  }

  /**
   * Detect theme from parent element classes or attributes
   */
  detectThemeFromParentOrClass(element: HTMLElement): string | null {
    // Check if we're inside a container with theme
    let parent = element.closest('.sidebar-container');
    
    // If not found, try parent element
    if (!parent && element.parentElement) {
      parent = element.parentElement;
    }
    
    if (parent) {
      // First check for theme attribute
      const themeAttr = parent.getAttribute('theme');
      if (themeAttr && Object.keys(this._themeMap).includes(themeAttr)) {
        return themeAttr;
      }
      
      // Then check for theme classes
      for (const theme of Object.keys(this._themeMap)) {
        if (parent.classList.contains(theme)) {
          return theme;
        }
      }
      
      // Recursively check parent nodes up to 3 levels
      let currentParent = parent;
      let levelsToCheck = 3;
      
      while (currentParent.parentElement && levelsToCheck > 0) {
        currentParent = currentParent.parentElement;
        
        for (const theme of Object.keys(this._themeMap)) {
          if (currentParent.classList.contains(theme)) {
            return theme;
          }
        }
        
        levelsToCheck--;
      }
    }
    
    // Check if document body has theme
    const bodyClassList = document.body.classList;
    for (const theme of Object.keys(this._themeMap)) {
      if (bodyClassList.contains(theme)) {
        return theme;
      }
    }
    
    // Default to null (which will fallback to the default theme)
    return null;
  }
}