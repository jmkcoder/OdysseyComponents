import { ExplorerNode, DropPosition } from './node-explorer.type';
import { NodeService } from './services/node.service';
import { DragDropService } from './services/drag-drop.service';
import { AnimationService } from './services/animation.service'; 
import { UIUpdaterService } from './services/ui-updater.service';
import { EventDispatcherService } from './services/event-dispatcher.service';
import { NavigationService } from './services/navigation.service';
import { SelectionService } from './services/selection.service';
import { defineCustomElement } from '../../utilities/define-custom-element';
import './node-explorer.scss';

export class NodeExplorer extends HTMLElement {
    private nodeService: NodeService = new NodeService();
    private dragDropService?: DragDropService;
    private animationService: AnimationService = new AnimationService();
    private uiUpdaterService: UIUpdaterService = new UIUpdaterService();
    private eventDispatcherService: EventDispatcherService;
    private navigationService: NavigationService = new NavigationService();
    private selectionService: SelectionService = new SelectionService();
    
    private _skipNextRender: boolean = false;
    private selectedNodeId: string | null = null;
    private selectedNodes: Set<string> = new Set();
    private _allowDragDrop: boolean = true;
    private _allowMultiSelect: boolean = false;
    private _theme: string = 'light';
    private focusedNodeId: string | null = null;
    private _loadingTimeouts: Map<string, number> = new Map();
    private _loadingTimeout: number = 10000; // Default timeout: 10 seconds
    private _parentThemeObserver: MutationObserver | null = null;

    constructor() {
        super();
        this.eventDispatcherService = new EventDispatcherService(this);
        this.initializeComponent();
    }

    private initializeComponent(): void {
        this.uiUpdaterService.addMaterialIcons();
        
        const nodes = this.parseNodes();
        this.nodeService = new NodeService(nodes);
        
        this._allowDragDrop = this.getAttribute('allow-drag-drop') !== 'false';
        this._allowMultiSelect = this.getAttribute('allow-multi-select') === 'true';
        this._theme = this.getAttribute('theme') || this.uiUpdaterService.detectThemeFromParentOrClass(this) || 'light';
        const loadingTimeoutAttr = this.getAttribute('loading-timeout');
        this._loadingTimeout = loadingTimeoutAttr ? parseInt(loadingTimeoutAttr, 10) : this._loadingTimeout;
    }

    private observeParentThemeChanges(): void {
        // If we already have an observer, disconnect it
        if (this._parentThemeObserver) {
            this._parentThemeObserver.disconnect();
            this._parentThemeObserver = null;
        }
        
        // Find the closest parent sidebar-container or any relevant parent
        let targetParent: Element | null = this.closest('.sidebar-container') || this.parentElement;
        
        if (!targetParent) return;
        
        // Create a new observer to watch for class and attribute changes
        this._parentThemeObserver = new MutationObserver((mutations) => {
            let shouldUpdateTheme = false;
            
            for (const mutation of mutations) {
                if (
                    (mutation.type === 'attributes' && 
                     (mutation.attributeName === 'class' || mutation.attributeName === 'theme')) ||
                    mutation.type === 'childList'
                ) {
                    shouldUpdateTheme = true;
                    break;
                }
            }
            
            if (shouldUpdateTheme) {
                const detectedTheme = this.uiUpdaterService.detectThemeFromParentOrClass(this);
                if (detectedTheme && detectedTheme !== this._theme) {
                    this.theme = detectedTheme; // This will trigger the setter which updates the attribute
                }
            }
        });
        
        // Start observing
        this._parentThemeObserver.observe(targetParent, {
            attributes: true,
            attributeFilter: ['class', 'theme'],
            childList: true,
            subtree: false
        });
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
        
        // Use UI updater service to handle DOM creation and updating
        this.uiUpdaterService.renderExplorer(
            this,
            nodes,
            this._allowMultiSelect,
            this._allowDragDrop,
            this._theme
        );

        if (this._allowDragDrop) {
            this.dragDropService = new DragDropService(
                this,
                this,
                this.handleNodeDrop.bind(this),
                this.handleDropToRoot.bind(this),
                this.handleToggleExpansion.bind(this)
            );
            
            this.dragDropService.attachListeners();
        } else {
            this.attachExpandToggleListeners();
        }
        
        this.attachNodeSelectionListeners();
        this.navigationService.attachKeyboardNavigation(this, this.handleComponentFocus.bind(this), this.handleComponentKeyDown.bind(this));
        this.selectionService.restoreSelectionState(this, this.selectedNodes);
        
        this.tabIndex = 0;
        this.addEventListener('focus', this.handleComponentFocus.bind(this));
    }

