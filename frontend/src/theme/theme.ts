import { createTheme } from '@mui/material/styles';

// Warm editorial palette — parchment, ink, aged gold
export const COLORS = {
  ink:        '#1C1917',   // deep warm black
  inkLight:   '#44403C',   // secondary text
  inkFaint:   '#78716C',   // muted text
  parchment:  '#FDFAF5',   // page background
  cream:      '#F5EFE6',   // card background
  gold:       '#B45309',   // amber accent (primary actions)
  goldLight:  '#D97706',   // hover gold
  goldPale:   '#FEF3C7',   // pale amber tint
  sage:       '#4A7C59',   // success green
  sagePale:   '#DCFCE7',
  rose:       '#BE123C',   // error
  rosePale:   '#FFE4E6',
  border:     '#E7E0D6',   // warm grey border
  divider:    '#EDE8E0',
};

export const elderlyTheme = createTheme({
  palette: {
    primary: {
      main: COLORS.gold,
      dark: '#92400E',
      light: COLORS.goldLight,
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: COLORS.sage,
      dark: '#166534',
      light: '#6EE7B7',
      contrastText: '#FFFFFF',
    },
    error: {
      main: COLORS.rose,
      light: '#FB7185',
    },
    warning: {
      main: '#D97706',
    },
    success: {
      main: COLORS.sage,
    },
    background: {
      default: COLORS.parchment,
      paper: COLORS.cream,
    },
    text: {
      primary: COLORS.ink,
      secondary: COLORS.inkLight,
      disabled: COLORS.inkFaint,
    },
    divider: COLORS.divider,
  },
  typography: {
    fontFamily: ['"DM Sans"', 'system-ui', 'sans-serif'].join(','),
    fontSize: 17,
    h1: {
      fontFamily: '"Playfair Display", Georgia, serif',
      fontSize: '3.25rem',
      fontWeight: 700,
      lineHeight: 1.15,
      color: COLORS.ink,
      letterSpacing: '-0.02em',
    },
    h2: {
      fontFamily: '"Playfair Display", Georgia, serif',
      fontSize: '2.5rem',
      fontWeight: 700,
      lineHeight: 1.2,
      color: COLORS.ink,
      letterSpacing: '-0.015em',
    },
    h3: {
      fontFamily: '"Playfair Display", Georgia, serif',
      fontSize: '2rem',
      fontWeight: 600,
      lineHeight: 1.3,
      color: COLORS.ink,
      letterSpacing: '-0.01em',
    },
    h4: {
      fontFamily: '"Playfair Display", Georgia, serif',
      fontSize: '1.625rem',
      fontWeight: 600,
      lineHeight: 1.35,
      color: COLORS.ink,
    },
    h5: {
      fontFamily: '"Playfair Display", Georgia, serif',
      fontSize: '1.35rem',
      fontWeight: 600,
      lineHeight: 1.4,
      color: COLORS.ink,
    },
    h6: {
      fontFamily: '"DM Sans", sans-serif',
      fontSize: '1.1rem',
      fontWeight: 500,
      lineHeight: 1.5,
      color: COLORS.inkLight,
      letterSpacing: '0.01em',
    },
    body1: {
      fontSize: '1.0625rem',
      lineHeight: 1.7,
      color: COLORS.ink,
    },
    body2: {
      fontSize: '0.9375rem',
      lineHeight: 1.65,
      color: COLORS.inkLight,
    },
    button: {
      fontSize: '1rem',
      fontWeight: 500,
      textTransform: 'none',
      letterSpacing: '0.01em',
    },
    caption: {
      fontFamily: '"DM Mono", monospace',
      fontSize: '0.8125rem',
      color: COLORS.inkFaint,
      letterSpacing: '0.03em',
    },
  },
  shape: {
    borderRadius: 6,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: COLORS.parchment,
          backgroundImage: `
            radial-gradient(ellipse at 20% 50%, rgba(180,83,9,0.04) 0%, transparent 60%),
            radial-gradient(ellipse at 80% 20%, rgba(74,124,89,0.03) 0%, transparent 50%)
          `,
          minHeight: '100vh',
        },
        '::selection': {
          backgroundColor: COLORS.goldPale,
          color: COLORS.ink,
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          minHeight: 48,
          minWidth: 100,
          padding: '11px 24px',
          borderRadius: 6,
          fontWeight: 500,
          fontSize: '1rem',
          transition: 'all 0.18s ease',
          boxShadow: 'none',
          '&:hover': { boxShadow: 'none' },
        },
        contained: {
          backgroundColor: COLORS.gold,
          color: '#fff',
          border: `1px solid ${COLORS.gold}`,
          '&:hover': {
            backgroundColor: '#92400E',
            borderColor: '#92400E',
          },
        },
        outlined: {
          borderColor: COLORS.border,
          color: COLORS.inkLight,
          backgroundColor: 'transparent',
          '&:hover': {
            backgroundColor: COLORS.cream,
            borderColor: COLORS.inkFaint,
          },
        },
        text: {
          color: COLORS.gold,
          '&:hover': { backgroundColor: COLORS.goldPale },
        },
        sizeLarge: {
          minHeight: 54,
          padding: '14px 32px',
          fontSize: '1.0625rem',
        },
        sizeSmall: {
          minHeight: 38,
          padding: '7px 16px',
          fontSize: '0.9rem',
        },
      },
      defaultProps: { disableElevation: true },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          color: COLORS.inkFaint,
          transition: 'all 0.15s ease',
          '&:hover': {
            backgroundColor: COLORS.cream,
            color: COLORS.ink,
          },
          '& .MuiSvgIcon-root': { fontSize: '1.5rem' },
        },
        sizeLarge: {
          '& .MuiSvgIcon-root': { fontSize: '1.75rem' },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: COLORS.cream,
          border: `1px solid ${COLORS.border}`,
          borderRadius: 10,
          boxShadow: '0 1px 4px rgba(28,25,23,0.06), 0 4px 16px rgba(28,25,23,0.04)',
          transition: 'box-shadow 0.2s ease, transform 0.2s ease',
        },
      },
    },
    MuiCardContent: {
      styleOverrides: {
        root: {
          padding: 24,
          '&:last-child': { paddingBottom: 24 },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            fontSize: '1.0625rem',
            backgroundColor: '#FFFDF9',
            borderRadius: 6,
            '& fieldset': { borderColor: COLORS.border },
            '&:hover fieldset': { borderColor: COLORS.inkFaint },
            '&.Mui-focused fieldset': { borderColor: COLORS.gold, borderWidth: 1.5 },
          },
          '& .MuiInputLabel-root': {
            fontSize: '1rem',
            color: COLORS.inkFaint,
            '&.Mui-focused': { color: COLORS.gold },
          },
        },
      },
      defaultProps: { variant: 'outlined' },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontSize: '0.875rem',
          height: 30,
          borderRadius: 4,
          fontFamily: '"DM Mono", monospace',
          letterSpacing: '0.02em',
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          fontSize: '1rem',
          borderRadius: 6,
          padding: '10px 16px',
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          backgroundColor: COLORS.parchment,
          backgroundImage: 'none',
          border: `1px solid ${COLORS.border}`,
          borderRadius: 12,
          boxShadow: '0 24px 64px rgba(28,25,23,0.18)',
        },
      },
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: {
          fontFamily: '"Playfair Display", Georgia, serif',
          fontSize: '1.4rem',
          fontWeight: 600,
          color: COLORS.ink,
          padding: '24px 28px 12px',
        },
      },
    },
    MuiDialogContent: {
      styleOverrides: {
        root: { padding: '12px 28px 20px' },
      },
    },
    MuiDialogActions: {
      styleOverrides: {
        root: {
          padding: '16px 28px 24px',
          gap: 8,
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        root: {
          '& .MuiTabs-indicator': {
            backgroundColor: COLORS.gold,
            height: 2,
          },
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          fontSize: '1rem',
          fontWeight: 400,
          color: COLORS.inkFaint,
          minHeight: 56,
          textTransform: 'none',
          letterSpacing: 0,
          '&.Mui-selected': {
            color: COLORS.gold,
            fontWeight: 500,
          },
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: {
          borderRadius: 3,
          backgroundColor: COLORS.border,
          height: 6,
        },
        bar: { borderRadius: 3, backgroundColor: COLORS.gold },
      },
    },
    MuiCircularProgress: {
      styleOverrides: {
        root: { color: COLORS.gold },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: { borderColor: COLORS.divider },
      },
    },
    MuiBreadcrumbs: {
      styleOverrides: {
        root: {
          '& .MuiBreadcrumbs-separator': { color: COLORS.border },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: COLORS.cream,
          backgroundImage: 'none',
        },
      },
    },
  },
  spacing: 8,
});
