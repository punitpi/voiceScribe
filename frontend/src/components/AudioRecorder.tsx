import { useState } from 'react';
import { useReactMediaRecorder } from 'react-media-recorder';
import {
  Box,
  Button,
  Typography,
  Alert,
  CircularProgress,
  LinearProgress,
} from '@mui/material';
import MicIcon from '@mui/icons-material/Mic';
import StopIcon from '@mui/icons-material/Stop';
import UploadIcon from '@mui/icons-material/Upload';
import DeleteIcon from '@mui/icons-material/Delete';
import { recordingsApi } from '../services/api';

interface AudioRecorderProps {
  projectId: number;
  language: 'en' | 'kn';
  onRecordingUploaded: () => void;
}

export default function AudioRecorder({ projectId, language, onRecordingUploaded }: AudioRecorderProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [timerInterval, setTimerInterval] = useState<NodeJS.Timeout | null>(null);

  const {
    status,
    startRecording,
    stopRecording,
    mediaBlobUrl,
    clearBlobUrl,
  } = useReactMediaRecorder({
    audio: true,
    onStart: () => {
      setRecordingTime(0);
      const interval = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
      setTimerInterval(interval);
    },
    onStop: () => {
      if (timerInterval) {
        clearInterval(timerInterval);
        setTimerInterval(null);
      }
    },
  });

  const handleUpload = async () => {
    if (!mediaBlobUrl) return;

    try {
      setUploading(true);
      setUploadError(null);

      const response = await fetch(mediaBlobUrl);
      const blob = await response.blob();
      const file = new File([blob], `recording-${Date.now()}.webm`, { type: 'audio/webm' });

      await recordingsApi.upload(projectId, file, language);

      clearBlobUrl();
      setRecordingTime(0);
      onRecordingUploaded();
    } catch (err: any) {
      setUploadError(err.response?.data?.error || err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleClear = () => {
    clearBlobUrl();
    setRecordingTime(0);
    setUploadError(null);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Record Your Voice
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Click the microphone button to start recording your narration
      </Typography>

      {uploadError && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setUploadError(null)}>
          {uploadError}
        </Alert>
      )}

      <Box sx={{ textAlign: 'center', py: 4 }}>
        {status === 'recording' && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="h3" color="error" sx={{ mb: 2 }}>
              {formatTime(recordingTime)}
            </Typography>
            <LinearProgress color="error" />
          </Box>
        )}

        {status === 'idle' && !mediaBlobUrl && (
          <Button
            variant="contained"
            color="primary"
            size="large"
            startIcon={<MicIcon sx={{ fontSize: '2rem' }} />}
            onClick={startRecording}
            sx={{ minWidth: 240, py: 2 }}
          >
            Start Recording
          </Button>
        )}

        {status === 'recording' && (
          <Button
            variant="contained"
            color="error"
            size="large"
            startIcon={<StopIcon sx={{ fontSize: '2rem' }} />}
            onClick={stopRecording}
            sx={{ minWidth: 240, py: 2 }}
          >
            Stop Recording
          </Button>
        )}

        {mediaBlobUrl && (
          <Box>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Recording Complete: {formatTime(recordingTime)}
            </Typography>
            <Box sx={{ mb: 3 }}>
              <audio src={mediaBlobUrl} controls style={{ width: '100%', maxWidth: 500 }} />
            </Box>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Button
                variant="contained"
                color="primary"
                size="large"
                startIcon={uploading ? <CircularProgress size={24} color="inherit" /> : <UploadIcon />}
                onClick={handleUpload}
                disabled={uploading}
              >
                Upload Recording
              </Button>
              <Button
                variant="outlined"
                size="large"
                startIcon={<DeleteIcon />}
                onClick={handleClear}
                disabled={uploading}
              >
                Discard
              </Button>
            </Box>
          </Box>
        )}
      </Box>
    </Box>
  );
}
