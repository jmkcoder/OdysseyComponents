/**
 * Define and register the web component
 */
export function defineCustomElement(elementName: string, elementClass: CustomElementConstructor): boolean {
    if (typeof window === 'undefined' || !window.customElements) {
        return false;
    }

    if (customElements.get(elementName)) {
        return true;
    }

    try {
        customElements.define(elementName, elementClass);
        return true;
    } catch (error) {
        return false;
    }
}