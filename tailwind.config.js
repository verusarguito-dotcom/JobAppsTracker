/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Executive Dark Theme tokens
        'dark-canvas':              '#0B132B', // Deep midnight slate canvas
        'dark-bg':                  '#0F172A', // Slate-900 background
        'dark-surface':             '#1E293B', // Slate-800 container
        'dark-surface-low':         '#162032', // Surface low container
        'dark-surface-high':        '#27354E', // Surface high container
        'dark-hairline':            '#334155', // Slate-700 hairline / borders
        'dark-border-active':       '#475569', // Slate-600 active border
        'dark-ink':                 '#F8FAFC', // Slate-50 primary text
        'dark-ink-secondary':       '#94A3B8', // Slate-400 secondary text
        'dark-ink-muted':           '#64748B', // Slate-500 muted text

        // Material 3 / Stitch tokens
        'primary':                  '#000000',
        'on-primary':               '#ffffff',
        'primary-container':        '#131b2e',
        'on-primary-container':     '#7c839b',
        'primary-fixed':            '#dae2fd',
        'primary-fixed-dim':        '#bec6e0',
        'on-primary-fixed':         '#131b2e',
        'on-primary-fixed-variant': '#3f465c',
        'secondary':                '#4e45d5',
        'on-secondary':             '#ffffff',
        'secondary-container':      '#6860ef',
        'on-secondary-container':   '#fffbff',
        'secondary-fixed':          '#e3dfff',
        'secondary-fixed-dim':      '#c3c0ff',
        'on-secondary-fixed':       '#100069',
        'on-secondary-fixed-variant':'#372abf',
        'tertiary':                 '#000000',
        'on-tertiary':              '#ffffff',
        'tertiary-container':       '#002114',
        'on-tertiary-container':    '#069669',
        'tertiary-fixed':           '#85f8c4',
        'tertiary-fixed-dim':       '#68dba9',
        'on-tertiary-fixed':        '#002114',
        'on-tertiary-fixed-variant':'#005137',
        'error':                    '#ba1a1a',
        'on-error':                 '#ffffff',
        'error-container':          '#ffdad6',
        'on-error-container':       '#93000a',
        'background':               '#f8f9ff',
        'on-background':            '#0b1c30',
        'surface-dim':              '#cbdbf5',
        'surface-bright':           '#f8f9ff',
        'surface-variant':          '#d3e4fe',
        'surface-container-lowest': '#ffffff',
        'surface-container-low':    '#eff4ff',
        'surface-container':        '#e5eeff',
        'surface-container-high':   '#dce9ff',
        'surface-container-highest':'#d3e4fe',
        'on-surface':               '#0b1c30',
        'on-surface-variant':       '#45464d',
        'inverse-surface':          '#213145',
        'inverse-on-surface':       '#eaf1ff',
        'inverse-primary':          '#bec6e0',
        'outline':                  '#76777d',
        'outline-variant':          '#c6c6cd',
        'surface-tint':             '#565e74',

        // Surface tiers (Slate-based backward compatibility)
        'canvas':          '#F8FAFC', // App background (Slate 50)
        'surface':         '#FFFFFF', // Card / container
        'surface-sub':     '#F1F5F9', // Inactive fill (Slate 100)
        'hairline':        '#E2E8F0', // Layout dividers (Slate 200)
        'border-active':   '#CBD5E1', // Interactive element borders (Slate 300)

        // Text (backward compatibility)
        'ink':             '#0F172A', // Primary text (Slate 900)
        'ink-secondary':   '#475569', // Metadata text (Slate 600)
        'ink-muted':       '#94A3B8', // Placeholder (Slate 400)

        // Semantic status (backward compatibility)
        'status-overdue':         '#BE123C',
        'status-overdue-bg':      '#FFF1F2',
        'status-overdue-border':  '#FECDD3',
        'status-upcoming':        '#B45309',
        'status-upcoming-bg':     '#FFFBEB',
        'status-upcoming-border': '#FDE68A',
        'status-offer':           '#047857',
        'status-offer-bg':        '#ECFDF5',
        'status-offer-border':    '#A7F3D0',
        'status-neutral':         '#475569',
        'status-neutral-bg':      '#F1F5F9',
        'status-neutral-border':  '#E2E8F0',

        // Actions (backward compatibility)
        'action-primary':        '#0F172A',
        'action-primary-hover':  '#1E293B',
        'action-focus':          '#4338CA',
        'action-focus-bg':       '#EEF2FF',
        'action-danger':         '#BE123C',
        'action-danger-bg':      '#FFF1F2',
        'action-danger-border':  '#FECDD3',
      },
      fontFamily: {
        'geist':      ['Geist', 'system-ui', 'sans-serif'],
        'mono-label': ['"JetBrains Mono"', 'monospace'],
        'display':    ['Geist', 'system-ui', 'sans-serif'],
        'headline-lg':['Geist', 'system-ui', 'sans-serif'],
        'headline-md':['Geist', 'system-ui', 'sans-serif'],
        'headline-sm':['Geist', 'system-ui', 'sans-serif'],
        'body-lg':    ['Geist', 'system-ui', 'sans-serif'],
        'body-md':    ['Geist', 'system-ui', 'sans-serif'],
        'body-sm':    ['Geist', 'system-ui', 'sans-serif'],
        'label-md':   ['"JetBrains Mono"', 'monospace'],
        'label-sm':   ['"JetBrains Mono"', 'monospace'],
      },
      fontSize: {
        'display':     ['2.25rem',   { lineHeight: '2.75rem',  letterSpacing: '-0.025em', fontWeight: '600' }],
        'headline-lg': ['1.75rem',   { lineHeight: '2.25rem',  letterSpacing: '-0.02em',  fontWeight: '600' }],
        'headline-md': ['1.25rem',   { lineHeight: '1.625rem', letterSpacing: '-0.015em', fontWeight: '600' }],
        'headline-sm': ['1rem',      { lineHeight: '1.375rem', letterSpacing: '-0.01em',  fontWeight: '600' }],
        'body-lg':     ['1rem',      { lineHeight: '1.5rem',   letterSpacing: '-0.005em', fontWeight: '400' }],
        'body-md':     ['0.875rem',  { lineHeight: '1.375rem', letterSpacing: '0em',      fontWeight: '400' }],
        'body-sm':     ['0.75rem',   { lineHeight: '1.125rem', letterSpacing: '0.005em',  fontWeight: '400' }],
        'label-md':    ['0.75rem',   { lineHeight: '1rem',     letterSpacing: '0.02em',   fontWeight: '500' }],
        'label-sm':    ['0.6875rem', { lineHeight: '0.875rem', letterSpacing: '0.03em',   fontWeight: '500' }],
      },
      borderRadius: {
        DEFAULT: '0.25rem',
        'sm':    '0.125rem',
        'md':    '0.375rem',
        'lg':    '0.5rem',
        'xl':    '0.75rem',
        'full':  '9999px',
      },
      boxShadow: {
        'card':       '0 1px 2px 0 rgba(15,23,42,0.04)',
        'card-hover': '0 1px 3px 0 rgba(15,23,42,0.08)',
        'overlay':    '0 8px 24px -4px rgba(15,23,42,0.08), 0 2px 6px -1px rgba(15,23,42,0.04)',
        'modal':      '0 20px 60px -8px rgba(15,23,42,0.16), 0 4px 12px -2px rgba(15,23,42,0.06)',
      },
      spacing: {
        'xs':  '0.25rem',
        'sm':  '0.5rem',
        'md':  '0.75rem',
        'lg':  '1rem',
        'xl':  '1.5rem',
        'xxl': '2rem',
        'space-xs': '0.25rem',
        'space-sm': '0.5rem',
        'space-md': '0.75rem',
        'space-lg': '1rem',
        'space-xl': '1.5rem',
        'gutter': '1rem',
        'gutter-desktop': '1.5rem',
        'margin': '1rem',
        'margin-desktop': '2rem',
      },
    },
  },
  plugins: [],
};
