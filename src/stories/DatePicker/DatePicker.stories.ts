import { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import  '../../index';

const meta: Meta = {
  title: 'Components/DatePicker',
  component: 'odyssey-date-picker',
  tags: ['autodocs'],
  render: (args) => {
    return html`
      <odyssey-date-picker
        ?disabled=${args.disabled}
        ?required=${args.required}
        value=${args.value || ''}
        min-date=${args.minDate || ''}
        max-date=${args.maxDate || ''}
        locale=${args.locale || ''}
        first-day-of-week=${args.firstDayOfWeek || '0'}
        theme=${args.theme || ''}
        events=${args.events ? JSON.stringify(args.events) : ''}
      ></odyssey-date-picker>
    `;
  },
  argTypes: {
    disabled: { control: 'boolean' },
    required: { control: 'boolean' },
    value: { control: 'text', description: 'Date in ISO format (YYYY-MM-DD)' },
    minDate: { control: 'text', description: 'Minimum allowed date in ISO format' },
    maxDate: { control: 'text', description: 'Maximum allowed date in ISO format' },
    locale: { 
      control: 'select',
      options: ['en-US', 'fr-FR', 'es-ES', 'de-DE', 'ja-JP', 'zh-CN', 'ar-EG'],
      description: 'Locale for date formatting'
    },
    firstDayOfWeek: { 
      control: 'select',
      options: ['0', '1', '6'],
      description: 'First day of week (0: Sunday, 1: Monday, 6: Saturday)'
    },
    theme: {
      control: 'select',
      options: ['light', 'dark', 'minimal', 'high-contrast'],
      description: 'Visual theme for the component'
    },
    events: { 
      control: 'object', 
      description: 'Events to display on specific dates'
    }
  },
  args: {
    disabled: false,
    required: false,
    value: '',
    minDate: '',
    maxDate: '',
    locale: 'en-US',
    firstDayOfWeek: '0',
    theme: 'light',
    events: {}
  }
};

export default meta;
type Story = StoryObj;

// Basic example
export const Default: Story = {
  args: {
    value: '2025-04-22'
  }
};

// Disabled state
export const Disabled: Story = {
  args: {
    value: '2025-04-22',
    disabled: true
  }
};

// Required state
export const Required: Story = {
  args: {
    required: true
  }
};

// With date range limits
export const WithDateRange: Story = {
  args: {
    minDate: '2025-04-10',
    maxDate: '2025-05-15'
  }
};

// Different locale
export const FrenchLocale: Story = {
  args: {
    locale: 'fr-FR',
    value: '2025-04-22'
  }
};

// Week starting on Monday
export const MondayStart: Story = {
  args: {
    firstDayOfWeek: '1',
    value: '2025-04-22'
  }
};

// Dark theme
export const DarkTheme: Story = {
  args: {
    theme: 'dark',
    value: '2025-04-22'
  },
  parameters: {
    backgrounds: { default: 'dark' }
  }
};

// With events
export const WithEvents: Story = {
  args: {
    value: '2025-04-22',
    events: {
      '2025-04-15': ['Meeting'],
      '2025-04-22': ['Important deadline', 'Call with client'],
      '2025-04-30': ['End of month report']
    }
  }
};

// Custom styled example
export const CustomStyled: Story = {
  args: {
    value: '2025-04-22'
  },
  render: (args) => {
    return html`
      <style>
        .custom-date-picker {
          --input-border-radius: 20px;
          --calendar-background: #f8f9fa;
          --calendar-border: 1px solid #ddd;
          --selected-bg: #4a6da7;
          --today-color: #d03535;
          --day-hover-bg: #eaeaea;
        }
        
        /* Light DOM styling - direct access to component's internal elements */
        .custom-date-picker .date-picker-input {
          border: 2px solid #4a6da7;
          padding: 12px 15px;
          border-radius: var(--input-border-radius);
          font-family: 'Arial', sans-serif;
        }
        
        .custom-date-picker .date-picker-dialog {
          background: var(--calendar-background);
          border: var(--calendar-border);
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }
        
        .custom-date-picker .date-picker-cell.today {
          color: var(--today-color);
          font-weight: bold;
        }
        
        .custom-date-picker .date-picker-cell.selected {
          background-color: var(--selected-bg);
        }
        
        .custom-date-picker .date-picker-cell:not(.weekday):hover {
          background-color: var(--day-hover-bg);
        }
      </style>
      <odyssey-date-picker 
        class="custom-date-picker"
        ?disabled=${args.disabled}
        ?required=${args.required}
        value=${args.value || ''}
        min-date=${args.minDate || ''}
        max-date=${args.maxDate || ''}
        locale=${args.locale || ''}
        first-day-of-week=${args.firstDayOfWeek || '0'}
      ></odyssey-date-picker>
    `;
  }
};