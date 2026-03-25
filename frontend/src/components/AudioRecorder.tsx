import { useState, useRef, useEffect } from 'react';
import { useReactMediaRecorder } from 'react-media-recorder';
import { Box, Button, Typography, Alert, CircularProgress } from '@mui/material';
import { recordingsApi } from '../services/api';
import { getErrorMessage } from '../utils/getErrorMessage';
import { COLORS } from '../theme/theme';

interface AudioRecorderProps {
  projectId: number;
  language: 'en' | 'kn' | 'en-kn';
  onRecordingUploaded: () => void;
}

export default function AudioRecorder({ projectId, language, onRecordingUploaded }: AudioRecorderProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Clear interval on unmount to prevent state updates on an unmounted component
  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const stopTimer = () => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  };

  const { status, startRecording, stopRecording, mediaBlobUrl, clearBlobUrl } = useReactMediaRecorder({
    audio: true,
    onStart: () => {
      setRecordingTime(0);
      timerRef.current = setInterval(() => setRecordingTime((p) => p + 1), 1000);
    },
    onStop: stopTimer,
  });

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  const handleUpload = async () => {
    if (!mediaBlobUrl) return;
    try {
      setUploading(true);
      setUploadError(null);
      const blob = await (await fetch(mediaBlobUrl)).blob();
      const file = new File([blob], `recording-${Date.now()}.webm`, { type: 'audio/webm' });
      await recordingsApi.upload(projectId, file, language);
      clearBlobUrl();
      setRecordingTime(0);
      onRecordingUploaded();
    } catch (err: unknown) {
      setUploadError(getErrorMessage(err, 'Upload failed'));
    } finally {
      setUploading(false);
    }
  };

  const handleClear = () => {
    clearBlobUrl();
    setRecordingTime(0);
    setUploadError(null);
  };

  const isRecording = status === 'recording';
  const hasRecording = !!mediaBlobUrl;

  return (
    <Box>
      {uploadError && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setUploadError(null)}>
          {uploadError}
        </Alert>
      )}

      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, py: 3 }}>
        {/* Idle: big mic button */}
        {!isRecording && !hasRecording && (
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="body2" sx={{ color: COLORS.inkFaint, mb: 4, fontStyle: 'italic' }}>
              Press the microphone to begin speaking
            </Typography>
            <Box
              onClick={startRecording}
              className="recording-pulse"
              sx={{
                width: 100,
                height: 100,
                borderRadius: '50%',
                backgroundColor: COLORS.gold,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                mx: 'auto',
                transition: 'transform 0.2s ease, background-color 0.2s ease',
                '&:hover': {
                  backgroundColor: '#92400E',
                  transform: 'scale(1.05)',
                },
              }}
            >
              <svg width="44" height="44" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="9" y="2" width="6" height="12" rx="3" fill="white"/>
                <path d="M5 11C5 14.866 8.13401 18 12 18C15.866 18 19 14.866 19 11" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                <line x1="12" y1="18" x2="12" y2="22" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                <line x1="8" y1="22" x2="16" y2="22" stroke="white" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </Box>
          </Box>
        )}

        {/* Recording state */}
        {isRecording && (
          <Box sx={{ textAlign: 'center', width: '100%', maxWidth: 400 }}>
            {/* Timer */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1.5, mb: 3 }}>
              <Box
                className="rec-dot"
                sx={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  backgroundColor: COLORS.rose,
                }}
              />
              <Typography
                sx={{
                  fontFamily: '"DM Mono", monospace',
                  fontSize: '2.5rem',
                  fontWeight: 500,
                  color: COLORS.ink,
                  lineHeight: 1,
                  letterSpacing: '0.04em',
                }}
              >
                {formatTime(recordingTime)}
              </Typography>
            </Box>

            {/* Waveform bars */}
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '4px', mb: 4, height: 36 }}>
              {Array.from({ length: 18 }).map((_, i) => (
                <Box
                  key={i}
                  sx={{
                    width: 3,
                    borderRadius: 2,
                    backgroundColor: COLORS.gold,
                    opacity: 0.5 + (i % 3) * 0.2,
                    animationName: 'waveform',
                    animationDuration: `${0.5 + (i * 0.07) % 0.5}s`,
                    animationTimingFunction: 'ease-in-out',
                    animationIterationCount: 'infinite',
                    animationDelay: `${(i * 0.06) % 0.4}s`,
                    height: `${28 + ((i * 7) % 20)}px`,
                  }}
                />
              ))}
            </Box>

            <Button
              onClick={stopRecording}
              sx={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                backgroundColor: COLORS.rose,
                minWidth: 'unset',
                minHeight: 'unset',
                padding: 0,
                mx: 'auto',
                display: 'flex',
                '&:hover': { backgroundColor: '#9F1239' },
              }}
            >
              <Box sx={{ width: 22, height: 22, borderRadius: '3px', backgroundColor: '#fff' }} />
            </Button>
            <Typography variant="body2" sx={{ mt: 2, color: COLORS.inkFaint }}>
              Click to stop
            </Typography>
          </Box>
        )}

        {/* Preview state */}
        {hasRecording && !isRecording && (
          <Box sx={{ textAlign: 'center', width: '100%', maxWidth: 480 }}>
            <Typography variant="body2" sx={{ color: COLORS.inkFaint, mb: 2, fontStyle: 'italic' }}>
              Recording ready — {formatTime(recordingTime)}
            </Typography>
            <audio src={mediaBlobUrl} controls style={{ width: '100%', marginBottom: '20px' }} />
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Button
                variant="contained"
                onClick={handleUpload}
                disabled={uploading}
                startIcon={uploading ? <CircularProgress size={18} sx={{ color: '#fff' }} /> : undefined}
              >
                {uploading ? 'Saving…' : 'Save recording'}
              </Button>
              <Button variant="outlined" onClick={handleClear} disabled={uploading}>
                Discard
              </Button>
            </Box>
          </Box>
        )}
      </Box>
    </Box>
  );
}
