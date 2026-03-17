import { createTheme } from '@mui/material/styles';

/**
 * Elderly-friendly theme with:
 * - Large text sizes (18px+ base, 24px+ headings)
 * - High contrast colors
 * - Large touch targets (48px+ buttons)
 * - Clear visual hierarchy
 */
export const elderlyTheme = createTheme({
  palette: {
    primary: {
      main: '#1976d2', // Blue - easy to see
      dark: '#115293',
      light: '#42a5f5',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#4caf50', // Green - for success states
      dark: '#388e3c',
      light: '#66bb6a',
      contrastText: '#ffffff',
    },
    error: {
      main: '#d32f2f', // Red - for errors
      dark: '#c62828',
      light: '#ef5350',
    },
    warning: {
      main: '#ff9800', // Orange - for warnings
    },
    info: {
      main: '#2196f3', // Blue - for info
    },
    success: {
      main: '#4caf50', // Green - for success
    },
    background: {
      default: '#ffffff',
      paper: '#f5f5f5',
    },
    text: {
      primary: '#212121', // Almost black - high contrast
      secondary: '#424242',
    },
  },
  typography: {
    fontFamily: [
      'system-ui',
      '-apple-system',
      'Roboto',
      'Segoe UI',
      'Arial',
      'sans-serif',
    ].join(','),
    fontSize: 18, // Base font size - larger than default 14px
    h1: {
      fontSize: '3rem', // 48px
      fontWeight: 600,
      lineHeight: 1.2,
      color: '#212121',
    },
    h2: {
      fontSize: '2.5rem', // 40px
      fontWeight: 600,
      lineHeight: 1.3,
      color: '#212121',
    },
    h3: {
      fontSize: '2rem', // 32px
      fontWeight: 600,
      lineHeight: 1.4,
      color: '#212121',
    },
    h4: {
      fontSize: '1.75rem', // 28px
      fontWeight: 600,
      lineHeight: 1.4,
      color: '#212121',
    },
    h5: {
      fontSize: '1.5rem', // 24px
      fontWeight: 500,
      lineHeight: 1.5,
      color: '#212121',
    },
    h6: {
      fontSize: '1.25rem', // 20px
      fontWeight: 500,
      lineHeight: 1.5,
      color: '#212121',
    },
    body1: {
      fontSize: '1.125rem', // 18px
      lineHeight: 1.6,
    },
    body2: {
      fontSize: '1rem', // 16px
      lineHeight: 1.6,
    },
    button: {
      fontSize: '1.125rem', // 18px
      fontWeight: 600,
      textTransform: 'none', // Don't uppercase buttons
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          minHeight: 48, // Large touch target
          minWidth: 120,
          padding: '12px 24px',
          fontSize: '1.125rem', // 18px
          borderRadius: 8,
        },
        sizeLarge: {
          minHeight: 56,
          padding: '16px 32px',
          fontSize: '1.25rem', // 20px
        },
        sizeMedium: {
          minHeight: 48,
          padding: '12px 24px',
          fontSize: '1.125rem', // 18px
        },
        sizeSmall: {
          minHeight: 40,
          padding: '8px 16px',
          fontSize: '1rem', // 16px
        },
      },
      defaultProps: {
        disableElevation: false,
        variant: 'contained',
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          padding: 12,
          '& .MuiSvgIcon-root': {
            fontSize: '2rem', // 32px - larger icons
          },
        },
        sizeLarge: {
          padding: 16,
          '& .MuiSvgIcon-root': {
            fontSize: '2.5rem', // 40px
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiInputBase-root': {
            fontSize: '1.125rem', // 18px
          },
          '& .MuiInputLabel-root': {
            fontSize: '1.125rem', // 18px
          },
        },
      },
      defaultProps: {
        variant: 'outlined',
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        },
      },
    },
    MuiCardContent: {
      styleOverrides: {
        root: {
          padding: 24,
          '&:last-child': {
            paddingBottom: 24,
          },
        },
      },
    },
    MuiTypography: {
      defaultProps: {
        variantMapping: {
          h1: 'h1',
          h2: 'h2',
          h3: 'h3',
          h4: 'h4',
          h5: 'h5',
          h6: 'h6',
          subtitle1: 'h6',
          subtitle2: 'h6',
          body1: 'p',
          body2: 'p',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontSize: '1rem', // 16px
          height: 36,
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          fontSize: '1.125rem', // 18px
          padding: '12px 16px',
        },
      },
    },
  },
  spacing: 8, // Default spacing unit
});
