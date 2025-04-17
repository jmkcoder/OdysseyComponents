import { ExplorerNode, DropPosition } from './node-explorer.type';
import { NodeService } from './services/node.service';
import { DragDropService } from './services/drag-drop.service';
import { AnimationService } from './services/animation.service'; 
import { UIUpdaterService } from './services/ui-updater.service';
import { EventDispatcherService } from './services/event-dispatcher.service';
import { NavigationService } from './services/navigation.service';
import { SelectionService } from './services/selection.service';
import { ThemeService } from './services/theme.service';
import { LoadingService } from './services/loading.service';
import { EventHandlerService } from './services/event-handler.service';
import { defineCustomElement } from '../../utilities/define-custom-element';
import './node-explorer.scss';

/**
 * NodeExplorer is a custom element for displaying and interacting with hierarchical data
 * This component supports drag and drop, lazy loading, multi-select, keyboard navigation,
 * and theming.
 */
export class NodeExplorer extends HTMLElement {
    // Core services
    private nodeService: NodeService;
    private uiUpdaterService: UIUpdaterService;
    private eventDispatcherService: EventDispatcherService;
    private navigationService: NavigationService;
    private selectionService: SelectionService;
    
    // Additional services
    private dragDropService?: DragDropService;
    private animationService: AnimationService;
    private themeService: ThemeService;
    private loadingService: LoadingService;
    private eventHandlerService: EventHandlerService;
    
    // Component state
    private _skipNextRender: boolean = false;
    private selectedNodeId: string | null = null;
    private selectedNodes: Set<string> = new Set();
    private focusedNodeId: string | null = null;
    
    // Component configuration
    private _allowDragDrop: boolean = true;
    private _allowMultiSelect: boolean = false;
    private _loadingTimeout: number = 10000; // Default timeout: 10 seconds
    private _initialized: boolean = false;

    constructor() {
        super();
        
        // Initialize base services
        this.nodeService = new NodeService();
        this.uiUpdaterService = new UIUpdaterService();
        this.animationService = new AnimationService();
        this.navigationService = new NavigationService();
        this.selectionService = new SelectionService();
        this.eventDispatcherService = new EventDispatcherService(this);
        
        // Initialize dependent services
        this.themeService = new ThemeService(this.uiUpdaterService);
        this.loadingService = new LoadingService(
            this.eventDispatcherService, 
            this.uiUpdaterService, 
            this.nodeService
        );
        
        // Initialize event handler service which coordinates other services
        this.eventHandlerService = new EventHandlerService(
            this.nodeService,
            this.eventDispatcherService,
            this.uiUpdaterService,
            this.selectionService,
            this.navigationService,
            this.loadingService
        );
        
        // DO NOT initialize with attributes in the constructor
        // This will cause the "Failed to execute 'createElement'" error
        // Initialization will happen in connectedCallback
    }

    /**
     * Initialize component state from attributes
     */
    private initializeComponent(): void {
        // Only initialize once to prevent duplicate initialization
        if (this._initialized) return;
        this._initialized = true;
        
        this.uiUpdaterService.addMaterialIcons();
        
        // Configure component from attributes
        this._allowDragDrop = this.getAttribute('allow-drag-drop') !== 'false';
        this._allowMultiSelect = this.getAttribute('allow-multi-select') === 'true';
        
        // Set loading timeout if provided
        const loadingTimeoutAttr = this.getAttribute('loading-timeout');
        if (loadingTimeoutAttr) {
            this._loadingTimeout = parseInt(loadingTimeoutAttr, 10);
            this.loadingService.setLoadingTimeout(this._loadingTimeout);
        }
        
        // Parse nodes after all other configs are set
        const nodes = this.parseNodes();
        this.nodeService = new NodeService(nodes);
        
        // Re-initialize event handler service with new node service
        this.eventHandlerService = new EventHandlerService(
            this.nodeService,
            this.eventDispatcherService,
            this.uiUpdaterService,
            this.selectionService,
            this.navigationService,
            this.loadingService
        );
        
        // Initialize theme last to ensure proper rendering
        this.themeService.initializeTheme(this);
    }

    /**
     * Parse nodes from the 'nodes' attribute
     */
    private parseNodes(): ExplorerNode[] {
        try {
            const nodesAttr = this.getAttribute('nodes');
            return nodesAttr ? JSON.parse(nodesAttr) : [];
        } catch (e) {
            console.error('Invalid nodes data', e);
            return [];
        }
    }

    /**
     * Render the explorer component
     */
    render(): void {
        const nodes = this.nodeService.getNodes();
        
        // Use UI updater service to handle DOM creation and updating
        this.uiUpdaterService.renderExplorer(
            this,
            nodes,
            this._allowMultiSelect,
            this._allowDragDrop,
            this.themeService.getTheme()
        );

        // Set up drag-drop functionality if enabled
        if (this._allowDragDrop) {
            this.dragDropService = new DragDropService(
                this,
                this,
                (sourceId, targetId, position) => 
                    this.eventHandlerService.handleNodeDrop(
                        sourceId, 
                        targetId, 
                        position, 
                        this, 
                        this.selectedNodes
                    ),
                (sourceId) => 
                    this.eventHandlerService.handleDropToRoot(sourceId, this),
                (id) => 
                    this.eventHandlerService.handleToggleExpansion(id, this, this.selectedNodes)
            );
            
            this.dragDropService.attachListeners();
        } else {
            this.attachExpandToggleListeners();
        }
        
        // Set up selection and keyboard navigation
        this.attachNodeSelectionListeners();
        this.navigationService.attachKeyboardNavigation(
            this, 
            () => {
                this.focusedNodeId = this.eventHandlerService.handleComponentFocus(this, this.focusedNodeId);
            },
            (e) => {
                this.focusedNodeId = this.eventHandlerService.handleComponentKeyDown(e, this.focusedNodeId, this);
            }
        );
        
        // Restore any previous selection state
        this.selectionService.restoreSelectionState(this, this.selectedNodes);
        
        this.tabIndex = 0;
        this.addEventListener('focus', () => {
            this.focusedNodeId = this.eventHandlerService.handleComponentFocus(this, this.focusedNodeId);
        });
    }

