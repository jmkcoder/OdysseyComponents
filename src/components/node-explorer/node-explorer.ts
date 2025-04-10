import { TailwindElement } from '../../utilities/tailwind-utils';
import { ExplorerNode, DropPosition, NodeSelectedEvent, NodeExpandedEvent, NodeCollapsedEvent, NodeLoadChildrenEvent } from './node-explorer.type';
import { NodeService } from './services/node.service';
import { NodeRendererService } from './services/node-renderer.service';
import { DragDropService } from './services/drag-drop.service';
import './node-explorer.scss';
import { defineCustomElement } from '../../utilities/define-custom-element';

export class NodeExplorer extends TailwindElement {
    private nodeService: NodeService = new NodeService();
    private nodeRendererService: NodeRendererService = new NodeRendererService();
    private dragDropService?: DragDropService;
    private _skipNextRender: boolean = false;
    private selectedNodeId: string | null = null;
    private selectedNodes: Set<string> = new Set();
    private _allowDragDrop: boolean = true;
    private _allowMultiSelect: boolean = false;
    private _theme: string = 'light';
    private focusedNodeId: string | null = null;
    private _loadingTimeouts: Map<string, number> = new Map();

    constructor() {
        super();
        this.initializeComponent();
    }

    private initializeComponent(): void {
        // Add component CSS to shadow DOM
        this.addMaterialIcons();
        
        const nodes = this.parseNodes();
        this.nodeService = new NodeService(nodes);
        
        // Initialize properties from attributes
        this._allowDragDrop = this.getAttribute('allow-drag-drop') !== 'false';
        this._allowMultiSelect = this.getAttribute('allow-multi-select') === 'true';
        this._theme = this.getAttribute('theme') || this.detectThemeFromClass() || 'light';
    }

    /**
     * Detect theme from the host element's class list
     * This allows themes to be set via class as well as via attribute
     */
    private detectThemeFromClass(): string | null {
        // Check if the component has one of the theme classes
        if (this.classList.contains('dark-theme')) return 'dark';
        if (this.classList.contains('minimal-theme')) return 'minimal';
        if (this.classList.contains('high-contrast-theme')) return 'high-contrast';
        if (this.classList.contains('light-theme')) return 'light';
        
        return null;
    }

    private addMaterialIcons(): void {
        const linkElem = document.createElement('link');
        linkElem.rel = 'stylesheet';
        linkElem.href = 'https://fonts.googleapis.com/icon?family=Material+Icons';
        linkElem.id = 'material-icons-styles';
        this.shadow.appendChild(linkElem);
        
        // Add Material Icons to the document head
        if (!document.head.querySelector('#material-icons-styles')) {
            const globalLinkElem = document.createElement('link');
            globalLinkElem.rel = 'stylesheet';
            globalLinkElem.href = 'https://fonts.googleapis.com/icon?family=Material+Icons';
            globalLinkElem.id = 'material-icons-styles';
            document.head.appendChild(globalLinkElem);
        }
    }

    private parseNodes(): ExplorerNode[] {
        try {
            const nodesAttr = this.getAttribute('nodes');
            return nodesAttr ? JSON.parse(nodesAttr) : [];
        } catch (e) {
            console.error('Invalid nodes data', e);
            return [];
        }
    }

    render(): void {
        const nodes = this.nodeService.getNodes();
        
        const template = document.createElement('template');
        template.innerHTML = this.nodeRendererService.renderExplorer(
            nodes, 
            this._allowMultiSelect, 
            this._allowDragDrop
        );

        // Clear existing content (except for styles)
        const tailwindStyles = this.shadow.querySelector('#tailwind-styles');
        const materialIconStyles = this.shadow.querySelector('#material-icons-styles');
        this.shadow.innerHTML = '';

        if (materialIconStyles) {
            this.shadow.appendChild(materialIconStyles);
        }

        if (tailwindStyles) {
            this.shadow.appendChild(tailwindStyles);
        }

        // Add the new content
        this.shadow.appendChild(template.content.cloneNode(true));

        // Apply theme class to root element
        const nodeExplorer = this.shadow.querySelector('.node-explorer');
        if (nodeExplorer) {
            // Remove any existing theme classes first
            nodeExplorer.classList.remove('light-theme', 'dark-theme', 'minimal-theme', 'high-contrast-theme');
            
            // Add the current theme class (if not light theme)
            if (this._theme !== 'light') {
                nodeExplorer.classList.add(`${this._theme}-theme`);
            } else {
                // Explicitly add light-theme class for consistency
                nodeExplorer.classList.add('light-theme');
            }
        }

        // Initialize and attach drag-drop manager if drag-drop is enabled
        if (this._allowDragDrop) {
            this.dragDropService = new DragDropService(
                this.shadow,
                this,
                this.handleNodeDrop.bind(this),
                this.handleDropToRoot.bind(this),
                this.handleToggleExpansion.bind(this)
            );
            
            this.dragDropService.attachListeners();
        } else {
            // Even when drag-drop is disabled, we need to attach expansion toggle listeners
            this.attachExpandToggleListeners();
        }
        
        // Attach node selection listeners
        this.attachNodeSelectionListeners();
        
        // Attach keyboard navigation
        this.attachKeyboardNavigation();
        
        // Restore selection state
        this.restoreSelectionState();
        
        // Make the component focusable
        this.tabIndex = 0;
        this.addEventListener('focus', this.handleComponentFocus.bind(this));
    }

