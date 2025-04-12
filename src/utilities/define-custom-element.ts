/**
 * Define and register the web component
 */
export function defineCustomElement(tagName: string, elementClass: CustomElementConstructor) {
    if (!customElements.get(tagName)) {
        customElements.define(tagName, elementClass);
    }
}