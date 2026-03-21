import { useState, useEffect, useCallback, useRef } from 'react';
import { Box, TextField, Typography, Alert } from '@mui/material';
import { getErrorMessage } from '../utils/getErrorMessage';
import { COLORS } from '../theme/theme';

interface TextEditorProps {
  initialContent: string;
  onSave: (content: string) => Promise<void>;
  autoSaveDelay?: number;
  projectTitle?: string;
}

export default function TextEditor({ initialContent, onSave, autoSaveDelay = 3000 }: TextEditorProps) {
  const [content, setContent] = useState(initialContent);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  const [error, setError] = useState<string | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedContentRef = useRef(initialContent);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setContent(initialContent);
    lastSavedContentRef.current = initialContent;
  }, [initialContent]);

  const trimmed = content.trim();
  const wordCount = trimmed ? trimmed.split(/\s+/).length : 0;
  const charCount = content.length;
  const pageEst = Math.max(1, Math.ceil(wordCount / 250));

  const handleSave = useCallback(async () => {
    if (content === lastSavedContentRef.current) return;
    try {
      setSaveStatus('saving');
      setError(null);
      await onSave(content);
      lastSavedContentRef.current = content;
      setSaveStatus('saved');
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Failed to save document'));
      setSaveStatus('unsaved');
    }
  }, [content, onSave]);

  useEffect(() => {
    if (content !== lastSavedContentRef.current) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSaveStatus('unsaved');
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(handleSave, autoSaveDelay);
    }
    return () => { if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current); };
  }, [content, handleSave, autoSaveDelay]);

  return (
    <Box>
      {/* Toolbar */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 2,
          mb: 2,
          px: 0,
        }}
      >
        {/* Stats */}
        <Box sx={{ display: 'flex', gap: 3, alignItems: 'center', flexWrap: 'wrap' }}>
          {[
            { value: wordCount.toLocaleString(), label: 'words' },
            { value: charCount.toLocaleString(), label: 'chars' },
            { value: `~${pageEst}`, label: pageEst === 1 ? 'page' : 'pages' },
          ].map(({ value, label }) => (
            <Box key={label} sx={{ display: 'flex', alignItems: 'baseline', gap: '3px' }}>
              <Typography
                sx={{
                  fontFamily: '"Playfair Display", Georgia, serif',
                  fontSize: '1.35rem',
                  fontWeight: 700,
                  color: COLORS.ink,
                  lineHeight: 1,
                }}
              >
                {value}
              </Typography>
              <Typography
                sx={{
                  fontFamily: '"DM Mono", monospace',
                  fontSize: '0.68rem',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: COLORS.inkFaint,
                }}
              >
                {label}
              </Typography>
            </Box>
          ))}
        </Box>

        {/* Save status */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {saveStatus === 'saving' && (
            <>
              <Box
                sx={{
                  width: 6, height: 6, borderRadius: '50%',
                  backgroundColor: COLORS.gold,
                  animation: 'recording-pulse 1s ease infinite',
                }}
              />
              <Typography sx={{ fontFamily: '"DM Mono", monospace', fontSize: '0.78rem', color: COLORS.inkFaint }}>
                saving…
              </Typography>
            </>
          )}
          {saveStatus === 'saved' && (
            <>
              <Box sx={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: COLORS.sage }} />
              <Typography sx={{ fontFamily: '"DM Mono", monospace', fontSize: '0.78rem', color: COLORS.sage }}>
                saved
              </Typography>
            </>
          )}
          {saveStatus === 'unsaved' && (
            <Typography sx={{ fontFamily: '"DM Mono", monospace', fontSize: '0.78rem', color: COLORS.inkFaint }}>
              unsaved
            </Typography>
          )}
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Editor */}
      <Box
        sx={{
          border: `1px solid ${COLORS.border}`,
          borderRadius: '8px',
          overflow: 'hidden',
          backgroundColor: '#FFFEF9',
          boxShadow: 'inset 0 1px 4px rgba(28,25,23,0.04)',
        }}
      >
        <TextField
          multiline
          fullWidth
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Begin writing here… your words will be saved automatically."
          variant="standard"
          InputProps={{ disableUnderline: true }}
          sx={{
            '& .MuiInputBase-root': {
              padding: '24px 32px',
              fontSize: '1.125rem',
              lineHeight: 1.85,
              fontFamily: '"Playfair Display", Georgia, serif',
              color: COLORS.ink,
              minHeight: '62vh',
              alignItems: 'flex-start',
              backgroundColor: 'transparent',
            },
            '& .MuiInputBase-input': {
              caretColor: COLORS.gold,
              '&::placeholder': {
                color: COLORS.inkFaint,
                fontStyle: 'italic',
                fontFamily: 'Georgia, serif',
                fontSize: '1.0625rem',
              },
            },
          }}
        />
      </Box>
    </Box>
  );
}
