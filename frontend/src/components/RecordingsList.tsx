import { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  IconButton,
  Alert,
  CircularProgress,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import TranscribeIcon from '@mui/icons-material/Subtitles';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import { recordingsApi, transcriptionsApi } from '../services/api';
import type { Recording } from '../types';

interface RecordingsListProps {
  recordings: Recording[];
  onRecordingDeleted: () => void;
  onTranscriptionComplete: () => void;
}

export default function RecordingsList({
  recordings,
  onRecordingDeleted,
  onTranscriptionComplete,
}: RecordingsListProps) {
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; recordingId?: number }>({
    open: false,
  });
  const [deleting, setDeleting] = useState(false);
  const [transcribing, setTranscribing] = useState<number | null>(null);
  const [transcriptionProgress, setTranscriptionProgress] = useState<{
    recordingId: number;
    progress: number;
    message: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [viewDialog, setViewDialog] = useState<{ open: boolean; recording?: Recording; transcription?: string }>({
    open: false,
  });
  const [loadingTranscription, setLoadingTranscription] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);

  // Setup Socket.IO connection
  useEffect(() => {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
    const newSocket = io(API_URL);

    newSocket.on('connect', () => {
      console.log('✅ Connected to Socket.IO');
    });

    newSocket.on('transcription:progress', (data: any) => {
      console.log('Transcription progress:', data);
      setTranscriptionProgress({
        recordingId: data.recordingId,
        progress: data.progress || 50,
        message: data.message || 'Transcribing...'
      });
    });

    newSocket.on('transcription:complete', (data: any) => {
      console.log('Transcription complete:', data);
      setTranscriptionProgress(null);
      setTranscribing(null);
      onTranscriptionComplete();
    });

    newSocket.on('transcription:error', (data: any) => {
      console.log('Transcription error:', data);
      setTranscriptionProgress(null);
      setTranscribing(null);
      setError(data.message || 'Transcription failed');
      onTranscriptionComplete();
    });

    newSocket.on('disconnect', () => {
      console.log('❌ Disconnected from Socket.IO');
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [onTranscriptionComplete]);

  const handleDelete = async () => {
    if (!deleteDialog.recordingId) return;

    try {
      setDeleting(true);
      await recordingsApi.delete(deleteDialog.recordingId);
      setDeleteDialog({ open: false });
      onRecordingDeleted();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete recording');
    } finally {
      setDeleting(false);
    }
  };

  const handleViewTranscription = async (recording: Recording) => {
    try {
      setLoadingTranscription(true);
      const response = await transcriptionsApi.getByRecording(recording.id!);
      if (response.data.success && response.data.data) {
        setViewDialog({
          open: true,
          recording,
          transcription: response.data.data.formatted_text || response.data.data.raw_text,
        });
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load transcription');
    } finally {
      setLoadingTranscription(false);
    }
  };

  const handleTranscribe = async (recordingId: number) => {
    try {
      setTranscribing(recordingId);
      setError(null);
      setTranscriptionProgress({
        recordingId,
        progress: 5,
        message: 'Initializing transcription...'
      });

      await transcriptionsApi.start(recordingId);

      // Socket.IO will handle the progress updates
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to start transcription');
      setTranscribing(null);
      setTranscriptionProgress(null);
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '0 B';
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    return `${(kb / 1024).toFixed(1)} MB`;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    // SQLite stores UTC timestamps without 'Z' suffix, so we need to add it
    const isoString = dateString.includes('Z') ? dateString : dateString + 'Z';
    const date = new Date(isoString);
    return date.toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const getStatusChip = (status: string) => {
    switch (status) {
      case 'completed':
        return <Chip icon={<CheckCircleIcon />} label="Transcribed" color="success" />;
      case 'transcribing':
        return <Chip icon={<HourglassEmptyIcon />} label="Transcribing..." color="warning" />;
      case 'failed':
        return <Chip icon={<ErrorIcon />} label="Failed" color="error" />;
      default:
        return <Chip label="Pending" color="default" />;
    }
  };

  if (recordings.length === 0) {
    return (
      <Card>
        <CardContent sx={{ textAlign: 'center', py: 6 }}>
          <Typography variant="h6" color="text.secondary">
            No recordings yet. Start by recording or uploading an audio file.
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {recordings.map((recording) => (
        <Card key={recording.id} sx={{ mb: 2 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between', mb: 2 }}>
              <Box sx={{ flexGrow: 1 }}>
                <Typography variant="h6" gutterBottom>
                  {recording.filename}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {formatFileSize(recording.file_size)} • {formatDate(recording.created_at)}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                {getStatusChip(recording.status)}
                <IconButton
                  color="error"
                  onClick={() => setDeleteDialog({ open: true, recordingId: recording.id })}
                  size="large"
                >
                  <DeleteIcon />
                </IconButton>
              </Box>
            </Box>

            {recording.status === 'pending' && (
              <Button
                variant="contained"
                startIcon={
                  transcribing === recording.id ? (
                    <CircularProgress size={20} color="inherit" />
                  ) : (
                    <TranscribeIcon />
                  )
                }
                onClick={() => handleTranscribe(recording.id!)}
                disabled={transcribing !== null}
                size="large"
              >
                {transcribing === recording.id ? 'Starting Transcription...' : 'Start Transcription'}
              </Button>
            )}

            {(recording.status === 'transcribing' || (transcriptionProgress && transcriptionProgress.recordingId === recording.id)) && (
              <Box sx={{ width: '100%' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                  <CircularProgress size={24} />
                  <Typography variant="body1" sx={{ fontSize: '1.125rem' }}>
                    {transcriptionProgress?.message || 'Transcription in progress...'}
                  </Typography>
                </Box>
                <LinearProgress
                  variant={transcriptionProgress?.progress ? 'determinate' : 'indeterminate'}
                  value={transcriptionProgress?.progress || 0}
                  sx={{ height: 8, borderRadius: 4 }}
                />
                {transcriptionProgress?.progress && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, fontSize: '1rem' }}>
                    {transcriptionProgress.progress}% complete
                  </Typography>
                )}
              </Box>
            )}

            {recording.status === 'completed' && (
              <Button
                variant="outlined"
                startIcon={loadingTranscription ? <CircularProgress size={20} color="inherit" /> : <PlayArrowIcon />}
                onClick={() => handleViewTranscription(recording)}
                disabled={loadingTranscription}
                size="large"
              >
                {loadingTranscription ? 'Loading...' : 'View Transcription'}
              </Button>
            )}

            {recording.status === 'failed' && (
              <Box>
                <Alert severity="error" sx={{ mb: 2 }}>
                  Transcription failed. You can try again or delete this recording.
                </Alert>
                <Button
                  variant="contained"
                  startIcon={
                    transcribing === recording.id ? (
                      <CircularProgress size={20} color="inherit" />
                    ) : (
                      <TranscribeIcon />
                    )
                  }
                  onClick={() => handleTranscribe(recording.id!)}
                  disabled={transcribing !== null}
                  size="large"
                >
                  {transcribing === recording.id ? 'Starting Transcription...' : 'Retry Transcription'}
                </Button>
              </Box>
            )}
          </CardContent>
        </Card>
      ))}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog.open} onClose={() => !deleting && setDeleteDialog({ open: false })}>
        <DialogTitle>
          <Typography variant="h5">Delete Recording?</Typography>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            Are you sure you want to delete this recording? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setDeleteDialog({ open: false })} disabled={deleting} size="large">
            Cancel
          </Button>
          <Button
            onClick={handleDelete}
            color="error"
            variant="contained"
            disabled={deleting}
            size="large"
          >
            {deleting ? <CircularProgress size={24} /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Transcription Dialog */}
      <Dialog
        open={viewDialog.open}
        onClose={() => setViewDialog({ open: false })}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h5">Transcription</Typography>
          {viewDialog.recording && (
            <Typography variant="body2" color="text.secondary">
              {viewDialog.recording.filename}
            </Typography>
          )}
        </DialogTitle>
        <DialogContent>
          <Box sx={{
            p: 3,
            bgcolor: 'grey.50',
            borderRadius: 1,
            minHeight: 200,
            maxHeight: 500,
            overflow: 'auto'
          }}>
            <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', fontSize: '1.125rem', lineHeight: 1.8 }}>
              {viewDialog.transcription || 'No transcription available'}
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setViewDialog({ open: false })} variant="contained" size="large">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
