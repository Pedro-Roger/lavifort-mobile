export const colors = {
  brand: {
    50: '#f0f9ff',
    100: '#e0f2fe',
    200: '#bae6fd',
    300: '#7dd3fc',
    400: '#38bdf8',
    500: '#0ea5e9',
    600: '#0284c7',
    700: '#0369a1',
    800: '#075985',
    900: '#0c4a6e',
  },
  neutral: {
    background: '#fcfcfd',
    surface: '#ffffff',
    surfaceSubtle: '#f8fafc',
    border: '#e5e7eb',
    borderSubtle: '#f1f5f9',
    textPrimary: '#0f172a',
    textSecondary: '#64748b',
    textMuted: '#94a3b8',
    white: '#ffffff',
    black: '#000000',
  },
  status: {
    BACKLOG: {
      bg: '#f1f5f9',
      text: '#475569',
      border: '#cbd5e1',
      label: 'Backlog',
    },
    EM_ANDAMENTO: {
      bg: '#e0f2fe',
      text: '#0369a1',
      border: '#7dd3fc',
      label: 'Em Andamento',
    },
    EM_REVISAO: {
      bg: '#fef3c7',
      text: '#b45309',
      border: '#fcd34d',
      label: 'Em Revisão',
    },
    CONCLUIDO: {
      bg: '#d1fae5',
      text: '#047857',
      border: '#6ee7b7',
      label: 'Concluído',
    },
  },
  priority: {
    BAIXA: {
      bg: '#f1f5f9',
      text: '#475569',
      border: '#cbd5e1',
      label: 'Baixa',
    },
    MEDIA: {
      bg: '#fef3c7',
      text: '#b45309',
      border: '#fcd34d',
      label: 'Média',
    },
    ALTA: {
      bg: '#fee2e2',
      text: '#b91c1c',
      border: '#fca5a5',
      label: 'Alta',
    },
    URGENTE: {
      bg: '#fef2f2',
      text: '#991b1b',
      border: '#f87171',
      label: 'Urgente',
    },
  },
  sync: {
    synced: '#10b981',
    syncing: '#0284c7',
    offline: '#f59e0b',
    error: '#ef4444',
  },
} as const;

export const spacing = {
  none: 0,
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
} as const;

export const radii = {
  none: 0,
  xs: 2,
  /** Pequenos detalhes (ex.: barras de progresso). */
  sm: 4,
  /** PADRÃO: cards, botões, inputs, modais, painéis, listas. */
  md: 6,
  /** Máximo para badges, chips e pills. */
  lg: 8,
  /** Alias para pills/chips (mesmo valor de lg). */
  pill: 8,
  /** APENAS elementos naturalmente circulares: avatares, dots, radios, ícones em círculo. */
  full: 9999,
} as const;

export const typography = {
  fontSizes: {
    xs: 11,
    sm: 13,
    base: 15,
    lg: 17,
    xl: 20,
    '2xl': 24,
    '3xl': 28,
  },
  fontWeights: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
  lineHeights: {
    xs: 14,
    sm: 18,
    base: 22,
    lg: 24,
    xl: 28,
    '2xl': 32,
    '3xl': 36,
  },
} as const;

export const minTouchTarget = 44;
