import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  Box,
  Typography,
  Alert,
  LinearProgress,
  Paper,
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { recordingsApi } from '../services/api';

interface AudioUploaderProps {
  projectId: number;
  language: 'en' | 'kn';
  onUploadComplete: () => void;
}

export default function AudioUploader({ projectId, language, onUploadComplete }: AudioUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];

    try {
      setUploading(true);
      setError(null);
      setSuccess(null);
      setUploadProgress(0);

      // Simulate progress (axios upload progress can be added)
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 10, 90));
      }, 200);

      await recordingsApi.upload(projectId, file, language);

      clearInterval(progressInterval);
      setUploadProgress(100);
      setSuccess(`Successfully uploaded: ${file.name}`);
      onUploadComplete();

      setTimeout(() => {
        setSuccess(null);
        setUploadProgress(0);
      }, 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  }, [projectId, language, onUploadComplete]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'audio/mpeg': ['.mp3'],
      'audio/mp4': ['.m4a'],
      'audio/wav': ['.wav'],
      'audio/ogg': ['.ogg'],
      'audio/webm': ['.webm'],
    },
    maxFiles: 1,
    maxSize: 100 * 1024 * 1024, // 100MB
    disabled: uploading,
  });

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Upload Audio File
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Drag and drop an audio file, or click to browse
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      <Paper
        {...getRootProps()}
        sx={{
          p: 6,
          border: '3px dashed',
          borderColor: isDragActive ? 'primary.main' : 'grey.400',
          backgroundColor: isDragActive ? 'action.hover' : 'background.paper',
          cursor: uploading ? 'not-allowed' : 'pointer',
          textAlign: 'center',
          transition: 'all 0.3s',
          '&:hover': uploading ? {} : {
            borderColor: 'primary.main',
            backgroundColor: 'action.hover',
          },
        }}
      >
        <input {...getInputProps()} />
        <CloudUploadIcon sx={{ fontSize: '5rem', color: 'primary.main', mb: 2 }} />
        {isDragActive ? (
          <Typography variant="h5" color="primary">
            Drop the audio file here
          </Typography>
        ) : (
          <>
            <Typography variant="h5" gutterBottom>
              {uploading ? 'Uploading...' : 'Drop audio file here'}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              or click to browse
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              Supported formats: MP3, M4A, WAV, OGG, WebM (max 100MB)
            </Typography>
          </>
        )}
      </Paper>

      {uploading && (
        <Box sx={{ mt: 3 }}>
          <LinearProgress variant="determinate" value={uploadProgress} />
          <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 1 }}>
            Uploading... {uploadProgress}%
          </Typography>
        </Box>
      )}
    </Box>
  );
}
