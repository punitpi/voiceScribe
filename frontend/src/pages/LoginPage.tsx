import React, { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Box, Card, CardContent, TextField, Button, Typography,
  Alert, CircularProgress, Link,
} from '@mui/material';
import MicIcon from '@mui/icons-material/Mic';
import { useAuth } from '../contexts/AuthContext';
import { COLORS } from '../theme/theme';
import { getErrorMessage } from '../utils/getErrorMessage';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(getErrorMessage(err, 'Login failed. Please check your credentials.'));
    } finally {
      setLoading(false);
    }
  };

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
            Sign in to your account
          </Typography>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          <Box component="form" onSubmit={handleSubmit} noValidate>
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
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Sign in'}
            </Button>
          </Box>

          <Typography variant="body1" sx={{ textAlign: 'center', color: COLORS.inkFaint }}>
            Don't have an account?{' '}
            <Link component={RouterLink} to="/register" sx={{ color: COLORS.gold }}>
              Register
            </Link>
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

export default LoginPage;
