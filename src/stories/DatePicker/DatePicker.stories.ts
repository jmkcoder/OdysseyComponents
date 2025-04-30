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
        @date-change=${args.onDateChange}
        @calendar-open=${args.onCalendarOpen}
        @calendar-close=${args.onCalendarClose}
        @date-clear=${args.onDateClear}
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
    },
    onDateChange: { action: 'date-change' },
    onCalendarOpen: { action: 'calendar-open' },
    onCalendarClose: { action: 'calendar-close' },
    onDateClear: { action: 'date-clear' }
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
  },
  parameters: {
    actions: {
      handles: ['date-change', 'calendar-open', 'calendar-close', 'date-clear']
    }
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
  },
  render: (args) => {
    // Actions argument defined in props would be added automatically by Storybook
    return html`
      <div class="event-example-container">
        <h3>DatePicker with Event Indicators</h3>
        <ul>
          <li><strong>Apr 15, 2025:</strong> Meeting</li>
          <li><strong>Apr 22, 2025:</strong> Important deadline, Call with client</li>
          <li><strong>Apr 30, 2025:</strong> End of month report</li>
        </ul>
        
        <odyssey-date-picker
          id="event-demo-picker"
          value=${args.value || ''}
          events=${JSON.stringify(args.events)}
          @date-change=${args.onDateChange}
          @calendar-open=${args.onCalendarOpen}
          @calendar-close=${args.onCalendarClose}
          @date-clear=${args.onDateClear}
        ></odyssey-date-picker>
      </div>
      </script>

      <style>
        .event-example-container {
          padding: 16px;
          max-width: 500px;
        }
        
        .event-example-container h3 {
          margin-top: 0;
          margin-bottom: 8px;
        }
        
        .event-example-container p {
          margin-bottom: 12px;
        }
        
        .event-example-container ul {
          margin-bottom: 20px;
          padding-left: 20px;
        }
      </style>
    `;
  },
  argTypes: {
    onDateChange: { action: 'date-change' },
    onCalendarOpen: { action: 'calendar-open' },
    onCalendarClose: { action: 'calendar-close' },
    onDateClear: { action: 'date-clear' }
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows event indicators on specific dates with color-coded dots and tooltips on hover. Events are displayed in the Actions panel when dates are selected or cleared.'
      }
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

// Custom input examples
export const CustomInputs: Story = {
  args: {
    value: '2025-04-26',
  },
  render: () => {
    return html`
      <style>
        .custom-inputs-container {
          display: flex;
          flex-direction: column;
          gap: 24px;
          max-width: 500px;
        }
        
        .example-wrapper {
          margin-bottom: 12px;
        }
        
        .input-example-title {
          font-weight: bold;
          margin-bottom: 8px;
          color: #333;
        }
        
        .styled-input {
          width: 100%;
          padding: 10px 15px;
          border: 2px solid #8b5cf6;
          border-radius: 8px;
          font-size: 14px;
          background-color: #f3f4f6;
          transition: all 0.3s ease;
        }
        
        .styled-input:focus {
          outline: none;
          box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.3);
        }
        
        .material-input {
          width: 100%;
          padding: 12px;
          border: none;
          border-bottom: 2px solid #9ca3af;
          font-size: 14px;
          background-color: transparent;
          transition: all 0.3s ease;
        }
        
        .material-input:focus {
          outline: none;
          border-bottom-color: #3b82f6;
        }
        
        .rounded-input {
          width: 100%;
          padding: 12px 20px;
          border: 1px solid #e5e7eb;
          border-radius: 50px;
          font-size: 14px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
          transition: all 0.3s ease;
        }
        
        .rounded-input:focus {
          outline: none;
          border-color: #10b981;
          box-shadow: 0 2px 8px rgba(16, 185, 129, 0.25);
        }
        
        .dark-input {
          width: 100%;
          padding: 12px;
          border: 1px solid #4b5563;
          border-radius: 6px;
          font-size: 14px;
          background-color: #1f2937;
          color: #e5e7eb;
          transition: all 0.3s ease;
        }
        
        .dark-input:focus {
          outline: none;
          border-color: #60a5fa;
          box-shadow: 0 0 0 3px rgba(96, 165, 250, 0.3);
        }
        
        .icon-slot-example {
          --date-picker-text-color: #4b5563;
          --date-picker-border-color: #e5e7eb;
          --date-picker-selected-bg-color: #3b82f6;
          margin-top: 30px;
        }
      </style>
      
      <div class="custom-inputs-container">
        <div class="example-wrapper">
          <p class="input-example-title">Purple Styled Input:</p>
          <odyssey-date-picker format="MM/dd/yyyy" value="2025-04-26">
            <input type="text" slot="input" class="styled-input" placeholder="Choose a date...">
          </odyssey-date-picker>
        </div>
        
        <div class="example-wrapper">
          <p class="input-example-title">Material Design Style:</p>
          <odyssey-date-picker format="d MMMM, yyyy" value="2025-04-26">
            <input type="text" slot="input" class="material-input" placeholder="Select date">
          </odyssey-date-picker>
        </div>
        
        <div class="example-wrapper">
          <p class="input-example-title">Rounded with Green Accents:</p>
          <odyssey-date-picker format="EEE, MMM d, yyyy" value="2025-04-26">
            <input type="text" slot="input" class="rounded-input" placeholder="Pick a date">
          </odyssey-date-picker>
        </div>
        
        <div class="example-wrapper">
          <p class="input-example-title">Dark Theme Input:</p>
          <odyssey-date-picker theme="dark" value="2025-04-26">
            <input type="text" slot="input" class="dark-input" placeholder="Select date">
          </odyssey-date-picker>
        </div>
        
        <div class="example-wrapper icon-slot-example">
          <p class="input-example-title">Default Input (For Comparison):</p>
          <odyssey-date-picker value="2025-04-26"></odyssey-date-picker>
        </div>
      </div>
    `;
  },
  parameters: {
    docs: {
      description: {
        story: 'Examples of date pickers with custom slotted inputs. The component maintains calendar functionality and icon placement while allowing completely custom input styling.'
      }
    }
  }
};