import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Tabs, Tab, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Chip, Button, Switch,
  FormControlLabel, Alert, CircularProgress, Paper,
} from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import { adminApi } from '../services/api';
import { COLORS } from '../theme/theme';
import { getErrorMessage } from '../utils/getErrorMessage';

interface AdminUser {
  id: number;
  email: string;
  name: string;
  role: 'user' | 'admin';
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

interface FeatureFlag {
  name: string;
  description: string | null;
  enabled_globally: number;
}

const statusColor = (status: string): 'warning' | 'success' | 'error' | 'default' => {
  if (status === 'pending') return 'warning';
  if (status === 'approved') return 'success';
  if (status === 'rejected') return 'error';
  return 'default';
};

const AdminPage: React.FC = () => {
  const [tab, setTab] = useState(0);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await adminApi.getUsers();
      setUsers(res.data.data);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to load users'));
    } finally {
      setLoading(false);
    }
  }, []);

  const loadFlags = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await adminApi.getFeatureFlags();
      setFlags(res.data.data);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to load feature flags'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (tab === 0) loadUsers();
    else loadFlags();
  }, [tab, loadUsers, loadFlags]);

  const handleApprove = async (id: number) => {
    try {
      await adminApi.approveUser(id);
      setMessage('User approved');
      loadUsers();
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to approve user'));
    }
  };

  const handleReject = async (id: number) => {
    try {
      await adminApi.rejectUser(id);
      setMessage('User rejected');
      loadUsers();
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to reject user'));
    }
  };

  const handleToggleRole = async (user: AdminUser) => {
    const newRole = user.role === 'admin' ? 'user' : 'admin';
    try {
      await adminApi.updateUserRole(user.id, newRole);
      setMessage(`User role updated to ${newRole}`);
      loadUsers();
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to update role'));
    }
  };

  const handleToggleFlag = async (flag: FeatureFlag) => {
    try {
      await adminApi.setGlobalFlag(flag.name, !flag.enabled_globally);
      setMessage(`Flag '${flag.name}' ${!flag.enabled_globally ? 'enabled' : 'disabled'}`);
      loadFlags();
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to update flag'));
    }
  };

  return (
    <Box sx={{ maxWidth: 1100, mx: 'auto', p: 3 }}>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 700, color: COLORS.ink }}>
        Admin Panel
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
      {message && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setMessage('')}>{message}</Alert>}

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3 }}>
        <Tab label="Users" />
        <Tab label="Feature Flags" />
      </Tabs>

      {loading && <CircularProgress />}

      {!loading && tab === 0 && (
        <TableContainer component={Paper} sx={{ backgroundColor: COLORS.cream }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><b>Name</b></TableCell>
                <TableCell><b>Email</b></TableCell>
                <TableCell><b>Status</b></TableCell>
                <TableCell><b>Role</b></TableCell>
                <TableCell><b>Joined</b></TableCell>
                <TableCell><b>Actions</b></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map(user => (
                <TableRow
                  key={user.id}
                  sx={{ backgroundColor: user.status === 'pending' ? '#FEF9C3' : 'inherit' }}
                >
                  <TableCell>{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Chip label={user.status} color={statusColor(user.status)} size="small" />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={user.role}
                      color={user.role === 'admin' ? 'primary' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      {user.status !== 'approved' && (
                        <Button
                          size="small"
                          variant="contained"
                          color="success"
                          startIcon={<CheckIcon />}
                          onClick={() => handleApprove(user.id)}
                        >
                          Approve
                        </Button>
                      )}
                      {user.status !== 'rejected' && (
                        <Button
                          size="small"
                          variant="outlined"
                          color="error"
                          startIcon={<CloseIcon />}
                          onClick={() => handleReject(user.id)}
                        >
                          Reject
                        </Button>
                      )}
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => handleToggleRole(user)}
                      >
                        {user.role === 'admin' ? 'Remove Admin' : 'Make Admin'}
                      </Button>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {!loading && tab === 1 && (
        <Box>
          <Alert severity="warning" sx={{ mb: 2 }}>
            Turning off a flag disables it for ALL users unless they have a per-user override.
          </Alert>
          <TableContainer component={Paper} sx={{ backgroundColor: COLORS.cream }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell><b>Flag</b></TableCell>
                  <TableCell><b>Description</b></TableCell>
                  <TableCell><b>Global Status</b></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {flags.map(flag => (
                  <TableRow key={flag.name}>
                    <TableCell sx={{ fontFamily: 'monospace', fontWeight: 600 }}>{flag.name}</TableCell>
                    <TableCell>{flag.description ?? '—'}</TableCell>
                    <TableCell>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={Boolean(flag.enabled_globally)}
                            onChange={() => handleToggleFlag(flag)}
                            color="primary"
                          />
                        }
                        label={flag.enabled_globally ? 'Enabled' : 'Disabled'}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}
    </Box>
  );
};

export default AdminPage;
