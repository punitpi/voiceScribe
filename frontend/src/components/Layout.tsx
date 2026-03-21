import { ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Box, Container, Typography, IconButton } from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import { COLORS } from '../theme/theme';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const isHome = location.pathname === '/';

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Header */}
      <Box
        component="header"
        sx={{
          borderBottom: `1px solid ${COLORS.border}`,
          backgroundColor: COLORS.parchment,
          position: 'sticky',
          top: 0,
          zIndex: 100,
          backdropFilter: 'blur(8px)',
        }}
      >
        <Container maxWidth="xl">
          <Box sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            py: 2,
          }}>
            {/* Wordmark */}
            <Box
              onClick={() => navigate('/')}
              sx={{
                display: 'flex',
                alignItems: 'baseline',
                gap: '6px',
                cursor: 'pointer',
                userSelect: 'none',
              }}
            >
              <Typography
                sx={{
                  fontFamily: '"Playfair Display", Georgia, serif',
                  fontSize: '1.625rem',
                  fontWeight: 700,
                  color: COLORS.ink,
                  lineHeight: 1,
                  letterSpacing: '-0.02em',
                }}
              >
                Voice
              </Typography>
              <Typography
                sx={{
                  fontFamily: '"Playfair Display", Georgia, serif',
                  fontSize: '1.625rem',
                  fontWeight: 400,
                  fontStyle: 'italic',
                  color: COLORS.gold,
                  lineHeight: 1,
                  letterSpacing: '-0.02em',
                }}
              >
                Scribe
              </Typography>
            </Box>

            {/* Nav */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography
                variant="body2"
                sx={{
                  color: COLORS.inkFaint,
                  fontStyle: 'italic',
                  display: { xs: 'none', sm: 'block' },
                  mr: 1,
                }}
              >
                Your story, your voice
              </Typography>
              {!isHome && (
                <IconButton
                  onClick={() => navigate('/')}
                  size="small"
                  aria-label="Go home"
                  sx={{
                    width: 38,
                    height: 38,
                    border: `1px solid ${COLORS.border}`,
                    borderRadius: '6px',
                    '& .MuiSvgIcon-root': { fontSize: '1.2rem' },
                  }}
                >
                  <HomeIcon />
                </IconButton>
              )}
            </Box>
          </Box>
        </Container>
      </Box>

      {/* Main content */}
      <Box
        component="main"
        className="page-enter"
        sx={{ flex: 1, py: { xs: 3, md: 5 } }}
      >
        <Container maxWidth="xl">
          {children}
        </Container>
      </Box>

      {/* Footer */}
      <Box
        component="footer"
        sx={{
          borderTop: `1px solid ${COLORS.border}`,
          py: 3,
          mt: 'auto',
        }}
      >
        <Container maxWidth="xl">
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
            <Typography variant="caption" sx={{ color: COLORS.inkFaint }}>
              © 2025 VoiceScribe
            </Typography>
            <Typography variant="caption" sx={{ color: COLORS.inkFaint, fontStyle: 'italic' }}>
              Every great book begins with a single spoken word
            </Typography>
          </Box>
        </Container>
      </Box>
    </Box>
  );
}
