import { DropPosition } from '../node-explorer.type';

export class DragDropService {
    private draggedNode: HTMLElement | null = null;
    private dropTarget: HTMLElement | null = null;
    private dropPosition: DropPosition = 'inside';
    private rootElement: HTMLElement; // Changed from shadowRoot to rootElement
    private hostElement: HTMLElement; // Reference to host element for event dispatch
    
    // Event callbacks
    private onDrop: (sourceId: string, targetId: string, position: DropPosition) => void;
    private onDropToRoot: (sourceId: string) => void;
    private onToggleExpansion: (id: string) => void;
    
    // External event listeners
    private externalDragStartListeners: ((sourceId: string, event: DragEvent) => void)[] = [];
    private externalDragEndListeners: ((sourceId: string | null, event: DragEvent) => void)[] = [];
    private externalDragOverListeners: ((targetId: string | null, position: DropPosition, event: DragEvent) => void)[] = [];
    private externalDragLeaveListeners: ((targetId: string | null, event: DragEvent) => void)[] = [];
    private externalDropListeners: ((sourceId: string, targetId: string | null, position: DropPosition, event: DragEvent) => void)[] = [];
    
    constructor(
        rootElement: HTMLElement, // Changed parameter type from ShadowRoot to HTMLElement
        hostElement: HTMLElement,
        onDrop: (sourceId: string, targetId: string, position: DropPosition) => void,
        onDropToRoot: (sourceId: string) => void,
        onToggleExpansion: (id: string) => void
    ) {
        this.rootElement = rootElement;
        this.hostElement = hostElement;
        this.onDrop = onDrop;
        this.onDropToRoot = onDropToRoot;
        this.onToggleExpansion = onToggleExpansion;
    }
    
    // Methods to register external event listeners
    addDragStartListener(listener: (sourceId: string, event: DragEvent) => void): void {
        this.externalDragStartListeners.push(listener);
    }
    
    addDragEndListener(listener: (sourceId: string | null, event: DragEvent) => void): void {
        this.externalDragEndListeners.push(listener);
    }
    
    addDragOverListener(listener: (targetId: string | null, position: DropPosition, event: DragEvent) => void): void {
        this.externalDragOverListeners.push(listener);
    }
    
    addDragLeaveListener(listener: (targetId: string | null, event: DragEvent) => void): void {
        this.externalDragLeaveListeners.push(listener);
    }
    
    addDropListener(listener: (sourceId: string, targetId: string | null, position: DropPosition, event: DragEvent) => void): void {
        this.externalDropListeners.push(listener);
    }
    
    private dispatchCustomEvent(name: string, detail: any): void {
        const event = new CustomEvent(name, {
            bubbles: true, 
            composed: true, // Keep composed true for potential future use in Shadow DOM
            detail
        });
        this.hostElement.dispatchEvent(event);
    }

    attachListeners(): void {
        // Updated to query the rootElement instead of shadowRoot
        const nodeHeaders = this.rootElement.querySelectorAll('.node-header');
        const expandToggles = this.rootElement.querySelectorAll('.expand-toggle');
        const nodeContainer = this.rootElement.querySelector('.node-container');
        
        // Add drag start event
        nodeHeaders.forEach(header => this.attachNodeHeaderEvents(header));
        
        // Add expand/collapse functionality
        expandToggles.forEach(toggle => this.attachExpandToggleEvents(toggle));
        
        if (nodeContainer) {
            this.attachContainerEvents(nodeContainer);
        }
    }
    
