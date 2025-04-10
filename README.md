# Odyssey Components

A library of web components for modern web applications, featuring the powerful Node Explorer component.

## Components

### Node Explorer
A hierarchical tree view component with drag-and-drop capabilities, multi-selection support, and keyboard navigation.

## Installation

```bash
npm install @jmkcoder/components
```

## Usage

### In a module environment (with bundlers like Webpack, Rollup, Vite)

```javascript
import { defineNodeExplorer } from '@jmkcoder/components';
import '@jmkcoder/components/dist/components.bundle.css'; 

// Register the components
defineNodeExplorer();
```

### In HTML (via CDN or local file)

```html
<!DOCTYPE html>
<html>
<head>
  <link rel="stylesheet" href="./node_modules/@jmkcoder/components/dist/components.bundle.css">
  <script type="module" src="./node_modules/@jmkcoder/components/dist/index.js"></script>
  <script>
    window.addEventListener('DOMContentLoaded', () => {
      // Register the components
      OdysseyComponents.defineNodeExplorer();
    });
  </script>
  <style>
    odyssey-node-explorer {
      height: 500px;
      display: block;
      border: 1px solid #e0e0e0;
      border-radius: 4px;
    }
  </style>
</head>
<body>
  <h1>Node Explorer Example</h1>
  <odyssey-node-explorer id="explorer"></odyssey-node-explorer>

  <script>
    window.addEventListener('DOMContentLoaded', () => {
      const explorer = document.getElementById('explorer');
      
      // Set up nodes data
      const nodes = [
        {
          id: 'root',
          label: 'Project Files',
          expanded: true,
          icon: 'folder',
          children: [
            { id: 'src', label: 'src', icon: 'folder' },
            { id: 'docs', label: 'docs', icon: 'folder' },
            { id: 'package.json', label: 'package.json', icon: 'description' }
          ]
        }
      ];
      
      // Set nodes to the explorer
      explorer.setAttribute('nodes', JSON.stringify(nodes));
      
      // Listen for events
      explorer.addEventListener('node-selected', (e) => {
        console.log('Selected:', e.detail.node);
      });
    });
  </script>
</body>
</html>
```

Check out the complete examples in the `examples/` directory:
- [`basic-example.html`](examples/basic-example.html): Simple demo with minimal setup
- [`usage-example.html`](examples/usage-example.html): Advanced usage with all features

## Node Explorer API

### Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `nodes` | String (JSON) | `'[]'` | A JSON string of the tree nodes structure |
| `allow-drag-drop` | Boolean | `true` | Enable or disable drag and drop functionality |
| `allow-multi-select` | Boolean | `false` | Enable or disable multi-selection of nodes |
| `theme` | String | `'light'` | Theme variant ('light', 'dark', 'minimal', 'high-contrast') |

### Node Structure

```javascript
// Basic node structure
{
  id: 'unique-id',       // Required unique identifier
  label: 'Node Label',   // Display text
  expanded: false,       // Whether the node is expanded (if it has children)
  icon: 'folder',        // Optional icon name (using Material Icons)
  children: [],          // Optional array of child nodes
  hasChildren: false,    // Indicate if node has children even if not loaded
  isLazy: false,         // For dynamic loading of children
  isLoading: false       // Indicates loading state
}
```

### Methods

```javascript
// Get a reference to the node explorer
const explorer = document.getElementById('explorer');

// Node manipulation
explorer.addNode('parent-id', { id: 'new-node', label: 'New Node' });
explorer.removeNode('node-id');
explorer.moveNode('source-id', 'target-id', 'inside'); // 'inside', 'before', or 'after'

// Node state control
explorer.expandNode('node-id');
explorer.collapseNode('node-id');
explorer.selectNode('node-id');

// Get node information
const selectedNode = explorer.getSelectedNode();
const selectedNodes = explorer.getSelectedNodes(); // For multi-select
const node = explorer.findNodeById('node-id');

// Lazy loading
explorer.markNodeAsLazy('node-id', true);
explorer.setNodeChildren('parent-id', childNodes);
explorer.appendNodeChildren('parent-id', moreChildNodes);
```

### Events

```javascript
// Selection events
explorer.addEventListener('node-selected', (e) => {
  console.log('Selected node:', e.detail.node);
});

explorer.addEventListener('nodes-selected', (e) => {
  console.log('Multiple nodes selected:', e.detail.nodes);
});

// Expansion events
explorer.addEventListener('node-expanded', (e) => {
  console.log('Node expanded:', e.detail.nodeId);
});

explorer.addEventListener('node-collapsed', (e) => {
  console.log('Node collapsed:', e.detail.nodeId);
});

// Lazy loading
explorer.addEventListener('load-children', (e) => {
  const { nodeId, node } = e.detail;
  console.log(`Loading children for node: ${nodeId}`);
  
  // Simulate fetching data
  setTimeout(() => {
    const children = [
      { id: `${nodeId}-child1`, label: 'Child 1' },
      { id: `${nodeId}-child2`, label: 'Child 2' }
    ];
    
    explorer.setNodeChildren(nodeId, children);
  }, 500);
});

// Drag and drop events
explorer.addEventListener('drop', (e) => {
  console.log('Node dropped:', e.detail);
});

// Structure changes
explorer.addEventListener('nodes-changed', (e) => {
  console.log('Node structure changed:', e.detail.nodes);
  // You can persist this new structure to your backend
});
```