    /**
     * Attach event listeners to expand/collapse toggles when drag-drop is disabled
     * This ensures nodes can be expanded even when drag-drop is turned off
     */
    private attachExpandToggleListeners(): void {
        const expandToggles = this.shadow.querySelectorAll('.expand-toggle');
        
        expandToggles.forEach(toggle => {
            toggle.addEventListener('click', (e: Event) => {
                // Stop propagation to parent nodes, but don't prevent default behavior
                e.stopPropagation();
                
                const id = (toggle as HTMLElement).getAttribute('data-id');
                if (!id) return;
                
                // Toggle the node state in the data model
                this.handleToggleExpansion(id);
            });
        });
    }
    
    private attachNodeSelectionListeners(): void {
        const nodeElements = this.shadow.querySelectorAll('.node');
        nodeElements.forEach(nodeEl => {
            nodeEl.addEventListener('click', (e: Event) => {
                // Only stop propagation to prevent bubbling up to parent nodes
                e.stopPropagation();
                
                // Get the node ID from the clicked element
                const nodeId = (nodeEl as HTMLElement).dataset.id;
                
                // Only handle the selection if this is not a click on an expand toggle
                const target = e.target as HTMLElement;
                const isExpandToggle = target.closest('.expand-toggle');
                
                if (nodeId && !isExpandToggle) {
                    this.handleNodeSelect(nodeId, e);
                    this.focusedNodeId = nodeId;
                    this.focusNode(nodeId);
                }
            });
            
            // Make node headers focusable for keyboard navigation
            const nodeHeader = nodeEl.querySelector('.node-header') as HTMLElement;
            if (nodeHeader) {
                nodeHeader.tabIndex = -1;
                
                nodeHeader.addEventListener('focus', () => {
                    this.focusedNodeId = nodeHeader.dataset.id || null;
                });
                
                // Handle keyboard events on focused node header
                nodeHeader.addEventListener('keydown', this.handleNodeKeyDown.bind(this));
            }
        });
    }
    
    private handleNodeKeyDown(e: KeyboardEvent): void {
        const nodeHeader = e.currentTarget as HTMLElement;
        const nodeId = nodeHeader.dataset.id;
        if (!nodeId) return;
        
        const node = this.nodeService.findNodeById(nodeId);
        if (!node) return;
        
        switch (e.key) {
            case 'Enter':
            case ' ': // Space
                e.preventDefault();
                this.handleNodeSelect(nodeId, e);
                break;
                
            case 'a': // Ctrl+A to select all nodes when multi-select is enabled
                if ((e.ctrlKey || e.metaKey) && this._allowMultiSelect) {
                    e.preventDefault();
                    this.selectAllNodes();
                }
                break;
                
            case 'ArrowRight':
                e.preventDefault();
                if (node.children && node.children.length) {
                    if (!node.expanded) {
                        // Expand node if it's collapsed
                        this.handleToggleExpansion(nodeId);
                    } else {
                        // If already expanded, move to first child
                        const firstChild = node.children[0];
                        if (firstChild) {
                            this.focusNode(firstChild.id);
                        }
                    }
                }
                break;
                
            case 'ArrowLeft':
                e.preventDefault();
                if (node.expanded && node.children && node.children.length) {
                    // Collapse node if it's expanded
                    this.handleToggleExpansion(nodeId);
                } else {
                    // Move to parent node
                    const parentId = this.findParentNodeId(nodeId);
                    if (parentId) {
                        this.focusNode(parentId);
                    }
                }
                break;
                
            case 'ArrowDown':
                e.preventDefault();
                this.navigateToNextNode(nodeId);
                break;
                
            case 'ArrowUp':
                e.preventDefault();
                this.navigateToPreviousNode(nodeId);
                break;
                
            case 'Home':
                e.preventDefault();
                this.navigateToFirstNode();
                break;
                
            case 'End':
                e.preventDefault();
                this.navigateToLastNode();
                break;
        }
    }

