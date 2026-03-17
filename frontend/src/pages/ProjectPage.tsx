import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Alert,
  CircularProgress,
  Grid,
  Tabs,
  Tab,
  Chip,
  IconButton,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import MicIcon from '@mui/icons-material/Mic';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import EditIcon from '@mui/icons-material/Edit';
import { projectsApi, recordingsApi } from '../services/api';
import type { Project, ProjectStats, Recording } from '../types';
import AudioRecorder from '../components/AudioRecorder';
import AudioUploader from '../components/AudioUploader';
import RecordingsList from '../components/RecordingsList';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

export default function ProjectPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [stats, setStats] = useState<ProjectStats | null>(null);
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    if (id) {
      loadProjectData();
    }
  }, [id]);

  const loadProjectData = async () => {
    try {
      setLoading(true);
      setError(null);
      const projectId = parseInt(id!);

      const [projectRes, statsRes, recordingsRes] = await Promise.all([
        projectsApi.getById(projectId),
        projectsApi.getStats(projectId),
        recordingsApi.getByProject(projectId),
      ]);

      if (projectRes.data.success && projectRes.data.data) {
        setProject(projectRes.data.data);
      }
      if (statsRes.data.success && statsRes.data.data) {
        setStats(statsRes.data.data);
      }
      if (recordingsRes.data.success && recordingsRes.data.data) {
        setRecordings(recordingsRes.data.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to load project');
    } finally {
      setLoading(false);
    }
  };

  const handleRecordingUploaded = () => {
    loadProjectData();
  };

  const handleRecordingDeleted = () => {
    loadProjectData();
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (error || !project) {
    return (
      <Box>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/')} size="large" sx={{ mb: 3 }}>
          Back to Dashboard
        </Button>
        <Alert severity="error">{error || 'Project not found'}</Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={() => navigate('/')} size="large" sx={{ mr: 2 }}>
          <ArrowBackIcon />
        </IconButton>
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h3" component="h2">
            {project.title}
          </Typography>
          {project.author_name && (
            <Typography variant="h6" color="text.secondary">
              by {project.author_name}
            </Typography>
          )}
        </Box>
        <Chip
          label={project.language === 'en' ? 'English' : 'ಕನ್ನಡ'}
          color="primary"
          size="medium"
        />
      </Box>

      {project.description && (
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          {project.description}
        </Typography>
      )}

      {/* Project Statistics */}
      {stats && (
        <Grid container spacing={2} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography variant="body2" color="text.secondary">
                  Recordings
                </Typography>
                <Typography variant="h4">{stats.totalRecordings}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography variant="body2" color="text.secondary">
                  Duration
                </Typography>
                <Typography variant="h4">
                  {stats.totalDuration > 0 ? formatDuration(stats.totalDuration) : '0:00'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography variant="body2" color="text.secondary">
                  Words
                </Typography>
                <Typography variant="h4">{stats.wordCount.toLocaleString()}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography variant="body2" color="text.secondary">
                  Pages
                </Typography>
                <Typography variant="h4">{stats.pageCount}</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Tabs for Record and Upload */}
      <Card>
        <Tabs
          value={tabValue}
          onChange={(_, newValue) => setTabValue(newValue)}
          sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}
        >
          <Tab
            icon={<MicIcon />}
            iconPosition="start"
            label="Record Audio"
            sx={{ fontSize: '1.125rem', minHeight: 64 }}
          />
          <Tab
            icon={<UploadFileIcon />}
            iconPosition="start"
            label="Upload File"
            sx={{ fontSize: '1.125rem', minHeight: 64 }}
          />
        </Tabs>

        <CardContent sx={{ minHeight: 300 }}>
          <TabPanel value={tabValue} index={0}>
            <AudioRecorder
              projectId={parseInt(id!)}
              language={project.language}
              onRecordingUploaded={handleRecordingUploaded}
            />
          </TabPanel>
          <TabPanel value={tabValue} index={1}>
            <AudioUploader
              projectId={parseInt(id!)}
              language={project.language}
              onUploadComplete={handleRecordingUploaded}
            />
          </TabPanel>
        </CardContent>
      </Card>

      {/* Edit Document Button */}
      <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
        <Button
          variant="contained"
          color="primary"
          size="large"
          startIcon={<EditIcon />}
          onClick={() => navigate(`/project/${id}/document`)}
          sx={{ minHeight: 56, fontSize: '1.125rem', px: 4 }}
        >
          Edit Document
        </Button>
      </Box>

      {/* Recordings List */}
      <Box sx={{ mt: 4 }}>
        <Typography variant="h4" sx={{ mb: 3 }}>
          Recordings
        </Typography>
        <RecordingsList
          recordings={recordings}
          onRecordingDeleted={handleRecordingDeleted}
          onTranscriptionComplete={loadProjectData}
        />
      </Box>
    </Box>
  );
}
