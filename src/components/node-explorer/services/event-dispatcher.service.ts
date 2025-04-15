import { ExplorerNode, NodeSelectedEvent, NodeExpandedEvent, NodeCollapsedEvent, NodeLoadChildrenEvent } from '../node-explorer.type';

/**
 * Service responsible for dispatching custom events
 */
export class EventDispatcherService {
    private element: HTMLElement;

    constructor(element: HTMLElement) {
        this.element = element;
    }

    /**
     * Dispatches a node selected event
     */
    dispatchNodeSelectEvent(node: ExplorerNode, originalEvent?: Event): void {
        const detail: NodeSelectedEvent = { 
            node,
            originalEvent
        };
        
        this.dispatchCustomEvent('node-selected', detail);
    }
    
    /**
     * Dispatches an event when multiple nodes are selected
     */
    dispatchMultiSelectEvent(nodes: ExplorerNode[]): void {
        this.dispatchCustomEvent('nodes-selected', {
            nodes,
            count: nodes.length
        });
    }
    
    /**
     * Dispatches an event when a node is expanded
     */
    dispatchNodeExpandedEvent(nodeId: string, node: ExplorerNode): void {
        const detail: NodeExpandedEvent = { nodeId, node };
        this.dispatchCustomEvent('node-expanded', detail);
    }
    
    /**
     * Dispatches an event when a node is collapsed
     */
    dispatchNodeCollapsedEvent(nodeId: string, node: ExplorerNode): void {
        const detail: NodeCollapsedEvent = { nodeId, node };
        this.dispatchCustomEvent('node-collapsed', detail);
    }
    
    /**
     * Dispatches an event to load children for a node
     */
    dispatchNodeLoadChildrenEvent(
        nodeId: string, 
        node: ExplorerNode, 
        pendingNode?: ExplorerNode, 
        isDropOperation?: boolean,
        hasError?: boolean,
        errorType?: string,
        errorMessage?: string
    ): void {
        const detail: NodeLoadChildrenEvent = { 
            nodeId, 
            node,
            pendingNode,
            isDropOperation,
            hasError,
            errorType,
            errorMessage
        };
        
        this.dispatchCustomEvent('load-children', detail);
    }
    
    /**
     * Dispatches an event when nodes structure changes
     */
    dispatchNodeChangeEvent(nodes: ExplorerNode[]): void {
        this.dispatchCustomEvent('nodes-changed', { nodes });
    }
    
    /**
     * Generic method to dispatch a custom event
     */
    private dispatchCustomEvent(name: string, detail: any): void {
        this.element.dispatchEvent(new CustomEvent(name, {
            bubbles: true,
            composed: true,
            detail
        }));
    }
}