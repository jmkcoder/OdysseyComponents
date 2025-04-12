import { defineNodeExplorer } from './components/node-explorer/node-explorer';
import { defineSidebarContainer } from './components/sidebar-container/sidebar-container';
import './styles.scss';

// Automatically register components when loaded as a script tag
registerComponents();

// Register components globally
function registerComponents() {
  if (!customElements.get('odyssey-node-explorer')) {
    defineNodeExplorer();
  }

  if (!customElements.get('sidebar-container')) {
    defineSidebarContainer();
  }
}

// Export functions for library usage
const OdysseyComponents = {
  defineNodeExplorer,
  defineSidebarContainer,
  registerComponents
};

export default OdysseyComponents;