    /**
     * Select all visible nodes in the tree
     * Only available when multi-select is enabled
     */
    private selectAllNodes(): void {
        if (!this._allowMultiSelect) return;
        
        // Get all visible nodes
        const visibleNodes = this.getVisibleNodesInOrder();
        
        // Clear current selection
        this.selectedNodes.clear();
        
        // Add all visible nodes to selection
        visibleNodes.forEach(node => {
            this.selectedNodes.add(node.id);
        });
        
        // Update UI and set the last node as the primary selection
        if (visibleNodes.length > 0) {
            this.selectedNodeId = visibleNodes[visibleNodes.length - 1].id;
        }
        
        // Update UI
        this.updateSelectionUI();
        
        // Update ARIA attributes
        this.setAriaAttributes();
        
        // Dispatch event for the selection change
        if (visibleNodes.length > 0) {
            this.dispatchMultiSelectEvent(this.getSelectedNodes());
        }
    }
    
    private findParentNodeId(childId: string): string | null {
        // Helper function to find a node's parent ID
        const findParent = (nodes: ExplorerNode[], id: string, parentId: string | null = null): string | null => {
            for (const node of nodes) {
                if (node.id === id) {
                    return parentId;
                }
                
                if (node.children && node.children.length) {
                    const foundParentId = findParent(node.children, id, node.id);
                    if (foundParentId !== null) {
                        return foundParentId;
                    }
                }
            }
            
            return null;
        };
        
        return findParent(this.nodeService.getNodes(), childId);
    }
    
    private navigateToNextNode(currentNodeId: string): void {
        // Build a flat list of visible nodes in display order
        const visibleNodes = this.getVisibleNodesInOrder();
        
        // Find the current node's index
        const currentIndex = visibleNodes.findIndex(node => node.id === currentNodeId);
        
        if (currentIndex !== -1 && currentIndex < visibleNodes.length - 1) {
            // Move to the next visible node
            this.focusNode(visibleNodes[currentIndex + 1].id);
        }
    }
    
    private navigateToPreviousNode(currentNodeId: string): void {
        // Build a flat list of visible nodes in display order
        const visibleNodes = this.getVisibleNodesInOrder();
        
        // Find the current node's index
        const currentIndex = visibleNodes.findIndex(node => node.id === currentNodeId);
        
        if (currentIndex > 0) {
            // Move to the previous visible node
            this.focusNode(visibleNodes[currentIndex - 1].id);
        }
    }
    
    private navigateToFirstNode(): void {
        const visibleNodes = this.getVisibleNodesInOrder();
        
        if (visibleNodes.length > 0) {
            this.focusNode(visibleNodes[0].id);
        }
    }
    
    private navigateToLastNode(): void {
        const visibleNodes = this.getVisibleNodesInOrder();
        
        if (visibleNodes.length > 0) {
            this.focusNode(visibleNodes[visibleNodes.length - 1].id);
        }
    }
    
    private getVisibleNodesInOrder(): ExplorerNode[] {
        const visibleNodes: ExplorerNode[] = [];
        
        const processNode = (node: ExplorerNode) => {
            visibleNodes.push(node);
            
            if (node.expanded && node.children && node.children.length) {
                node.children.forEach(child => processNode(child));
            }
        };
        
        this.nodeService.getNodes().forEach(node => processNode(node));
        
        return visibleNodes;
    }
    
