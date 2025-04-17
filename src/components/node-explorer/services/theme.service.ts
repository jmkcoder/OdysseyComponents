import { UIUpdaterService } from './ui-updater.service';

export class ThemeService {
    private _theme: string = 'light';
    private _parentThemeObserver: MutationObserver | null = null;
    
    constructor(private uiUpdaterService: UIUpdaterService) {}
    
    /**
     * Initialize theme from element attributes or detect from parent
     */
    initializeTheme(element: HTMLElement): void {
        this._theme = element.getAttribute('theme') || 
            this.uiUpdaterService.detectThemeFromParentOrClass(element) || 
            'light';
        this.applyThemeClass(element);
    }
    
    /**
     * Apply the appropriate theme class based on the current theme value
     */
    applyThemeClass(element: HTMLElement): void {
        // Remove all existing theme classes
        element.classList.remove('light-theme', 'dark-theme', 'minimal-theme', 'high-contrast-theme');
        
        // Apply the appropriate theme class with suffix
        if (this._theme === 'dark') {
            element.classList.add('dark-theme');
        } else if (this._theme === 'minimal') {
            element.classList.add('minimal-theme');
        } else if (this._theme === 'high-contrast') {
            element.classList.add('high-contrast-theme');
        } else {
            // Default to light theme
            element.classList.add('light-theme');
        }
    }
    
    /**
     * Set up mutation observer to detect theme changes in parent elements
     */
    observeParentThemeChanges(element: HTMLElement): void {
        // If we already have an observer, disconnect it
        if (this._parentThemeObserver) {
            this._parentThemeObserver.disconnect();
            this._parentThemeObserver = null;
        }
        
        // Find the closest parent sidebar-container or any relevant parent
        let targetParent: Element | null = element.closest('.sidebar-container') || element.parentElement;
        
        if (!targetParent) return;
        
        // Create a new observer to watch for class and attribute changes
        this._parentThemeObserver = new MutationObserver((mutations) => {
            let shouldUpdateTheme = false;
            
            for (const mutation of mutations) {
                if (
                    (mutation.type === 'attributes' && 
                     (mutation.attributeName === 'class' || mutation.attributeName === 'theme')) ||
                    mutation.type === 'childList'
                ) {
                    shouldUpdateTheme = true;
                    break;
                }
            }
            
            if (shouldUpdateTheme) {
                const detectedTheme = this.uiUpdaterService.detectThemeFromParentOrClass(element);
                if (detectedTheme && detectedTheme !== this._theme) {
                    this.setTheme(element, detectedTheme);
                }
            }
        });
        
        // Start observing
        this._parentThemeObserver.observe(targetParent, {
            attributes: true,
            attributeFilter: ['class', 'theme'],
            childList: true,
            subtree: false
        });
    }
    
    /**
     * Stop observing theme changes
     */
    disconnectObserver(): void {
        if (this._parentThemeObserver) {
            this._parentThemeObserver.disconnect();
            this._parentThemeObserver = null;
        }
    }
    
    /**
     * Get the current theme
     */
    getTheme(): string {
        return this._theme;
    }
    
    /**
     * Set a new theme and update the element
     */
    setTheme(element: HTMLElement, theme: string): void {
        if (this._theme !== theme) {
            this._theme = theme;
            element.setAttribute('theme', theme);
            this.applyThemeClass(element);
        }
    }
}