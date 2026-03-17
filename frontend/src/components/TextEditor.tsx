import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box,
  TextField,
  Typography,
  Chip,
  CircularProgress,
  Alert,
  Paper,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

interface TextEditorProps {
  initialContent: string;
  onSave: (content: string) => Promise<void>;
  autoSaveDelay?: number; // milliseconds
  projectTitle?: string;
}

export default function TextEditor({
  initialContent,
  onSave,
  autoSaveDelay = 3000,
  projectTitle,
}: TextEditorProps) {
  const [content, setContent] = useState(initialContent);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  const [error, setError] = useState<string | null>(null);
  const [wordCount, setWordCount] = useState(0);
  const [characterCount, setCharacterCount] = useState(0);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedContentRef = useRef(initialContent);

  // Update content when initialContent changes
  useEffect(() => {
    setContent(initialContent);
    lastSavedContentRef.current = initialContent;
  }, [initialContent]);

  // Calculate word and character count
  useEffect(() => {
    const words = content.trim().split(/\s+/).filter(w => w.length > 0);
    setWordCount(words.length);
    setCharacterCount(content.length);
  }, [content]);

  // Auto-save logic
  const handleSave = useCallback(async () => {
    if (content === lastSavedContentRef.current) {
      return; // No changes to save
    }

    try {
      setSaveStatus('saving');
      setError(null);
      await onSave(content);
      lastSavedContentRef.current = content;
      setSaveStatus('saved');
    } catch (err: any) {
      console.error('Failed to save:', err);
      setError(err.response?.data?.error || 'Failed to save document');
      setSaveStatus('unsaved');
    }
  }, [content, onSave]);

  // Debounced auto-save
  useEffect(() => {
    if (content !== lastSavedContentRef.current) {
      setSaveStatus('unsaved');

      // Clear existing timeout
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      // Set new timeout
      saveTimeoutRef.current = setTimeout(() => {
        handleSave();
      }, autoSaveDelay);
    }

    // Cleanup
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [content, handleSave, autoSaveDelay]);

  const handleContentChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(event.target.value);
  };

  return (
    <Box>
      {/* Header */}
      <Paper
        sx={{
          p: 2,
          mb: 2,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 2,
        }}
      >
        <Box>
          {projectTitle && (
            <Typography variant="h6" gutterBottom>
              {projectTitle}
            </Typography>
          )}
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <Chip
              label={`${wordCount} words`}
              size="medium"
              color="primary"
              variant="outlined"
            />
            <Chip
              label={`${characterCount} characters`}
              size="medium"
              color="primary"
              variant="outlined"
            />
            <Chip
              label={`~${Math.ceil(wordCount / 250)} pages`}
              size="medium"
              color="primary"
              variant="outlined"
            />
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {saveStatus === 'saving' && (
            <>
              <CircularProgress size={20} />
              <Typography variant="body2" color="text.secondary">
                Saving...
              </Typography>
            </>
          )}
          {saveStatus === 'saved' && (
            <>
              <CheckCircleIcon color="success" />
              <Typography variant="body2" color="success.main">
                All changes saved
              </Typography>
            </>
          )}
          {saveStatus === 'unsaved' && (
            <>
              <SaveIcon color="action" />
              <Typography variant="body2" color="text.secondary">
                Unsaved changes
              </Typography>
            </>
          )}
        </Box>
      </Paper>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Editor */}
      <TextField
        multiline
        fullWidth
        value={content}
        onChange={handleContentChange}
        placeholder="Start writing your book here... All changes are automatically saved."
        sx={{
          '& .MuiInputBase-root': {
            fontSize: '1.125rem',
            lineHeight: 1.8,
            fontFamily: 'Georgia, serif',
            minHeight: '60vh',
            alignItems: 'flex-start',
          },
          '& .MuiInputBase-input': {
            p: 3,
          },
        }}
        InputProps={{
          sx: {
            fontSize: '1.125rem',
          },
        }}
      />
    </Box>
  );
}
