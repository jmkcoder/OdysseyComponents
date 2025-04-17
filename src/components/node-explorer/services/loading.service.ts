import { EventDispatcherService } from './event-dispatcher.service';
import { UIUpdaterService } from './ui-updater.service';
import { ExplorerNode } from '../node-explorer.type';
import { NodeService } from './node.service';

export class LoadingService {
    private _loadingTimeouts: Map<string, number> = new Map();
    private _loadingTimeout: number = 10000; // Default timeout: 10 seconds
    
    constructor(
        private eventDispatcherService: EventDispatcherService,
        private uiUpdaterService: UIUpdaterService,
        private nodeService: NodeService
    ) {}
    
    /**
     * Set the loading timeout value in milliseconds
     */
    setLoadingTimeout(timeout: number): void {
        this._loadingTimeout = timeout;
    }
    
    /**
     * Starts a timeout for loading the children of a node
     * Will show an error state if loading takes too long
     */
    startLoadingTimeout(nodeId: string, host: HTMLElement, selectedNodes: Set<string>): void {
        // Clear any existing timeout for this node
        this.clearLoadingTimeout(nodeId);
        
        // Set a new timeout
        const timeoutId = window.setTimeout(() => {
            const node = this.nodeService.findNodeById(nodeId);
            if (node && node.isLoading) {
                // Mark the node as having an error
                node.isLoading = false;
                node.hasLoadingError = true;
                
                // Update the UI to show the error state
                this.uiUpdaterService.updateNodeUI(host, nodeId, node, selectedNodes);
                
                // Dispatch error info through the load-children event
                this.eventDispatcherService.dispatchNodeLoadChildrenEvent(
                    nodeId,
                    node,
                    undefined,
                    false,
                    true, // hasError
                    'timeout',
                    'Loading timeout exceeded'
                );
            }
        }, this._loadingTimeout);
        
        // Store the timeout ID
        this._loadingTimeouts.set(nodeId, timeoutId);
    }
    
    /**
     * Clears any existing loading timeout for a node
     */
    clearLoadingTimeout(nodeId: string): void {
        const timeoutId = this._loadingTimeouts.get(nodeId);
        if (timeoutId !== undefined) {
            window.clearTimeout(timeoutId);
            this._loadingTimeouts.delete(nodeId);
        }
    }
    
    /**
     * Clear all loading timeouts
     */
    clearAllTimeouts(): void {
        for (const [nodeId, timeoutId] of this._loadingTimeouts.entries()) {
            window.clearTimeout(timeoutId);
        }
        this._loadingTimeouts.clear();
    }

    /**
     * Retry loading children for a node that previously failed
     */
    retryLoadingChildren(nodeId: string, host: HTMLElement, selectedNodes: Set<string>): void {
        const node = this.nodeService.findNodeById(nodeId);
        if (!node) return;
        
        // Reset the error state
        node.hasLoadingError = false;
        node.isLoading = true;
        
        // Update the UI to show loading state
        this.uiUpdaterService.updateNodeUI(host, nodeId, node, selectedNodes);
        
        // Start a new timeout
        this.startLoadingTimeout(nodeId, host, selectedNodes);
        
        // Dispatch the load children event again
        this.eventDispatcherService.dispatchNodeLoadChildrenEvent(nodeId, node);
    }
}