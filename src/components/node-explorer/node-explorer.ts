import { ExplorerNode, DropPosition, NodeSelectedEvent, NodeExpandedEvent, NodeCollapsedEvent, NodeLoadChildrenEvent } from './node-explorer.type';
import { NodeService } from './services/node.service';
import { NodeRendererService } from './services/node-renderer.service';
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
    private nodeRendererService: NodeRendererService = new NodeRendererService();
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
        this.addMaterialIcons();
        
        const nodes = this.parseNodes();
        this.nodeService = new NodeService(nodes);
        
        this._allowDragDrop = this.getAttribute('allow-drag-drop') !== 'false';
        this._allowMultiSelect = this.getAttribute('allow-multi-select') === 'true';
        this._theme = this.getAttribute('theme') || this.detectThemeFromParentOrClass() || 'light';
        const loadingTimeoutAttr = this.getAttribute('loading-timeout');
        this._loadingTimeout = loadingTimeoutAttr ? parseInt(loadingTimeoutAttr, 10) : this._loadingTimeout;
    }

    private detectThemeFromParentOrClass(): string | null {
        // First check if the component itself has a theme class
        if (this.classList.contains('dark-theme')) return 'dark';
        if (this.classList.contains('light-theme')) return 'light';
        if (this.classList.contains('minimal-theme')) return 'minimal';
        if (this.classList.contains('high-contrast-theme')) return 'high-contrast';
        
        // If not, check parent elements for theme indicators
        let parent = this.parentElement;
        while (parent) {
            // Check for sidebar-container with theme
            if (parent.classList.contains('sidebar-container')) {
                // Check for theme classes
                if (parent.classList.contains('dark')) return 'dark';
                else if (parent.classList.contains('light')) return 'light';
                else if (parent.classList.contains('minimal')) return 'minimal';
                else if (parent.classList.contains('high-contrast')) return 'high-contrast';
                else return 'light'; // No theme found on sidebar-container
            }
            
            // Check for any other parent with theme classes
            if (parent.classList.contains('dark-theme')) return 'dark';
            if (parent.classList.contains('light-theme')) return 'light'; 
            if (parent.classList.contains('dark-mode')) return 'dark';
            if (parent.classList.contains('light-mode')) return 'light';
            if (parent.classList.contains('minimal-theme')) return 'minimal';
            if (parent.classList.contains('high-contrast-theme')) return 'high-contrast';
            
            // Check for theme attribute on any parent
            const parentTheme = parent.getAttribute('theme');
            if (parentTheme) return parentTheme;
            
            parent = parent.parentElement;
        }
        
        // If no theme is found, return null (will default to light)
        return null;
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
                const detectedTheme = this.detectThemeFromParentOrClass();
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

    private addMaterialIcons(): void {
        if (!document.head.querySelector('#material-icons-styles')) {
            const globalLinkElem = document.createElement('link');
            globalLinkElem.rel = 'stylesheet';
            globalLinkElem.href = 'https://fonts.googleapis.com/icon?family=Material+Icons';
            globalLinkElem.id = 'material-icons-styles';
            document.head.insertBefore(globalLinkElem, document.head.firstChild);
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

        this.innerHTML = '';

        this.appendChild(template.content.cloneNode(true));

        const nodeExplorer = this.querySelector('.node-explorer');
        if (nodeExplorer) {
            nodeExplorer.classList.remove('light-theme', 'dark-theme', 'minimal-theme', 'high-contrast-theme');
            
            if (this._theme !== 'light') {
                nodeExplorer.classList.add(`${this._theme}-theme`);
            } else {
                nodeExplorer.classList.add('light-theme');
            }
        }

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
        this.attachKeyboardNavigation();
        this.restoreSelectionState();
        
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
                    this.focusNode(nodeId);
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
        
        switch (e.key) {
            case 'Enter':
            case ' ': 
                e.preventDefault();
                this.handleNodeSelect(nodeId, e);
                break;
                
            case 'a': 
                if ((e.ctrlKey || e.metaKey) && this._allowMultiSelect) {
                    e.preventDefault();
                    this.selectAllNodes();
                }
                break;
                
            case 'ArrowRight':
                e.preventDefault();
                if (node.children && node.children.length) {
                    if (!node.expanded) {
                        this.handleToggleExpansion(nodeId);
                    } else {
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
                    this.handleToggleExpansion(nodeId);
                } else {
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
        
        this.updateSelectionUI();
        this.setAriaAttributes();
        
        if (visibleNodes.length > 0) {
            this.dispatchMultiSelectEvent(this.getSelectedNodes());
        }
    }
    
    private findParentNodeId(childId: string): string | null {
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
        const nextNodeId = this.navigationService.navigateToNextNode(this, currentNodeId, this.nodeService.getNodes());
        if (nextNodeId) {
            this.navigationService.focusNode(this, nextNodeId);
            this.focusedNodeId = nextNodeId;
        }
    }
    
    private navigateToPreviousNode(currentNodeId: string): void {
        const prevNodeId = this.navigationService.navigateToPreviousNode(this, currentNodeId, this.nodeService.getNodes());
        if (prevNodeId) {
            this.navigationService.focusNode(this, prevNodeId);
            this.focusedNodeId = prevNodeId;
        }
    }
    
    private navigateToFirstNode(): void {
        const firstNodeId = this.navigationService.navigateToFirstNode(this.nodeService.getNodes());
        if (firstNodeId) {
            this.navigationService.focusNode(this, firstNodeId);
            this.focusedNodeId = firstNodeId;
        }
    }
    
    private navigateToLastNode(): void {
        const lastNodeId = this.navigationService.navigateToLastNode(this.nodeService.getNodes());
        if (lastNodeId) {
            this.navigationService.focusNode(this, lastNodeId);
            this.focusedNodeId = lastNodeId;
        }
    }
    
    private focusNode(nodeId: string): void {
        if (this.navigationService.focusNode(this, nodeId)) {
            this.focusedNodeId = nodeId;
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
    
    private attachKeyboardNavigation(): void {
        const explorerContainer = this.querySelector('.node-explorer');
        if (explorerContainer) {
            (explorerContainer as HTMLElement).tabIndex = 0;
            explorerContainer.addEventListener('keydown', this.handleComponentKeyDown.bind(this) as EventListener);
        }
        
        this.setAriaAttributes();
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
    
    private setAriaAttributes(): void {
        const container = this.querySelector('.node-container');
        if (container) {
            container.setAttribute('role', 'tree');
            container.setAttribute('aria-multiselectable', this._allowMultiSelect ? 'true' : 'false');
        }
        
        const nodes = this.querySelectorAll('.node');
        nodes.forEach(node => {
            const nodeId = (node as HTMLElement).dataset.id;
            if (!nodeId) return;
            
            const nodeHeader = node.querySelector('.node-header');
            if (nodeHeader) {
                nodeHeader.setAttribute('role', 'treeitem');
                
                if (this.selectedNodes.has(nodeId)) {
                    nodeHeader.setAttribute('aria-selected', 'true');
                } else {
                    nodeHeader.setAttribute('aria-selected', 'false');
                }
                
                const foundNode = this.nodeService.findNodeById(nodeId);
                if (foundNode) {
                    if (foundNode.children && foundNode.children.length > 0) {
                        nodeHeader.setAttribute('aria-expanded', foundNode.expanded ? 'true' : 'false');
                    }
                }
                
                const level = this.getNodeLevel(nodeId);
                nodeHeader.setAttribute('aria-level', level.toString());
            }
            
            const childrenContainer = node.querySelector('.node-children');
            if (childrenContainer) {
                childrenContainer.setAttribute('role', 'group');
            }
        });
    }
    
    private getNodeLevel(nodeId: string): number {
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
    
    private updateSelectionUI(): void {
        const allNodes = this.querySelectorAll('.node');
        allNodes.forEach(node => {
            node.classList.remove('selected');
            
            const header = node.querySelector('.node-header');
            if (header) {
                header.setAttribute('aria-selected', 'false');
            }
        });
        
        this.selectedNodes.forEach(nodeId => {
            const nodeElement = this.querySelector(`.node[data-id="${nodeId}"]`);
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
            const targetNode = this.nodeService.findNodeById(targetId);
            
            // Check if the target node is lazy and not expanded
            if (targetNode && targetNode.isLazy && !targetNode.isLoading && (!targetNode.children || !targetNode.children.length)) {
                // Store the source node temporarily
                const tempSourceNode = {...sourceNode};
                
                // First load the children
                targetNode.isLoading = true;
                targetNode.expanded = true;
                this.updateNodeUI(targetId);
                
                // Dispatch load children event - after children are loaded, the drop will be completed
                this.dispatchEvent(new CustomEvent('load-children', {
                    bubbles: true,
                    composed: true,
                    detail: { 
                        nodeId: targetId, 
                        node: targetNode,
                        pendingNode: tempSourceNode,
                        isDropOperation: true 
                    }
                }));
                
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
    
    private updateNodeUI(nodeId: string): void {
        const nodeElement = this.querySelector(`.node[data-id="${nodeId}"]`);
        if (!nodeElement) return;

        const node = this.nodeService.findNodeById(nodeId);
        if (!node) return;

        const nodeHeader = nodeElement.querySelector('.node-header');
        if (nodeHeader) {
            nodeHeader.setAttribute('aria-expanded', node.expanded ? 'true' : 'false');
            nodeHeader.setAttribute('aria-selected', this.selectedNodes.has(nodeId) ? 'true' : 'false');

            const expandToggle = nodeHeader.querySelector('.expand-toggle');
            if (expandToggle) {
                if (node.isLoading) {
                    expandToggle.textContent = 'sync';
                } else if (node.hasLoadingError) {
                    expandToggle.textContent = 'error';
                } else {
                    expandToggle.textContent = node.expanded ? 'keyboard_arrow_down' : 'keyboard_arrow_right';
                }
            }

            // Remove any existing indicators
            const existingIndicator = nodeHeader.querySelector('.loading-indicator, .error-indicator');
            if (existingIndicator) {
                existingIndicator.remove();
            }

            const nodeLabel = nodeHeader.querySelector('.node-label');
            if (!nodeLabel) return;

            // Add appropriate indicator based on node state
            if (node.isLoading) {
                const loadingIcon = document.createElement('span');
                loadingIcon.className = 'loading-indicator material-icons animate-spin ml-2';
                loadingIcon.textContent = 'refresh';
                nodeLabel.appendChild(loadingIcon);
            } else if (node.hasLoadingError) {
                const errorIcon = document.createElement('span');
                errorIcon.className = 'error-indicator material-icons ml-2';
                errorIcon.textContent = 'error_outline';
                errorIcon.style.color = 'var(--odyssey-error-color, #e53935)';
                errorIcon.title = 'Failed to load. Click to retry.';
                
                // Add click handler to retry loading
                errorIcon.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.retryLoadingChildren(nodeId);
                });
                
                nodeLabel.appendChild(errorIcon);
            }
        }

        const childrenContainer = nodeElement.querySelector('.node-children') as HTMLElement;
        if (childrenContainer) {
            if (node.expanded) {
                childrenContainer.classList.add('expanded');
                childrenContainer.style.height = 'auto';
                childrenContainer.style.opacity = '1';
                childrenContainer.style.pointerEvents = 'auto';
            } else {
                childrenContainer.classList.remove('expanded');
                childrenContainer.style.height = '0';
                childrenContainer.style.opacity = '0';
                childrenContainer.style.pointerEvents = 'none';
            }
        }
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
                this.updateNodeUI(nodeId);
                
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
        this.updateNodeUI(nodeId);
        
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

    connectedCallback() {
        this.initializeComponent();
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
                this.render();
                break;
        }
    }

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
        
        this.updateNodesAndRender();
        return true;
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