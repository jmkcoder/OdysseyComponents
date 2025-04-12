import { html } from 'lit';
import  '../../index';

// Default sample data structure
const defaultNodes = [
  {
    id: 'node1',
    label: 'Project Root',
    icon: 'folder',
    expanded: false,
    children: [
      {
        id: 'node2',
        label: 'src',
        icon: 'folder',
        expanded: false,
        children: [
          { id: 'node3', label: 'components', icon: 'folder' },
          { id: 'node4', label: 'utils', icon: 'folder' },
          { id: 'node5', label: 'assets', icon: 'folder' }
        ]
      },
      {
        id: 'node6',
        label: 'docs',
        icon: 'folder',
        expanded: false,
        children: [
          { id: 'node7', label: 'api.md', icon: 'insert_drive_file' },
          { id: 'node8', label: 'setup.md', icon: 'insert_drive_file' }
        ]
      }
    ]
  },
  {
    id: 'node9',
    label: 'External Resources',
    icon: 'folder',
    expanded: false,
    children: [
      { id: 'node10', label: 'CDN Assets', icon: 'insert_drive_file' },
      { id: 'node11', label: 'APIs', icon: 'insert_drive_file' }
    ]
  }
];

// File Explorer example data
const fileExplorerNodes = [
  {
    id: 'root',
    label: 'My Project',
    icon: 'folder',
    expanded: true,
    children: [
      {
        id: 'src',
        label: 'src',
        icon: 'folder',
        expanded: true,
        children: [
          { 
            id: 'components', 
            label: 'components', 
            icon: 'folder',
            expanded: true,
            children: [
              { id: 'button.js', label: 'button.js', icon: 'javascript' },
              { id: 'input.js', label: 'input.js', icon: 'javascript' }
            ]
          },
          { 
            id: 'styles', 
            label: 'styles', 
            icon: 'folder',
            expanded: true,
            children: [
              { id: 'main.css', label: 'main.css', icon: 'css' }
            ]
          },
          { id: 'app.js', label: 'app.js', icon: 'javascript' },
          { id: 'index.js', label: 'index.js', icon: 'javascript' }
        ]
      },
      {
        id: 'public',
        label: 'public',
        icon: 'folder',
        expanded: true,
        children: [
          { id: 'index.html', label: 'index.html', icon: 'html' },
          { id: 'favicon.ico', label: 'favicon.ico', icon: 'image' }
        ]
      },
      { id: 'package.json', label: 'package.json', icon: 'code' },
      { id: 'README.md', label: 'README.md', icon: 'description' }
    ]
  }
];

// Organizational chart example data
const orgChartNodes = [
  {
    id: 'ceo',
    label: 'John Smith (CEO)',
    icon: 'person',
    expanded: true,
    children: [
      {
        id: 'cto',
        label: 'Jane Doe (CTO)',
        icon: 'person',
        expanded: true,
        children: [
          { id: 'lead-dev', label: 'Lead Developer', icon: 'person' },
          { id: 'senior-dev', label: 'Senior Developer', icon: 'person' },
          { id: 'junior-dev', label: 'Junior Developer', icon: 'person' }
        ]
      },
      {
        id: 'cfo',
        label: 'Bob Johnson (CFO)',
        icon: 'person',
        expanded: true,
        children: [
          { id: 'accountant', label: 'Accountant', icon: 'person' },
          { id: 'financial-analyst', label: 'Financial Analyst', icon: 'person' }
        ]
      },
      {
        id: 'cmo',
        label: 'Alice Williams (CMO)',
        icon: 'person',
        expanded: true,
        children: [
          { id: 'marketing-specialist', label: 'Marketing Specialist', icon: 'person' },
          { id: 'content-creator', label: 'Content Creator', icon: 'person' }
        ]
      }
    ]
  }
];

// Lazy loading example data - updated with new API
const lazyLoadedNodes = [
  {
    id: 'root1',
    label: 'Documents',
    icon: 'folder',
    expanded: true,
    children: [
      { 
        id: 'lazy1', 
        label: 'Projects', 
        icon: 'folder',
        isLazy: true,  // New property to mark as lazy loaded
        hasChildren: true,  // Indicate it has children even though they're not loaded yet
        expanded: false
      },
      { 
        id: 'lazy2', 
        label: 'Reports', 
        icon: 'folder',
        isLazy: true,
        hasChildren: true,
        expanded: false
      }
    ]
  },
  {
    id: 'root2',
    label: 'Images',
    icon: 'folder',
    isLazy: true,
    hasChildren: true,
    expanded: false
  },
  {
    id: 'root3',
    label: 'External Resources',
    icon: 'cloud',
    isLazy: true,
    hasChildren: true,
    expanded: false
  }
];

