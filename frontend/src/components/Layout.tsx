import { ReactNode, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Box, Container, Typography, IconButton, Tooltip, Button } from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import { COLORS } from '../theme/theme';
import { useAuth } from '../contexts/AuthContext';
import SettingsDialog from './SettingsDialog';

interface LayoutProps {
  children: ReactNode;
}

const ZOOM_STEP = 10;
const ZOOM_MIN = 80;
const ZOOM_MAX = 200;

export default function Layout({ children }: LayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const isHome = location.pathname === '/';
  const { isAdmin } = useAuth();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [zoom, setZoom] = useState(100);

  const handleZoomIn = () => {
    setZoom((z) => {
      const next = Math.min(z + ZOOM_STEP, ZOOM_MAX);
      document.documentElement.style.fontSize = `${next}%`;
      return next;
    });
  };

  const handleZoomOut = () => {
    setZoom((z) => {
      const next = Math.max(z - ZOOM_STEP, ZOOM_MIN);
      document.documentElement.style.fontSize = `${next}%`;
      return next;
    });
  };

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

              {/* Zoom controls */}
              <Box sx={{ display: 'flex', alignItems: 'center', border: `1px solid ${COLORS.border}`, borderRadius: '6px', overflow: 'hidden' }}>
                <Tooltip title="Zoom out (make text smaller)">
                  <IconButton
                    onClick={handleZoomOut}
                    size="small"
                    aria-label="Zoom out"
                    disabled={zoom <= ZOOM_MIN}
                    sx={{ width: 36, height: 36, borderRadius: 0, '& .MuiSvgIcon-root': { fontSize: '1.1rem' } }}
                  >
                    <RemoveIcon />
                  </IconButton>
                </Tooltip>
                <Typography sx={{ fontSize: '0.78rem', fontFamily: '"DM Mono", monospace', color: COLORS.inkFaint, px: 1, minWidth: 38, textAlign: 'center', userSelect: 'none' }}>
                  {zoom}%
                </Typography>
                <Tooltip title="Zoom in (make text bigger)">
                  <IconButton
                    onClick={handleZoomIn}
                    size="small"
                    aria-label="Zoom in"
                    disabled={zoom >= ZOOM_MAX}
                    sx={{ width: 36, height: 36, borderRadius: 0, '& .MuiSvgIcon-root': { fontSize: '1.1rem' } }}
                  >
                    <AddIcon />
                  </IconButton>
                </Tooltip>
              </Box>

              {isAdmin && (
                <Tooltip title="Admin Panel">
                  <IconButton
                    onClick={() => navigate('/admin')}
                    size="small"
                    aria-label="Admin panel"
                    sx={{
                      width: 38,
                      height: 38,
                      border: `1px solid ${COLORS.border}`,
                      borderRadius: '6px',
                      '& .MuiSvgIcon-root': { fontSize: '1.2rem' },
                    }}
                  >
                    <AdminPanelSettingsIcon />
                  </IconButton>
                </Tooltip>
              )}

              {!isHome && (
                <Tooltip title="Home">
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
                </Tooltip>
              )}

              <Tooltip title="Account settings">
                <IconButton
                  onClick={() => setSettingsOpen(true)}
                  size="small"
                  aria-label="Account settings"
                  sx={{
                    width: 38,
                    height: 38,
                    border: `1px solid ${COLORS.border}`,
                    borderRadius: '6px',
                    '& .MuiSvgIcon-root': { fontSize: '1.2rem' },
                  }}
                >
                  <AccountCircleIcon />
                </IconButton>
              </Tooltip>
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

      <SettingsDialog open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </Box>
  );
}