    private focusNode(nodeId: string): void {
        const nodeHeader = this.shadow.querySelector(`.node-header[data-id="${nodeId}"]`) as HTMLElement;
        
        if (nodeHeader) {
            this.focusedNodeId = nodeId;
            nodeHeader.focus();
            
            // Ensure node is visible by scrolling it into view if needed
            nodeHeader.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }
    
    private handleComponentFocus(): void {
        // When the component receives focus, focus the first node or the previously focused node
        if (this.focusedNodeId) {
            this.focusNode(this.focusedNodeId);
        } else {
            const visibleNodes = this.getVisibleNodesInOrder();
            if (visibleNodes.length > 0) {
                this.focusNode(visibleNodes[0].id);
            }
        }
    }
    
    private attachKeyboardNavigation(): void {
        // Add tabindex to make the component focusable
        const explorerContainer = this.shadow.querySelector('.node-explorer');
        if (explorerContainer) {
            (explorerContainer as HTMLElement).tabIndex = 0;
            explorerContainer.addEventListener('keydown', this.handleComponentKeyDown.bind(this) as EventListener);
        }
        
        // Set ARIA attributes for accessibility
        this.setAriaAttributes();
    }
    
    private setAriaAttributes(): void {
        // Set the tree role for the container
        const container = this.shadow.querySelector('.node-container');
        if (container) {
            container.setAttribute('role', 'tree');
            container.setAttribute('aria-multiselectable', this._allowMultiSelect ? 'true' : 'false');
        }
        
        // Set the treeitem role for each node
        const nodes = this.shadow.querySelectorAll('.node');
        nodes.forEach(node => {
            const nodeId = (node as HTMLElement).dataset.id;
            if (!nodeId) return;
            
            const nodeHeader = node.querySelector('.node-header');
            if (nodeHeader) {
                nodeHeader.setAttribute('role', 'treeitem');
                
                // Check if selected
                if (this.selectedNodes.has(nodeId)) {
                    nodeHeader.setAttribute('aria-selected', 'true');
                } else {
                    nodeHeader.setAttribute('aria-selected', 'false');
                }
                
                // Check if it has children
                const foundNode = this.nodeService.findNodeById(nodeId);
                if (foundNode) {
                    if (foundNode.children && foundNode.children.length > 0) {
                        nodeHeader.setAttribute('aria-expanded', foundNode.expanded ? 'true' : 'false');
                    }
                }
                
                // Set the level for screen readers
                const level = this.getNodeLevel(nodeId);
                nodeHeader.setAttribute('aria-level', level.toString());
            }
            
            // Mark group of children
            const childrenContainer = node.querySelector('.node-children');
            if (childrenContainer) {
                childrenContainer.setAttribute('role', 'group');
            }
        });
    }
    
    private getNodeLevel(nodeId: string): number {
        // Calculate the node's level in the tree
        let level = 1;
        let currentId = nodeId;
        let parentId = this.findParentNodeId(currentId);
        
        while (parentId !== null) {
            level++;
            currentId = parentId;
            parentId = this.findParentNodeId(currentId);
        }
        
        return level;
    }
    
    private handleComponentKeyDown(e: KeyboardEvent): void {
        // Focus first node when tree receives focus and Tab key is pressed
        if (e.key === 'Tab' && !e.shiftKey && !this.focusedNodeId) {
            const visibleNodes = this.getVisibleNodesInOrder();
            if (visibleNodes.length > 0) {
                e.preventDefault();
                this.focusNode(visibleNodes[0].id);
            }
        }
    }
    
    private handleNodeSelect(nodeId: string, originalEvent?: Event): void {
        const selectedNode = this.nodeService.findNodeById(nodeId);
        if (!selectedNode) return;
        
        // Check if we're in multi-select mode and using modifier keys
        const isMultiSelect = this._allowMultiSelect && originalEvent && 
            (originalEvent instanceof MouseEvent || originalEvent instanceof KeyboardEvent) && 
            (originalEvent.ctrlKey || originalEvent.metaKey || originalEvent.shiftKey);
        
        if (isMultiSelect) {
            if (originalEvent && originalEvent.shiftKey && this.selectedNodeId) {
                // Shift+click: select range between last selected node and current node
                this.selectNodeRange(this.selectedNodeId, nodeId);
            } else {
                // Ctrl/Cmd+click: toggle selection for this node
                if (this.selectedNodes.has(nodeId)) {
                    this.selectedNodes.delete(nodeId);
                } else {
                    this.selectedNodes.add(nodeId);
                }
                this.selectedNodeId = this.selectedNodes.size > 0 ? 
                    Array.from(this.selectedNodes)[this.selectedNodes.size - 1] : null;
            }
        } else {
            // Single selection - clear previous and select only this node
            this.selectedNodes.clear();
            this.selectedNodes.add(nodeId);
            this.selectedNodeId = nodeId;
        }
        
        // Update the selection visual state
        this.updateSelectionUI();
        
        // Update ARIA attributes for accessibility
        this.setAriaAttributes();
        
        // Dispatch event with the selected node
        this.dispatchNodeSelectEvent(selectedNode, originalEvent);
    }
    
    private selectNodeRange(startNodeId: string, endNodeId: string): void {
        // Get all visible nodes in order
        const visibleNodes = this.getVisibleNodesInOrder();
        
        // Find indexes of start and end nodes
        const startIndex = visibleNodes.findIndex(node => node.id === startNodeId);
        const endIndex = visibleNodes.findIndex(node => node.id === endNodeId);
        
        if (startIndex === -1 || endIndex === -1) return;
        
        // Clear previous selection
        this.selectedNodes.clear();
        
        // Determine range direction
        const minIndex = Math.min(startIndex, endIndex);
        const maxIndex = Math.max(startIndex, endIndex);
        
        // Select all nodes in the range
        for (let i = minIndex; i <= maxIndex; i++) {
            this.selectedNodes.add(visibleNodes[i].id);
        }
    }
    
    private updateSelectionUI(): void {
        // Clear all selections first
        const allNodes = this.shadow.querySelectorAll('.node');
        allNodes.forEach(node => {
            node.classList.remove('selected');
            
            const header = node.querySelector('.node-header');
            if (header) {
                header.setAttribute('aria-selected', 'false');
            }
        });
        
        // Apply selections to all selected nodes
        this.selectedNodes.forEach(nodeId => {
            const nodeElement = this.shadow.querySelector(`.node[data-id="${nodeId}"]`);
            if (nodeElement) {
                nodeElement.classList.add('selected');
                
                const header = nodeElement.querySelector('.node-header');
                if (header) {
                    header.setAttribute('aria-selected', 'true');
                }
            }
        });
    }
    
    private restoreSelectionState(): void {
        // Restore selection visual state after re-rendering
        this.updateSelectionUI();
    }
    
    private dispatchNodeSelectEvent(node: ExplorerNode, originalEvent?: Event): void {
        const detail: NodeSelectedEvent = { 
            node,
            originalEvent
        };
        
        this.dispatchEvent(new CustomEvent('node-selected', {
            bubbles: true,
            composed: true,
            detail
        }));
    }
    
    /**
     * Dispatch event when multiple nodes are selected
     */
    private dispatchMultiSelectEvent(nodes: ExplorerNode[]): void {
        this.dispatchEvent(new CustomEvent('nodes-selected', {
            bubbles: true,
            composed: true,
            detail: {
                nodes,
                count: nodes.length
            }
        }));
    }
    
    private handleNodeDrop(sourceId: string, targetId: string, position: DropPosition): void {
        const sourceNode = this.nodeService.findAndRemoveNode(sourceId);
        if (!sourceNode) return;
        
        if (position === 'inside') {
            this.nodeService.addNodeToParent(targetId, sourceNode);
        } else {
            this.nodeService.addNodeBeforeOrAfter(targetId, sourceNode, position);
        }
        
        this.updateNodesAndRender();
    }
    
    private handleDropToRoot(sourceId: string): void {
        const sourceNode = this.nodeService.findAndRemoveNode(sourceId);
        if (!sourceNode) return;
        
        this.nodeService.addNodeToRoot(sourceNode);
        this.updateNodesAndRender();
    }
    
    private handleToggleExpansion(id: string): void {
        // Get the node that was toggled
        const node = this.nodeService.findNodeById(id);
        if (!node) return;
        
        // Check if this is a lazy-loaded node that needs to load its children
        if (node.isLazy && !node.isLoading && !node.expanded) {
            // Node is lazy and not yet loaded, set it to loading state
            node.isLoading = true;
            
            // Expand the node to show loading indicator
            node.expanded = true;
            
            // Store the current focused node ID before rendering
            const currentFocusedNodeId = this.focusedNodeId;
            
            // Re-render to show loading state
            this.render();
            
            // Restore focus after rendering
            if (currentFocusedNodeId) {
                this.focusNode(currentFocusedNodeId);
            }
            
            // Set a timeout to prevent infinite loading
            const loadingTimeout = window.setTimeout(() => {
                // Check if the node is still in loading state after timeout
                const currentNode = this.nodeService.findNodeById(id);
                if (currentNode && currentNode.isLoading) {
                    currentNode.isLoading = false;
                    
                    // Add an error node as a child to indicate the loading failed
                    if (!currentNode.children || currentNode.children.length === 0) {
                        currentNode.children = [{
                            id: `${id}-load-error`,
                            label: 'Failed to load. Click to retry.',
                            icon: 'error',
                            isRetry: true
                        }];
                        this.render();

                        // Attach a click listener to the retry node
                        const retryNode = this.shadow.querySelector(`.node[data-id="${id}-load-error"]`);
                        if (retryNode) {
                            retryNode.addEventListener('click', () => {
                                currentNode.isLoading = true;
                                currentNode.children = [];
                                this.render();
                                this.dispatchNodeLoadChildrenEvent(id, currentNode);
                            });
                        }
                    }
                }
            }, 10000); // 10 second timeout
            
            // Store timeout ID to clear it if loading completes normally
            this._loadingTimeouts = this._loadingTimeouts || new Map();
            this._loadingTimeouts.set(id, loadingTimeout as number);
            
            // Dispatch load-children event so user can provide the data
            this.dispatchNodeLoadChildrenEvent(id, node);
            return;
        }
        
        // Toggle the node expansion state in the model
        if (this.nodeService.toggleNodeExpansion(id)) {
            // Add smooth height animation for better UX
            this.animateNodeExpansion(id, node.expanded || false);
            
            // Dispatch specific expand/collapse event
            if (node.expanded) {
                this.dispatchNodeExpandedEvent(id, node);
            } else {
                this.dispatchNodeCollapsedEvent(id, node);
            }
            
            // Get the updated nodes after toggling
            const nodes = this.nodeService.getNodes();
            
            // Store the current focused node ID before rendering
            const currentFocusedNodeId = this.focusedNodeId;
            
            // Update the attribute with the new state to preserve it during re-render
            // but use skipNextRender flag to prevent an infinite loop
            this._skipNextRender = true;
            this.setAttribute('nodes', JSON.stringify(nodes));
            
            // Re-render to ensure all event handlers are properly attached
            this.render();
            
            // Restore focus after rendering
            if (currentFocusedNodeId) {
                this.focusNode(currentFocusedNodeId);
            }
        }
    }

    /**
     * Dispatch an event to request lazy loading of children for a node
     */
    private dispatchNodeLoadChildrenEvent(nodeId: string, node: ExplorerNode): void {
        const detail: NodeLoadChildrenEvent = { nodeId, node };
        this.dispatchEvent(new CustomEvent('load-children', {
            bubbles: true,
            composed: true,
            detail
        }));
    }

    /**
     * Animate the expansion/collapse of a node for better user experience
     */
    private animateNodeExpansion(nodeId: string, isExpanding: boolean): void {
        const nodeChildren = this.shadow.querySelector(`.node-children[data-parent="${nodeId}"]`) as HTMLElement;
        if (!nodeChildren) return;
        
        if (isExpanding) {
            // Measure the natural height of the node children
            nodeChildren.style.height = 'auto';
            nodeChildren.style.opacity = '1';
            nodeChildren.style.pointerEvents = 'auto';
            const height = nodeChildren.offsetHeight;
            
            // Start from 0 height and animate to the measured height
            nodeChildren.style.height = '0px';
            nodeChildren.style.opacity = '0';
            nodeChildren.offsetHeight; // Force reflow
            
            // Animate to the target height
            nodeChildren.style.transition = `height var(--transition-duration) var(--transition-timing), 
                                            opacity var(--transition-duration) var(--transition-timing)`;
            nodeChildren.style.height = `${height}px`;
            nodeChildren.style.opacity = '1';
            
            // Wait for animation to complete then set to auto height
            setTimeout(() => {
                nodeChildren.style.height = 'auto';
            }, 200); // Match the transition duration
        } else {
            // Measure current height
            const height = nodeChildren.offsetHeight;
            
            // Set fixed height to enable animation
            nodeChildren.style.height = `${height}px`;
            nodeChildren.offsetHeight; // Force reflow
            
            // Animate to 0 height
            nodeChildren.style.transition = `height var(--transition-duration) var(--transition-timing), 
                                            opacity var(--transition-duration) var(--transition-timing)`;
            nodeChildren.style.height = '0px';
            nodeChildren.style.opacity = '0';
        }
    }
    
    private dispatchNodeExpandedEvent(nodeId: string, node: ExplorerNode): void {
        const detail: NodeExpandedEvent = { nodeId, node };
        this.dispatchEvent(new CustomEvent('node-expanded', {
            bubbles: true,
            composed: true,
            detail
        }));
    }
    
    private dispatchNodeCollapsedEvent(nodeId: string, node: ExplorerNode): void {
        const detail: NodeCollapsedEvent = { nodeId, node };
        this.dispatchEvent(new CustomEvent('node-collapsed', {
            bubbles: true,
            composed: true,
            detail
        }));
    }
    
    private updateNodesAndRender(): void {
        const nodes = this.nodeService.getNodes();
        
        // Ensure expanded states are maintained
        this.nodeService.ensureExpandedStateConsistency();
        
        this._skipNextRender = true;
        this.setAttribute('nodes', JSON.stringify(nodes));
        this.render();
    }

    connectedCallback() {
        this.initializeComponent();
        this.render();
    }

    disconnectedCallback() {
        this.shadow.innerHTML = ''; // Clear shadow DOM content
    }

    static get observedAttributes() {
        return ['nodes', 'allow-drag-drop', 'allow-multi-select', 'theme'];
    }

    attributeChangedCallback(name: string, oldValue: string, newValue: string) {
        if (oldValue === newValue) return;
        
        switch (name) {
            case 'nodes':
                if (this._skipNextRender) {
                    this._skipNextRender = false;
                    
                    // Even when skipping render, we should still dispatch the event
                    // since the nodes have changed
                    this.dispatchNodeChangeEvent(this.parseNodes());
                    return;
                }
                const nodes = this.parseNodes();
                this.nodeService.setNodes(nodes);
                this.render();
                
                // Dispatch event for nodes change
                this.dispatchNodeChangeEvent(nodes);
                break;
                
            case 'allow-drag-drop':
                this._allowDragDrop = newValue !== 'false';
                this.render();
                break;
                
            case 'allow-multi-select':
                this._allowMultiSelect = newValue === 'true';
                break;
                
            case 'theme':
                this._theme = newValue || 'light';
                this.render();
                break;
        }
    }
    
    private dispatchNodeChangeEvent(nodes: ExplorerNode[]): void {
        this.dispatchEvent(new CustomEvent('nodes-changed', {
            bubbles: true,
            composed: true,
            detail: { nodes }
        }));
    }
    
    // Public API methods
    
    /**
     * Expands a node by its ID
     * @param id ID of the node to expand
     * @returns true if node was found and expanded, false otherwise
     */
    expandNode(id: string): boolean {
        const node = this.nodeService.findNodeById(id);
        if (node && !node.expanded) {
            node.expanded = true;
            this.updateNodesAndRender();
            this.dispatchNodeExpandedEvent(id, node);
            return true;
        }
        return false;
    }
    
    /**
     * Collapses a node by its ID
     * @param id ID of the node to collapse
     * @returns true if node was found and collapsed, false otherwise
     */
    collapseNode(id: string): boolean {
        const node = this.nodeService.findNodeById(id);
        if (node && node.expanded) {
            node.expanded = false;
            this.updateNodesAndRender();
            this.dispatchNodeCollapsedEvent(id, node);
            return true;
        }
        return false;
    }
    
    /**
     * Programmatically selects a node
     * @param id ID of the node to select
     * @returns true if the node was found and selected, false otherwise
     */
    selectNode(id: string): boolean {
        const node = this.nodeService.findNodeById(id);
        if (node) {
            this.handleNodeSelect(id);
            return true;
        }
        return false;
    }
    
    /**
     * Returns the currently selected node
     * @returns The selected node or null if none is selected
     */
    getSelectedNode(): ExplorerNode | null {
        if (this.selectedNodeId) {
            return this.nodeService.findNodeById(this.selectedNodeId) || null;
        }
        return null;
    }
    
    /**
     * Returns multiple selected nodes if multi-select is enabled
     * @returns Array of selected nodes
     */
    getSelectedNodes(): ExplorerNode[] {
        return Array.from(this.selectedNodes)
            .map(id => this.nodeService.findNodeById(id))
            .filter((node): node is ExplorerNode => node !== undefined);
    }
    
    /**
     * Finds and returns a node by its ID
     * @param id The ID of the node to find
     * @returns The node if found, undefined otherwise
     */
    findNodeById(id: string): ExplorerNode | undefined {
        return this.nodeService.findNodeById(id);
    }
    
    /**
     * Adds a new node as a child of parent node or at root if parentId is null
     * @param parentId ID of the parent node or null to add at root
     * @param node The node to add
     * @returns true if operation succeeded, false otherwise
     */
    addNode(parentId: string | null, node: ExplorerNode): boolean {
        if (parentId === null) {
            this.nodeService.addNodeToRoot(node);
            this.updateNodesAndRender();
            return true;
        } else {
            const success = this.nodeService.addNodeToParent(parentId, node);
            if (success) {
                this.updateNodesAndRender();
            }
            return success;
        }
    }
    
    /**
     * Removes a node from the tree
     * @param id ID of the node to remove
     * @returns true if node was found and removed, false otherwise
     */
    removeNode(id: string): boolean {
        // Check if the node to remove is currently selected
        if (this.selectedNodeId === id) {
            this.selectedNodeId = null;
            this.selectedNodes.delete(id);
        }
        
        const removedNode = this.nodeService.findAndRemoveNode(id);
        if (removedNode) {
            this.updateNodesAndRender();
            return true;
        }
        return false;
    }
    
    /**
     * Moves a node to a new position
     * @param sourceId ID of the node to move
     * @param targetId ID of the target node
     * @param position Position relative to target ('before', 'after', or 'inside')
     * @returns true if operation succeeded, false otherwise
     */
    moveNode(sourceId: string, targetId: string, position: DropPosition): boolean {
        const sourceNode = this.nodeService.findAndRemoveNode(sourceId);
        
        if (!sourceNode) return false;
        
        let success = false;
        
        if (position === 'inside') {
            success = this.nodeService.addNodeToParent(targetId, sourceNode);
        } else {
            success = this.nodeService.addNodeBeforeOrAfter(targetId, sourceNode, position);
        }
        
        if (success) {
            this.updateNodesAndRender();
        }
        
        return success;
    }
    
    /**
     * Get or set whether drag and drop is allowed
     */
    get allowDragDrop(): boolean {
        return this._allowDragDrop;
    }
    
    set allowDragDrop(value: boolean) {
        if (this._allowDragDrop !== value) {
            this._allowDragDrop = value;
            this.setAttribute('allow-drag-drop', value.toString());
        }
    }
    
    /**
     * Get or set whether multi-select is allowed
     */
    get allowMultiSelect(): boolean {
        return this._allowMultiSelect;
    }
    
    set allowMultiSelect(value: boolean) {
        if (this._allowMultiSelect !== value) {
            this._allowMultiSelect = value;
            this.setAttribute('allow-multi-select', value.toString());
        }
    }
    
    /**
     * Get or set the theme
     */
    get theme(): string {
        return this._theme;
    }
    
    set theme(value: string) {
        if (this._theme !== value) {
            this._theme = value;
            this.setAttribute('theme', value);
        }
    }

    /**
     * Set children for a node with lazy loading
     * Use this method to provide children nodes after a load-children event
     * 
     * @param nodeId ID of the parent node
     * @param children Array of child nodes to add
     * @param allChildrenLoaded Whether all children have been loaded (true) or more might be loaded later (false)
     * @returns true if successful, false if node wasn't found
     */
    setNodeChildren(nodeId: string, children: ExplorerNode[], allChildrenLoaded: boolean = true): boolean {
        const node = this.nodeService.findNodeById(nodeId);
        if (!node) return false;
        
        // Update the node
        node.isLoading = false;
        node.children = children;
        node.isLazy = !allChildrenLoaded; // If allChildrenLoaded is false, node remains lazy
        
        // Ensure expanded state
        node.expanded = true;
        
        // Update the nodes attribute and re-render
        this.updateNodesAndRender();
        return true;
    }
    
    /**
     * Mark a node as lazy-loaded, meaning it will trigger a load-children event when expanded
     * 
     * @param nodeId ID of the node to mark as lazy
     * @param hasChildren Whether the node should show an expand indicator
     * @returns true if successful, false if node wasn't found
     */
    markNodeAsLazy(nodeId: string, hasChildren: boolean = true): boolean {
        const node = this.nodeService.findNodeById(nodeId);
        if (!node) return false;
        
        node.isLazy = true;
        node.hasChildren = hasChildren;
        
        // Update the nodes attribute and re-render
        this.updateNodesAndRender();
        return true;
    }
    
    /**
     * Add more children to an already loaded lazy node
     * Useful for pagination/infinite scrolling of large directory structures
     * 
     * @param nodeId ID of the parent node
     * @param additionalChildren Array of additional child nodes to add
     * @param allChildrenLoaded Whether all children have been loaded now
     * @returns true if successful, false if node wasn't found
     */
    appendNodeChildren(nodeId: string, additionalChildren: ExplorerNode[], allChildrenLoaded: boolean = true): boolean {
        const node = this.nodeService.findNodeById(nodeId);
        if (!node) return false;
        
        // Initialize children array if it doesn't exist
        if (!node.children) {
            node.children = [];
        }
        
        // Add the new children to the existing ones
        node.children = [...node.children, ...additionalChildren];
        
        // Update lazy status based on whether all children are loaded
        node.isLazy = !allChildrenLoaded;
        node.isLoading = false;
        
        // Update the nodes attribute and re-render
        this.updateNodesAndRender();
        return true;
    }
}

export const defineNodeExplorer = () => defineCustomElement('odyssey-node-explorer', NodeExplorer);