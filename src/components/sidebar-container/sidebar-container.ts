import { defineCustomElement } from '../../utilities/define-custom-element';
import { SidebarResizeService } from './sidebar-resize.service';
import './sidebar-container.scss';

class SidebarContainer extends HTMLElement {
  private resizeService!: SidebarResizeService;
  private isResizeEnabled: boolean = false;

  constructor() {
    super();
  }

  connectedCallback() {
    if (!this.isConnected) return;

    // Create the surrounding structure without overwriting the slotted content
    this.className = 'sidebar-container';

    const userHeader = this.querySelector('header');
    const userFooter = this.querySelector('footer');
    const parser = new DOMParser();

    const content = `
      <header class="sidebar-header">
        ${userHeader ? userHeader.innerHTML : '<h1 class="sidebar-title">Sidebar</h1>'}
      </header>
      <div class="sidebar-content">
      </div>
      <footer class="sidebar-footer">
        ${userFooter ? userFooter.innerHTML : '<label class="theme-toggle"><span>Dark Mode</span><input type="checkbox" id="theme-toggle-checkbox"></label>'}
      </footer>
      <div class="resize-handle"></div>
    `;

    const contentHtml = parser.parseFromString(content, 'text/html')

    // Move existing children (except header and footer) into the content area
    const contentArea = contentHtml.querySelector('.sidebar-content');
    if (contentArea) {
      Array.from(this.children).forEach((child) => {
        if (child.tagName.toLowerCase() !== 'header' && child.tagName.toLowerCase() !== 'footer') {
          contentArea.appendChild(child);
        }
      });
    }

    this.innerHTML = '';
    this.appendChild(contentHtml.body);

    // Initialize the resize service with the web component itself
    this.resizeService = new SidebarResizeService(this);

    this.addThemeToggleListener();
    this.applyTheme();
    this.addSwipeGestureListener(this);

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

    const hideDarkMode = this.hasAttribute('hide-darkmode');
    this.toggleDarkModeSection(hideDarkMode);

    // Add ARIA attributes for accessibility
    this.setAttribute('role', 'complementary');
    this.setAttribute('aria-expanded', 'true');

    // Add keyboard navigation support
    this.addEventListener('keydown', this.handleKeyboardNavigation.bind(this));
  }

  static get observedAttributes() {
    return ['theme', 'hide-darkmode'];
  }

  attributeChangedCallback(name: string, oldValue: string, newValue: string) {
    if (name === 'theme' && oldValue !== newValue) {
      this.applyTheme();
    }
    if (name === 'hide-darkmode' && oldValue !== newValue) {
      this.toggleDarkModeSection(newValue !== null);
    }
  }

  private applyTheme() {
    const theme = this.getAttribute('theme');
    const sidebarElement = this.querySelector('.sidebar-container') as HTMLElement;
    if (!sidebarElement) {
      console.warn('Sidebar container element not found in the DOM.');
      return;
    }

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
    if (!themeToggleCheckbox) {
      console.warn('Theme toggle checkbox not found in the DOM.');
      return;
    }

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
        sidebarElement.classList.add('collapsed');
        this.emitEvent('collapse', { collapsed: true });
      }
      if (touchEndX > touchStartX + 50) {
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

  private toggleDarkModeSection(hide: boolean) {
    const darkModeSection = this.querySelector('.theme-toggle') as HTMLElement;
    if (darkModeSection) {
      darkModeSection.style.display = hide ? 'none' : '';
    }
  }

  private handleKeyboardNavigation(event: KeyboardEvent) {
    const sidebarElement = this.querySelector('.sidebar-container') as HTMLElement;
    if (!sidebarElement) return;

    switch (event.key) {
      case 'Tab':
        // Allow default tab behavior
        break;
      case 'ArrowUp':
      case 'ArrowDown':
        this.navigateContent(event.key === 'ArrowUp' ? -1 : 1);
        event.preventDefault();
        break;
      case 'Enter':
      case ' ': // Space key
        this.activateFocusedElement();
        event.preventDefault();
        break;
    }
  }

  private navigateContent(direction: number) {
    const focusableElements = Array.from(
      this.querySelectorAll('.sidebar-content a, .sidebar-content button, .sidebar-content input')
    ) as HTMLElement[];

    const currentIndex = focusableElements.findIndex((el) => el === document.activeElement);
    const nextIndex = (currentIndex + direction + focusableElements.length) % focusableElements.length;

    focusableElements[nextIndex]?.focus();
  }

  private activateFocusedElement() {
    const activeElement = document.activeElement as HTMLElement;
    if (activeElement && this.contains(activeElement)) {
      activeElement.click();
    }
  }

  disconnectedCallback() {
    this.resizeService.destroy();
  }
}

export const defineSidebarContainer = () => defineCustomElement('sidebar-container', SidebarContainer);