    private attachExpandToggleListeners(): void {
        const expandToggles = this.querySelectorAll('.expand-toggle');
        
        expandToggles.forEach(toggle => {
            toggle.addEventListener('click', (e: Event) => {
                e.stopPropagation();
                
                const id = (toggle as HTMLElement).getAttribute('data-id');
                if (!id) return;
                
                this.handleToggleExpansion(id);
            });
        });
    }
    
    private attachNodeSelectionListeners(): void {
        const nodeElements = this.querySelectorAll('.node');
        nodeElements.forEach(nodeEl => {
            nodeEl.addEventListener('click', (e: Event) => {
                e.stopPropagation();
                
                const nodeId = (nodeEl as HTMLElement).dataset.id;
                
                const target = e.target as HTMLElement;
                const isExpandToggle = target.closest('.expand-toggle');
                
                if (nodeId && !isExpandToggle) {
                    this.handleNodeSelect(nodeId, e);
                    this.focusedNodeId = nodeId;
                    this.navigationService.focusNode(this, nodeId);
                }
            });
            
            const nodeHeader = nodeEl.querySelector('.node-header') as HTMLElement;
            if (nodeHeader) {
                nodeHeader.tabIndex = -1;
                
                nodeHeader.addEventListener('focus', () => {
                    this.focusedNodeId = nodeHeader.dataset.id || null;
                });
                
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
        
        this.navigationService.handleNodeKeyDown(
            e, 
            nodeId, 
            node, 
            this,
            this.nodeService,
            this.handleToggleExpansion.bind(this),
            this.handleNodeSelect.bind(this),
            this.selectAllNodes.bind(this)
        );
    }

    private selectAllNodes(): void {
        if (!this._allowMultiSelect) return;
        
        const visibleNodes = this.navigationService.getVisibleNodesInOrder(this.nodeService.getNodes());
        
        this.selectedNodes.clear();
        
        visibleNodes.forEach(node => {
            this.selectedNodes.add(node.id);
        });
        
        if (visibleNodes.length > 0) {
            this.selectedNodeId = visibleNodes[visibleNodes.length - 1].id;
        }
        
        this.uiUpdaterService.updateSelectionUI(this, this.selectedNodes);
        this.uiUpdaterService.setAriaAttributes(this, this._allowMultiSelect, this.nodeService);
        
        if (visibleNodes.length > 0) {
            this.eventDispatcherService.dispatchMultiSelectEvent(this.getSelectedNodes());
        }
    }
    
    private handleComponentFocus(): void {
        if (this.focusedNodeId) {
            this.navigationService.focusNode(this, this.focusedNodeId);
        } else {
            const visibleNodes = this.navigationService.getVisibleNodesInOrder(this.nodeService.getNodes());
            if (visibleNodes.length > 0) {
                this.navigationService.focusNode(this, visibleNodes[0].id);
                this.focusedNodeId = visibleNodes[0].id;
            }
        }
    }
    
    private handleComponentKeyDown(e: KeyboardEvent): void {
        if (e.key === 'Tab' && !e.shiftKey && !this.focusedNodeId) {
            const visibleNodes = this.navigationService.getVisibleNodesInOrder(this.nodeService.getNodes());
            if (visibleNodes.length > 0) {
                e.preventDefault();
                this.navigationService.focusNode(this, visibleNodes[0].id);
                this.focusedNodeId = visibleNodes[0].id;
            }
        }
    }
    
    private handleNodeDrop(sourceId: string, targetId: string, position: DropPosition): void {
        // Check if target is a descendant of source (circular reference)
        if (this.isDescendant(sourceId, targetId)) {
            return;
        }
        
        const sourceNode = this.nodeService.findAndRemoveNode(sourceId);
        if (!sourceNode) return;
        
        if (position === 'inside') {
            const targetNode = this.nodeService.findNodeById(targetId);
            
            // Check if the target node is lazy and not expanded
            if (targetNode && targetNode.isLazy && !targetNode.isLoading && (!targetNode.children || !targetNode.children.length)) {
                // Store the source node temporarily
                const tempSourceNode = {...sourceNode};
                
                // First load the children
                targetNode.isLoading = true;
                targetNode.expanded = true;
                this.uiUpdaterService.updateNodeUI(this, targetId, targetNode, this.selectedNodes);
                
                // Dispatch load children event - after children are loaded, the drop will be completed
                this.eventDispatcherService.dispatchNodeLoadChildrenEvent(
                    targetId, 
                    targetNode,
                    tempSourceNode,
                    true
                );
                
                return;
            } else {
                this.nodeService.addNodeToParent(targetId, sourceNode);
            }
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
        const node = this.nodeService.findNodeById(id);
        if (!node) return;

        // Handle lazy loading
        if (node.isLazy && !node.isLoading && !node.expanded) {
            node.isLoading = true;
            node.expanded = true;
            this.uiUpdaterService.updateNodeUI(this, id, node, this.selectedNodes);
            this.eventDispatcherService.dispatchNodeLoadChildrenEvent(id, node);
            this.startLoadingTimeout(id);
            return;
        }

        if (this.nodeService.toggleNodeExpansion(id)) {
            // Update the UI
            this.uiUpdaterService.updateNodeUI(this, id, node, this.selectedNodes);

            // Animate the expand toggle icon
            const expandToggle = this.querySelector(`.expand-toggle[data-id="${id}"]`) as HTMLElement;
            if (expandToggle) {
                // Fix type error by ensuring expanded is a boolean
                const isExpanded = !!node.expanded;
                this.animationService.animateExpandToggle(expandToggle, isExpanded);
            }

            // Dispatch appropriate events
            if (node.expanded) {
                this.eventDispatcherService.dispatchNodeExpandedEvent(id, node);
            } else {
                this.eventDispatcherService.dispatchNodeCollapsedEvent(id, node);
            }
        }
    }

    private handleNodeSelect(nodeId: string, originalEvent?: Event): void {
        // Use the selection service to handle node selection logic
        const result = this.selectionService.handleNodeSelect(
            nodeId, 
            this.selectedNodeId,
            this.selectedNodes,
            this._allowMultiSelect,
            this.nodeService.getNodes(),
            originalEvent
        );
        
        // Update state with results from the service
        this.selectedNodeId = result.selectedNodeId;
        this.selectedNodes = result.selectedNodes;
        
        if (!result.selectedNode) return;
        
        // Update UI
        this.uiUpdaterService.updateSelectionUI(this, this.selectedNodes);
        this.uiUpdaterService.setAriaAttributes(this, this._allowMultiSelect, this.nodeService);
        
        // Dispatch events
        if (this._allowMultiSelect && this.selectedNodes.size > 1) {
            const selectedNodes = this.selectionService.getSelectedNodes(this.selectedNodes, this.nodeService.getNodes());
            this.eventDispatcherService.dispatchMultiSelectEvent(selectedNodes);
        } else {
            this.eventDispatcherService.dispatchNodeSelectEvent(result.selectedNode, originalEvent);
        }
    }

    /**
     * Starts a timeout for loading the children of a node
     * Will show an error state if loading takes too long
     */
    private startLoadingTimeout(nodeId: string): void {
        // Clear any existing timeout for this node
        this.clearLoadingTimeout(nodeId);
        
        // Set a new timeout
        const timeoutId = window.setTimeout(() => {
            const node = this.nodeService.findNodeById(nodeId);
            if (node && node.isLoading) {
                // Mark the node as having an error
                node.isLoading = false;
                node.hasLoadingError = true;
                
                // Update the UI to show the error state
                this.uiUpdaterService.updateNodeUI(this, nodeId, node, this.selectedNodes);
                
                // Dispatch error info through the load-children event
                this.eventDispatcherService.dispatchNodeLoadChildrenEvent(
                    nodeId,
                    node,
                    undefined,
                    false,
                    true, // hasError
                    'timeout',
                    'Loading timeout exceeded'
                );
            }
        }, this._loadingTimeout);
        
        // Store the timeout ID
        this._loadingTimeouts.set(nodeId, timeoutId);
    }
    
    /**
     * Clears any existing loading timeout for a node
     */
    private clearLoadingTimeout(nodeId: string): void {
        const timeoutId = this._loadingTimeouts.get(nodeId);
        if (timeoutId !== undefined) {
            window.clearTimeout(timeoutId);
            this._loadingTimeouts.delete(nodeId);
        }
    }

    /**
     * Retry loading children for a node that previously failed
     */
    private retryLoadingChildren(nodeId: string): void {
        const node = this.nodeService.findNodeById(nodeId);
        if (!node) return;
        
        // Reset the error state
        node.hasLoadingError = false;
        node.isLoading = true;
        
        // Update the UI to show loading state
        this.uiUpdaterService.updateNodeUI(this, nodeId, node, this.selectedNodes);
        
        // Start a new timeout
        this.startLoadingTimeout(nodeId);
        
        // Dispatch the load children event again
        this.eventDispatcherService.dispatchNodeLoadChildrenEvent(nodeId, node);
    }

    /**
     * Updates nodes and re-renders the component
     */
    private updateNodesAndRender(): void {
        const nodes = this.nodeService.getNodes();
        
        this.nodeService.ensureExpandedStateConsistency();
        
        this._skipNextRender = true;
        this.setAttribute('nodes', JSON.stringify(nodes));
        this.render();
        
        // Dispatch node change event
        this.eventDispatcherService.dispatchNodeChangeEvent(nodes);
    }

    private isDescendant(ancestorId: string, nodeId: string): boolean {
        // If it's the same node, it's not considered a descendant
        if (ancestorId === nodeId) return false;
        
        // Find the node by ID
        const potentialAncestor = this.nodeService.findNodeById(ancestorId);
        if (!potentialAncestor || !potentialAncestor.children) return false;
        
        // Check if any of the children match the nodeId
        for (const child of potentialAncestor.children) {
            if (child.id === nodeId) return true;
            
            // Recursively check child's descendants
            if (this.isDescendant(child.id, nodeId)) return true;
        }
        
        return false;
    }

    /**
     * Internal handler for the load-children event
     * This handles adding the dropped node after children are loaded
     */
    private handleLazyLoadingEvent(e: CustomEvent): void {
        const { nodeId, isDropPending, pendingNode } = e.detail;
        
        // Only handle events that have a pending drop operation
        if (isDropPending && pendingNode) {
            // Set a timeout to ensure the node children are properly rendered first
            setTimeout(() => {
                // Add the dropped node to the target
                this.addNode(nodeId, pendingNode);
            }, 100);
        }
    }

    connectedCallback() {
        this.initializeComponent();
        this.applyThemeClass(); // Apply theme class when component is connected
        this.render();
        this.observeParentThemeChanges();
    }

    disconnectedCallback() {
        if (this._parentThemeObserver) {
            this._parentThemeObserver.disconnect();
            this._parentThemeObserver = null;
        }
        
        // Clear all loading timeouts
        for (const [nodeId, timeoutId] of this._loadingTimeouts.entries()) {
            window.clearTimeout(timeoutId);
        }
        this._loadingTimeouts.clear();
        
        this.innerHTML = '';
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
                    this.eventDispatcherService.dispatchNodeChangeEvent(this.parseNodes());
                    return;
                }
                const nodes = this.parseNodes();
                this.nodeService.setNodes(nodes);
                this.render();
                this.eventDispatcherService.dispatchNodeChangeEvent(nodes);
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
                this.applyThemeClass();
                this.render();
                break;
        }
    }
    
    /**
     * Apply the appropriate theme class based on the current theme value
     */
    private applyThemeClass(): void {
        // Remove all existing theme classes
        this.classList.remove('light-theme', 'dark-theme', 'minimal-theme', 'high-contrast-theme');
        
        // Apply the appropriate theme class with suffix
        if (this._theme === 'dark') {
            this.classList.add('dark-theme');
        } else if (this._theme === 'minimal') {
            this.classList.add('minimal-theme');
        } else if (this._theme === 'high-contrast') {
            this.classList.add('high-contrast-theme');
        } else {
            // Default to light theme
            this.classList.add('light-theme');
        }
    }

    // Public API methods

    expandNode(id: string): boolean {
        const node = this.nodeService.findNodeById(id);
        if (node && !node.expanded) {
            node.expanded = true;
            this.updateNodesAndRender();
            this.eventDispatcherService.dispatchNodeExpandedEvent(id, node);
            return true;
        }
        return false;
    }
    
    collapseNode(id: string): boolean {
        const node = this.nodeService.findNodeById(id);
        if (node && node.expanded) {
            node.expanded = false;
            this.updateNodesAndRender();
            this.eventDispatcherService.dispatchNodeCollapsedEvent(id, node);
            return true;
        }
        return false;
    }
    
    selectNode(id: string): boolean {
        const node = this.nodeService.findNodeById(id);
        if (node) {
            this.handleNodeSelect(id);
            return true;
        }
        return false;
    }
    
    getSelectedNode(): ExplorerNode | null {
        if (this.selectedNodeId) {
            return this.nodeService.findNodeById(this.selectedNodeId) || null;
        }
        return null;
    }
    
    getSelectedNodes(): ExplorerNode[] {
        return Array.from(this.selectedNodes)
            .map(id => this.nodeService.findNodeById(id))
            .filter((node): node is ExplorerNode => node !== undefined);
    }
    
    findNodeById(id: string): ExplorerNode | undefined {
        return this.nodeService.findNodeById(id);
    }
    
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
    
    removeNode(id: string): boolean {
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
    
    get allowDragDrop(): boolean {
        return this._allowDragDrop;
    }
    
    set allowDragDrop(value: boolean) {
        if (this._allowDragDrop !== value) {
            this._allowDragDrop = value;
            this.setAttribute('allow-drag-drop', value.toString());
        }
    }
    
    get allowMultiSelect(): boolean {
        return this._allowMultiSelect;
    }
    
    set allowMultiSelect(value: boolean) {
        if (this._allowMultiSelect !== value) {
            this._allowMultiSelect = value;
            this.setAttribute('allow-multi-select', value.toString());
        }
    }
    
    get theme(): string {
        return this._theme;
    }
    
    set theme(value: string) {
        if (this._theme !== value) {
            this._theme = value;
            this.setAttribute('theme', value);
            this.applyThemeClass(); // Apply theme class when theme property is set
        }
    }

    setNodeChildren(nodeId: string, children: ExplorerNode[], allChildrenLoaded: boolean = true): boolean {
        const node = this.nodeService.findNodeById(nodeId);
        if (!node) return false;
        
        node.isLoading = false;
        node.children = children;
        node.isLazy = !allChildrenLoaded; 
        node.expanded = true;
        
        // Clear any loading timeout for this node since loading is complete
        this.clearLoadingTimeout(nodeId);
        
        // Get event details before updating and rendering
        const pendingEvents = this.findPendingLoadEvents(nodeId);
        
        // Update the nodes and render the component
        this.updateNodesAndRender();
        
        // Handle any pending dropped nodes after the children are loaded
        if (pendingEvents.length > 0) {
            pendingEvents.forEach(event => {
                const { pendingNode } = event.detail;
                if (pendingNode) {
                    this.addNode(nodeId, pendingNode);
                }
            });
        }
        
        return true;
    }
    
    /**
     * Find any pending load-children events for a specific node ID
     */
    private findPendingLoadEvents(nodeId: string): CustomEvent[] {
        // We use a custom approach to find events that are waiting for this node
        // by checking the latest event that was dispatched
        const pendingEvents: CustomEvent[] = [];
        
        // Get load-children events from event dispatcher service if available
        const lastEvent = this.eventDispatcherService.getLastLoadChildrenEvent();
        if (lastEvent && 
            lastEvent.detail.nodeId === nodeId && 
            lastEvent.detail.isDropPending && 
            lastEvent.detail.pendingNode) {
            pendingEvents.push(lastEvent as CustomEvent);
        }
        
        return pendingEvents;
    }
    
    markNodeAsLazy(nodeId: string, hasChildren: boolean = true): boolean {
        const node = this.nodeService.findNodeById(nodeId);
        if (!node) return false;
        
        node.isLazy = true;
        node.hasChildren = hasChildren;
        
        this.updateNodesAndRender();
        return true;
    }
    
    appendNodeChildren(nodeId: string, additionalChildren: ExplorerNode[], allChildrenLoaded: boolean = true): boolean {
        const node = this.nodeService.findNodeById(nodeId);
        if (!node) return false;
        
        if (!node.children) {
            node.children = [];
        }
        
        node.children = [...node.children, ...additionalChildren];
        node.isLazy = !allChildrenLoaded;
        node.isLoading = false;
        
        // Clear any loading timeout for this node since loading is complete
        this.clearLoadingTimeout(nodeId);
        
        this.updateNodesAndRender();
        return true;
    }
}

export const defineNodeExplorer = () => defineCustomElement('odyssey-node-explorer', NodeExplorer);