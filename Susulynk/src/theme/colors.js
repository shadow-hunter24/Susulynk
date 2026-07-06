// Susulynk Brand Colors

export const LightColors = {
  primary:        '#1A6B3C',
  primaryLight:   '#2E9E5B',
  primaryDark:    '#0F4525',
  secondary:      '#F5A623',
  secondaryLight: '#FFC85A',
  background:     '#F5F7FA',
  surface:        '#FFFFFF',
  textPrimary:    '#1A1A2E',
  textSecondary:  '#6B7280',
  textMuted:      '#9CA3AF',
  border:         '#E5E7EB',
  success:        '#22C55E',
  error:          '#EF4444',
  warning:        '#F59E0B',
  info:           '#3B82F6',
  white:          '#FFFFFF',
  black:          '#000000',
  overlay:        'rgba(0,0,0,0.5)',
};

export const DarkColors = {
  primary:        '#2ECC71',       // brighter green — readable on dark bg
  primaryLight:   '#48D98A',
  primaryDark:    '#1A9E55',
  secondary:      '#F5A623',
  secondaryLight: '#FFC85A',
  background:     '#0F1117',       // near-black page background
  surface:        '#1C1F26',       // card / surface
  textPrimary:    '#F1F5F9',       // almost white
  textSecondary:  '#94A3B8',
  textMuted:      '#64748B',
  border:         '#2D3340',
  success:        '#22C55E',
  error:          '#F87171',
  warning:        '#FBBF24',
  info:           '#60A5FA',
  white:          '#FFFFFF',
  black:          '#000000',
  overlay:        'rgba(0,0,0,0.7)',
};

// Static export kept for files that have not yet been migrated (auth screens etc.)
export const Colors = LightColors;
export default Colors;
