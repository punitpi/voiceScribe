import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Grid,
  Tab,
  Tabs,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import MicIcon from '@mui/icons-material/Mic';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import AutoStoriesIcon from '@mui/icons-material/AutoStories';
import { projectsApi, recordingsApi } from '../services/api';
import type { Project, ProjectStats, Recording } from '../types';
import { getErrorMessage } from '../utils/getErrorMessage';
import AudioRecorder from '../components/AudioRecorder';
import AudioUploader from '../components/AudioUploader';
import RecordingsList from '../components/RecordingsList';
import LanguagePill from '../components/LanguagePill';
import { COLORS } from '../theme/theme';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel({ children, value, index }: TabPanelProps) {
  return (
    <div role="tabpanel" hidden={value !== index}>
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <Box
      sx={{
        border: `1px solid ${COLORS.border}`,
        borderRadius: '8px',
        backgroundColor: COLORS.cream,
        px: 3,
        py: 2.5,
        display: 'flex',
        flexDirection: 'column',
        gap: 0.5,
      }}
    >
      <Typography
        sx={{
          fontFamily: '"DM Mono", monospace',
          fontSize: '0.7rem',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: COLORS.inkFaint,
        }}
      >
        {label}
      </Typography>
      <Typography
        sx={{
          fontFamily: '"Playfair Display", Georgia, serif',
          fontSize: '2rem',
          fontWeight: 700,
          lineHeight: 1,
          color: COLORS.ink,
        }}
      >
        {value}
      </Typography>
    </Box>
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

  const loadProjectData = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const projectId = parseInt(id);
      const [projectRes, statsRes, recordingsRes] = await Promise.all([
        projectsApi.getById(projectId),
        projectsApi.getStats(projectId),
        recordingsApi.getByProject(projectId),
      ]);
      if (projectRes.data.success && projectRes.data.data) setProject(projectRes.data.data);
      if (statsRes.data.success && statsRes.data.data) setStats(statsRes.data.data);
      if (recordingsRes.data.success && recordingsRes.data.data) setRecordings(recordingsRes.data.data);
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Failed to load project'));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { loadProjectData(); }, [loadProjectData]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress size={40} />
      </Box>
    );
  }

  if (error || !project) {
    return (
      <Box>
        <Button startIcon={<ArrowBackIcon />} variant="outlined" onClick={() => navigate('/')} sx={{ mb: 3 }}>
          Back to Library
        </Button>
        <Alert severity="error">{error || 'Project not found'}</Alert>
      </Box>
    );
  }

  return (
    <Box>
      {/* Back + title header */}
      <Box sx={{ mb: 5 }}>
        <Button
          startIcon={<ArrowBackIcon sx={{ fontSize: '1rem !important' }} />}
          variant="text"
          onClick={() => navigate('/')}
          sx={{
            color: COLORS.inkFaint,
            fontSize: '0.9rem',
            fontStyle: 'italic',
            mb: 2,
            px: 0,
            '&:hover': { backgroundColor: 'transparent', color: COLORS.ink },
          }}
        >
          Back to library
        </Button>

        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 3, flexWrap: 'wrap' }}>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            {/* Language pill */}
            <Box sx={{ mb: 1.5 }}>
              <LanguagePill language={project.language} />
            </Box>
            <Typography variant="h2" sx={{ mb: 0.5, fontStyle: 'italic' }}>
              {project.title}
            </Typography>
            {project.author_name && (
              <Typography variant="body1" sx={{ color: COLORS.inkFaint }}>
                by {project.author_name}
              </Typography>
            )}
            {project.description && (
              <Typography variant="body2" sx={{ color: COLORS.inkLight, mt: 1, maxWidth: 640, lineHeight: 1.7 }}>
                {project.description}
              </Typography>
            )}
          </Box>

          {/* Edit document CTA */}
          <Button
            variant="contained"
            size="large"
            startIcon={<AutoStoriesIcon sx={{ fontSize: '1.1rem !important' }} />}
            onClick={() => navigate(`/project/${id}/document`)}
            sx={{ flexShrink: 0 }}
          >
            View Document
          </Button>
        </Box>
      </Box>

      {/* Stats row */}
      {stats && (
        <Grid container spacing={2} sx={{ mb: 5 }}>
          <Grid item xs={6} sm={3}>
            <StatCard label="Recordings" value={stats.totalRecordings} />
          </Grid>
          <Grid item xs={6} sm={3}>
            <StatCard label="Duration" value={stats.totalDuration > 0 ? formatDuration(stats.totalDuration) : '0:00'} />
          </Grid>
          <Grid item xs={6} sm={3}>
            <StatCard label="Words" value={stats.wordCount.toLocaleString()} />
          </Grid>
          <Grid item xs={6} sm={3}>
            <StatCard label="Pages" value={stats.pageCount} />
          </Grid>
        </Grid>
      )}

      {/* Record / Upload tabs */}
      <Box
        sx={{
          border: `1px solid ${COLORS.border}`,
          borderRadius: '10px',
          backgroundColor: COLORS.cream,
          mb: 5,
          overflow: 'hidden',
        }}
      >
        <Box sx={{ borderBottom: `1px solid ${COLORS.border}` }}>
          <Tabs
            value={tabValue}
            onChange={(_, v) => setTabValue(v)}
            sx={{
              px: 2,
              '& .MuiTabs-indicator': { backgroundColor: COLORS.gold, height: 2 },
            }}
          >
            <Tab
              icon={<MicIcon sx={{ fontSize: '1.1rem' }} />}
              iconPosition="start"
              label="Record"
              sx={{ minHeight: 54, fontSize: '0.975rem', gap: 0.75 }}
            />
            <Tab
              icon={<UploadFileIcon sx={{ fontSize: '1.1rem' }} />}
              iconPosition="start"
              label="Upload file"
              sx={{ minHeight: 54, fontSize: '0.975rem', gap: 0.75 }}
            />
          </Tabs>
        </Box>
        <Box sx={{ p: 3, minHeight: 240 }}>
          <TabPanel value={tabValue} index={0}>
            <AudioRecorder
              projectId={parseInt(id!)}
              language={project.language}
              onRecordingUploaded={loadProjectData}
            />
          </TabPanel>
          <TabPanel value={tabValue} index={1}>
            <AudioUploader
              projectId={parseInt(id!)}
              language={project.language}
              onUploadComplete={loadProjectData}
            />
          </TabPanel>
        </Box>
      </Box>

      {/* Recordings list */}
      {recordings.length > 0 && (
        <Box>
          <Typography
            variant="body2"
            sx={{
              fontFamily: '"DM Mono", monospace',
              fontSize: '0.7rem',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: COLORS.inkFaint,
              mb: 2,
            }}
          >
            Recordings — {recordings.length}
          </Typography>
          <RecordingsList
            recordings={recordings}
            onRecordingDeleted={loadProjectData}
            onTranscriptionComplete={loadProjectData}
          />
        </Box>
      )}
    </Box>
  );
}
