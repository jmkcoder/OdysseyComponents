import  '../../index';

export default {
  title: 'Components/SidebarContainer',
  component: 'sidebar-container',
};

const Template = (args) => {
  const container = document.createElement('sidebar-container');
  container.innerHTML = args.content;

  if (args.theme) {
    container.setAttribute('theme', args.theme);
  }

  if (args.hideDarkMode) {
    container.setAttribute('hide-darkmode', '');
  }

  if (args.collapsible) {
    container.setAttribute('collapsible', 'true');
  }

  if (args.resizable) {
    container.setAttribute('resizable', '');
  }

  if (args.nodes) {
    const nodeExplorer = container.querySelector('odyssey-node-explorer');
    if (nodeExplorer) {
      nodeExplorer.setAttribute('nodes', JSON.stringify(args.nodes));
    }
  }

  return container;
};

export const Default = Template.bind({});
Default.args = {
  content: `
    <div style="padding: 16px;">
      <h3>Sidebar Content</h3>
      <p>This is an example of content inside the sidebar container.</p>
    </div>
  `,
  resizable: false,
  collapsible: false,
  theme: 'light',
  hideDarkMode: false,
};

export const Themed = Template.bind({});
Themed.args = {
  content: `
    <div style="padding: 16px;">
      <h3>Sidebar Content</h3>
      <p>This is an example of content inside the sidebar container.</p>
    </div>
  `,
  theme: 'dark', // Default theme for the story
  hideDarkMode: true,
};

export const Resizable = Template.bind({});
Resizable.args = {
  content: `
    <div style="padding: 16px;">
      <h3>Resizable Sidebar</h3>
      <p>This sidebar can be resized by dragging its edges.</p>
    </div>
  `,
  resizable: true,
};

export const Collapsible = Template.bind({});
Collapsible.args = {
  content: `
    <div style="padding: 16px;">
      <h3>Collapsible Sidebar</h3>
      <p>This sidebar can be collapsed and expanded.</p>
    </div>
  `,
  collapsible: true,
};

export const WithNodeExplorer = Template.bind({});
WithNodeExplorer.args = {
  content: `
    <div style="padding: 16px;">
      <odyssey-node-explorer
        allow-drag-drop="true"
        allow-multi-select="false"
        theme="light"
      ></odyssey-node-explorer>
    </div>
  `,
  nodes: [
    {
      "id": "root",
      "label": "Root Node",
      "icon": "folder",
      "expanded": true,
      "children": [
        {
          "id": "child1",
          "label": "Child Node 1",
          "icon": "folder",
          "expanded": true,
          "children": [
            { "id": "grandchild1", "label": "Grandchild Node 1", "icon": "insert_drive_file" },
            { "id": "grandchild2", "label": "Grandchild Node 2", "icon": "insert_drive_file" }
          ]
        },
        {
          "id": "child2",
          "label": "Child Node 2",
          "icon": "folder",
          "expanded": false,
          "children": [
            { "id": "grandchild3", "label": "Grandchild Node 3", "icon": "insert_drive_file" }
          ]
        }
      ]
    }
  ],
  resizable: true,
};

export const CustomHeaderFooter = Template.bind({});
CustomHeaderFooter.args = {
  content: `
    <header>
      <h1>Custom Header</h1>
    </header>
    <div style="padding: 16px;">
      <p>This is the main content of the sidebar.</p>
    </div>
    <footer>
      <p>Custom Footer</p>
    </footer>
  `,
  theme: 'light',
  hideDarkMode: false,
};

export const ToggleButtonStory = (args) => {
  const container = document.createElement('sidebar-container');
  container.innerHTML = args.content;

  if (args.collapsible) {
    container.setAttribute('collapsible', 'true');
  }

  if (args.collapsed) {
    container.setAttribute('collapsed', '');
  }

  const toggleButton = document.createElement('button');
  toggleButton.textContent = 'Toggle Collapse';
  toggleButton.style.margin = '16px';
  toggleButton.addEventListener('click', () => {
    const isCollapsed = container.hasAttribute('collapsed');
    if (isCollapsed) {
      container.removeAttribute('collapsed');
      container.dispatchEvent(new CustomEvent('expand', { detail: { collapsed: false } }));
    } else {
      container.setAttribute('collapsed', '');
      container.dispatchEvent(new CustomEvent('collapse', { detail: { collapsed: true } }));
    }
  });

  const wrapper = document.createElement('div');
  wrapper.appendChild(toggleButton);
  wrapper.appendChild(container);

  return wrapper;
};

ToggleButtonStory.args = {
  content: `
    <div style="padding: 16px;">
      <h3>Toggle Button Example</h3>
      <p>Use the button below to toggle the sidebar's collapsed state.</p>
    </div>
  `,
  collapsible: true,
  collapsed: false, // Default state for the story
};