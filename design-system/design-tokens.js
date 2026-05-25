const tokens = {
  color: {
    // Backgrounds
    bg: {
      base:    '#F5F5F5',
      surface: '#FFFFFF',
      subtle:  '#EBEBEB',
      muted:   '#DCDCDC',
    },

    // Text
    text: {
      primary:   '#0D0D0D',
      secondary: '#525252',
      tertiary:  '#8C8C8C',
      inverse:   '#FFFFFF',
      link:      '#FF611A',
    },

    // Accent — Swiss orange
    accent: {
      DEFAULT: '#FF611A',
      hover:   '#E8551A',
      active:  '#CC4A15',
      subtle:  '#FFF0E8',
      muted:   '#FFBDA0',
    },

    // Borders
    border: {
      subtle:  '#E0E0E0',
      DEFAULT: '#C0C0C0',
      strong:  '#7A7A7A',
    },

    // Semantic status
    success: {
      bg:      '#F0F7F2',
      text:    '#1A6B3A',
      DEFAULT: '#1E8A3D',
    },
    warning: {
      bg:      '#FFF9E6',
      text:    '#9A5E00',
      DEFAULT: '#D48000',
    },
    error: {
      bg:      '#FEF2F2',
      text:    '#C42020',
      DEFAULT: '#E53535',
    },

    // Overlays
    overlay: {
      subtle: 'rgba(0, 0, 0, 0.04)',
      modal:  'rgba(0, 0, 0, 0.56)',
    },
  },

  // ─────────────────────────────────────────
  // Typography — Geist Mono
  // ─────────────────────────────────────────
  font: {
    family: {
      sans: "'Geist Mono', ui-monospace, monospace",
      mono: "'Geist Mono', ui-monospace, monospace",
    },
    weight: {
      regular:  400,
      medium:   500,
      semibold: 600,
    },
    scale: {
      display: { size: '56px', lineHeight: '64px', letterSpacing: '-0.03em',  weight: 400 },
      h1:      { size: '40px', lineHeight: '44px', letterSpacing: '-0.025em', weight: 400 },
      h2:      { size: '32px', lineHeight: '36px', letterSpacing: '-0.02em',  weight: 400 },
      h3:      { size: '24px', lineHeight: '28px', letterSpacing: '-0.015em', weight: 400 },
      bodyLg:  { size: '18px', lineHeight: '24px', letterSpacing: '-0.01em',  weight: 400 },
      body:    { size: '16px', lineHeight: '24px', letterSpacing: '-0.005em', weight: 400 },
      bodySm:  { size: '13px', lineHeight: '18px', letterSpacing: '0em',      weight: 400 },
      caption: { size: '12px', lineHeight: '16px', letterSpacing: '0.01em',   weight: 400 },
      label:   { size: '11px', lineHeight: '14px', letterSpacing: '0.06em',   weight: 500 },
    },
  },

  // ─────────────────────────────────────────
  // Spacing — 4px base unit
  // ─────────────────────────────────────────
  space: {
    1:  '4px',
    2:  '8px',
    3:  '12px',
    4:  '16px',
    5:  '20px',
    6:  '24px',
    8:  '32px',
    10: '40px',
    12: '48px',
    16: '64px',
    20: '80px',
    24: '96px',
    32: '128px',
  },

  // ─────────────────────────────────────────
  // Border radius — sharp corners by default
  // ─────────────────────────────────────────
  radius: {
    sm:   '0px',
    md:   '0px',
    lg:   '0px',
    xl:   '0px',
    '2xl':'0px',
    full: '9999px',
  },

  // ─────────────────────────────────────────
  // Shadows
  // ─────────────────────────────────────────
  shadow: {
    xs: '0 1px 2px rgba(0, 0, 0, 0.05)',
    sm: '0 1px 3px rgba(0, 0, 0, 0.07), 0 1px 2px rgba(0, 0, 0, 0.04)',
    md: '0 4px 8px rgba(0, 0, 0, 0.06), 0 2px 4px rgba(0, 0, 0, 0.04)',
    lg: '0 12px 24px rgba(0, 0, 0, 0.08), 0 4px 8px rgba(0, 0, 0, 0.04)',
  },

  // ─────────────────────────────────────────
  // Transitions
  // ─────────────────────────────────────────
  transition: {
    fast:   '150ms ease-out',
    normal: '200ms ease-out',
    slow:   '300ms ease-out',
  },

  // ─────────────────────────────────────────
  // Z-index
  // ─────────────────────────────────────────
  zIndex: {
    base:     0,
    raised:   1,
    dropdown: 100,
    sticky:   200,
    modal:    300,
    toast:    400,
  },
};

module.exports = tokens;