## Features

### Themes
Four built-in themes: light, dark, minimal, and high-contrast for accessibility.

```javascript
// Apply a theme
explorer.setAttribute('theme', 'dark');

// Or use the property
explorer.theme = 'high-contrast';
```

### Keyboard Navigation
Full keyboard support for navigation and selection:
- Arrow keys for navigation
- Space/Enter for selection
- Home/End for jumping to first/last node

### Drag and Drop
Intuitive drag and drop functionality for reorganizing nodes:
- Drag nodes to reorder within the same parent
- Drag nodes to new parents
- Visual indicators show valid drop targets

```javascript
// Disable drag and drop
explorer.setAttribute('allow-drag-drop', 'false');

// Or use the property
explorer.allowDragDrop = false;
```

### Multi-Select
Support for selecting multiple nodes using Ctrl/Cmd+click and Shift+click.

```javascript
// Enable multi-select
explorer.setAttribute('allow-multi-select', 'true');

// Or use the property
explorer.allowMultiSelect = true;
```

### Lazy Loading
Efficient handling of large data sets by loading children on demand:

```javascript
// Mark a node as lazy-loadable
explorer.markNodeAsLazy('folder-id', true);

// Listen for load events
explorer.addEventListener('load-children', handleLoadChildren);

function handleLoadChildren(event) {
  const { nodeId } = event.detail;
  
  // Fetch data from server
  fetchChildrenFromServer(nodeId).then(children => {
    // Provide the children to the explorer
    explorer.setNodeChildren(nodeId, children);
  });
}
```

## CSS Customization

You can customize the component appearance using CSS custom properties:

```css
odyssey-node-explorer {
  --primary-color: #3b82f6;
  --primary-light: #93c5fd;
  --gray-light: #f3f4f6;
  --gray-medium: #e5e7eb;
  --text-color: #111827;
  --text-light: #6b7280;
  --node-padding: 6px 8px;
  --node-margin: 2px 0;
  --node-border-radius: 6px;
  --node-font-size: 13px;
  --connector-width: 2px;
  --connector-color: #e8e8e8;
  --selection-bg: rgba(59, 130, 246, 0.2);
  --transition-duration: 200ms;
  --transition-timing: cubic-bezier(0.4, 0, 0.2, 1);
}

/* Dark theme example */
odyssey-node-explorer.dark-theme {
  --primary-color: #60a5fa;
  --primary-light: #2563eb;
  --gray-light: #374151;
  --gray-medium: #1f2937;
  --text-color: #f9fafb;
  --text-light: #d1d5db;
  --connector-color: #4b5563;
  --selection-bg: rgba(96, 165, 250, 0.2);
}
```

## Project Structure

```
odyssey-components/
├── src/                  # Source code
│   ├── components/       # Web components
│   │   ├── node-explorer/  # Node Explorer component
│   │   │   ├── node-explorer.ts        # Main component file
│   │   │   ├── node-explorer.scss      # Component styles
│   │   │   ├── node-explorer.type.ts   # TypeScript interfaces
│   │   │   └── services/               # Component services
│   │   │       ├── node.service.ts           # Node data handling
│   │   │       ├── node-renderer.service.ts  # DOM rendering
│   │   │       └── drag-drop.service.ts      # Drag & drop handling
│   │   └── odyssey-button/ # Button component
│   ├── utilities/        # Utility functions
│   └── stories/          # Storybook documentation
├── examples/             # Usage examples
└── distlib/              # Built distribution files
```

## Development

To develop and test the components locally:

```bash
# Install dependencies
npm install

# Run development server with hot reloading
npm run dev

# Run Storybook for component documentation
npm run storybook

# Build the library
npm run build

# Build Storybook documentation site
npm run build-storybook
```

### Development Workflow

1. Make changes to component files in `src/components/`
2. Test in development server or Storybook
3. Build the library when ready
4. Check the examples in the `examples/` directory to verify the build

## Contribution

Contributions are welcome! Please feel free to submit a Pull Request.

## License

ISC

## Browser Support
The Node Explorer component supports all modern browsers:
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Acknowledgments

This component uses [Material Icons](https://fonts.google.com/icons) for node icons.