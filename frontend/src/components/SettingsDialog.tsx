import React, { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Box, Typography, TextField, Button, Divider, Alert,
  Switch, FormControlLabel, CircularProgress,
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { authApi } from '../services/api';
import { COLORS } from '../theme/theme';
import { getErrorMessage } from '../utils/getErrorMessage';

interface SettingsDialogProps {
  open: boolean;
  onClose: () => void;
}

const CONSENT_KEY = 'analytics_consent';

const SettingsDialog: React.FC<SettingsDialogProps> = ({ open, onClose }) => {
  const { user, logout, refreshUser } = useAuth();
  const [name, setName] = useState(user?.name ?? '');
  const [nameLoading, setNameLoading] = useState(false);
  const [nameMsg, setNameMsg] = useState('');
  const [nameError, setNameError] = useState('');
  const [consentValue, setConsentValue] = useState(localStorage.getItem(CONSENT_KEY) === 'accepted');

  const handleSaveName = async () => {
    setNameLoading(true);
    setNameMsg('');
    setNameError('');
    try {
      await authApi.updateProfile(name);
      await refreshUser();
      setNameMsg('Profile updated');
    } catch (err) {
      setNameError(getErrorMessage(err, 'Failed to update profile'));
    } finally {
      setNameLoading(false);
    }
  };

  const handleConsentToggle = async (checked: boolean) => {
    setConsentValue(checked);
    localStorage.setItem(CONSENT_KEY, checked ? 'accepted' : 'declined');
    try { await authApi.updateConsent(checked); } catch { /* non-critical */ }
  };

  const handleLogout = async () => {
    await logout();
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 700, color: COLORS.ink }}>Settings</DialogTitle>
      <DialogContent>
        {/* Profile Section */}
        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1, color: COLORS.inkLight }}>
          Profile
        </Typography>
        {nameMsg && <Alert severity="success" sx={{ mb: 1 }}>{nameMsg}</Alert>}
        {nameError && <Alert severity="error" sx={{ mb: 1 }}>{nameError}</Alert>}
        <TextField
          label="Name"
          value={name}
          onChange={e => setName(e.target.value)}
          fullWidth
          sx={{ mb: 1 }}
        />
        <TextField
          label="Email"
          value={user?.email ?? ''}
          fullWidth
          disabled
          sx={{ mb: 2 }}
        />
        <Button
          variant="contained"
          onClick={handleSaveName}
          disabled={nameLoading || !name.trim()}
          sx={{ mb: 3 }}
        >
          {nameLoading ? <CircularProgress size={20} color="inherit" /> : 'Save Name'}
        </Button>

        <Divider sx={{ my: 2 }} />

        {/* Privacy Section */}
        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1, color: COLORS.inkLight }}>
          Privacy
        </Typography>
        <FormControlLabel
          control={
            <Switch
              checked={consentValue}
              onChange={e => handleConsentToggle(e.target.checked)}
              color="primary"
            />
          }
          label="Allow analytics tracking to help improve the app"
        />

        <Divider sx={{ my: 2 }} />

        {/* Account Section */}
        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1, color: COLORS.inkLight }}>
          Account
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" color="error" onClick={handleLogout}>
            Sign out
          </Button>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default SettingsDialog;
