import '../styles.scss'

/**
 * Helper utilities for integrating Tailwind CSS with Web Components
 */

/**
 * Injects Tailwind styles into a Shadow DOM
 * @param shadowRoot The shadow root to inject styles into
 */
export async function injectTailwindStyles(shadowRoot: ShadowRoot): Promise<void> {
    // Create a style element to directly inject CSS
    const styleElem = document.createElement('style');
    styleElem.id = 'tailwind-styles';
    
    try {
        // Try to fetch the compiled CSS
        const response = await fetch('/components.bundle.css');
        if (!response.ok) {
            throw new Error(`Failed to fetch CSS: ${response.status} ${response.statusText}`);
        }
        const css = await response.text();
        styleElem.textContent = css;
        shadowRoot.appendChild(styleElem);
    } catch (err) {
        // Fallback approach: try to get styles from the document
        try {
            const existingStylesheet = document.querySelector('link[href*="components.bundle.css"]');
            if (existingStylesheet && existingStylesheet instanceof HTMLLinkElement) {
                const fallbackStyleElem = document.createElement('link');
                fallbackStyleElem.rel = 'stylesheet';
                fallbackStyleElem.href = existingStylesheet.href;
                fallbackStyleElem.id = 'tailwind-styles';
                shadowRoot.appendChild(fallbackStyleElem);
            } else {
                // If no stylesheet found, create an empty one as placeholder
                const emptyStyle = document.createElement('style');
                emptyStyle.id = 'tailwind-styles';
                emptyStyle.textContent = '/* Placeholder for Tailwind styles */';
                shadowRoot.appendChild(emptyStyle);
            }
        } catch (fallbackErr) {
            // If both methods fail, create an empty style element
            const emptyStyle = document.createElement('style');
            emptyStyle.id = 'tailwind-styles';
            emptyStyle.textContent = '/* Placeholder for Tailwind styles */';
            shadowRoot.appendChild(emptyStyle);
        }
    }

    
}

/**
 * A base class for web components that use Tailwind CSS
 * Extend this class to automatically get Tailwind styles in your shadow DOM
 */
export class TailwindElement extends HTMLElement {
  protected shadow: ShadowRoot;
  
  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: 'open' });
    
    // Inject Tailwind styles asynchronously
    injectTailwindStyles(this.shadow).catch(err => {
    });
  }

  /**
   * Helper method to apply Tailwind classes inside the shadow DOM
   * @param element The element to apply classes to
   * @param classes Space-separated string of Tailwind classes
   */
  protected applyTailwindClasses(element: HTMLElement, classes: string): void {
    classes.split(' ').forEach(className => {
      if (className.trim()) {
        element.classList.add(className.trim());
      }
    });
  }

  render() {
    // Method to be overridden by subclasses
    const tailwindStyles = this.shadow.querySelector('#tailwind-styles');
    if (tailwindStyles) {
      this.shadow.appendChild(tailwindStyles);
    }
  }
}