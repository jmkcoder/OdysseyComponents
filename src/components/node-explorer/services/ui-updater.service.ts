import { ExplorerNode } from '../node-explorer.type';

/**
 * Service responsible for updating the UI elements of the node explorer
 */
export class UIUpdaterService {
    /**
     * Adds Material Icons to the document if not already present
     */
    addMaterialIcons(): void {
        // Check if Material Icons is already loaded
        const existingLink = document.querySelector('link[href*="material-icons"]');
        if (existingLink) return;
        
        // Add embedded fallback icons for essential icons used in the component
        this.addEmbeddedIconFallback();
        
        // Try loading external Material Icons with error handling
        try {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = 'https://fonts.googleapis.com/icon?family=Material+Icons';
            
            // Add error handling
            link.onerror = () => {
                console.warn('Failed to load Material Icons from CDN. Using embedded fallback icons.');
                // The fallback is already added above
            };
            
            document.head.appendChild(link);
        } catch (error) {
            console.warn('Error while trying to load Material Icons:', error);
            // The fallback is already added above
        }
    }
    
    /**
     * Adds embedded essential icon styles as fallback
     */
    private addEmbeddedIconFallback(): void {
        // Check if our fallback is already added
        if (document.getElementById('odyssey-material-icons-fallback')) return;
        
        const style = document.createElement('style');
        style.id = 'odyssey-material-icons-fallback';
        
        // Only include the most essential icons used in the component
        style.textContent = `
            /* Minimal Material Icons Fallback - Only the ones used in the component */
            @font-face {
                font-family: 'Material Icons Fallback';
                font-style: normal;
                font-weight: 400;
                src: url(data:application/font-woff2;charset=utf-8;base64,d09GMgABAAAAAAZsAAsAAAAAC7AAAAYeAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAHFQGYABsEQgKilCHUQE2AiQDTAsQAAQgBYIUByAbsQptyFEURWSXIvsiwN04FEEUnO0ZiKHYuOGxUfBs9uT/XyfvIrxFWBToyQp9Ii1CMRm1ZlE96it00ViY1hxJFP9N04C9f8cV5agCmsbGGsQG5YRqsvo2pf/vPvzzlIq8YSz2ELm/J30LgATyBeQAEEAJBMD8m+HC//+537777TfbAzwdRdrEWiLRJibMq9VKiIVJLUsnQ0jb7Nd+H2uUkTGXbO7vLZCpqFqby5D9IcSYiEw7E6FVS9JJn9f+3xvpfhGRw8BEJk9WrV5Dh0On0qO03TJoq95CFDIyV6ZBxJib9IAN4IVPn4BVzlxaXkfaxdaxpXwDh+yw5wGmIJhTBUPxVnFQP5HUBxxb44AzAmiEDwfe+MzlyVC9UncnkFRSGdWI3v7mE1I6HSVSQfH6g3Lj0K+pnP56Ujn5FVIIfCZqGfajRNoPo1L5/t4JQg/FSJJOT50/4oPS8KCUJnUqJdTEh8Q/WgeHIEqjXu6bzbC5dRDVdw+Tewd5LYOsmg/WBeJQCsFgGYakFIlCMx9JgTA42LLvICYjEC6l0qqvQRkeQ5LvHsPC2YoQaBZDcKYxlQpSTiU0NB/KKZ2t5FxFrVQgVK0BpLEOTJbXwEgYjHq9xSAmLJWTRKF1vsJbKcBkVFFIgUQBxyHnqeQslcTIpBS5+VEcG/0jOPA8F39DFfhviaJKlgE4hGRVpeyO9On6aPohpq0kpCzH9V3QorkG6Wjfc0JgtLMtgNCLy+RCLxZoRaeCboY2UolYtBteiCC0LzA4bmcOzU1eLBZwHmZWXdpxdleyHkidBZw5dG/oPR28WTEF+H4mWQAAQP1/TjIzEQdc8sFUhF0/6eWlZ29BgMDw//8yfnCHs6rP7akCwjCsnD3bsXZNx5o17WvXpCCgw4YgDJldpheZPXs2eXCY3NL79IZK1iNWowUohcpXDqoAlXqA0oG5O3JTenKhbgCgpscRQZE3e/asWWkcLvvMXjF7VnYKH+LgzJyVGQa6K7G9M9I4SRCakgXkwj36eWpbx1y4o1DWSOUnrIBrHeL5D8/sUdhWGgzlW8MkIAiu4SQWhink05/ql/56LYnN6gxdty2wVem0Kb6qkGuVPGlqJdDZNEQO+QQbzILdJpUwpjMB2UbDnFYI0kHia7LInVa90hQIacWyGL21xaRQmg2drVYpBLPk9jOydTs44NvAozdEdfzGNImLy57kC98UdxOEPxNcXLB33a/JeCaXL0Oz3qZUVe+cnLB2wUihLJTZXCyzwZJe1GI4s+iwctHCLTugt74L4bG//qhwFT91HZn44YhQi9jnZ2eXzM8uMr+4OD+nMKdwQXZJTk720bAQjm/xeJ4FUF1aXVQaVnYilB+1qaYsrLSsxjBFxAJUHd4YFRkeGdk8xtj6aRb+o5Z4yBgRugNAzRDQ4cAgoDOaHw4xJGCMIYAAOtAFiGNYqmUGBllRWZS3srDkmO2oKnq5tChzZQnMnbqDwfHfdQoAgDpE9k6T+mO/pQRtmg8AGgDwzxj9sVmD1ILP+c81HSZsAuTcy/1bPl1muZeDGczje/5lFekXTQYuP7k92j5Ncm22P8o4YiuAQwEAwAMB8PF2Hj77R6qPkmq63NpnS8fQTVVafuQBGF0uhp+4pvkShk8mVJaypLpGkzbT9D1ouphIIuGVibTnEsLOyoRGIADaifFD1THjMrkKE5nxYKJyS1hDElcmOvcjie7DRAafgaJ3lhDVgkxQ7pXAMM3gSEjJ9IgG3snBfwFqcKQG9JatZA4HyRTCTR6Fnp+mQ9fL3NMfvwSQudQmd9N/HJMURUB98IXG8WQ52kKlQu9ySKhJ1p1VZwtwYTEmtf9p5tOFYtMh8D9kW9YpBbVeAmz7AVTByT4Ck6FJAA==) format('woff2');
            }
            .material-icons {
                font-family: 'Material Icons Fallback', 'Material Icons';
                font-weight: normal;
                font-style: normal;
                font-size: 24px;
                line-height: 1;
                letter-spacing: normal;
                text-transform: none;
                display: inline-block;
                white-space: nowrap;
                word-wrap: normal;
                direction: ltr;
                -webkit-font-feature-settings: 'liga';
                -webkit-font-smoothing: antialiased;
            }
            /* Essential icon definitions */
            .material-icons.folder:before { content: "\\e2c7"; }
            .material-icons.insert_drive_file:before { content: "\\e24d"; }
            .material-icons.keyboard_arrow_right:before { content: "\\e315"; }
            .material-icons.keyboard_arrow_down:before { content: "\\e313"; }
            .material-icons.sync:before { content: "\\e627"; }
            .material-icons.refresh:before { content: "\\e5d5"; }
            .material-icons.error_outline:before { content: "\\e001"; }
            .material-icons.person:before { content: "\\e7fd"; }
            .material-icons.image:before { content: "\\e410"; }
            .material-icons.description:before { content: "\\e873"; }
            .material-icons.code:before { content: "\\e86f"; }
            .material-icons.javascript:before { content: "\\eb97"; }
            .material-icons.css:before { content: "\\eb93"; }
            .material-icons.html:before { content: "\\eb96"; }
        `;
        
        document.head.appendChild(style);
    }
    
