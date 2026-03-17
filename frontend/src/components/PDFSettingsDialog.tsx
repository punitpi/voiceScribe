import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Slider,
  Switch,
  Box,
  Typography,
  Divider,
} from '@mui/material';
import type { PDFSettings } from '../types';

interface PDFSettingsDialogProps {
  open: boolean;
  onClose: () => void;
  onGenerate: (settings: Partial<PDFSettings>) => void;
  generating: boolean;
}

export default function PDFSettingsDialog({
  open,
  onClose,
  onGenerate,
  generating,
}: PDFSettingsDialogProps) {
  const [settings, setSettings] = useState<Partial<PDFSettings>>({
    pageSize: 'A4',
    fontSize: 12,
    lineSpacing: 1.5,
    includeHeader: true,
    includePageNumbers: true,
  });

  const handleGenerate = () => {
    onGenerate(settings);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Typography variant="h5">PDF Settings</Typography>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ py: 2 }}>
          {/* Page Size */}
          <FormControl component="fieldset" fullWidth sx={{ mb: 3 }}>
            <FormLabel component="legend" sx={{ fontSize: '1.125rem', mb: 1 }}>
              Page Size
            </FormLabel>
            <RadioGroup
              value={settings.pageSize}
              onChange={(e) => setSettings({ ...settings, pageSize: e.target.value as 'A4' | 'Letter' })}
            >
              <FormControlLabel
                value="A4"
                control={<Radio size="medium" />}
                label={<Typography sx={{ fontSize: '1.125rem' }}>A4 (Standard)</Typography>}
              />
              <FormControlLabel
                value="Letter"
                control={<Radio size="medium" />}
                label={<Typography sx={{ fontSize: '1.125rem' }}>Letter (US)</Typography>}
              />
            </RadioGroup>
          </FormControl>

          <Divider sx={{ my: 3 }} />

          {/* Font Size */}
          <FormControl component="fieldset" fullWidth sx={{ mb: 3 }}>
            <FormLabel component="legend" sx={{ fontSize: '1.125rem', mb: 2 }}>
              Font Size: {settings.fontSize}pt
            </FormLabel>
            <Box sx={{ px: 2 }}>
              <Slider
                value={settings.fontSize}
                onChange={(_, value) => setSettings({ ...settings, fontSize: value as number })}
                min={10}
                max={14}
                step={1}
                marks={[
                  { value: 10, label: '10pt' },
                  { value: 12, label: '12pt' },
                  { value: 14, label: '14pt' },
                ]}
                valueLabelDisplay="auto"
              />
            </Box>
          </FormControl>

          <Divider sx={{ my: 3 }} />

          {/* Line Spacing */}
          <FormControl component="fieldset" fullWidth sx={{ mb: 3 }}>
            <FormLabel component="legend" sx={{ fontSize: '1.125rem', mb: 1 }}>
              Line Spacing
            </FormLabel>
            <RadioGroup
              value={settings.lineSpacing}
              onChange={(e) => setSettings({ ...settings, lineSpacing: parseFloat(e.target.value) })}
            >
              <FormControlLabel
                value={1.5}
                control={<Radio size="medium" />}
                label={<Typography sx={{ fontSize: '1.125rem' }}>1.5 (Standard)</Typography>}
              />
              <FormControlLabel
                value={2.0}
                control={<Radio size="medium" />}
                label={<Typography sx={{ fontSize: '1.125rem' }}>2.0 (Double Spaced)</Typography>}
              />
            </RadioGroup>
          </FormControl>

          <Divider sx={{ my: 3 }} />

          {/* Include Header */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography sx={{ fontSize: '1.125rem' }}>Include Header (Title & Author)</Typography>
            <Switch
              checked={settings.includeHeader}
              onChange={(e) => setSettings({ ...settings, includeHeader: e.target.checked })}
              size="medium"
            />
          </Box>

          {/* Include Page Numbers */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography sx={{ fontSize: '1.125rem' }}>Include Page Numbers</Typography>
            <Switch
              checked={settings.includePageNumbers}
              onChange={(e) => setSettings({ ...settings, includePageNumbers: e.target.checked })}
              size="medium"
            />
          </Box>
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 3 }}>
        <Button onClick={onClose} variant="outlined" size="large" disabled={generating}>
          Cancel
        </Button>
        <Button
          onClick={handleGenerate}
          variant="contained"
          color="primary"
          size="large"
          disabled={generating}
        >
          {generating ? 'Generating...' : 'Generate PDF'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
