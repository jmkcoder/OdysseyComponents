import { ExplorerNode, NodeSelectedEvent, NodeExpandedEvent, NodeCollapsedEvent, NodeChangeEvent, NodesSelectedEvent, DragStartEvent, NodeLoadChildrenEvent } from '../node-explorer.type';

/**
 * Service responsible for dispatching custom events from the node explorer
 */
export class EventDispatcherService {
    private eventTarget: HTMLElement;
    private lastLoadChildrenEvent: CustomEvent | null = null;
    
    constructor(eventTarget: HTMLElement) {
        this.eventTarget = eventTarget;
    }
    
    /**
     * Returns the last load-children event that was dispatched
     */
    getLastLoadChildrenEvent(): CustomEvent | null {
        return this.lastLoadChildrenEvent;
    }
    
    /**
     * Dispatches a node select event
     */
    dispatchNodeSelectEvent(node: ExplorerNode, originalEvent?: Event): void {
        const selectEvent = new CustomEvent<NodeSelectedEvent>('node-selected', {
            bubbles: true,
            composed: true,
            detail: {
                node,
                originalEvent
            }
        });
        
        this.eventTarget.dispatchEvent(selectEvent);
    }
    
    /**
     * Dispatches a multi-select event
     */
    dispatchMultiSelectEvent(nodes: ExplorerNode[], originalEvent?: Event): void {
        const multiSelectEvent = new CustomEvent<NodesSelectedEvent>('nodes-selected', {
            bubbles: true,
            composed: true,
            detail: {
                nodes,
                originalEvent,
                count: nodes.length
            }
        });
        
        this.eventTarget.dispatchEvent(multiSelectEvent);
    }
    
    /**
     * Dispatches a node expanded event
     */
    dispatchNodeExpandedEvent(nodeId: string, node: ExplorerNode): void {
        const expandEvent = new CustomEvent<NodeExpandedEvent>('node-expanded', {
            bubbles: true,
            composed: true,
            detail: {
                nodeId,
                node
            }
        });
        
        this.eventTarget.dispatchEvent(expandEvent);
    }
    
    /**
     * Dispatches a node collapsed event
     */
    dispatchNodeCollapsedEvent(nodeId: string, node: ExplorerNode): void {
        const collapseEvent = new CustomEvent<NodeCollapsedEvent>('node-collapsed', {
            bubbles: true,
            composed: true,
            detail: {
                nodeId,
                node
            }
        });
        
        this.eventTarget.dispatchEvent(collapseEvent);
    }
    
    /**
     * Dispatches a nodes change event
     */
    dispatchNodeChangeEvent(nodes: ExplorerNode[]): void {
        const changeEvent = new CustomEvent<NodeChangeEvent>('nodes-changed', {
            bubbles: true,
            composed: true,
            detail: {
                nodes
            }
        });
        
        this.eventTarget.dispatchEvent(changeEvent);
    }
    
    /**
     * Dispatches a node load children event
     */
    dispatchNodeLoadChildrenEvent(
        nodeId: string, 
        node: ExplorerNode,
        pendingNode?: ExplorerNode,
        isDropPending: boolean = false,
        hasError: boolean = false,
        errorType?: string,
        errorMessage?: string
    ): void {
        const loadChildrenEvent = new CustomEvent('load-children', {
            bubbles: true,
            composed: true,
            detail: {
                nodeId,
                node,
                pendingNode, // Renamed from sourceNode for clarity
                isDropPending,
                hasError,
                error: hasError ? {
                    type: errorType || 'unknown',
                    message: errorMessage || 'Unknown error loading children'
                } : undefined
            }
        });
        
        // Store the event for later reference if it's a drop operation
        if (isDropPending && pendingNode) {
            this.lastLoadChildrenEvent = loadChildrenEvent;
        }
        
        this.eventTarget.dispatchEvent(loadChildrenEvent);
    }
}