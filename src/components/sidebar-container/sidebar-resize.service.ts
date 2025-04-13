import { debounce } from 'lodash'; // Import debounce for performance optimization

export class SidebarResizeService {
  private sidebar: HTMLElement;
  private resizeHandle: HTMLElement | undefined;
  private isResizing: boolean = false;
  private isEnabled: boolean = true;
  private eventListeners: { [key: string]: ((...args: any[]) => void)[] } = {};

  constructor(sidebar: HTMLElement) {
    this.sidebar = sidebar;
    this.createResizeHandle();
    this.addEventListeners();
  }

  private createResizeHandle() {
    this.resizeHandle = document.createElement('div');
    this.resizeHandle.className = 'resize-handle';
    this.sidebar.appendChild(this.resizeHandle);
  }

  private addEventListeners() {
    this.resizeHandle?.addEventListener('mousedown', this.onMouseDown.bind(this));
    document.addEventListener('mousemove', this.onMouseMove.bind(this));
    document.addEventListener('mouseup', this.onMouseUp.bind(this));
  }

  private onMouseDown(event: MouseEvent) {
    if (!this.isEnabled) return;
    this.isResizing = true;
    document.body.style.cursor = 'col-resize';
    this.emit('resizeStart', event);
    event.preventDefault(); // Prevent text selection during resizing
  }

  private onMouseMove(event: MouseEvent) {
    if (!this.isResizing || !this.isEnabled) return;

    const containerWidth = this.sidebar.parentElement?.clientWidth || window.innerWidth;
    const newWidth = event.clientX - this.sidebar.getBoundingClientRect().left;
    const minWidth = 150;
    const maxWidth = containerWidth;

    if (newWidth >= minWidth && newWidth <= maxWidth) {
      this.sidebar.style.transition = 'width 0.1s ease';
      this.sidebar.style.width = `${newWidth}px`;
      this.emit('resizing', newWidth);
    }
  }

  private onMouseUp() {
    if (this.isResizing) {
      this.emit('resizeEnd');
    }
    this.isResizing = false;
    document.body.style.cursor = '';
  }

  public enable() {
    this.isEnabled = true;
    if (this.resizeHandle) {
      this.resizeHandle.classList.remove('disabled');
    }
  }

  public disable() {
    this.isEnabled = false;
    if (this.resizeHandle) {
      this.resizeHandle.classList.add('disabled');
    }
  }

  public destroy() {
    this.resizeHandle?.removeEventListener('mousedown', this.onMouseDown.bind(this));
    document.removeEventListener('mousemove', this.onMouseMove.bind(this));
    document.removeEventListener('mouseup', this.onMouseUp.bind(this));
  }

  public on(event: string, listener: (...args: any[]) => void) {
    if (!this.eventListeners[event]) {
      this.eventListeners[event] = [];
    }
    this.eventListeners[event].push(listener);
  }

  public off(event: string, listener: (...args: any[]) => void) {
    if (!this.eventListeners[event]) return;
    this.eventListeners[event] = this.eventListeners[event].filter(l => l !== listener);
  }

  private emit(event: string, ...args: any[]) {
    if (!this.eventListeners[event]) return;
    this.eventListeners[event].forEach(listener => listener(...args));
  }
}