    public attachNodeHeaderEvents(header: Element): void {
        header.addEventListener('dragstart', (e) => {
            this.draggedNode = header as HTMLElement;
            const sourceId = header.getAttribute('data-id') || '';
            (e as DragEvent).dataTransfer!.setData('text/plain', sourceId);
            setTimeout(() => {
                (header as HTMLElement).style.opacity = '0.4';
            }, 0);
            
            // Notify external listeners
            this.externalDragStartListeners.forEach(listener => {
                listener(sourceId, e as DragEvent);
            });
            
            // Dispatch custom event
            this.dispatchCustomEvent('drag-start', {
                sourceId,
                originalEvent: e
            });
        });

        header.addEventListener('dragend', (e) => {
            const sourceId = this.draggedNode?.getAttribute('data-id') || null;
            
            if (this.draggedNode) {
                this.draggedNode.style.opacity = '';
                this.draggedNode = null;
            }

            this.clearAllIndicators();
            
            // Notify external listeners
            this.externalDragEndListeners.forEach(listener => {
                listener(sourceId, e as DragEvent);
            });
            
            // Dispatch custom event
            this.dispatchCustomEvent('drag-end', {
                sourceId,
                originalEvent: e
            });
        });

        header.addEventListener('dragover', (e) => {
            e.preventDefault();
            if (this.draggedNode === header) return;

            const rect = header.getBoundingClientRect();
            const mouseY = (e as DragEvent).clientY;
            const thirdHeight = rect.height / 3;

            // Set new dropTarget
            this.dropTarget = header as HTMLElement;
            const targetId = this.dropTarget.getAttribute('data-id') || '';

            this.dropTarget.classList.remove('drop-border-inside');
            this.dropTarget.classList.remove('drop-border-before');
            this.dropTarget.classList.remove('drop-border-after');

            if (mouseY < rect.top + thirdHeight) {
                // Top third - insert before
                this.dropPosition = 'before';
                this.dropTarget.classList.add('drop-border-before');
            } else if (mouseY > rect.bottom - thirdHeight) {
                // Bottom third - insert after
                this.dropPosition = 'after';
                this.dropTarget.classList.add('drop-border-after');
            } else {
                // Middle third - insert inside
                this.dropPosition = 'inside';
                this.dropTarget.classList.add('drop-border-inside');
                this.dropTarget.classList.add('drop-target');
            }
            
            // Notify external listeners
            this.externalDragOverListeners.forEach(listener => {
                listener(targetId, this.dropPosition, e as DragEvent);
            });
            
            // Dispatch custom event
            this.dispatchCustomEvent('drag-over', {
                targetId,
                position: this.dropPosition,
                originalEvent: e
            });
        });

        header.addEventListener('dragleave', (e) => {
            const relatedTarget = (e as DragEvent).relatedTarget as Node;
            if (header.contains(relatedTarget)) {
                return;
            }

            const targetId = (header as HTMLElement).getAttribute('data-id') || null;
            
            if (this.dropTarget === header) {
                this.clearAllIndicators();
            }
            
            // Notify external listeners
            this.externalDragLeaveListeners.forEach(listener => {
                listener(targetId, e as DragEvent);
            });
            
            // Dispatch custom event
            this.dispatchCustomEvent('drag-leave', {
                targetId,
                originalEvent: e
            });
        });

        header.addEventListener('drop', (e) => {
            e.preventDefault();
            if (!this.draggedNode) return;

            const sourceId = this.draggedNode.getAttribute('data-id') || '';
            const targetId = (e.currentTarget as HTMLElement).getAttribute('data-id') || '';

            if (sourceId && targetId && sourceId !== targetId) {
                this.onDrop(sourceId, targetId, this.dropPosition);
                
                // Notify external listeners
                this.externalDropListeners.forEach(listener => {
                    listener(sourceId, targetId, this.dropPosition, e as DragEvent);
                });
                
                // Dispatch custom event
                this.dispatchCustomEvent('drop', {
                    sourceId,
                    targetId,
                    position: this.dropPosition,
                    originalEvent: e
                });
            }

            this.clearAllIndicators();
        });
    }
    
    public attachExpandToggleEvents(toggle: Element): void {
        toggle.addEventListener('click', (e) => {
            // Stop propagation to parent nodes, but don't prevent default behavior
            e.stopPropagation();
            
            const id = toggle.getAttribute('data-id');
            if (!id) return;
            
            // Toggle the node state in the data model
            this.onToggleExpansion(id);
            
            // Instead of animating rotation, we'll simply let the UI updater service
            // handle changing the icon in the onToggleExpansion callback
        });
    }
    
    private attachContainerEvents(container: Element): void {
        container.addEventListener('dragover', (e) => {
            e.preventDefault();
            if (e.target === container) {
                (container as HTMLElement).classList.add('container-drop-target');
                
                // Notify external listeners with null targetId (represents the root)
                this.externalDragOverListeners.forEach(listener => {
                    listener(null, 'inside', e as DragEvent);
                });
                
                // Dispatch custom event
                this.dispatchCustomEvent('drag-over', {
                    targetId: null,
                    position: 'inside',
                    originalEvent: e
                });
            }
        });

        container.addEventListener('dragleave', (e) => {
            (container as HTMLElement).classList.remove('container-drop-target');
            
            // Notify external listeners
            this.externalDragLeaveListeners.forEach(listener => {
                listener(null, e as DragEvent);
            });
            
            // Dispatch custom event
            this.dispatchCustomEvent('drag-leave', {
                targetId: null,
                originalEvent: e
            });
        });

        container.addEventListener('drop', (e) => {
            if (e.target === container && this.draggedNode) {
                e.preventDefault();
                const sourceId = this.draggedNode.getAttribute('data-id') || '';
                if (sourceId) {
                    this.onDropToRoot(sourceId);
                    
                    // Notify external listeners
                    this.externalDropListeners.forEach(listener => {
                        listener(sourceId, null, 'inside', e as DragEvent);
                    });
                    
                    // Dispatch custom event
                    this.dispatchCustomEvent('drop', {
                        sourceId,
                        targetId: null,
                        position: 'inside',
                        originalEvent: e
                    });
                }
            }
            (container as HTMLElement).classList.remove('container-drop-target');
        });
    }
    
    clearAllIndicators(): void {
        // Updated to query the rootElement instead of shadowRoot
        const allHeaders = this.rootElement.querySelectorAll('.node-header');
        allHeaders.forEach(h => {
            h.classList.remove('drop-target');
            h.classList.remove('drop-border-inside');
            h.classList.remove('drop-border-after');
            h.classList.remove('drop-border-before');
            (h as HTMLElement).style.boxShadow = '';

            const beforeIndicator = h.querySelector('.before-indicator') as HTMLElement;
            const afterIndicator = h.querySelector('.after-indicator') as HTMLElement;

            if (beforeIndicator) beforeIndicator.style.display = 'none';
            if (afterIndicator) afterIndicator.style.display = 'none';
        });

        this.dropTarget = null;

        const container = this.rootElement.querySelector('.node-container');
        if (container) {
            container.classList.remove('container-drop-target');
        }
    }
}