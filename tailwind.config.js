/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Surface tiers (Slate-based)
        'canvas':          '#F8FAFC', // App background (Slate 50)
        'surface':         '#FFFFFF', // Card / container
        'surface-sub':     '#F1F5F9', // Inactive fill (Slate 100)
        'hairline':        '#E2E8F0', // Layout dividers (Slate 200)
        'border-active':   '#CBD5E1', // Interactive element borders (Slate 300)
        // Text
        'ink':             '#0F172A', // Primary text (Slate 900)
        'ink-secondary':   '#475569', // Metadata text (Slate 600)
        'ink-muted':       '#94A3B8', // Placeholder (Slate 400)
        // Semantic status
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
        // Actions
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
        'md':    '0.375rem',
        'lg':    '0.5rem',
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
      },
    },
  },
  plugins: [],
};
