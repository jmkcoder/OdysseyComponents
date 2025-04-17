import { ExplorerNode } from '../node-explorer.type';

/**
 * Service responsible for handling node selection logic
 */
export class SelectionService {
    /**
     * Handle node selection and return the updated selection state
     */
    handleNodeSelect(
        nodeId: string,
        currentSelectedNodeId: string | null,
        selectedNodes: Set<string>,
        allowMultiSelect: boolean,
        allNodes: ExplorerNode[],
        originalEvent?: Event
    ): {
        selectedNodeId: string | null;
        selectedNodes: Set<string>;
        selectedNode: ExplorerNode | undefined;
    } {
        const node = this.findNodeById(nodeId, allNodes);
        if (!node) {
            return {
                selectedNodeId: currentSelectedNodeId,
                selectedNodes,
                selectedNode: undefined
            };
        }

        // Handle multi-select with shift key
        if (allowMultiSelect && originalEvent && originalEvent instanceof MouseEvent && originalEvent.shiftKey && currentSelectedNodeId) {
            if (currentSelectedNodeId === nodeId) {
                // Nothing to do if selecting the same node
                return {
                    selectedNodeId: currentSelectedNodeId,
                    selectedNodes,
                    selectedNode: node
                };
            }

            // Select range of nodes between current selection and target
            const visibleNodes = this.getVisibleNodesInOrder(allNodes);
            const nodeIds = visibleNodes.map(n => n.id);
            
            const currentIdx = nodeIds.indexOf(currentSelectedNodeId);
            const targetIdx = nodeIds.indexOf(nodeId);
            
            if (currentIdx !== -1 && targetIdx !== -1) {
                const startIdx = Math.min(currentIdx, targetIdx);
                const endIdx = Math.max(currentIdx, targetIdx);
                
                // Create a new Set to not mutate the original
                const newSelectedNodes = new Set<string>(selectedNodes);
                
                // Add all nodes in range to selection
                for (let i = startIdx; i <= endIdx; i++) {
                    newSelectedNodes.add(nodeIds[i]);
                }
                
                return {
                    selectedNodeId: nodeId,
                    selectedNodes: newSelectedNodes,
                    selectedNode: node
                };
            }
        }
        
        // Handle multi-select with ctrl/cmd key
        if (allowMultiSelect && originalEvent && originalEvent instanceof MouseEvent && (originalEvent.ctrlKey || originalEvent.metaKey)) {
            // Create a new Set to not mutate the original
            const newSelectedNodes = new Set<string>(selectedNodes);
            
            // Toggle selection for this node
            if (newSelectedNodes.has(nodeId)) {
                newSelectedNodes.delete(nodeId);
                
                // If the selected node was deselected, find another to be the primary selected
                if (nodeId === currentSelectedNodeId) {
                    const remainingSelected = Array.from(newSelectedNodes);
                    const newSelectedNodeId = remainingSelected.length > 0 ? remainingSelected[0] : null;
                    const newSelectedNode = newSelectedNodeId ? this.findNodeById(newSelectedNodeId, allNodes) : undefined;
                    
                    return {
                        selectedNodeId: newSelectedNodeId,
                        selectedNodes: newSelectedNodes,
                        selectedNode: newSelectedNode
                    };
                }
                
                return {
                    selectedNodeId: currentSelectedNodeId,
                    selectedNodes: newSelectedNodes,
                    selectedNode: node
                };
            } else {
                // Add this node to selection
                newSelectedNodes.add(nodeId);
                
                return {
                    selectedNodeId: nodeId,
                    selectedNodes: newSelectedNodes,
                    selectedNode: node
                };
            }
        }
        
        // Regular single selection
        if (allowMultiSelect) {
            // Clear multi-select if not using modifier keys
            return {
                selectedNodeId: nodeId,
                selectedNodes: new Set<string>([nodeId]),
                selectedNode: node
            };
        } else {
            // Single select mode - always just select one node
            return {
                selectedNodeId: nodeId,
                selectedNodes: new Set<string>([nodeId]),
                selectedNode: node
            };
        }
    }
    
    /**
     * Get all selected nodes as an array of ExplorerNode objects
     */
    getSelectedNodes(selectedNodeIds: Set<string>, allNodes: ExplorerNode[]): ExplorerNode[] {
        return Array.from(selectedNodeIds)
            .map(id => this.findNodeById(id, allNodes))
            .filter((node): node is ExplorerNode => node !== undefined);
    }
    
    /**
     * Restore the selection state in the DOM
     */
    restoreSelectionState(rootElement: HTMLElement, selectedNodeIds: Set<string>): void {
        // Clear all selections first
        const allNodes = rootElement.querySelectorAll('.node');
        allNodes.forEach(node => {
            node.classList.remove('selected');
            
            const header = node.querySelector('.node-header');
            if (header) {
                header.setAttribute('aria-selected', 'false');
            }
        });
        
        // Apply selections
        selectedNodeIds.forEach(nodeId => {
            const nodeElement = rootElement.querySelector(`.node[data-id="${nodeId}"]`);
            if (nodeElement) {
                nodeElement.classList.add('selected');
                
                const header = nodeElement.querySelector('.node-header');
                if (header) {
                    header.setAttribute('aria-selected', 'true');
                }
            }
        });
    }
    
    /**
     * Find a node by its ID in the tree
     */
    private findNodeById(id: string, nodes: ExplorerNode[]): ExplorerNode | undefined {
        for (const node of nodes) {
            if (node.id === id) {
                return node;
            }
            
            if (node.children) {
                const childResult = this.findNodeById(id, node.children);
                if (childResult) {
                    return childResult;
                }
            }
        }
        
        return undefined;
    }
    
    /**
     * Get all visible nodes in document order
     */
    private getVisibleNodesInOrder(nodes: ExplorerNode[]): ExplorerNode[] {
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
}