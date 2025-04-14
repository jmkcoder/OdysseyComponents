import { ExplorerNode } from '../node-explorer.type';

export class AnimationService {
    /**
     * Animates a node expansion or collapse transition
     */
    animateNodeExpansion(nodeElement: HTMLElement, nodeId: string, isExpanding: boolean): void {
        if (!this.shouldAnimateNode(nodeElement, nodeId)) return;

        const nodeChildren = nodeElement.querySelector(`.node-children[data-parent="${nodeId}"]`) as HTMLElement;
        if (!nodeChildren) return;

        if (isExpanding) {
            nodeChildren.style.height = 'auto';
            nodeChildren.style.opacity = '1';
            nodeChildren.style.pointerEvents = 'auto';
            const height = nodeChildren.offsetHeight;

            nodeChildren.style.height = '0px';
            nodeChildren.style.opacity = '0';
            nodeChildren.offsetHeight; // Force reflow

            nodeChildren.style.transition = `height var(--transition-duration) var(--transition-timing), 
                                           opacity var(--transition-duration) var(--transition-timing)`;
            nodeChildren.style.height = `${height}px`;
            nodeChildren.style.opacity = '1';

            setTimeout(() => {
                nodeChildren.style.height = 'auto';
            }, 200);
        } else {
            const height = nodeChildren.offsetHeight;

            nodeChildren.style.height = `${height}px`;
            nodeChildren.offsetHeight; // Force reflow

            nodeChildren.style.transition = `height var(--transition-duration) var(--transition-timing), 
                                           opacity var(--transition-duration) var(--transition-timing)`;
            nodeChildren.style.height = '0px';
            nodeChildren.style.opacity = '0';
        }
    }

    /**
     * Animates expand/collapse icon rotation
     */
    animateExpandToggle(expandToggle: HTMLElement, isExpanded: boolean): void {
        // Change the icon based on expanded state
        expandToggle.textContent = isExpanded ? 'keyboard_arrow_down' : 'keyboard_arrow_right';
    }

    /**
     * Checks if a node should be animated
     */
    private shouldAnimateNode(element: HTMLElement, nodeId: string): boolean {
        const nodeElement = element.querySelector(`.node[data-id="${nodeId}"]`);
        return !!nodeElement && !nodeElement.classList.contains('no-animation');
    }
}