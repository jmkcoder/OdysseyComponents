import { TailwindElement } from '../../utilities/tailwind-utils';
import { defineCustomElement } from '../../utilities/define-custom-element';

// Pure web component implementation that uses Tailwind
export class OdysseyButton extends TailwindElement {
  private button: HTMLButtonElement | null = null;
  
  constructor() {
    super();
    
    // Render after a small delay to ensure styles are loaded
    setTimeout(() => this.render(), 0);
  }
  
  // Declarative render method
  render() {
    type VariantType = keyof typeof variantClasses;
    const variant = (this.getAttribute('variant') as VariantType) || 'primary';
    const label = this.getAttribute('label') || 'Button';
    const disabled = this.hasAttribute('disabled');
    
    // Stripe-inspired button styles
    const baseClasses = "px-4 py-2 text-sm font-medium rounded-full transition-all duration-200 ease-in-out";
    
    // Different variants based on Stripe's design
    const variantClasses = {
      primary: "bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm",
      secondary: "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50",
      subtle: "bg-transparent text-indigo-600 hover:bg-indigo-50"
    };
    
    const disabledClasses = disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer";
    
    const template = document.createElement('template');
    template.innerHTML = `
      <button class="${baseClasses} ${variantClasses[variant] || variantClasses.primary} ${disabledClasses}"
        ${disabled ? 'disabled' : ''}>
        ${label}
      </button>
    `;
    
    // Clear and recreate content
    const tailwindStyles = this.shadow.querySelector('#tailwind-styles');
    this.shadow.innerHTML = '';
    
    if (tailwindStyles) {
      this.shadow.appendChild(tailwindStyles);
    }
    
    this.shadow.appendChild(template.content.cloneNode(true));
    
    this.button = this.shadow.querySelector('button');
    
    if (this.button && !disabled) {
      this.button.addEventListener('click', this._handleClick);
    }
  }
  
  // Event handler for click events
  private _handleClick = () => {
    this.dispatchEvent(new CustomEvent('button-click', {
      bubbles: true,
      composed: true
    }));
  }
  
  connectedCallback() {
    // Already rendered in constructor
  }
  
  disconnectedCallback() {
    // Clean up event listeners
    if (this.button) {
      this.button.removeEventListener('click', this._handleClick);
    }
  }
  
  static get observedAttributes() {
    return ['label', 'disabled', 'variant'];
  }
  
  attributeChangedCallback(name: string, oldValue: string, newValue: string) {
    if (oldValue === newValue) return;
    this.render();
  }
}

export const defineOdysseyButton = () => defineCustomElement('odyssey-button', OdysseyButton);