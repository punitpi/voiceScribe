import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import {
  Box,
  Typography,
  Button,
  Alert,
  CircularProgress,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { recordingsApi, transcriptionsApi } from '../services/api';
import type { Recording } from '../types';
import { getErrorMessage } from '../utils/getErrorMessage';
import { COLORS } from '../theme/theme';
import { formatDateTime } from '../utils/formatDate';

const fadeUpAnimation = {
  '@keyframes fadeUp': {
    from: { opacity: 0, transform: 'translateY(6px)' },
    to: { opacity: 1, transform: 'translateY(0)' },
  },
} as const;

interface RecordingsListProps {
  recordings: Recording[];
  onRecordingDeleted: () => void;
  onTranscriptionComplete: () => void;
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; color: string; bg: string }> = {
    completed: { label: 'Transcribed', color: COLORS.sage, bg: COLORS.sagePale },
    transcribing: { label: 'Transcribing…', color: '#D97706', bg: '#FEF9C3' },
    failed: { label: 'Failed', color: COLORS.rose, bg: COLORS.rosePale },
    pending: { label: 'Pending', color: COLORS.inkFaint, bg: COLORS.divider },
  };
  const c = config[status] || config.pending;
  return (
    <Box
      sx={{
        fontFamily: '"DM Mono", monospace',
        fontSize: '0.7rem',
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        color: c.color,
        backgroundColor: c.bg,
        px: 1.5,
        py: 0.4,
        borderRadius: 3,
        display: 'inline-block',
        flexShrink: 0,
      }}
    >
      {c.label}
    </Box>
  );
}

