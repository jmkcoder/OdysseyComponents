import { defineCustomElement } from '../../utilities/define-custom-element';
import { SidebarResizeService } from './sidebar-resize.service';
import './sidebar-container.scss';

class SidebarContainer extends HTMLElement {
  private resizeService!: SidebarResizeService;
  private isCollapsed: boolean = false;
  private isResizeEnabled: boolean = true;

  constructor() {
    super();
  }

  connectedCallback() {
    if (!this.isConnected) return;

    // Create the surrounding structure without overwriting the slotted content
    const wrapper = document.createElement('div');
    wrapper.className = 'sidebar-container';

    wrapper.innerHTML = `
      <div class="sidebar-header">
        <h1 class="sidebar-title">Sidebar</h1>
      </div>
      <div class="sidebar-content">
      </div>
      <div class="sidebar-footer">
        <label class="theme-toggle">
          <span>Dark Mode</span> 
          <input type="checkbox" id="theme-toggle-checkbox">
        </label>
      </div>
      <div class="resize-handle"></div>
    `;

    // Move existing children into the content area
    const contentArea = wrapper.querySelector('.sidebar-content');
    if (contentArea) {
      while (this.firstChild) {
        contentArea.appendChild(this.firstChild);
      }
    }

    // Clear the current content and append the wrapper
    this.innerHTML = '';
    this.appendChild(wrapper);

    const sidebarElement = this.querySelector('.sidebar-container') as HTMLElement;
    if (!sidebarElement) {
      throw new Error("Sidebar container element not found");
    }

    // Initialize the resize service with the sidebar element
    this.resizeService = new SidebarResizeService(sidebarElement);
    this.addThemeToggleListener();
    this.applyTheme();
    this.addSwipeGestureListener(sidebarElement);

    // Apply custom CSS variables if provided
    this.applyCustomStyles();

    const isMobile = window.matchMedia('(max-width: 767px)').matches;
    if (isMobile) {
      this.isResizeEnabled = false;
      this.resizeService.disable();
    }

    // Emit collapse/expand events
    this.addEventListener('collapse', () => {
      console.log('Sidebar collapsed');
    });

    this.addEventListener('expand', () => {
      console.log('Sidebar expanded');
    });
  }

  static get observedAttributes() {
    return ['theme'];
  }

  attributeChangedCallback(name: string, oldValue: string, newValue: string) {
    if (name === 'theme' && oldValue !== newValue) {
      this.applyTheme();
    }
  }

  private applyTheme() {
    const theme = this.getAttribute('theme');
    const sidebarElement = this.querySelector('.sidebar-container') as HTMLElement;
    sidebarElement.classList.remove('light', 'dark', 'minimal', 'high-contrast');
    if (theme) {
      sidebarElement.classList.add(theme);
    }
  }

  private applyCustomStyles() {
    const styleKeys = [
      '--sidebar-bg',
      '--sidebar-text',
      '--sidebar-border',
      '--sidebar-dark-bg',
      '--sidebar-dark-text',
      '--sidebar-dark-border',
      '--sidebar-hover-text',
      '--toggle-bg',
      '--toggle-checked-bg'
    ];

    styleKeys.forEach((key) => {
      const value = this.getAttribute(key);
      if (value) {
        this.style.setProperty(key, value);
      }
    });
  }

  private addThemeToggleListener() {
    const themeToggleCheckbox = this.querySelector('#theme-toggle-checkbox') as HTMLInputElement;
    themeToggleCheckbox.addEventListener('change', () => {
      const sidebarElement = this.querySelector('.sidebar-container') as HTMLElement;
      if (themeToggleCheckbox.checked) {
        sidebarElement.classList.add('dark');
      } else {
        sidebarElement.classList.remove('dark');
      }
    });
  }

  private addSwipeGestureListener(sidebarElement: HTMLElement) {
    let touchStartX = 0;
    let touchEndX = 0;

    const handleGesture = () => {
      if (touchEndX < touchStartX - 50) {
        // Swipe left to close
        this.isCollapsed = true;
        sidebarElement.classList.add('collapsed');
        this.emitEvent('collapse', { collapsed: true });
      }
      if (touchEndX > touchStartX + 50) {
        // Swipe right to open
        this.isCollapsed = false;
        sidebarElement.classList.remove('collapsed');
        this.emitEvent('expand', { collapsed: false });
      }
    };

    sidebarElement.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].screenX;
      this.emitEvent('touchstart');
    });

    sidebarElement.addEventListener('touchend', (e) => {
      touchEndX = e.changedTouches[0].screenX;
      handleGesture();
      this.emitEvent('touchend');
    });
  }

  private emitEvent(eventName: string, detail: any = {}) {
    const event = new CustomEvent(eventName, { detail });
    this.dispatchEvent(event);
  }

  disconnectedCallback() {
    this.resizeService.destroy();
  }
}

export const defineSidebarContainer = () => defineCustomElement('sidebar-container', SidebarContainer);