    /**
     * Attach click event listeners to expand/collapse toggles
     */
    private attachExpandToggleListeners(): void {
        const expandToggles = this.querySelectorAll('.expand-toggle');
        
        expandToggles.forEach(toggle => {
            toggle.addEventListener('click', (e: Event) => {
                e.stopPropagation();
                
                const id = (toggle as HTMLElement).getAttribute('data-id');
                if (!id) return;
                
                this.eventHandlerService.handleToggleExpansion(id, this, this.selectedNodes);
            });
        });
    }
    
    /**
     * Attach click event listeners for node selection
     */
    private attachNodeSelectionListeners(): void {
        const nodeElements = this.querySelectorAll('.node');
        nodeElements.forEach(nodeEl => {
            nodeEl.addEventListener('click', (e: Event) => {
                e.stopPropagation();
                
                const nodeId = (nodeEl as HTMLElement).dataset.id;
                
                const target = e.target as HTMLElement;
                const isExpandToggle = target.closest('.expand-toggle');
                
                if (nodeId && !isExpandToggle) {
                    const result = this.eventHandlerService.handleNodeSelect(
                        nodeId, 
                        this.selectedNodeId, 
                        this.selectedNodes, 
                        this._allowMultiSelect, 
                        this,
                        e
                    );
                    
                    this.selectedNodeId = result.selectedNodeId;
                    this.selectedNodes = result.selectedNodes;
                    
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
                
                nodeHeader.addEventListener('keydown', (e: KeyboardEvent) => {
                    this.eventHandlerService.handleNodeKeyDown(
                        e,
                        this,
                        this.selectedNodeId,
                        this.selectedNodes,
                        this._allowMultiSelect
                    );
                });
            }
        });
    }

    // Lifecycle methods

    connectedCallback() {
        this.initializeComponent();
        this.render();
        this.themeService.observeParentThemeChanges(this);
    }

    disconnectedCallback() {
        this.themeService.disconnectObserver();
        this.loadingService.clearAllTimeouts();
        this.innerHTML = '';
    }

    static get observedAttributes() {
        return ['nodes', 'allow-drag-drop', 'allow-multi-select', 'theme', 'loading-timeout'];
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
                this.themeService.setTheme(this, newValue || 'light');
                this.render();
                break;
                
            case 'loading-timeout':
                this._loadingTimeout = newValue ? parseInt(newValue, 10) : 10000;
                this.loadingService.setLoadingTimeout(this._loadingTimeout);
                break;
        }
    }

    // Public API methods

    expandNode(id: string): boolean {
        const node = this.nodeService.findNodeById(id);
        if (node && !node.expanded) {
            node.expanded = true;
            this.eventHandlerService.updateNodesAndRender(this);
            this.eventDispatcherService.dispatchNodeExpandedEvent(id, node);
            return true;
        }
        return false;
    }
    
    collapseNode(id: string): boolean {
        const node = this.nodeService.findNodeById(id);
        if (node && node.expanded) {
            node.expanded = false;
            this.eventHandlerService.updateNodesAndRender(this);
            this.eventDispatcherService.dispatchNodeCollapsedEvent(id, node);
            return true;
        }
        return false;
    }
    
    selectNode(id: string): boolean {
        const node = this.nodeService.findNodeById(id);
        if (node) {
            const result = this.eventHandlerService.handleNodeSelect(
                id, 
                this.selectedNodeId, 
                this.selectedNodes, 
                this._allowMultiSelect, 
                this
            );
            
            this.selectedNodeId = result.selectedNodeId;
            this.selectedNodes = result.selectedNodes;
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
            this.eventHandlerService.updateNodesAndRender(this);
            return true;
        } else {
            const success = this.nodeService.addNodeToParent(parentId, node);
            if (success) {
                this.eventHandlerService.updateNodesAndRender(this);
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
            this.eventHandlerService.updateNodesAndRender(this);
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
            this.eventHandlerService.updateNodesAndRender(this);
        }
        
        return success;
    }
    
    // Configuration properties with getters/setters
    
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
        return this.themeService.getTheme();
    }
    
    set theme(value: string) {
        this.themeService.setTheme(this, value);
    }

    // API methods for handling lazy-loaded content
    
    setNodeChildren(nodeId: string, children: ExplorerNode[], allChildrenLoaded: boolean = true): boolean {
        const node = this.nodeService.findNodeById(nodeId);
        if (!node) return false;
        
        node.isLoading = false;
        node.children = children;
        node.isLazy = !allChildrenLoaded; 
        node.expanded = true;
        
        // Clear any loading timeout for this node since loading is complete
        this.loadingService.clearLoadingTimeout(nodeId);
        
        // Get event details before updating and rendering
        const pendingEvents = this.findPendingLoadEvents(nodeId);
        
        // Update the nodes and render the component
        this.eventHandlerService.updateNodesAndRender(this);
        
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
        
        this.eventHandlerService.updateNodesAndRender(this);
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
        this.loadingService.clearLoadingTimeout(nodeId);
        
        this.eventHandlerService.updateNodesAndRender(this);
        return true;
    }
}

export const defineNodeExplorer = () => defineCustomElement('odyssey-node-explorer', NodeExplorer);