// Theme examples - we'll use the same data structure but different CSS
const themeExampleNodes = [
  {
    id: 'theme-root',
    label: 'Theme Demo',
    icon: 'folder',
    expanded: true,
    children: [
      {
        id: 'theme-1',
        label: 'First Level Item',
        icon: 'folder',
        expanded: true,
        children: [
          { id: 'theme-1-1', label: 'Second Level Item 1', icon: 'insert_drive_file' },
          { id: 'theme-1-2', label: 'Second Level Item 2', icon: 'insert_drive_file' }
        ]
      },
      {
        id: 'theme-2',
        label: 'Another Item',
        icon: 'folder',
        expanded: true,
        children: [
          { id: 'theme-2-1', label: 'Child Item', icon: 'insert_drive_file' }
        ]
      }
    ]
  }
];

// Larger dataset for performance testing
const generateLargeDataset = (depth = 3, breadth = 4, prefix = '') => {
  let id = 0;
  const generateNodes = (currentDepth, currentPrefix) => {
    if (currentDepth <= 0) return [];
    
    return Array.from({ length: breadth }, (_, i) => {
      id++;
      const nodeId = `node${id}`;
      const label = `${currentPrefix}${currentPrefix ? '.' : ''}Item ${i + 1}`;
      
      return {
        id: nodeId,
        label,
        expanded: currentDepth === depth, // Only expand top level by default
        children: generateNodes(currentDepth - 1, label)
      };
    });
  };
  
  return generateNodes(depth, prefix);
};

const largeDataset = generateLargeDataset(4, 5);

// Story definition
export default {
  title: 'Components/Node Explorer',
  component: 'odyssey-node-explorer',
  argTypes: {
    allowDragDrop: {
      control: 'boolean',
      description: 'Enable or disable drag and drop functionality',
      defaultValue: true
    },
    allowMultiSelect: {
      control: 'boolean',
      description: 'Enable or disable multi-selection of nodes',
      defaultValue: false
    },
    theme: {
      control: 'select',
      options: ['light', 'dark', 'minimal', 'high-contrast'],
      description: 'Theme variant',
      defaultValue: 'light'
    },
    handleNodeSelected: { action: 'node-selected' },
    handleNodesSelected: { action: 'nodes-selected' },
    handleNodeExpanded: { action: 'node-expanded' },
    handleNodeCollapsed: { action: 'node-collapsed' },
    handleDragStart: { action: 'drag-start' },
    handleDrop: { action: 'drop' },
    handleNodesChanged: { action: 'nodes-changed' }
  },
  parameters: {
    docs: {
      description: {
        component: 'A powerful hierarchical tree view component with drag-and-drop capabilities for modern web applications.'
      }
    }
  }
};

