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
}