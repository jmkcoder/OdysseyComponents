import { ExplorerNode } from '../node-explorer.type';

/**
 * Service for managing keyboard navigation and node traversal
 */
export class NavigationService {
    /**
     * Gets all visible nodes in traversal order
     */
    getVisibleNodesInOrder(nodes: ExplorerNode[]): ExplorerNode[] {
        const visibleNodes: ExplorerNode[] = [];
        
        const processNode = (node: ExplorerNode) => {
            visibleNodes.push(node);
            
            if (node.expanded && node.children && node.children.length) {
                node.children.forEach(child => processNode(child));
            }
        };
        
        nodes.forEach(node => processNode(node));
        
        return visibleNodes;
    }
    
    /**
     * Navigates to the next node in the tree
     */
    navigateToNextNode(rootElement: HTMLElement, currentNodeId: string, nodes: ExplorerNode[]): string | null {
        const visibleNodes = this.getVisibleNodesInOrder(nodes);
        const currentIndex = visibleNodes.findIndex(node => node.id === currentNodeId);
        
        if (currentIndex !== -1 && currentIndex < visibleNodes.length - 1) {
            return visibleNodes[currentIndex + 1].id;
        }
        
        return null;
    }
    
    /**
     * Navigates to the previous node in the tree
     */
    navigateToPreviousNode(rootElement: HTMLElement, currentNodeId: string, nodes: ExplorerNode[]): string | null {
        const visibleNodes = this.getVisibleNodesInOrder(nodes);
        const currentIndex = visibleNodes.findIndex(node => node.id === currentNodeId);
        
        if (currentIndex > 0) {
            return visibleNodes[currentIndex - 1].id;
        }
        
        return null;
    }
    
    /**
     * Navigates to the first node in the tree
     */
    navigateToFirstNode(nodes: ExplorerNode[]): string | null {
        const visibleNodes = this.getVisibleNodesInOrder(nodes);
        
        if (visibleNodes.length > 0) {
            return visibleNodes[0].id;
        }
        
        return null;
    }
    
    /**
     * Navigates to the last node in the tree
     */
    navigateToLastNode(nodes: ExplorerNode[]): string | null {
        const visibleNodes = this.getVisibleNodesInOrder(nodes);
        
        if (visibleNodes.length > 0) {
            return visibleNodes[visibleNodes.length - 1].id;
        }
        
        return null;
    }
    
    /**
     * Applies focus to a specific node
     */
    focusNode(rootElement: HTMLElement, nodeId: string): boolean {
        const nodeHeader = rootElement.querySelector(`.node-header[data-id="${nodeId}"]`) as HTMLElement;
        
        if (nodeHeader) {
            nodeHeader.focus();
            nodeHeader.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            return true;
        }
        
        return false;
    }
}