// Base template
const Template = (args) => {
  // Create the component with initial data
  const explorer = document.createElement('odyssey-node-explorer');
  explorer.id = `demo-explorer-${Math.random().toString(36).substr(2, 9)}`;
  explorer.setAttribute('nodes', JSON.stringify(args.nodes || defaultNodes));
  
  // Set theme via attribute 
  if (args.theme && args.theme !== 'light') {
    explorer.setAttribute('theme', args.theme);
  }
  
  // Set multi-select via attribute
  if (args.allowMultiSelect) {
    explorer.setAttribute('allow-multi-select', 'true');
  }
  
  // Set drag-drop via attribute
  if (args.allowDragDrop === false) {
    explorer.setAttribute('allow-drag-drop', 'false');
  }
  
  // Set up event listeners to handle state changes
  setTimeout(() => {
    const explorerElement = document.getElementById(explorer.id);
    if (explorerElement) {
      // Listen for nodes-changed event and update the args.nodes
      explorerElement.addEventListener('nodes-changed', (e) => {
        if (args.handleNodesChanged) {
          args.handleNodesChanged(e);
        }
        // Update the nodes data to maintain state
        args.nodes = e.detail.nodes;
      });
      
      // Listen for node selection
      explorerElement.addEventListener('node-selected', (e) => {
        if (args.handleNodeSelected) {
          args.handleNodeSelected(e);
        }
      });
      
      // Listen for multi-node selection if multi-select is enabled
      if (args.allowMultiSelect) {
        explorerElement.addEventListener('nodes-selected', (e) => {
          if (args.handleNodesSelected) {
            args.handleNodesSelected(e);
          }
        });
      }
      
      // Add drag-drop event listeners if enabled
      if (args.allowDragDrop !== false) {
        explorerElement.addEventListener('drag-start', (e) => {
          if (args.handleDragStart) {
            args.handleDragStart(e);
          }
        });
        
        explorerElement.addEventListener('drop', (e) => {
          if (args.handleDrop) {
            args.handleDrop(e);
          }
        });
      }
      
      // Special handling for lazy loading example
      if (args.lazyLoad) {
        explorerElement.addEventListener('load-children', (e) => {
          const nodeId = e.detail.nodeId;
          const node = e.detail.node;
          
          console.log(`Loading children for node: ${node.label} (${nodeId})`);
          
          // Simulate loading data from a server
          setTimeout(() => {
            // Generate different children based on the node ID
            let childNodes = generateLazyChildren(nodeId);
            
            // Use the new setNodeChildren API method to update the node
            explorerElement.setNodeChildren(nodeId, childNodes, true);
          }, 1000); // Simulate network delay
        });
      }
      
      function generateLazyChildren(nodeId) {
        // Generate different children based on the parent node
        switch(nodeId) {
          case 'lazy1': // Projects folder
            return [
              { id: 'project1', label: 'Web Application', icon: 'web' },
              { id: 'project2', label: 'Mobile App', icon: 'phone_android' },
              { id: 'project3', label: 'Desktop App', icon: 'desktop_windows' },
              { 
                id: 'subfolder1', 
                label: 'Archive', 
                icon: 'folder',
                isLazy: true,
                hasChildren: true
              }
            ];
            
          case 'lazy2': // Reports folder
            return [
              { id: 'report1', label: 'Q1 Report.pdf', icon: 'picture_as_pdf' },
              { id: 'report2', label: 'Q2 Report.pdf', icon: 'picture_as_pdf' },
              { id: 'report3', label: 'Annual Review.docx', icon: 'description' }
            ];
            
          case 'root2': // Images folder
            return [
              { id: 'image1', label: 'Screenshot.png', icon: 'image' },
              { id: 'image2', label: 'Profile.jpg', icon: 'image' },
              { id: 'image3', label: 'Logo.svg', icon: 'image' },
              { 
                id: 'subfolder2', 
                label: 'Vacation Photos', 
                icon: 'folder',
                isLazy: true,
                hasChildren: true
              }
            ];
            
          case 'root3': // External Resources
            return [
              { id: 'ext1', label: 'API Documentation', icon: 'language' },
              { id: 'ext2', label: 'Cloud Storage', icon: 'cloud' },
              { id: 'ext3', label: 'External Database', icon: 'storage' }
            ];
            
          case 'subfolder1': // Archive subfolder
            return [
              { id: 'archive1', label: 'Legacy Project', icon: 'folder' },
              { id: 'archive2', label: 'Backup Files', icon: 'backup' }
            ];
            
          case 'subfolder2': // Vacation Photos
            return [
              { id: 'vacation1', label: 'Beach.jpg', icon: 'image' },
              { id: 'vacation2', label: 'Mountains.jpg', icon: 'image' },
              { id: 'vacation3', label: 'City.jpg', icon: 'image' }
            ];
            
          default:
            // Default children if no specific match
            return [
              { id: `${nodeId}-child1`, label: 'Item 1', icon: 'insert_drive_file' },
              { id: `${nodeId}-child2`, label: 'Item 2', icon: 'insert_drive_file' },
              { id: `${nodeId}-child3`, label: 'Item 3', icon: 'insert_drive_file' }
            ];
        }
      }
    }
  }, 100);
  
  // Add style element for theme demos if needed
  if (args.customCSS) {
    const style = document.createElement('style');
    style.textContent = args.customCSS;
    document.head.appendChild(style);
  }
  
  return html`${explorer}`;
};

// Stories
export const Default = Template.bind({});
Default.args = {
  nodes: defaultNodes,
  allowDragDrop: true,
  allowMultiSelect: false,
  theme: 'light'
};
Default.parameters = {
  docs: {
    description: {
      story: 'Default configuration of the Node Explorer with drag-and-drop enabled.'
    }
  }
};

// File Explorer Example
export const FileExplorer = Template.bind({});
FileExplorer.args = {
  nodes: fileExplorerNodes,
  allowDragDrop: true,
  allowMultiSelect: false,
  theme: 'light'
};
FileExplorer.parameters = {
  docs: {
    description: {
      story: 'A realistic file explorer example with appropriate icons for different file types.'
    }
  }
};

// Organizational Chart Example
export const OrganizationalChart = Template.bind({});
OrganizationalChart.args = {
  nodes: orgChartNodes,
  allowDragDrop: true,
  allowMultiSelect: false,
  theme: 'light'
};
OrganizationalChart.parameters = {
  docs: {
    description: {
      story: 'An organizational chart showing company structure with person icons.'
    }
  }
};

