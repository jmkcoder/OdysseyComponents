import { ExplorerNode, DropPosition, NodeSelectedEvent, NodeExpandedEvent, NodeCollapsedEvent, NodeLoadChildrenEvent } from './node-explorer.type';
import { NodeService } from './services/node.service';
import { NodeRendererService } from './services/node-renderer.service';
import { DragDropService } from './services/drag-drop.service';
import { defineCustomElement } from '../../utilities/define-custom-element';
import './node-explorer.scss';

export class NodeExplorer extends HTMLElement {
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
        this.addMaterialIcons();
        
        const nodes = this.parseNodes();
        this.nodeService = new NodeService(nodes);
        
        this._allowDragDrop = this.getAttribute('allow-drag-drop') !== 'false';
        this._allowMultiSelect = this.getAttribute('allow-multi-select') === 'true';
        this._theme = this.getAttribute('theme') || this.detectThemeFromClass() || 'light';
    }

    private detectThemeFromClass(): string | null {
        if (this.classList.contains('dark-theme')) return 'dark';
        if (this.classList.contains('minimal-theme')) return 'minimal';
        if (this.classList.contains('high-contrast-theme')) return 'high-contrast';
        if (this.classList.contains('light-theme')) return 'light';
        
        return null;
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
        
        const visibleNodes = this.getVisibleNodesInOrder();
        
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
    
    private navigateToNextNode(currentNodeId: string): void {
        const visibleNodes = this.getVisibleNodesInOrder();
        const currentIndex = visibleNodes.findIndex(node => node.id === currentNodeId);
        
        if (currentIndex !== -1 && currentIndex < visibleNodes.length - 1) {
            this.focusNode(visibleNodes[currentIndex + 1].id);
        }
    }
    
    private navigateToPreviousNode(currentNodeId: string): void {
        const visibleNodes = this.getVisibleNodesInOrder();
        const currentIndex = visibleNodes.findIndex(node => node.id === currentNodeId);
        
        if (currentIndex > 0) {
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
    
    private focusNode(nodeId: string): void {
        const nodeHeader = this.querySelector(`.node-header[data-id="${nodeId}"]`) as HTMLElement;
        
        if (nodeHeader) {
            this.focusedNodeId = nodeId;
            nodeHeader.focus();
            
            nodeHeader.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }
    
    private handleComponentFocus(): void {
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
        const explorerContainer = this.querySelector('.node-explorer');
        if (explorerContainer) {
            (explorerContainer as HTMLElement).tabIndex = 0;
            explorerContainer.addEventListener('keydown', this.handleComponentKeyDown.bind(this) as EventListener);
        }
        
        this.setAriaAttributes();
    }
    
    private handleComponentKeyDown(e: KeyboardEvent): void {
        if (e.key === 'Tab' && !e.shiftKey && !this.focusedNodeId) {
            const visibleNodes = this.getVisibleNodesInOrder();
            if (visibleNodes.length > 0) {
                e.preventDefault();
                this.focusNode(visibleNodes[0].id);
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
        const node = this.nodeService.findNodeById(id);
        if (!node) return;
        
        if (node.isLazy && !node.isLoading && !node.expanded) {
            node.isLoading = true;
            node.expanded = true;
            
            const currentFocusedNodeId = this.focusedNodeId;
            
            this.render();
            
            if (currentFocusedNodeId) {
                this.focusNode(currentFocusedNodeId);
            }
            
            const loadingTimeout = window.setTimeout(() => {
                const currentNode = this.nodeService.findNodeById(id);
                if (currentNode && currentNode.isLoading) {
                    currentNode.isLoading = false;
                    
                    if (!currentNode.children || currentNode.children.length === 0) {
                        currentNode.children = [{
                            id: `${id}-load-error`,
                            label: 'Failed to load. Click to retry.',
                            icon: 'error',
                            isRetry: true
                        }];
                        this.render();

                        const retryNode = this.querySelector(`.node[data-id="${id}-load-error"]`);
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
            }, 10000);
            
            this._loadingTimeouts = this._loadingTimeouts || new Map();
            this._loadingTimeouts.set(id, loadingTimeout as number);
            
            this.dispatchNodeLoadChildrenEvent(id, node);
            return;
        }
        
        if (this.nodeService.toggleNodeExpansion(id)) {
            this.animateNodeExpansion(id, node.expanded || false);
            
            if (node.expanded) {
                this.dispatchNodeExpandedEvent(id, node);
            } else {
                this.dispatchNodeCollapsedEvent(id, node);
            }
            
            const nodes = this.nodeService.getNodes();
            
            const currentFocusedNodeId = this.focusedNodeId;
            
            this._skipNextRender = true;
            this.setAttribute('nodes', JSON.stringify(nodes));
            
            this.render();
            
            if (currentFocusedNodeId) {
                this.focusNode(currentFocusedNodeId);
            }
        }
    }

    private dispatchNodeLoadChildrenEvent(nodeId: string, node: ExplorerNode): void {
        const detail: NodeLoadChildrenEvent = { nodeId, node };
        this.dispatchEvent(new CustomEvent('load-children', {
            bubbles: true,
            composed: true,
            detail
        }));
    }

    private animateNodeExpansion(nodeId: string, isExpanding: boolean): void {
        const nodeChildren = this.querySelector(`.node-children[data-parent="${nodeId}"]`) as HTMLElement;
        if (!nodeChildren) return;
        
        if (isExpanding) {
            nodeChildren.style.height = 'auto';
            nodeChildren.style.opacity = '1';
            nodeChildren.style.pointerEvents = 'auto';
            const height = nodeChildren.offsetHeight;
            
            nodeChildren.style.height = '0px';
            nodeChildren.style.opacity = '0';
            nodeChildren.offsetHeight;
            
            nodeChildren.style.transition = `height var(--transition-duration) var(--transition-timing), 
                                            opacity var(--transition-duration) var(--transition-timing)`;
            nodeChildren.style.height = `${height}px`;
            nodeChildren.style.opacity = '1';
            
            setTimeout(() => {
                nodeChildren.style.height = 'auto';
            }, 200);
        } else {
            const height = nodeChildren.offsetHeight;
            
            nodeChildren.style.height = `${height}px`;
            nodeChildren.offsetHeight;
            
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
        
        this.nodeService.ensureExpandedStateConsistency();
        
        this._skipNextRender = true;
        this.setAttribute('nodes', JSON.stringify(nodes));
        this.render();
    }
    
    private handleNodeSelect(nodeId: string, originalEvent?: Event): void {
        const selectedNode = this.nodeService.findNodeById(nodeId);
        if (!selectedNode) return;
        
        const isMultiSelect = this._allowMultiSelect && originalEvent && 
            (originalEvent instanceof MouseEvent || originalEvent instanceof KeyboardEvent) && 
            (originalEvent.ctrlKey || originalEvent.metaKey || originalEvent.shiftKey);
        
        if (isMultiSelect) {
            if (originalEvent && originalEvent.shiftKey && this.selectedNodeId) {
                this.selectNodeRange(this.selectedNodeId, nodeId);
            } else {
                if (this.selectedNodes.has(nodeId)) {
                    this.selectedNodes.delete(nodeId);
                } else {
                    this.selectedNodes.add(nodeId);
                }
                this.selectedNodeId = this.selectedNodes.size > 0 ? 
                    Array.from(this.selectedNodes)[this.selectedNodes.size - 1] : null;
            }
        } else {
            this.selectedNodes.clear();
            this.selectedNodes.add(nodeId);
            this.selectedNodeId = nodeId;
        }
        
        this.updateSelectionUI();
        this.setAriaAttributes();
        this.dispatchNodeSelectEvent(selectedNode, originalEvent);
    }
    
    private selectNodeRange(startNodeId: string, endNodeId: string): void {
        const visibleNodes = this.getVisibleNodesInOrder();
        
        const startIndex = visibleNodes.findIndex(node => node.id === startNodeId);
        const endIndex = visibleNodes.findIndex(node => node.id === endNodeId);
        
        if (startIndex === -1 || endIndex === -1) return;
        
        this.selectedNodes.clear();
        
        const minIndex = Math.min(startIndex, endIndex);
        const maxIndex = Math.max(startIndex, endIndex);
        
        for (let i = minIndex; i <= maxIndex; i++) {
            this.selectedNodes.add(visibleNodes[i].id);
        }
    }

    connectedCallback() {
        this.initializeComponent();
        this.render();
    }

    disconnectedCallback() {
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
                    this.dispatchNodeChangeEvent(this.parseNodes());
                    return;
                }
                const nodes = this.parseNodes();
                this.nodeService.setNodes(nodes);
                this.render();
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
        
        this.updateNodesAndRender();
        return true;
    }
}

export const defineNodeExplorer = () => defineCustomElement('odyssey-node-explorer', NodeExplorer);