import { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AppBar,
  Box,
  Container,
  Toolbar,
  Typography,
  IconButton,
} from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import MicIcon from '@mui/icons-material/Mic';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const navigate = useNavigate();

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar position="static" elevation={2}>
        <Toolbar sx={{ minHeight: 80 }}>
          <MicIcon sx={{ fontSize: '2.5rem', mr: 2 }} />
          <Typography
            variant="h4"
            component="h1"
            sx={{ flexGrow: 1, fontWeight: 700 }}
          >
            VoiceScribe
          </Typography>
          <IconButton
            color="inherit"
            onClick={() => navigate('/')}
            size="large"
            aria-label="Go to home"
          >
            <HomeIcon />
          </IconButton>
        </Toolbar>
      </AppBar>
      <Container
        maxWidth="xl"
        sx={{
          flex: 1,
          py: 4,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {children}
      </Container>
      <Box
        component="footer"
        sx={{
          py: 3,
          px: 2,
          mt: 'auto',
          backgroundColor: (theme) => theme.palette.grey[200],
        }}
      >
        <Container maxWidth="xl">
          <Typography variant="body2" color="text.secondary" align="center">
            VoiceScribe - Voice-to-Text Book Writing for Elderly Authors
          </Typography>
        </Container>
      </Box>
    </Box>
  );
}