// Large Dataset Example
export const LargeDataset = Template.bind({});
LargeDataset.args = {
  nodes: largeDataset,
  allowDragDrop: true,
  allowMultiSelect: false,
  theme: 'light'
};
LargeDataset.parameters = {
  docs: {
    description: {
      story: 'Example showing performance with a large dataset (4 levels deep, 5 children per node).'
    }
  }
};

// Lazy Loading Example
export const LazyLoading = Template.bind({});
LazyLoading.args = {
  nodes: lazyLoadedNodes,
  lazyLoad: true, // This flag tells the Template to set up lazy loading handlers
  customId: 'lazy-explorer' // Ensure we have a predictable ID to reference in docs
};
LazyLoading.parameters = {
  docs: {
    description: {
      story: 'Example of lazy-loaded nodes that fetch children on demand for better performance.'
    }
  }
};

// Dark Theme Example
export const DarkTheme = Template.bind({});
DarkTheme.args = {
  nodes: themeExampleNodes,
  allowDragDrop: true,
  allowMultiSelect: false,
  theme: 'dark',
  customCSS: `
    .dark-theme {
      --primary-color: #7B68EE;
      --primary-light: rgba(123, 104, 238, 0.15);
      --gray-light: #23252F;
      --gray-border: #3A3E4C;
      --hover-bg: #2A2D39;
      --text-secondary: #A0AEC0;
      --text-primary: #E2E8F0;
      color: var(--text-primary);
      background-color: #1A1D27;
    }
    
    .dark-theme .node-label {
      color: var(--text-primary);
    }
    
    .dark-theme .expand-toggle {
      color: var(--text-secondary);
    }
    
    .dark-theme .node.selected > .node-header {
      background-color: rgba(123, 104, 238, 0.2);
    }
  `
};
DarkTheme.parameters = {
  docs: {
    description: {
      story: 'Dark theme variant of the Node Explorer component.'
    }
  }
};

// Minimal Theme Example
export const MinimalTheme = Template.bind({});
MinimalTheme.args = {
  nodes: themeExampleNodes,
  allowDragDrop: true,
  allowMultiSelect: false,
  theme: 'minimal',
  customCSS: `
    .minimal-theme {
      --primary-color: #0070f3;
      --primary-light: rgba(0, 112, 243, 0.1);
      --gray-light: transparent;
      --gray-border: transparent;
      --hover-bg: rgba(0, 0, 0, 0.03);
      --connector-width: 1px;
      --connector-color: #ddd;
      --node-padding: 4px 6px;
      --node-margin: 1px 0;
      --node-border-radius: 3px;
    }
    
    .minimal-theme .node-children {
      border-left: var(--connector-width) solid var(--connector-color);
    }
  `
};
MinimalTheme.parameters = {
  docs: {
    description: {
      story: 'A minimalist theme with reduced visual elements and simpler styling.'
    }
  }
};

// High Contrast Theme Example
export const HighContrastTheme = Template.bind({});
HighContrastTheme.args = {
  nodes: themeExampleNodes,
  allowDragDrop: true,
  allowMultiSelect: false,
  theme: 'high-contrast',
  customCSS: `
    .high-contrast-theme {
      --primary-color: #FFD700;
      --primary-light: rgba(255, 215, 0, 0.15);
      --gray-light: #000000;
      --gray-border: #FFFFFF;
      --hover-bg: #333333;
      --text-secondary: #FFFFFF;
      --text-primary: #FFFFFF;
      color: var(--text-primary);
      background-color: #000000;
    }
    
    .high-contrast-theme .node-label {
      color: var(--text-primary);
    }
    
    .high-contrast-theme .node-header:hover {
      background-color: var(--hover-bg);
      outline: 2px solid var(--primary-color);
    }
    
    .high-contrast-theme .node.selected > .node-header {
      background-color: var(--primary-color);
      color: #000000;
    }
  `
};
HighContrastTheme.parameters = {
  docs: {
    description: {
      story: 'High contrast theme for accessibility, with strong color differences for better visibility.'
    }
  }
};

// Disabled Drag-Drop Example
export const DisabledDragDrop = Template.bind({});
DisabledDragDrop.args = {
  nodes: defaultNodes,
  allowDragDrop: false,
  allowMultiSelect: false,
  theme: 'light'
};
DisabledDragDrop.parameters = {
  docs: {
    description: {
      story: 'Node Explorer with drag and drop functionality disabled.'
    }
  }
};

// Multi-Select Enabled Example
export const MultiSelectEnabled = Template.bind({});
MultiSelectEnabled.args = {
  nodes: defaultNodes,
  allowDragDrop: true,
  allowMultiSelect: true,
  theme: 'light'
};
MultiSelectEnabled.parameters = {
  docs: {
    description: {
      story: 'Node Explorer with multi-selection enabled. Use Ctrl/Cmd key to select multiple nodes.'
    }
  }
};