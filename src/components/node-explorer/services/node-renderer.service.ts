import { ExplorerNode } from '../node-explorer.type';

export class NodeRendererService {
    renderNodes(nodes: ExplorerNode[], level = 0, allowDragDrop: boolean = true): string {
        if (!nodes || nodes.length === 0) {
            return '<div class="empty-message">No items</div>';
        }

        return nodes.map(node => this.renderNode(node, level, allowDragDrop)).join('');
    }
    
    private renderNode(node: ExplorerNode, level: number, allowDragDrop: boolean = true): string {
        const hasChildren = node.children && node.children.length > 0;
        const mightHaveChildren = hasChildren || node.hasChildren;
        const isExpanded = node.expanded !== false;
        const isLoading = node.isLoading === true;
        const paddingLeft = level * 16; // Increased indentation for better hierarchy visibility

        return `
        <div class="node" data-id="${node.id}">
          <div class="node-header flex items-center rounded-md cursor-pointer" 
               style="padding-left: ${paddingLeft + 8}px"
               ${allowDragDrop ? 'draggable="true"' : ''}
               data-id="${node.id}">
            <!-- Fixed indicator placement and styling -->
            <div class="drop-indicator before-indicator" style="display:none; position:absolute; left:0; right:0; height:3px; background-color:var(--primary-color); top:0;"></div>
            <div class="node-label truncate flex flex-1 items-center" data-id="${node.id}">
              ${mightHaveChildren ?
                  `<span class="block material-icons expand-toggle flex items-center justify-center mr-3 select-none" 
                         data-id="${node.id}" 
                         style="transform: ${isExpanded ? 'rotate(0deg)' : 'rotate(-90deg)'}">
                    ${isLoading ? 'sync' : 'expand_more'}
                  </span>` :
                  `<span class="w-[24px] mr-3"></span>`
              }
              ${node.icon ? `<span class="material-icons mr-2 text-lg">${node.icon}</span>` : ''}
              <span class="truncate">${node.label}</span>
              ${isLoading ? `<span class="loading-indicator material-icons animate-spin ml-2">refresh</span>` : ''}
            </div>
            <!-- Fixed indicator placement and styling -->
            <div class="drop-indicator after-indicator" style="display:none; position:absolute; left:0; right:0; height:3px; background-color:var(--primary-color); bottom:0;"></div>
          </div>
          ${hasChildren || (isExpanded && isLoading) ?
                `<div class="node-children ${isExpanded ? 'expanded' : ''}" 
                      data-parent="${node.id}"
                      style="${isExpanded ? 'height: auto; opacity: 1; pointer-events: auto;' : ''}">
                   ${isLoading && (!node.children || node.children.length === 0) ?
                        `<div class="loading-placeholder px-4 py-2 text-gray-500">Loading...</div>` :
                        this.renderNodes(node.children || [], level + 1, allowDragDrop)
                    }
                 </div>` :
                ''
            }
        </div>
      `;
    }
    
    renderExplorer(nodes: ExplorerNode[], allowMultiSelect: boolean = false, allowDragDrop: boolean = true): string {
        return `
        <div class="node-explorer" ${allowMultiSelect ? 'allow-multi-select="true"' : ''} ${!allowDragDrop ? 'allow-drag-drop="false"' : ''}>
          <div class="node-container">
            ${this.renderNodes(nodes, 0, allowDragDrop)}
          </div>
        </div>
        `;
    }
}