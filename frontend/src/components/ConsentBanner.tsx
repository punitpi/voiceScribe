import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';
import { authApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { COLORS } from '../theme/theme';

const CONSENT_KEY = 'analytics_consent';

const ConsentBanner: React.FC = () => {
  const { user } = useAuth();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (user && !localStorage.getItem(CONSENT_KEY)) {
      setVisible(true);
    }
  }, [user]);

  if (!visible) return null;

  const handleAccept = async () => {
    localStorage.setItem(CONSENT_KEY, 'accepted');
    setVisible(false);
    try { await authApi.updateConsent(true); } catch { /* non-critical */ }
  };

  const handleDecline = async () => {
    localStorage.setItem(CONSENT_KEY, 'declined');
    setVisible(false);
    try { await authApi.updateConsent(false); } catch { /* non-critical */ }
  };

  return (
    <Paper
      elevation={4}
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1400,
        backgroundColor: COLORS.cream,
        borderTop: `2px solid ${COLORS.border}`,
        px: 3,
        py: 2,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 2,
        flexWrap: 'wrap',
      }}
    >
      <Typography variant="body2" sx={{ color: COLORS.inkLight, flex: 1, minWidth: 200 }}>
        We use cookies to keep you logged in, and with your permission we'll track usage analytics to improve the app.
      </Typography>
      <Box sx={{ display: 'flex', gap: 1 }}>
        <Button variant="outlined" size="small" onClick={handleDecline}>
          Decline Analytics
        </Button>
        <Button variant="contained" size="small" onClick={handleAccept}>
          Accept All
        </Button>
      </Box>
    </Paper>
  );
};

export default ConsentBanner;
