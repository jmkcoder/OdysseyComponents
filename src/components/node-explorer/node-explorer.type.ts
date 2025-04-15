export interface ExplorerNode {
    id: string;
    label: string;
    children?: ExplorerNode[];
    expanded?: boolean;
    icon?: string;
    hasChildren?: boolean; // Indicates if the node has children even if they're not loaded yet
    isLoading?: boolean; // Indicates if the node's children are currently being loaded
    isLazy?: boolean; // Indicates if this node needs to load its children dynamically
    isRetry?: boolean; // Indicates if the node is in a retry state
    hasLoadingError?: boolean; // Indicates if there was an error loading the children (e.g., timeout)
}

// New interface to expose public methods of the NodeExplorer element
export interface NodeExplorerElement extends HTMLElement {
    // Node manipulation methods
    expandNode(id: string): boolean;
    collapseNode(id: string): boolean;
    selectNode(id: string): boolean;
    getSelectedNode(): ExplorerNode | null;
    getSelectedNodes(): ExplorerNode[];
    findNodeById(id: string): ExplorerNode | undefined;
    addNode(parentId: string | null, node: ExplorerNode): boolean;
    removeNode(id: string): boolean;
    moveNode(sourceId: string, targetId: string, position: DropPosition): boolean;
    
    // Lazy loading methods
    setNodeChildren(nodeId: string, children: ExplorerNode[], allChildrenLoaded?: boolean): boolean;
    markNodeAsLazy(nodeId: string, hasChildren?: boolean): boolean;
    appendNodeChildren(nodeId: string, additionalChildren: ExplorerNode[], allChildrenLoaded?: boolean): boolean;
    
    // Configuration properties
    allowDragDrop: boolean;
    allowMultiSelect: boolean;
    theme: string;
}

export type DropPosition = 'before' | 'after' | 'inside';

export interface NodeDragEvent {
    sourceId: string;
    targetId: string;
    position: DropPosition;
    originalEvent?: DragEvent;
}

export interface NodeChangeEvent {
    nodes: ExplorerNode[];
}

export interface NodeSelectedEvent {
    node: ExplorerNode;
    originalEvent?: Event;
}

export interface NodesSelectedEvent {
    nodes: ExplorerNode[];
    count: number;
}

export interface NodeExpandedEvent {
    nodeId: string;
    node: ExplorerNode;
}

export interface NodeCollapsedEvent {
    nodeId: string;
    node: ExplorerNode;
}

export interface DragStartEvent {
    sourceId: string;
    originalEvent: DragEvent;
}

export interface NodeLoadChildrenEvent {
    nodeId: string;
    node: ExplorerNode;
    pendingNode?: ExplorerNode; // The node that is waiting to be added after lazy loading completes
    isDropOperation?: boolean;  // Flag indicating this is triggered by a drag and drop operation
    hasError?: boolean;         // Indicates if this event is reporting a loading error
    errorType?: 'timeout' | string; // The type of error that occurred
    errorMessage?: string;      // Additional error information
}