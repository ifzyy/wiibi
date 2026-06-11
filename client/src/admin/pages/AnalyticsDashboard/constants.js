/**
 * Design tokens — matches the OMS C object pattern exactly.
 * Every new admin module imports from here for visual consistency.
 */
export const C = {
  // Brand
  amber:       '#FFAA14',
  amberLight:  'rgba(255,170,20,0.12)',
  amberBorder: 'rgba(255,170,20,0.30)',

  // Backgrounds
  bg:          '#F5F5F3',
  surface:     '#FFFFFF',
  surfaceHov:  '#FAFAF8',

  // Text
  ink:         '#1A1A18',
  inkMid:      '#6B6B60',
  inkFaint:    '#B0B0A0',

  // Borders
  border:      '#E8E8E0',
  borderMid:   '#D0D0C8',

  // Status colours
  green:       '#16A34A',
  greenBg:     '#DCFCE7',
  red:         '#DC2626',
  redBg:       '#FEE2E2',
  blue:        '#2563EB',
  blueBg:      '#DBEAFE',
  purple:      '#7C3AED',
  purpleBg:    '#EDE9FE',
  orange:      '#EA580C',
  orangeBg:    '#FFEDD5',

  // Radius
  r:           '10px',
  rSm:         '6px',
  rLg:         '14px',

  // Shadow
  shadow:      '0 1px 3px rgba(0,0,0,0.07), 0 1px 2px rgba(0,0,0,0.04)',
  shadowMd:    '0 4px 16px rgba(0,0,0,0.08)',
  shadowLg:    '0 8px 32px rgba(0,0,0,0.12)',

  // Font
  font:        "Geist, -apple-system, 'Inter', sans-serif",
};

export const STATUS_COLORS = {
  // Payment
  paid:               { bg: '#DCFCE7', text: '#16A34A' },
  unpaid:             { bg: '#FEF9C3', text: '#A16207' },
  failed:             { bg: '#FEE2E2', text: '#DC2626' },
  partially_refunded: { bg: '#DBEAFE', text: '#2563EB' },
  refunded:           { bg: '#EDE9FE', text: '#7C3AED' },

  // Fulfillment
  pending:            { bg: '#FEF9C3', text: '#A16207' },
  processing:         { bg: '#DBEAFE', text: '#2563EB' },
  shipped:            { bg: '#E0F2FE', text: '#0369A1' },
  in_transit:         { bg: '#F0FDF4', text: '#166534' },
  delivered:          { bg: '#DCFCE7', text: '#16A34A' },
  cancelled:          { bg: '#FEE2E2', text: '#DC2626' },

  // Ticket
  open:               { bg: '#DBEAFE', text: '#2563EB' },
  in_progress:        { bg: '#FEF9C3', text: '#A16207' },
  waiting_customer:   { bg: '#FFEDD5', text: '#EA580C' },
  resolved:           { bg: '#DCFCE7', text: '#16A34A' },
  closed:             { bg: '#F3F4F6', text: '#6B7280' },

  // Priority
  low:                { bg: '#F3F4F6', text: '#6B7280' },
  medium:             { bg: '#DBEAFE', text: '#2563EB' },
  high:               { bg: '#FFEDD5', text: '#EA580C' },
  urgent:             { bg: '#FEE2E2', text: '#DC2626' },

  // Solar lead CRM
  new:                { bg: '#DBEAFE', text: '#2563EB' },
  contacted:          { bg: '#FEF9C3', text: '#A16207' },
  converted:          { bg: '#DCFCE7', text: '#16A34A' },
};

export const fmtCurrency = (n, currency = 'NGN') =>
  `₦${parseFloat(n || 0).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const fmtDate = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' });
};

export const fmtDateShort = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' });
};