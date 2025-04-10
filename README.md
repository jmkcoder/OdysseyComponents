# Odyssey Components

A library of web components built with Lit, including a Node Explorer and reusable UI components.

## Installation

```bash
npm install odyssey-components
```

## Components

### Node Explorer
A customizable node-based explorer component for visualizing and manipulating node structures.

### Odyssey Button
A customizable button component with different variants (primary, secondary, outline).

## Usage

### In a module environment (with bundlers like Webpack, Rollup, Vite)

```javascript
import { defineOdysseyButton, defineNodeExplorer } from 'odyssey-components';
import 'odyssey-components/dist/styles.css'; 

// Register the components
defineOdysseyButton();
defineNodeExplorer();
```

### In HTML (via CDN or local file)

```html
<!DOCTYPE html>
<html>
<head>
  <link rel="stylesheet" href="./node_modules/odyssey-components/dist/styles.css">
</head>
<body>
  <odyssey-button label="Click me" variant="primary"></odyssey-button>
  <node-explorer style="height: 500px; width: 100%"></node-explorer>

  <script type="module">
    import { defineOdysseyButton, defineNodeExplorer } from './node_modules/odyssey-components/dist/index.js';
    
    // Register the components
    defineOdysseyButton();
    defineNodeExplorer();
    
    // Configure the node explorer
    const explorer = document.querySelector('node-explorer');
    
    // Add nodes
    explorer.addNode({
      id: 'node1',
      label: 'Node 1',
      type: 'process' 
    });
  </script>
</body>
</html>
```

## Component APIs

### Node Explorer

```javascript
// Add a node
nodeExplorer.addNode({
  id: 'unique-id',
  label: 'Node Label',
  type: 'process', // or 'data', 'input', 'output'
  x: 100, // optional position
  y: 100  // optional position
});

// Add a connection between nodes
nodeExplorer.addConnection({
  source: 'source-node-id',
  target: 'target-node-id'
});

// Remove a node (will also remove associated connections)
nodeExplorer.removeNode('node-id');

// Clear the explorer
nodeExplorer.clear();
```

### Odyssey Button

```html
<!-- Primary variant -->
<odyssey-button 
  label="Primary Button" 
  variant="primary">
</odyssey-button>

<!-- Secondary variant -->
<odyssey-button 
  label="Secondary Button" 
  variant="secondary">
</odyssey-button>

<!-- Outline variant -->
<odyssey-button 
  label="Outline Button" 
  variant="outline">
</odyssey-button>

<!-- With click handler -->
<odyssey-button 
  label="Click Me" 
  variant="primary"
  id="myButton">
</odyssey-button>

<script>
  document.getElementById('myButton').addEventListener('click', () => {
    console.log('Button clicked!');
  });
</script>
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
```