    /**
     * Renders the explorer component with the provided nodes
     */
    renderExplorer(
        rootElement: HTMLElement,
        nodes: ExplorerNode[],
        allowMultiSelect: boolean,
        allowDragDrop: boolean,
        theme: string
    ): void {
        // Clear existing content
        rootElement.classList.add('node-explorer');
        rootElement.setAttribute('role', 'tree');
        rootElement.innerHTML = '';
        
        // Create container for nodes
        const container = document.createElement('div');
        container.className = 'node-container';
        container.setAttribute('role', 'tree');
        container.setAttribute('aria-multiselectable', allowMultiSelect ? 'true' : 'false');
        
        // Create and append nodes
        this.createNodeElements(container, nodes, allowDragDrop);
        rootElement.appendChild(container);
        
        // Set accessibility attributes
        this.setAriaAttributesForNodes(container, nodes);
    }
    
    /**
     * Creates node elements and appends them to the container
     */
    private createNodeElements(container: HTMLElement, nodes: ExplorerNode[], allowDragDrop: boolean): void {
        nodes.forEach(node => {
            const nodeEl = document.createElement('div');
            nodeEl.className = 'node';
            nodeEl.dataset.id = node.id;
            
            // Create node header
            const header = document.createElement('div');
            header.className = 'node-header';
            header.setAttribute('tabindex', '-1');
            header.dataset.id = node.id;
            
            // Create expand toggle if node has children or is lazy-loaded
            if ((node.children && node.children.length > 0) || (node.isLazy && node.hasChildren !== false)) {
                const expandToggle = document.createElement('span');
                expandToggle.className = 'expand-toggle material-icons';
                expandToggle.dataset.id = node.id;
                
                if (node.isLoading) {
                    // Use a better loading icon and make sure animation class is correctly applied
                    expandToggle.textContent = 'autorenew'; // Better icon for spinner
                    expandToggle.className = 'expand-toggle material-icons animate-spin';
                } else {
                    expandToggle.textContent = node.expanded ? 'keyboard_arrow_down' : 'keyboard_arrow_right';
                }
                
                header.appendChild(expandToggle);
            } else {
                // Add spacer for alignment if no expand toggle
                const spacer = document.createElement('span');
                spacer.className = 'expand-toggle-spacer';
                header.appendChild(spacer);
            }
            
            // Create node icon
            if (node.icon) {
                const iconEl = document.createElement('span');
                
                // Check if the icon is a Material icon name or starts with material: prefix
                if (node.icon.startsWith('material:')) {
                    // Handle explicit material: prefix
                    iconEl.className = 'node-icon material-icons';
                    iconEl.textContent = node.icon.substring(9); // Remove "material:" prefix
                } else if (node.icon.includes('/') || node.icon.startsWith('http') || node.icon.startsWith('data:')) {
                    // Handle image URLs
                    iconEl.className = 'node-icon custom-icon';
                    
                    const img = document.createElement('img');
                    img.src = node.icon;
                    img.alt = '';
                    iconEl.appendChild(img);
                } else {
                    // Default case: treat as Material icon name
                    iconEl.className = 'node-icon material-icons';
                    iconEl.textContent = node.icon;
                }
                
                header.appendChild(iconEl);
            }
            
            // Create node label
            const label = document.createElement('span');
            label.className = 'node-label';
            label.textContent = node.label;
            
            header.appendChild(label);
            nodeEl.appendChild(header);
            
            // Set drag attributes if drag drop is allowed
            if (allowDragDrop) {
                header.setAttribute('draggable', 'true');
            }
            
            // Create children container if node has children
            if (node.children && node.children.length > 0) {
                const childrenContainer = document.createElement('div');
                childrenContainer.className = 'node-children';
                childrenContainer.setAttribute('role', 'group');
                
                if (node.expanded) {
                    childrenContainer.classList.add('expanded');
                    childrenContainer.style.height = 'auto';
                    childrenContainer.style.opacity = '1';
                    childrenContainer.style.pointerEvents = 'auto';
                } else {
                    childrenContainer.style.height = '0';
                    childrenContainer.style.opacity = '0';
                    childrenContainer.style.pointerEvents = 'none';
                }
                
                // Recursively create child nodes
                this.createNodeElements(childrenContainer, node.children, allowDragDrop);
                nodeEl.appendChild(childrenContainer);
            } else if (node.isLoading) {
                // Add a loading placeholder when a node is in loading state but has no children yet
                const childrenContainer = document.createElement('div');
                childrenContainer.className = 'node-children expanded';
                childrenContainer.setAttribute('role', 'group');
                childrenContainer.style.height = 'auto';
                childrenContainer.style.opacity = '1';
                childrenContainer.style.pointerEvents = 'auto';
                
                const loadingPlaceholder = document.createElement('div');
                loadingPlaceholder.className = 'loading-placeholder';
                loadingPlaceholder.textContent = 'Loading...';
                loadingPlaceholder.style.padding = '4px 8px';
                loadingPlaceholder.style.color = 'var(--text-secondary)';
                loadingPlaceholder.style.fontStyle = 'italic';
                
                childrenContainer.appendChild(loadingPlaceholder);
                nodeEl.appendChild(childrenContainer);
            }
            
            container.appendChild(nodeEl);
        });
    }
    
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
                    // Consistent with the createNodeElements method
                    expandToggle.textContent = 'autorenew';
                    expandToggle.classList.add('animate-spin');
                } else {
                    // Set the correct icon based on expansion state
                    expandToggle.textContent = node.expanded ? 'keyboard_arrow_down' : 'keyboard_arrow_right';
                    expandToggle.classList.remove('animate-spin');
                }
            }

            // We don't need separate loading indicator in the label anymore
            if (!node.isLoading) {
                const loadingIndicator = nodeHeader.querySelector('.loading-indicator');
                if (loadingIndicator) {
                    loadingIndicator.remove();
                }
            }
            
            // Update error indicator
            this.updateErrorIndicator(nodeHeader as HTMLElement, !!node.hasLoadingError);
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
        const loadingIndicator = nodeHeader.querySelector('.loading-indicator');
        if (isLoading) {
            if (!loadingIndicator) {
                const newLoadingIndicator = document.createElement('span');
                newLoadingIndicator.className = 'loading-indicator material-icons animate-spin ml-2';
                newLoadingIndicator.textContent = 'refresh';
                const nodeLabel = nodeHeader.querySelector('.node-label');
                if (nodeLabel) {
                    nodeLabel.appendChild(newLoadingIndicator);
                }
            }
        } else if (loadingIndicator) {
            loadingIndicator.remove();
        }
    }
    
    /**
     * Updates the error indicator for a node
     */
    private updateErrorIndicator(nodeHeader: HTMLElement, hasError: boolean): void {
        const errorIndicator = nodeHeader.querySelector('.error-indicator');
        if (hasError) {
            if (!errorIndicator) {
                const newErrorIndicator = document.createElement('span');
                newErrorIndicator.className = 'error-indicator material-icons text-red-500 ml-2';
                newErrorIndicator.textContent = 'error_outline';
                newErrorIndicator.title = 'Failed to load children. Click to retry.';
                const nodeLabel = nodeHeader.querySelector('.node-label');
                if (nodeLabel) {
                    nodeLabel.appendChild(newErrorIndicator);
                }
            }
        } else if (errorIndicator) {
            errorIndicator.remove();
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
     * Sets accessibility attributes on all nodes
     */
    private setAriaAttributesForNodes(container: HTMLElement, nodes: ExplorerNode[], level: number = 1): void {
        nodes.forEach(node => {
            const nodeEl = container.querySelector(`.node[data-id="${node.id}"]`);
            if (!nodeEl) return;
            
            const nodeHeader = nodeEl.querySelector('.node-header');
            if (nodeHeader) {
                nodeHeader.setAttribute('role', 'treeitem');
                nodeHeader.setAttribute('aria-level', level.toString());
                
                if (node.children && node.children.length > 0) {
                    nodeHeader.setAttribute('aria-expanded', node.expanded ? 'true' : 'false');
                }
            }
            
            const childrenContainer = nodeEl.querySelector('.node-children');
            if (childrenContainer && node.children) {
                childrenContainer.setAttribute('role', 'group');
                this.setAriaAttributesForNodes(childrenContainer as HTMLElement, node.children, level + 1);
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
    
    /**
     * Detect theme from parent element classes or attributes
     */
    detectThemeFromParentOrClass(element: HTMLElement): string | null {
        // Check if we're inside a sidebar-container or other relevant container
        let parent = element.closest('.sidebar-container');
        
        // If not found, try parent element
        if (!parent && element.parentElement) {
            parent = element.parentElement;
        }
        
        if (parent) {
            // First check for theme attribute
            const themeAttr = parent.getAttribute('theme');
            if (themeAttr === 'dark' || themeAttr === 'light') {
                return themeAttr;
            }
            
            // Then check for theme classes
            if (parent.classList.contains('dark')) {
                return 'dark';
            } else if (parent.classList.contains('light')) {
                return 'light';
            }
            
            // Recursively check parent nodes up to 3 levels
            let currentParent = parent;
            let levelsToCheck = 3;
            
            while (currentParent.parentElement && levelsToCheck > 0) {
                currentParent = currentParent.parentElement;
                
                if (currentParent.classList.contains('dark')) {
                    return 'dark';
                } else if (currentParent.classList.contains('light')) {
                    return 'light';
                }
                
                levelsToCheck--;
            }
        }
        
        // Check if document body has theme
        const bodyClassList = document.body.classList;
        if (bodyClassList.contains('dark')) {
            return 'dark';
        } else if (bodyClassList.contains('light')) {
            return 'light';
        }
        
        // Default to null (which will fallback to the default theme)
        return null;
    }
}