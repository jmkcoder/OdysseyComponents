import { ExplorerNode } from '../node-explorer.type';

/**
 * Service responsible for updating the UI elements of the node explorer
 */
export class UIUpdaterService {
    /**
     * Updates the UI of a specific node based on its state
     */
    updateNodeUI(rootElement: HTMLElement, nodeId: string, node: ExplorerNode, selectedNodeIds: Set<string>): void {
        const nodeElement = rootElement.querySelector(`.node[data-id="${nodeId}"]`);
        if (!nodeElement) return;

        const nodeHeader = nodeElement.querySelector('.node-header');
        if (nodeHeader) {
            nodeHeader.setAttribute('aria-expanded', node.expanded ? 'true' : 'false');
            nodeHeader.setAttribute('aria-selected', selectedNodeIds.has(nodeId) ? 'true' : 'false');

            const expandToggle = nodeHeader.querySelector('.expand-toggle');
            if (expandToggle) {
                if (node.isLoading) {
                    expandToggle.textContent = 'sync';
                } else {
                    // Set the correct icon based on expansion state
                    expandToggle.textContent = node.expanded ? 'keyboard_arrow_down' : 'keyboard_arrow_right';
                }
            }

            // Fix type error by ensuring isLoading is a boolean
            this.updateLoadingIndicator(nodeHeader as HTMLElement, !!node.isLoading);
        }

        const childrenContainer = nodeElement.querySelector('.node-children') as HTMLElement;
        if (childrenContainer) {
            // Fix type error by ensuring expanded is a boolean
            this.updateChildrenContainer(childrenContainer, !!node.expanded);
        }
    }

    /**
     * Updates the loading indicator for a node
     */
    private updateLoadingIndicator(nodeHeader: HTMLElement, isLoading: boolean): void {
        const rightIcon = nodeHeader.querySelector('.loading-indicator');
        if (isLoading) {
            if (!rightIcon) {
                const newRightIcon = document.createElement('span');
                newRightIcon.className = 'loading-indicator material-icons animate-spin ml-2';
                newRightIcon.textContent = 'refresh';
                const nodeLabel = nodeHeader.querySelector('.node-label');
                if (nodeLabel) {
                    nodeLabel.appendChild(newRightIcon);
                }
            }
        } else if (rightIcon) {
            rightIcon.remove();
        }
    }

    /**
     * Updates the children container based on expansion state
     */
    private updateChildrenContainer(container: HTMLElement, isExpanded: boolean): void {
        if (isExpanded) {
            container.classList.add('expanded');
            container.style.height = 'auto';
            container.style.opacity = '1';
            container.style.pointerEvents = 'auto';
        } else {
            container.classList.remove('expanded');
            container.style.height = '0';
            container.style.opacity = '0';
            container.style.pointerEvents = 'none';
        }
    }

    /**
     * Updates the selection UI for all nodes
     */
    updateSelectionUI(rootElement: HTMLElement, selectedNodeIds: Set<string>): void {
        const allNodes = rootElement.querySelectorAll('.node');
        allNodes.forEach(node => {
            node.classList.remove('selected');
            
            const header = node.querySelector('.node-header');
            if (header) {
                header.setAttribute('aria-selected', 'false');
            }
        });
        
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
     * Sets accessibility attributes on the node tree
     */
    setAriaAttributes(rootElement: HTMLElement, allowMultiSelect: boolean, nodeService: any): void {
        const container = rootElement.querySelector('.node-container');
        if (container) {
            container.setAttribute('role', 'tree');
            container.setAttribute('aria-multiselectable', allowMultiSelect ? 'true' : 'false');
        }
        
        const nodes = rootElement.querySelectorAll('.node');
        nodes.forEach(node => {
            const nodeId = (node as HTMLElement).dataset.id;
            if (!nodeId) return;
            
            const nodeHeader = node.querySelector('.node-header');
            if (nodeHeader) {
                nodeHeader.setAttribute('role', 'treeitem');
                
                const foundNode = nodeService.findNodeById(nodeId);
                if (foundNode) {
                    if (foundNode.children && foundNode.children.length > 0) {
                        nodeHeader.setAttribute('aria-expanded', foundNode.expanded ? 'true' : 'false');
                    }
                }
                
                const level = this.getNodeLevel(nodeId, nodeService);
                nodeHeader.setAttribute('aria-level', level.toString());
            }
            
            const childrenContainer = node.querySelector('.node-children');
            if (childrenContainer) {
                childrenContainer.setAttribute('role', 'group');
            }
        });
    }
    
    /**
     * Gets the level of a node in the tree hierarchy
     */
    private getNodeLevel(nodeId: string, nodeService: any): number {
        let level = 1;
        let currentId = nodeId;
        let parentId = this.findParentNodeId(currentId, nodeService);
        
        while (parentId !== null) {
            level++;
            currentId = parentId;
            parentId = this.findParentNodeId(currentId, nodeService);
        }
        
        return level;
    }
    
    /**
     * Finds the parent node ID for a given child node
     */
    private findParentNodeId(childId: string, nodeService: any): string | null {
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
        
        return findParent(nodeService.getNodes(), childId);
    }
}