export default function RecordingsList({ recordings, onRecordingDeleted, onTranscriptionComplete }: RecordingsListProps) {
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; recordingId?: number }>({ open: false });
  const [deleting, setDeleting] = useState(false);
  const [transcribing, setTranscribing] = useState<number | null>(null);
  const [transcriptionProgress, setTranscriptionProgress] = useState<{ recordingId: number; progress: number; message: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [viewDialog, setViewDialog] = useState<{ open: boolean; recording?: Recording; transcription?: string }>({ open: false });
  const [loadingTranscription, setLoadingTranscription] = useState(false);
  // Stable ref so socket setup runs only once (avoids reconnect on every parent re-render)
  const onTranscriptionCompleteRef = useRef(onTranscriptionComplete);
  useEffect(() => { onTranscriptionCompleteRef.current = onTranscriptionComplete; });

  useEffect(() => {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
    const sock = io(API_URL);
    sock.on('transcription:progress', (data: { recordingId: number; progress?: number; message?: string }) => {
      setTranscriptionProgress({ recordingId: data.recordingId, progress: data.progress || 50, message: data.message || 'Transcribing…' });
    });
    sock.on('transcription:complete', () => {
      setTranscriptionProgress(null);
      setTranscribing(null);
      onTranscriptionCompleteRef.current();
    });
    sock.on('transcription:error', (data: { message?: string }) => {
      setTranscriptionProgress(null);
      setTranscribing(null);
      setError(data.message || 'Transcription failed');
      onTranscriptionCompleteRef.current();
    });
    return () => { sock.close(); };
  }, []);

  const handleDelete = async () => {
    if (!deleteDialog.recordingId) return;
    try {
      setDeleting(true);
      await recordingsApi.delete(deleteDialog.recordingId);
      setDeleteDialog({ open: false });
      onRecordingDeleted();
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Failed to delete recording'));
    } finally {
      setDeleting(false);
    }
  };

  const handleViewTranscription = async (recording: Recording) => {
    try {
      setLoadingTranscription(true);
      const response = await transcriptionsApi.getByRecording(recording.id!);
      if (response.data.success && response.data.data) {
        setViewDialog({ open: true, recording, transcription: response.data.data.formatted_text || response.data.data.raw_text });
      }
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Failed to load transcription'));
    } finally {
      setLoadingTranscription(false);
    }
  };

  const handleTranscribe = async (recordingId: number) => {
    try {
      setTranscribing(recordingId);
      setError(null);
      setTranscriptionProgress({ recordingId, progress: 5, message: 'Starting…' });
      await transcriptionsApi.start(recordingId);
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Failed to start transcription'));
      setTranscribing(null);
      setTranscriptionProgress(null);
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '0 B';
    const kb = bytes / 1024;
    return kb < 1024 ? `${kb.toFixed(1)} KB` : `${(kb / 1024).toFixed(1)} MB`;
  };

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {recordings.map((recording, i) => (
          <Box
            key={recording.id}
            sx={{
              border: `1px solid ${COLORS.border}`,
              borderRadius: '8px',
              backgroundColor: COLORS.cream,
              p: 3,
              animation: `fadeUp 0.25s ease ${i * 0.04}s both`,
              ...fadeUpAnimation,
            }}
          >
            {/* Row 1: filename + status + delete */}
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 1.5 }}>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography
                  sx={{
                    fontWeight: 500,
                    fontSize: '1rem',
                    color: COLORS.ink,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {recording.original_filename || recording.filename}
                </Typography>
                <Typography
                  sx={{
                    fontFamily: '"DM Mono", monospace',
                    fontSize: '0.75rem',
                    color: COLORS.inkFaint,
                    mt: 0.25,
                  }}
                >
                  {formatFileSize(recording.file_size)} · {formatDateTime(recording.created_at)}
                </Typography>
              </Box>
              <StatusBadge status={recording.status} />
              <Box
                onClick={() => setDeleteDialog({ open: true, recordingId: recording.id })}
                sx={{
                  cursor: 'pointer',
                  color: COLORS.inkFaint,
                  lineHeight: 0,
                  p: 0.5,
                  borderRadius: '4px',
                  '&:hover': { color: COLORS.rose, backgroundColor: COLORS.rosePale },
                  transition: 'all 0.15s',
                  flexShrink: 0,
                }}
                title="Delete recording"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M2 4h12M5 4V2.5a.5.5 0 01.5-.5h5a.5.5 0 01.5.5V4M6 7v5M10 7v5M3 4l.8 9.5a.5.5 0 00.5.5h7.4a.5.5 0 00.5-.5L13 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </Box>
            </Box>

            {/* Actions */}
            {recording.status === 'pending' && (
              <Button
                size="small"
                variant="outlined"
                onClick={() => handleTranscribe(recording.id!)}
                disabled={transcribing !== null}
                sx={{ fontSize: '0.875rem' }}
              >
                {transcribing === recording.id ? (
                  <><CircularProgress size={14} sx={{ mr: 1 }} />Starting…</>
                ) : 'Transcribe'}
              </Button>
            )}

            {(recording.status === 'transcribing' || (transcriptionProgress?.recordingId === recording.id)) && (
              <Box sx={{ mt: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                  <CircularProgress size={16} />
                  <Typography sx={{ fontSize: '0.9rem', color: COLORS.inkLight }}>
                    {transcriptionProgress?.message || 'Transcribing…'}
                  </Typography>
                </Box>
                <LinearProgress
                  variant={transcriptionProgress?.progress ? 'determinate' : 'indeterminate'}
                  value={transcriptionProgress?.progress || 0}
                />
                {transcriptionProgress?.progress && (
                  <Typography sx={{ fontFamily: '"DM Mono", monospace', fontSize: '0.72rem', color: COLORS.inkFaint, mt: 0.5 }}>
                    {transcriptionProgress.progress}%
                  </Typography>
                )}
              </Box>
            )}

            {recording.status === 'completed' && (
              <Button
                size="small"
                variant="outlined"
                onClick={() => handleViewTranscription(recording)}
                disabled={loadingTranscription}
                sx={{ fontSize: '0.875rem' }}
              >
                {loadingTranscription ? <CircularProgress size={14} sx={{ mr: 1 }} /> : null}
                View transcription
              </Button>
            )}

            {recording.status === 'failed' && (
              <Box>
                <Alert severity="error" sx={{ mb: 1.5, py: 0.5 }}>
                  Transcription failed — you can retry or delete this recording.
                </Alert>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => handleTranscribe(recording.id!)}
                  disabled={transcribing !== null}
                  sx={{ fontSize: '0.875rem' }}
                >
                  Retry
                </Button>
              </Box>
            )}
          </Box>
        ))}
      </Box>

      {/* Delete dialog */}
      <Dialog open={deleteDialog.open} onClose={() => !deleting && setDeleteDialog({ open: false })}>
        <DialogTitle>Delete this recording?</DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ color: COLORS.inkLight }}>
            This cannot be undone. The audio file and any transcription will be permanently removed.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button variant="outlined" onClick={() => setDeleteDialog({ open: false })} disabled={deleting}>
            Cancel
          </Button>
          <Button
            onClick={handleDelete}
            disabled={deleting}
            sx={{
              backgroundColor: COLORS.rose,
              color: '#fff',
              '&:hover': { backgroundColor: '#9F1239' },
            }}
          >
            {deleting ? <CircularProgress size={18} sx={{ color: '#fff' }} /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* View transcription dialog */}
      <Dialog open={viewDialog.open} onClose={() => setViewDialog({ open: false })} maxWidth="md" fullWidth>
        <DialogTitle>
          Transcription
          {viewDialog.recording && (
            <Typography
              variant="body2"
              sx={{
                fontFamily: '"DM Mono", monospace',
                fontSize: '0.78rem',
                color: COLORS.inkFaint,
                mt: 0.25,
              }}
            >
              {viewDialog.recording.original_filename || viewDialog.recording.filename}
            </Typography>
          )}
        </DialogTitle>
        <DialogContent>
          <Box
            sx={{
              p: 3,
              border: `1px solid ${COLORS.border}`,
              borderRadius: '8px',
              backgroundColor: '#FFFDF9',
              minHeight: 180,
              maxHeight: 460,
              overflow: 'auto',
            }}
          >
            <Typography
              sx={{
                whiteSpace: 'pre-wrap',
                fontSize: '1.35rem',
                lineHeight: 2,
                fontFamily: 'Georgia, serif',
                color: COLORS.ink,
              }}
            >
              {viewDialog.transcription || 'No transcription available'}
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button variant="contained" onClick={() => setViewDialog({ open: false })}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
