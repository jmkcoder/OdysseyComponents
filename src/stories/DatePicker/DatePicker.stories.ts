import { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import  '../../index';

const meta: Meta = {
  title: 'Components/DatePicker',
  component: 'odyssey-date-picker',
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
        mode=${args.mode || 'single'}
        start-date=${args.startDate || ''}
        end-date=${args.endDate || ''}
        events=${args.events ? JSON.stringify(args.events) : ''}
        format=${args.format || ''}
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
    mode: {
      control: 'select',
      options: ['single', 'range'],
      description: 'Date selection mode'
    },
    startDate: {
      control: 'text',
      description: 'Start date of selected range in ISO format'
    },
    endDate: {
      control: 'text',
      description: 'End date of selected range in ISO format'
    },
    events: { 
      control: 'object', 
      description: 'Events to display on specific dates'
    },
    format: {
      control: 'text',
      description: 'Custom date format pattern'
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
    mode: 'single',
    startDate: '',
    endDate: '',
    events: {},
    format: ''
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

// Range Selection mode
export const RangeSelection: Story = {
  args: {
    mode: 'range',
    startDate: '2025-04-15',
    endDate: '2025-04-22'
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
        
        .custom-date-picker .day.today {
          color: var(--today-color);
          font-weight: bold;
        }
        
        .custom-date-picker .day.selected {
          background-color: var(--selected-bg);
        }
        
        .custom-date-picker .day:not(.weekday):hover {
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

// Custom date formatting examples
export const CustomFormats: Story = {
  args: {
    value: '2025-04-26',
    format: 'yyyy-MM-dd'
  },
  argTypes: {
    format: {
      control: 'select',
      options: [
        'yyyy-MM-dd',     // ISO format
        'MM/dd/yyyy',     // US format
        'dd.MM.yyyy',     // European format
        'd MMMM, yyyy',   // Long date format
        'EEE, MMM d, yyyy' // Weekday format
      ],
      description: 'Date display format pattern'
    }
  }
};