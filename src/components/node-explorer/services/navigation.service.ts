import { ExplorerNode } from '../node-explorer.type';
import { NodeService } from './node.service';

/**
 * Service responsible for handling keyboard navigation in the node explorer
 */
export class NavigationService {
    /**
     * Attaches keyboard navigation event listeners to the component
     */
    attachKeyboardNavigation(
        rootElement: HTMLElement,
        focusHandler: () => void,
        keydownHandler: (e: KeyboardEvent) => void
    ): void {
        rootElement.addEventListener('focus', focusHandler);
        rootElement.addEventListener('keydown', keydownHandler);
    }
    
    /**
     * Focus a specific node by ID
     */
    focusNode(rootElement: HTMLElement, nodeId: string): void {
        const nodeHeader = rootElement.querySelector(`.node-header[data-id="${nodeId}"]`) as HTMLElement;
        if (nodeHeader) {
            nodeHeader.focus();
        }
    }
    
    /**
     * Handle key down events on a node
     */
    handleNodeKeyDown(
        e: KeyboardEvent,
        nodeId: string,
        node: ExplorerNode,
        rootElement: HTMLElement,
        nodeService: NodeService,
        toggleHandler: (id: string) => void,
        selectHandler: (id: string, event?: Event) => void,
        selectAllHandler: () => void
    ): void {
        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                this.navigateToNextNode(nodeId, rootElement, nodeService.getNodes(), selectHandler);
                break;
                
            case 'ArrowUp':
                e.preventDefault();
                this.navigateToPreviousNode(nodeId, rootElement, nodeService.getNodes(), selectHandler);
                break;
                
            case 'ArrowRight':
                e.preventDefault();
                if (node.children && node.children.length > 0) {
                    if (!node.expanded) {
                        // Expand the node
                        toggleHandler(nodeId);
                    } else {
                        // Already expanded, navigate to first child
                        if (node.children.length > 0) {
                            this.focusNode(rootElement, node.children[0].id);
                        }
                    }
                } else if (node.isLazy && !node.expanded) {
                    // Expand lazy node to load children
                    toggleHandler(nodeId);
                }
                break;
                
            case 'ArrowLeft':
                e.preventDefault();
                if (node.expanded) {
                    // Collapse the node
                    toggleHandler(nodeId);
                } else {
                    // Navigate to parent
                    const parentId = this.findParentNodeId(nodeId, nodeService.getNodes());
                    if (parentId) {
                        this.focusNode(rootElement, parentId);
                    }
                }
                break;
                
            case 'Home':
                e.preventDefault();
                // Navigate to first node in the tree
                const visibleNodes = this.getVisibleNodesInOrder(nodeService.getNodes());
                if (visibleNodes.length > 0) {
                    this.focusNode(rootElement, visibleNodes[0].id);
                }
                break;
                
            case 'End':
                e.preventDefault();
                // Navigate to last visible node in the tree
                const allVisibleNodes = this.getVisibleNodesInOrder(nodeService.getNodes());
                if (allVisibleNodes.length > 0) {
                    this.focusNode(rootElement, allVisibleNodes[allVisibleNodes.length - 1].id);
                }
                break;
                
            case 'Enter':
            case ' ':  // Space key
                e.preventDefault();
                selectHandler(nodeId, e);
                break;
                
            case 'a':
                if (e.ctrlKey || e.metaKey) {
                    e.preventDefault();
                    selectAllHandler();
                }
                break;
        }
    }
    
    /**
     * Navigate to the next visible node
     */
    navigateToNextNode(
        currentNodeId: string, 
        rootElement: HTMLElement, 
        allNodes: ExplorerNode[],
        selectHandler: (id: string, event?: KeyboardEvent) => void
    ): void {
        const visibleNodes = this.getVisibleNodesInOrder(allNodes);
        const nodeIds = visibleNodes.map(node => node.id);
        
        const currentIndex = nodeIds.indexOf(currentNodeId);
        if (currentIndex !== -1 && currentIndex < nodeIds.length - 1) {
            const nextNodeId = nodeIds[currentIndex + 1];
            this.focusNode(rootElement, nextNodeId);
            
            if (selectHandler && (navigator.platform.includes('Mac') ? (event as KeyboardEvent)?.metaKey : (event as KeyboardEvent)?.ctrlKey)) {
                selectHandler(nextNodeId, event as KeyboardEvent);
            }
        }
    }
    
    /**
     * Navigate to the previous visible node
     */
    navigateToPreviousNode(
        currentNodeId: string, 
        rootElement: HTMLElement, 
        allNodes: ExplorerNode[],
        selectHandler: (id: string, event?: Event) => void
    ): void {
        const visibleNodes = this.getVisibleNodesInOrder(allNodes);
        const nodeIds = visibleNodes.map(node => node.id);
        
        const currentIndex = nodeIds.indexOf(currentNodeId);
        if (currentIndex > 0) {
            const prevNodeId = nodeIds[currentIndex - 1];
            this.focusNode(rootElement, prevNodeId);
            
            if (selectHandler && (navigator.platform.includes('Mac') ? (event as KeyboardEvent)?.metaKey : (event as KeyboardEvent)?.ctrlKey)) {
                selectHandler(prevNodeId, event);
            }
        }
    }
    
    /**
     * Get all visible nodes in document order
     */
    getVisibleNodesInOrder(nodes: ExplorerNode[]): ExplorerNode[] {
        const result: ExplorerNode[] = [];
        
        const traverseVisible = (nodeList: ExplorerNode[]) => {
            for (const node of nodeList) {
                result.push(node);
                
                if (node.expanded && node.children) {
                    traverseVisible(node.children);
                }
            }
        };
        
        traverseVisible(nodes);
        return result;
    }
    
    /**
     * Find the parent ID of a node
     */
    private findParentNodeId(childId: string, nodes: ExplorerNode[], parentId: string | null = null): string | null {
        for (const node of nodes) {
            if (node.id === childId) {
                return parentId;
            }
            
            if (node.children && node.children.length > 0) {
                const foundParentId = this.findParentNodeId(childId, node.children, node.id);
                if (foundParentId !== null) {
                    return foundParentId;
                }
            }
        }
        
        return null;
    }
}