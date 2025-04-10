import { ExplorerNode, DropPosition } from '../node-explorer.type';

export class NodeService {
    private nodes: ExplorerNode[] = [];
    
    constructor(initialNodes: ExplorerNode[] = []) {
        this.nodes = this.processNodesDefaults(initialNodes);
    }
    
    getNodes(): ExplorerNode[] {
        return this.nodes;
    }
    
    setNodes(nodes: ExplorerNode[]): void {
        this.nodes = this.processNodesDefaults(nodes);
    }

    /**
     * Process all nodes to ensure default values are set
     * @param nodes Nodes to process
     * @returns Processed nodes with default values
     */
    private processNodesDefaults(nodes: ExplorerNode[]): ExplorerNode[] {
        return nodes.map(node => {
            // Create a new node object with default values
            const processedNode: ExplorerNode = {
                ...node,
                // Set expanded to false when not explicitly set to true
                expanded: node.expanded === true
            };
            
            // Process children recursively if they exist
            if (node.children && node.children.length > 0) {
                processedNode.children = this.processNodesDefaults(node.children);
            }
            
            return processedNode;
        });
    }

    findAndRemoveNode(id: string): ExplorerNode | null {
        return this.findAndRemoveNodeFromArray(this.nodes, id);
    }
    
    private findAndRemoveNodeFromArray(nodes: ExplorerNode[], id: string): ExplorerNode | null {
        for (let i = 0; i < nodes.length; i++) {
            if (nodes[i].id === id) {
                const node = nodes[i];
                nodes.splice(i, 1);
                return node;
            }

            if (nodes[i].children) {
                const found = this.findAndRemoveNodeFromArray(nodes[i].children!, id);
                if (found) return found;
            }
        }

        return null;
    }
    
    addNodeToParent(targetId: string, nodeToAdd: ExplorerNode): boolean {
        return this.addNodeToParentInArray(this.nodes, targetId, nodeToAdd);
    }
    
    private addNodeToParentInArray(nodes: ExplorerNode[], targetId: string, nodeToAdd: ExplorerNode): boolean {
        for (let i = 0; i < nodes.length; i++) {
            if (nodes[i].id === targetId) {
                nodes[i].children = nodes[i].children || [];
                nodes[i].expanded = true;
                nodes[i].children?.push(nodeToAdd);
                return true;
            }

            if (nodes[i].children) {
                const added = this.addNodeToParentInArray(nodes[i].children!, targetId, nodeToAdd);
                if (added) return true;
            }
        }

        return false;
    }
    
    addNodeBeforeOrAfter(targetId: string, nodeToAdd: ExplorerNode, position: 'before' | 'after'): boolean {
        return this.addNodeBeforeOrAfterInArray(this.nodes, targetId, nodeToAdd, position);
    }
    
    private addNodeBeforeOrAfterInArray(
        nodes: ExplorerNode[],
        targetId: string,
        nodeToAdd: ExplorerNode,
        position: 'before' | 'after'
    ): boolean {
        for (let i = 0; i < nodes.length; i++) {
            if (nodes[i].id === targetId) {
                if (position === 'before') {
                    nodes.splice(i, 0, nodeToAdd);
                } else {
                    nodes.splice(i + 1, 0, nodeToAdd);
                }
                return true;
            }
        }

        for (let i = 0; i < nodes.length; i++) {
            if (nodes[i].children) {
                const added = this.addNodeBeforeOrAfterInArray(nodes[i].children!, targetId, nodeToAdd, position);
                if (added) return true;
            }
        }

        return false;
    }
    
    addNodeToRoot(node: ExplorerNode): void {
        this.nodes.push(node);
    }
    
    toggleNodeExpansion(id: string): boolean {
        return this.updateNodeExpansionInArray(this.nodes, id);
    }
    
    updateNodeExpansionInArray(nodes: ExplorerNode[], id: string): boolean {
        for (let i = 0; i < nodes.length; i++) {
            if (nodes[i].id === id) {
                nodes[i].expanded = !nodes[i].expanded;
                return true;
            }

            if (nodes[i].children) {
                const updated = this.updateNodeExpansionInArray(nodes[i].children!, id);
                if (updated) return true;
            }
        }

        return false;
    }

    /**
     * Finds a node by its ID in the tree
     * @param id The ID of the node to find
     * @returns The found node or undefined if not found
     */
    findNodeById(id: string): ExplorerNode | undefined {
        const findInNodes = (nodes: ExplorerNode[]): ExplorerNode | undefined => {
            for (const node of nodes) {
                if (node.id === id) {
                    return node;
                }
                
                if (node.children?.length) {
                    const found = findInNodes(node.children);
                    if (found) {
                        return found;
                    }
                }
            }
            
            return undefined;
        };
        
        return findInNodes(this.nodes);
    }

    /**
     * Find node in tree by its ID and update its expanded state
     * @param id The node ID to update
     * @param expanded The new expanded state
     * @returns true if found and updated, false otherwise
     */
    updateNodeExpandedState(id: string, expanded: boolean): boolean {
        const findAndUpdate = (nodes: ExplorerNode[]): boolean => {
            for (let i = 0; i < nodes.length; i++) {
                if (nodes[i].id === id) {
                    nodes[i].expanded = expanded;
                    return true;
                }
                
                if (nodes[i].children?.length) {
                    const found = findAndUpdate(nodes[i].children!);
                    if (found) return true;
                }
            }
            
            return false;
        };
        
        return findAndUpdate(this.nodes);
    }
    
    /**
     * Ensure expanded parent nodes stay expanded after operations
     * Important for persisting expansion state during drag/drop
     */
    ensureExpandedStateConsistency(): void {
        const processNodes = (nodes: ExplorerNode[]): void => {
            for (const node of nodes) {
                // If node has children and is expanded make sure it stays expanded
                if (node.children?.length && node.expanded) {
                    node.expanded = true;
                }
                
                // Process children recursively
                if (node.children?.length) {
                    processNodes(node.children);
                }
            }
        };
        
        processNodes(this.nodes);
    }
}