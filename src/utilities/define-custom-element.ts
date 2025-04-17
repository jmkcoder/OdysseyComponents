/**
 * Define and register the web component
 */
export function defineCustomElement(tagName: string, elementClass: CustomElementConstructor) {
    try {
        if (!customElements.get(tagName)) {
            customElements.define(tagName, elementClass);
            console.log(`Custom element '${tagName}' registered successfully`);
        }
    } catch (error) {
        console.error(`Error registering custom element '${tagName}':`, error);
    }
}