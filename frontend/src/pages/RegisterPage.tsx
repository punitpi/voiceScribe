import React, { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box, Card, CardContent, TextField, Button, Typography,
  Alert, CircularProgress, Link,
} from '@mui/material';
import MicIcon from '@mui/icons-material/Mic';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import { authApi } from '../services/api';
import { COLORS } from '../theme/theme';
import { getErrorMessage } from '../utils/getErrorMessage';

const RegisterPage: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await authApi.register(email, password, name);
      setSuccess(true);
    } catch (err) {
      setError(getErrorMessage(err, 'Registration failed. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          backgroundColor: COLORS.parchment,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          px: 2,
        }}
      >
        <Card sx={{ maxWidth: 480, width: '100%', backgroundColor: COLORS.cream, boxShadow: 3 }}>
          <CardContent sx={{ p: 4, textAlign: 'center' }}>
            <CheckCircleOutlineIcon sx={{ fontSize: 64, color: COLORS.sage, mb: 2 }} />
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 2, color: COLORS.ink }}>
              Registration Successful
            </Typography>
            <Typography variant="body1" sx={{ color: COLORS.inkLight, mb: 3 }}>
              Your account is pending admin approval. You'll be able to log in once an administrator approves your account.
            </Typography>
            <Link component={RouterLink} to="/login" sx={{ color: COLORS.gold, fontSize: 18 }}>
              Back to Sign in
            </Link>
          </CardContent>
        </Card>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        backgroundColor: COLORS.parchment,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        px: 2,
      }}
    >
      <Card sx={{ maxWidth: 480, width: '100%', backgroundColor: COLORS.cream, boxShadow: 3 }}>
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 4, justifyContent: 'center' }}>
            <MicIcon sx={{ fontSize: 36, color: COLORS.gold }} />
            <Typography variant="h4" sx={{ fontWeight: 700, color: COLORS.ink }}>
              VoiceScribe
            </Typography>
          </Box>

          <Typography variant="h6" sx={{ mb: 3, textAlign: 'center', color: COLORS.inkLight }}>
            Create your account
          </Typography>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          <Box component="form" onSubmit={handleSubmit} noValidate>
            <TextField
              label="Full Name"
              value={name}
              onChange={e => setName(e.target.value)}
              fullWidth
              required
              sx={{ mb: 2 }}
              inputProps={{ style: { fontSize: 18 } }}
            />
            <TextField
              label="Email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              fullWidth
              required
              sx={{ mb: 2 }}
              inputProps={{ style: { fontSize: 18 } }}
            />
            <TextField
              label="Password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              fullWidth
              required
              helperText="At least 8 characters"
              sx={{ mb: 3 }}
              inputProps={{ style: { fontSize: 18 } }}
            />
            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={loading}
              sx={{ height: 48, fontSize: 18, mb: 2 }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Create Account'}
            </Button>
          </Box>

          <Typography variant="body1" sx={{ textAlign: 'center', color: COLORS.inkFaint }}>
            Already have an account?{' '}
            <Link component={RouterLink} to="/login" sx={{ color: COLORS.gold }}>
              Sign in
            </Link>
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

export default RegisterPage;
