import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Box, Typography, Alert, LinearProgress } from '@mui/material';
import { recordingsApi } from '../services/api';
import { getErrorMessage } from '../utils/getErrorMessage';
import { COLORS } from '../theme/theme';

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
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 10, 90));
      }, 200);
      await recordingsApi.upload(projectId, file, language);
      clearInterval(progressInterval);
      setUploadProgress(100);
      setSuccess(`Uploaded: ${file.name}`);
      onUploadComplete();
      setTimeout(() => { setSuccess(null); setUploadProgress(0); }, 3000);
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Upload failed'));
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
    maxSize: 100 * 1024 * 1024,
    disabled: uploading,
  });

  return (
    <Box>
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

      <Box
        {...getRootProps()}
        sx={{
          border: `2px dashed ${isDragActive ? COLORS.gold : COLORS.border}`,
          borderRadius: '10px',
          backgroundColor: isDragActive ? COLORS.goldPale : '#FFFDF9',
          cursor: uploading ? 'not-allowed' : 'pointer',
          textAlign: 'center',
          p: { xs: 4, md: 7 },
          transition: 'all 0.2s ease',
          '&:hover': uploading ? {} : {
            borderColor: COLORS.gold,
            backgroundColor: COLORS.goldPale,
          },
        }}
      >
        <input {...getInputProps()} />

        {/* Cloud upload icon */}
        <Box sx={{ mb: 2, opacity: isDragActive ? 0.9 : 0.4 }}>
          <svg width="52" height="40" viewBox="0 0 52 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M26 28V10M26 10L20 16M26 10L32 16" stroke={COLORS.ink} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M14 32C8.477 32 4 27.523 4 22C4 17.029 7.693 12.9 12.5 12.1C13.867 7.42 18.124 4 23.2 4C29.627 4 34.8 9.173 34.8 15.6C34.8 15.733 34.797 15.867 34.79 16C39.399 16.463 43 20.316 43 25C43 30.523 38.523 35 33 35" stroke={COLORS.ink} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </Box>

        {isDragActive ? (
          <Typography variant="h5" sx={{ color: COLORS.gold }}>
            Drop it here
          </Typography>
        ) : uploading ? (
          <Typography variant="body1" sx={{ color: COLORS.inkLight }}>
            Uploading…
          </Typography>
        ) : (
          <>
            <Typography variant="h6" sx={{ mb: 0.5, fontFamily: '"DM Sans", sans-serif', fontWeight: 500, color: COLORS.ink }}>
              Drop an audio file here
            </Typography>
            <Typography variant="body2" sx={{ color: COLORS.inkFaint }}>
              or click to browse your files
            </Typography>
            <Typography
              sx={{
                mt: 2,
                fontFamily: '"DM Mono", monospace',
                fontSize: '0.72rem',
                letterSpacing: '0.06em',
                color: COLORS.inkFaint,
                textTransform: 'uppercase',
              }}
            >
              MP3 · M4A · WAV · OGG · WebM · max 100 MB
            </Typography>
          </>
        )}
      </Box>

      {uploading && (
        <Box sx={{ mt: 2 }}>
          <LinearProgress variant="determinate" value={uploadProgress} />
          <Typography
            sx={{ mt: 0.75, fontFamily: '"DM Mono", monospace', fontSize: '0.8rem', color: COLORS.inkFaint, textAlign: 'center' }}
          >
            {uploadProgress}%
          </Typography>
        </Box>
      )}
    </Box>
  );
}
