import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Grid,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  CircularProgress,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { projectsApi } from '../services/api';
import type { Project } from '../types';
import { getErrorMessage } from '../utils/getErrorMessage';
import { COLORS } from '../theme/theme';
import LanguagePill from '../components/LanguagePill';
import { formatDate } from '../utils/formatDate';

export default function Dashboard() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newProject, setNewProject] = useState({
    title: '',
    author_name: '',
    description: '',
    language: 'en' as 'en' | 'kn',
  });
  const [createError, setCreateError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => { loadProjects(); }, []);

  const loadProjects = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await projectsApi.getAll();
      if (response.data.success && response.data.data) {
        setProjects(response.data.data);
      }
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Failed to load projects'));
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async () => {
    if (!newProject.title.trim()) {
      setCreateError('Please give your book a title');
      return;
    }
    try {
      setCreating(true);
      setCreateError(null);
      const response = await projectsApi.create(newProject);
      if (response.data.success && response.data.data) {
        setProjects([response.data.data, ...projects]);
        setCreateDialogOpen(false);
        setNewProject({ title: '', author_name: '', description: '', language: 'en' });
        navigate(`/project/${response.data.data.id}`);
      }
    } catch (err: unknown) {
      setCreateError(getErrorMessage(err, 'Failed to create project'));
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress size={40} />
      </Box>
    );
  }

  return (
    <Box>
      {/* Hero strip */}
      <Box
        sx={{
          mb: { xs: 5, md: 8 },
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: { xs: 'flex-start', sm: 'flex-end' },
          justifyContent: 'space-between',
          gap: 3,
          borderBottom: `1px solid ${COLORS.divider}`,
          pb: 4,
        }}
      >
        <Box>
          <Typography
            variant="h2"
            sx={{ mb: '4px', fontStyle: 'italic' }}
          >
            Your Library
          </Typography>
          <Typography variant="body1" sx={{ color: COLORS.inkFaint }}>
            {projects.length === 0
              ? 'Begin your first chapter today'
              : `${projects.length} book${projects.length !== 1 ? 's' : ''} in progress`}
          </Typography>
        </Box>

        <Button
          variant="contained"
          startIcon={<AddIcon sx={{ fontSize: '1.1rem !important' }} />}
          onClick={() => setCreateDialogOpen(true)}
          sx={{ whiteSpace: 'nowrap', flexShrink: 0 }}
        >
          New Book
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 4 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Empty state */}
      {projects.length === 0 ? (
        <Box
          sx={{
            textAlign: 'center',
            py: { xs: 8, md: 14 },
            px: 4,
            maxWidth: 520,
            mx: 'auto',
          }}
        >
          {/* Open book icon */}
          <Box sx={{ mb: 4, opacity: 0.25 }}>
            <svg width="80" height="64" viewBox="0 0 80 64" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M40 12 C32 6 16 4 4 8 L4 56 C16 52 32 54 40 60 C48 54 64 52 76 56 L76 8 C64 4 48 6 40 12Z" stroke={COLORS.ink} strokeWidth="2.5" fill="none" strokeLinejoin="round"/>
              <path d="M40 12 L40 60" stroke={COLORS.ink} strokeWidth="2" strokeLinecap="round"/>
              <path d="M16 18 L34 18 M16 26 L34 26 M16 34 L28 34" stroke={COLORS.ink} strokeWidth="1.5" strokeLinecap="round"/>
              <path d="M46 18 L64 18 M46 26 L64 26 M52 34 L64 34" stroke={COLORS.ink} strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </Box>
          <Typography variant="h4" sx={{ mb: 2 }}>
            A blank page awaits
          </Typography>
          <Typography variant="body1" sx={{ color: COLORS.inkFaint, mb: 5, lineHeight: 1.8 }}>
            Every great memoir begins with a single voice.<br />
            Start recording your story today.
          </Typography>
          <Button
            variant="contained"
            size="large"
            startIcon={<AddIcon />}
            onClick={() => setCreateDialogOpen(true)}
          >
            Begin Your First Book
          </Button>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {projects.map((project, i) => (
            <Grid item xs={12} sm={6} lg={4} key={project.id}>
              <Box
                onClick={() => navigate(`/project/${project.id}`)}
                sx={{
                  height: '100%',
                  cursor: 'pointer',
                  borderRadius: '10px',
                  border: `1px solid ${COLORS.border}`,
                  backgroundColor: COLORS.cream,
                  p: 3,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 1.5,
                  transition: 'all 0.2s ease',
                  animation: `fadeUp 0.3s ease ${i * 0.05}s both`,
                  '@keyframes fadeUp': {
                    from: { opacity: 0, transform: 'translateY(10px)' },
                    to: { opacity: 1, transform: 'translateY(0)' },
                  },
                  '&:hover': {
                    borderColor: COLORS.gold,
                    boxShadow: `0 4px 20px rgba(180,83,9,0.1)`,
                    transform: 'translateY(-2px)',
                  },
                }}
              >
                {/* Language tag */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <LanguagePill language={project.language} />
                  <Typography
                    sx={{
                      fontFamily: '"DM Mono", monospace',
                      fontSize: '0.72rem',
                      color: COLORS.inkFaint,
                    }}
                  >
                    {formatDate(project.created_at)}
                  </Typography>
                </Box>

                {/* Title */}
                <Typography
                  variant="h5"
                  sx={{
                    mt: 0.5,
                    mb: 0.5,
                    lineHeight: 1.3,
                    color: COLORS.ink,
                  }}
                >
                  {project.title}
                </Typography>

                {project.author_name && (
                  <Typography
                    variant="body2"
                    sx={{ color: COLORS.inkFaint, fontStyle: 'italic' }}
                  >
                    by {project.author_name}
                  </Typography>
                )}

                {project.description && (
                  <Typography
                    variant="body2"
                    sx={{
                      color: COLORS.inkLight,
                      mt: 0.5,
                      flexGrow: 1,
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {project.description}
                  </Typography>
                )}

                {/* Open cue */}
                <Box sx={{ mt: 'auto', pt: 2, borderTop: `1px solid ${COLORS.divider}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Typography
                    sx={{
                      fontSize: '0.875rem',
                      color: COLORS.gold,
                      fontWeight: 500,
                    }}
                  >
                    Open project
                  </Typography>
                  <Box sx={{ color: COLORS.gold, lineHeight: 0 }}>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </Box>
                </Box>
              </Box>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Create Project Dialog */}
      <Dialog
        open={createDialogOpen}
        onClose={() => !creating && setCreateDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Start a new book</DialogTitle>
        <DialogContent sx={{ pt: '16px !important' }}>
          {createError && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setCreateError(null)}>
              {createError}
            </Alert>
          )}
          <TextField
            autoFocus
            label="Book title"
            fullWidth
            required
            value={newProject.title}
            onChange={(e) => setNewProject({ ...newProject, title: e.target.value })}
            disabled={creating}
            sx={{ mb: 2 }}
            placeholder="e.g. Memories of a Monsoon Childhood"
          />
          <TextField
            label="Author name"
            fullWidth
            value={newProject.author_name}
            onChange={(e) => setNewProject({ ...newProject, author_name: e.target.value })}
            disabled={creating}
            sx={{ mb: 2 }}
            placeholder="Your name"
          />
          <TextField
            label="Description (optional)"
            fullWidth
            multiline
            rows={3}
            value={newProject.description}
            onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
            disabled={creating}
            sx={{ mb: 2 }}
            placeholder="A short note about what this book is about"
          />
          <TextField
            label="Language"
            fullWidth
            select
            SelectProps={{ native: true }}
            value={newProject.language}
            onChange={(e) => setNewProject({ ...newProject, language: e.target.value as 'en' | 'kn' })}
            disabled={creating}
          >
            <option value="en">English</option>
            <option value="kn">ಕನ್ನಡ (Kannada)</option>
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button variant="outlined" onClick={() => setCreateDialogOpen(false)} disabled={creating}>
            Cancel
          </Button>
          <Button variant="contained" onClick={handleCreateProject} disabled={creating}>
            {creating ? <CircularProgress size={20} sx={{ color: '#fff' }} /> : 'Create book'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
