import { EventDispatcherService } from './event-dispatcher.service';
import { NodeService } from './node.service';
import { UIUpdaterService } from './ui-updater.service';
import { SelectionService } from './selection.service';
import { NavigationService } from './navigation.service';
import { LoadingService } from './loading.service';
import { ExplorerNode, DropPosition } from '../node-explorer.type';

export class EventHandlerService {
    constructor(
        private nodeService: NodeService,
        private eventDispatcherService: EventDispatcherService,
        private uiUpdaterService: UIUpdaterService,
        private selectionService: SelectionService,
        private navigationService: NavigationService,
        private loadingService: LoadingService
    ) {}

    /**
     * Handle node selection events
     */
    handleNodeSelect(
        nodeId: string,
        selectedNodeId: string | null,
        selectedNodes: Set<string>,
        allowMultiSelect: boolean,
        host: HTMLElement,
        originalEvent?: Event
    ): { selectedNodeId: string | null, selectedNodes: Set<string> } {
        // Use the selection service to handle node selection logic
        const result = this.selectionService.handleNodeSelect(
            nodeId, 
            selectedNodeId,
            selectedNodes,
            allowMultiSelect,
            this.nodeService.getNodes(),
            originalEvent
        );
        
        if (!result.selectedNode) return result;
        
        // Update UI
        this.uiUpdaterService.updateSelectionUI(host, result.selectedNodes);
        this.uiUpdaterService.setAriaAttributes(host, allowMultiSelect, this.nodeService);
        
        // Dispatch events
        if (allowMultiSelect && result.selectedNodes.size > 1) {
            const selectedNodes = this.selectionService.getSelectedNodes(result.selectedNodes, this.nodeService.getNodes());
            this.eventDispatcherService.dispatchMultiSelectEvent(selectedNodes);
        } else {
            this.eventDispatcherService.dispatchNodeSelectEvent(result.selectedNode, originalEvent);
        }
        
        return result;
    }

    /**
     * Handle toggling node expansion
     */
    handleToggleExpansion(id: string, host: HTMLElement, selectedNodes: Set<string>): void {
        const node = this.nodeService.findNodeById(id);
        if (!node) return;

        // Handle lazy loading
        if (node.isLazy && !node.isLoading && !node.expanded) {
            node.isLoading = true;
            node.expanded = true;
            this.uiUpdaterService.updateNodeUI(host, id, node, selectedNodes);
            this.eventDispatcherService.dispatchNodeLoadChildrenEvent(id, node);
            this.loadingService.startLoadingTimeout(id, host, selectedNodes);
            return;
        }

        if (this.nodeService.toggleNodeExpansion(id)) {
            // Update the UI
            this.uiUpdaterService.updateNodeUI(host, id, node, selectedNodes);

            // Dispatch appropriate events
            if (node.expanded) {
                this.eventDispatcherService.dispatchNodeExpandedEvent(id, node);
            } else {
                this.eventDispatcherService.dispatchNodeCollapsedEvent(id, node);
            }
        }
    }

    /**
     * Handle component focus
     */
    handleComponentFocus(host: HTMLElement, focusedNodeId: string | null): string | null {
        let newFocusedNodeId = focusedNodeId;
        
        if (focusedNodeId) {
            this.navigationService.focusNode(host, focusedNodeId);
        } else {
            const visibleNodes = this.navigationService.getVisibleNodesInOrder(this.nodeService.getNodes());
            if (visibleNodes.length > 0) {
                this.navigationService.focusNode(host, visibleNodes[0].id);
                newFocusedNodeId = visibleNodes[0].id;
            }
        }
        
        return newFocusedNodeId;
    }

    /**
     * Handle component keydown events
     */
    handleComponentKeyDown(e: KeyboardEvent, focusedNodeId: string | null, host: HTMLElement): string | null {
        let newFocusedNodeId = focusedNodeId;
        
        if (e.key === 'Tab' && !e.shiftKey && !focusedNodeId) {
            const visibleNodes = this.navigationService.getVisibleNodesInOrder(this.nodeService.getNodes());
            if (visibleNodes.length > 0) {
                e.preventDefault();
                this.navigationService.focusNode(host, visibleNodes[0].id);
                newFocusedNodeId = visibleNodes[0].id;
            }
        }
        
        return newFocusedNodeId;
    }

