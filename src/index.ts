import { defineNodeExplorer } from './components/node-explorer/node-explorer';
import './styles.scss';

// Automatically register components when loaded as a script tag
registerComponents();

// Register components globally
function registerComponents() {
    defineNodeExplorer();
}

// Export functions for library usage
const OdysseyComponents = {
  defineNodeExplorer,
  registerComponents
};

export default OdysseyComponents;

