import { ExplorerNode } from '../node-explorer.type';
import { NavigationService } from './navigation.service';

/**
 * Service for handling node selection operations
 */
export class SelectionService {
    private navigationService = new NavigationService();

    /**
     * Handles selection of a node with support for multi-select
     */
    handleNodeSelect(
        nodeId: string, 
        selectedNodeId: string | null,
        selectedNodes: Set<string>,
        allowMultiSelect: boolean,
        nodes: ExplorerNode[], 
        originalEvent?: Event
    ): { 
        selectedNodeId: string | null, 
        selectedNodes: Set<string>,
        selectedNode: ExplorerNode | undefined 
    } {
        const selectedNode = this.findNodeById(nodeId, nodes);
        if (!selectedNode) return { selectedNodeId, selectedNodes, selectedNode: undefined };
        
        const isMultiSelect = allowMultiSelect && originalEvent && 
            (originalEvent instanceof MouseEvent || originalEvent instanceof KeyboardEvent) && 
            (originalEvent.ctrlKey || originalEvent.metaKey || originalEvent.shiftKey);
        
        const newSelectedNodes = new Set(selectedNodes);
        
        if (isMultiSelect) {
            if (originalEvent && originalEvent.shiftKey && selectedNodeId) {
                this.selectNodeRange(selectedNodeId, nodeId, newSelectedNodes, nodes);
            } else {
                if (newSelectedNodes.has(nodeId)) {
                    newSelectedNodes.delete(nodeId);
                } else {
                    newSelectedNodes.add(nodeId);
                }
                selectedNodeId = newSelectedNodes.size > 0 ? 
                    Array.from(newSelectedNodes)[newSelectedNodes.size - 1] : null;
            }
        } else {
            newSelectedNodes.clear();
            newSelectedNodes.add(nodeId);
            selectedNodeId = nodeId;
        }
        
        return { 
            selectedNodeId, 
            selectedNodes: newSelectedNodes,
            selectedNode 
        };
    }
    
    /**
     * Selects all nodes in the visible tree
     */
    selectAllNodes(nodes: ExplorerNode[]): Set<string> {
        const visibleNodes = this.navigationService.getVisibleNodesInOrder(nodes);
        const selectedNodes = new Set<string>();
        
        visibleNodes.forEach(node => {
            selectedNodes.add(node.id);
        });
        
        return selectedNodes;
    }
    
    /**
     * Selects a range of nodes between two node IDs
     */
    selectNodeRange(startNodeId: string, endNodeId: string, selectedNodes: Set<string>, nodes: ExplorerNode[]): void {
        const visibleNodes = this.navigationService.getVisibleNodesInOrder(nodes);
        
        const startIndex = visibleNodes.findIndex(node => node.id === startNodeId);
        const endIndex = visibleNodes.findIndex(node => node.id === endNodeId);
        
        if (startIndex === -1 || endIndex === -1) return;
        
        selectedNodes.clear();
        
        const minIndex = Math.min(startIndex, endIndex);
        const maxIndex = Math.max(startIndex, endIndex);
        
        for (let i = minIndex; i <= maxIndex; i++) {
            selectedNodes.add(visibleNodes[i].id);
        }
    }
    
    /**
     * Gets selected nodes from the node collection
     */
    getSelectedNodes(selectedNodeIds: Set<string>, nodes: ExplorerNode[]): ExplorerNode[] {
        return Array.from(selectedNodeIds)
            .map(id => this.findNodeById(id, nodes))
            .filter((node): node is ExplorerNode => node !== undefined);
    }
    
    /**
     * Finds a node by its ID
     */
    findNodeById(id: string, nodes: ExplorerNode[]): ExplorerNode | undefined {
        // Recursive function to find node in tree
        const findNode = (nodes: ExplorerNode[], id: string): ExplorerNode | undefined => {
            for (const node of nodes) {
                if (node.id === id) {
                    return node;
                }
                
                if (node.children && node.children.length > 0) {
                    const found = findNode(node.children, id);
                    if (found) return found;
                }
            }
            
            return undefined;
        };
        
        return findNode(nodes, id);
    }
}