    /**
     * Handle node keydown events
     */
    handleNodeKeyDown(
        e: KeyboardEvent, 
        host: HTMLElement,
        selectedNodeId: string | null,
        selectedNodes: Set<string>,
        allowMultiSelect: boolean
    ): void {
        const nodeHeader = e.currentTarget as HTMLElement;
        const nodeId = nodeHeader.dataset.id;
        if (!nodeId) return;
        
        const node = this.nodeService.findNodeById(nodeId);
        if (!node) return;
        
        this.navigationService.handleNodeKeyDown(
            e, 
            nodeId, 
            node, 
            host,
            this.nodeService,
            (id: string) => this.handleToggleExpansion(id, host, selectedNodes),
            (id: string, event?: Event) => this.handleNodeSelect(
                id, 
                selectedNodeId, 
                selectedNodes, 
                allowMultiSelect, 
                host, 
                event
            ),
            () => this.selectAllNodes(host, selectedNodes, allowMultiSelect)
        );
    }

    /**
     * Select all visible nodes
     */
    selectAllNodes(
        host: HTMLElement, 
        selectedNodes: Set<string>, 
        allowMultiSelect: boolean
    ): { selectedNodeId: string | null, selectedNodes: Set<string> } {
        if (!allowMultiSelect) {
            return { selectedNodeId: null, selectedNodes: new Set() };
        }
        
        const visibleNodes = this.navigationService.getVisibleNodesInOrder(this.nodeService.getNodes());
        const newSelectedNodes = new Set<string>();
        let lastSelectedNodeId: string | null = null;
        
        visibleNodes.forEach(node => {
            newSelectedNodes.add(node.id);
            lastSelectedNodeId = node.id;
        });
        
        // Update UI
        this.uiUpdaterService.updateSelectionUI(host, newSelectedNodes);
        this.uiUpdaterService.setAriaAttributes(host, allowMultiSelect, this.nodeService);
        
        if (visibleNodes.length > 0) {
            const selectedNodeObjects = this.selectionService.getSelectedNodes(newSelectedNodes, this.nodeService.getNodes());
            this.eventDispatcherService.dispatchMultiSelectEvent(selectedNodeObjects);
        }
        
        return { 
            selectedNodeId: lastSelectedNodeId,
            selectedNodes: newSelectedNodes
        };
    }

    /**
     * Handle dropping a node onto another node
     */
    handleNodeDrop(
        sourceId: string, 
        targetId: string, 
        position: DropPosition,
        host: HTMLElement,
        selectedNodes: Set<string>
    ): void {
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
                this.uiUpdaterService.updateNodeUI(host, targetId, targetNode, selectedNodes);
                
                // Dispatch load children event - after children are loaded, the drop will be completed
                this.eventDispatcherService.dispatchNodeLoadChildrenEvent(
                    targetId, 
                    targetNode,
                    tempSourceNode,
                    true
                );
                
                this.loadingService.startLoadingTimeout(targetId, host, selectedNodes);
                return;
            } else {
                this.nodeService.addNodeToParent(targetId, sourceNode);
            }
        } else {
            this.nodeService.addNodeBeforeOrAfter(targetId, sourceNode, position);
        }
        
        this.updateNodesAndRender(host);
    }
    
    /**
     * Handle dropping a node to the root level
     */
    handleDropToRoot(sourceId: string, host: HTMLElement): void {
        const sourceNode = this.nodeService.findAndRemoveNode(sourceId);
        if (!sourceNode) return;
        
        this.nodeService.addNodeToRoot(sourceNode);
        this.updateNodesAndRender(host);
    }
    
    /**
     * Check if a node is a descendant of another node (to prevent circular references)
     */
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
     * Updates nodes and triggers rerender of the component
     */
    updateNodesAndRender(host: HTMLElement): { nodes: ExplorerNode[]; skipNextRender: boolean } {
        const nodes = this.nodeService.getNodes();
        
        this.nodeService.ensureExpandedStateConsistency();
        
        // Skip the next render since we're manually triggering it
        const skipNextRender = true;
        
        // Update the nodes attribute
        host.setAttribute('nodes', JSON.stringify(nodes));
        
        // Dispatch node change event
        this.eventDispatcherService.dispatchNodeChangeEvent(nodes);
        
        return { nodes, skipNextRender };
    }
}