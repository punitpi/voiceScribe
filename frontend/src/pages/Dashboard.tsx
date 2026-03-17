import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardActions,
  Grid,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Chip,
  CircularProgress,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import BookIcon from '@mui/icons-material/Book';
import { projectsApi } from '../services/api';
import type { Project } from '../types';

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

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await projectsApi.getAll();
      if (response.data.success && response.data.data) {
        setProjects(response.data.data);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async () => {
    if (!newProject.title.trim()) {
      setCreateError('Project title is required');
      return;
    }

    try {
      setCreating(true);
      setCreateError(null);
      const response = await projectsApi.create(newProject);
      if (response.data.success && response.data.data) {
        setProjects([response.data.data, ...projects]);
        setCreateDialogOpen(false);
        setNewProject({
          title: '',
          author_name: '',
          description: '',
          language: 'en',
        });
        // Navigate to the new project
        navigate(`/project/${response.data.data.id}`);
      }
    } catch (err: any) {
      setCreateError(err.response?.data?.error || err.message || 'Failed to create project');
    } finally {
      setCreating(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    // SQLite stores UTC timestamps without 'Z' suffix, so we need to add it
    const isoString = dateString.includes('Z') ? dateString : dateString + 'Z';
    const date = new Date(isoString);
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h3" component="h2">
          My Book Projects
        </Typography>
        <Button
          variant="contained"
          size="large"
          startIcon={<AddIcon />}
          onClick={() => setCreateDialogOpen(true)}
        >
          New Project
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {projects.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 8 }}>
            <BookIcon sx={{ fontSize: '5rem', color: 'text.secondary', mb: 2 }} />
            <Typography variant="h5" gutterBottom>
              No Projects Yet
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              Create your first book project to start recording and transcribing
            </Typography>
            <Button
              variant="contained"
              size="large"
              startIcon={<AddIcon />}
              onClick={() => setCreateDialogOpen(true)}
            >
              Create First Project
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {projects.map((project) => (
            <Grid item xs={12} md={6} lg={4} key={project.id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                    <Typography variant="h5" component="h3" sx={{ flexGrow: 1 }}>
                      {project.title}
                    </Typography>
                    <Chip
                      label={project.language === 'en' ? 'English' : 'ಕನ್ನಡ'}
                      size="small"
                      color="primary"
                    />
                  </Box>
                  {project.author_name && (
                    <Typography variant="body1" color="text.secondary" gutterBottom>
                      by {project.author_name}
                    </Typography>
                  )}
                  {project.description && (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                      {project.description}
                    </Typography>
                  )}
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                    Created: {formatDate(project.created_at)}
                  </Typography>
                </CardContent>
                <CardActions sx={{ p: 2, pt: 0 }}>
                  <Button
                    fullWidth
                    variant="contained"
                    size="large"
                    onClick={() => navigate(`/project/${project.id}`)}
                  >
                    Open Project
                  </Button>
                </CardActions>
              </Card>
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
        <DialogTitle>
          <Typography variant="h4">Create New Project</Typography>
        </DialogTitle>
        <DialogContent>
          {createError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {createError}
            </Alert>
          )}
          <TextField
            autoFocus
            margin="normal"
            label="Book Title"
            fullWidth
            required
            value={newProject.title}
            onChange={(e) => setNewProject({ ...newProject, title: e.target.value })}
            disabled={creating}
          />
          <TextField
            margin="normal"
            label="Author Name"
            fullWidth
            value={newProject.author_name}
            onChange={(e) => setNewProject({ ...newProject, author_name: e.target.value })}
            disabled={creating}
          />
          <TextField
            margin="normal"
            label="Description"
            fullWidth
            multiline
            rows={3}
            value={newProject.description}
            onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
            disabled={creating}
          />
          <TextField
            margin="normal"
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
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setCreateDialogOpen(false)} disabled={creating} size="large">
            Cancel
          </Button>
          <Button onClick={handleCreateProject} variant="contained" disabled={creating} size="large">
            {creating ? <CircularProgress size={24} /> : 'Create Project'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
