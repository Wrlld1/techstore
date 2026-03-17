import { createTheme, ThemeOptions } from '@mui/material/styles';

const getTheme = () => {
  const options: ThemeOptions = {
    palette: {
      mode: 'light',
      primary: {
        main: '#2563EB',
        light: '#60A5FA',
        dark: '#1D4ED8',
      },
      secondary: {
        main: '#7C3AED',
        light: '#A78BFA',
        dark: '#5B21B6',
      },
      error: { main: '#EF4444' },
      warning: { main: '#F59E0B' },
      success: { main: '#10B981' },
      info: { main: '#06B6D4' },
      background: {
        default: '#F8FAFC',
        paper: '#FFFFFF',
      },
      text: {
        primary: '#1E293B',
        secondary: '#64748B',
      },
      divider: '#E2E8F0',
    },
    typography: {
      fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
      h1: { fontWeight: 700, fontSize: '2.5rem' },
      h2: { fontWeight: 700, fontSize: '2rem' },
      h3: { fontWeight: 600, fontSize: '1.5rem' },
      h4: { fontWeight: 600, fontSize: '1.25rem' },
      h5: { fontWeight: 600, fontSize: '1.1rem' },
      h6: { fontWeight: 600, fontSize: '1rem' },
      button: { textTransform: 'none', fontWeight: 600 },
    },
    shape: {
      borderRadius: 12,
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          '@keyframes fadeInUp': {
            from: { opacity: 0, transform: 'translateY(20px)' },
            to: { opacity: 1, transform: 'translateY(0)' },
          },
          '@keyframes fadeIn': {
            from: { opacity: 0 },
            to: { opacity: 1 },
          },
          '@keyframes slideInRight': {
            from: { opacity: 0, transform: 'translateX(20px)' },
            to: { opacity: 1, transform: 'translateX(0)' },
          },
          '@keyframes bounceIn': {
            '0%': { transform: 'scale(0.3)', opacity: 0 },
            '50%': { transform: 'scale(1.05)' },
            '70%': { transform: 'scale(0.9)' },
            '100%': { transform: 'scale(1)', opacity: 1 },
          },
          '::-webkit-scrollbar': { width: 8 },
          '::-webkit-scrollbar-track': {
            background: '#F1F5F9',
          },
          '::-webkit-scrollbar-thumb': {
            background: '#CBD5E1',
            borderRadius: 4,
          },
          '::-webkit-scrollbar-thumb:hover': {
            background: '#94A3B8',
          },
          '::selection': {
            background: '#2563EB',
            color: '#fff',
          },
          body: {
            scrollBehavior: 'smooth',
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 10,
            padding: '10px 24px',
            transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:active': { transform: 'scale(0.97)' },
          },
          contained: {
            boxShadow: 'none',
            '&:hover': {
              boxShadow: '0 4px 16px rgba(37, 99, 235, 0.35)',
              transform: 'translateY(-1px)',
            },
          },
          outlined: {
            '&:hover': { transform: 'translateY(-1px)' },
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 16,
            border: '1px solid #E2E8F0',
            boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: '0 12px 32px rgba(0,0,0,0.1)',
              borderColor: '#CBD5E1',
            },
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: { borderRadius: 8, transition: 'all 0.2s ease' },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              borderRadius: 10,
              transition: 'all 0.2s ease',
              '&:hover': {
                boxShadow: '0 0 0 3px rgba(37,99,235,0.06)',
              },
              '&.Mui-focused': {
                boxShadow: '0 0 0 3px rgba(37,99,235,0.12)',
              },
            },
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            boxShadow: 'none',
            backdropFilter: 'blur(12px)',
            backgroundColor: 'rgba(255,255,255,0.85)',
          },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: {
            borderRadius: 20,
            boxShadow: '0 25px 60px rgba(0,0,0,0.15)',
          },
        },
      },
      MuiTooltip: {
        styleOverrides: {
          tooltip: { borderRadius: 8, fontSize: '0.75rem', fontWeight: 500 },
        },
      },
      MuiPagination: {
        styleOverrides: {
          root: {
            '& .MuiPaginationItem-root': {
              borderRadius: 8,
              transition: 'all 0.2s ease',
              '&:hover': { transform: 'scale(1.1)' },
            },
          },
        },
      },
      MuiBadge: {
        styleOverrides: {
          badge: { fontWeight: 700, fontSize: '0.65rem' },
        },
      },
      MuiTableRow: {
        styleOverrides: {
          root: { transition: 'background-color 0.15s ease' },
        },
      },
      MuiSkeleton: {
        styleOverrides: {
          root: { borderRadius: 12 },
        },
      },
    },
  };

  return createTheme(options);
};

export default getTheme;
