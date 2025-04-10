import { defineOdysseyButton } from './components/odyssey-button/OdysseyButton';
import { defineNodeExplorer } from './components/node-explorer/node-explorer';

// Automatically register components when loaded as a script tag
registerComponents();

// Register components globally
function registerComponents() {
    defineOdysseyButton();
    defineNodeExplorer();
}

// Export functions for library usage
const OdysseyComponents = {
  defineOdysseyButton,
  defineNodeExplorer,
  registerComponents
};

export default OdysseyComponents;

