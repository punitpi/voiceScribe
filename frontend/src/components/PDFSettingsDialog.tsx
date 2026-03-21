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
  CircularProgress,
} from '@mui/material';
import type { PDFSettings } from '../types';
import { COLORS } from '../theme/theme';

interface PDFSettingsDialogProps {
  open: boolean;
  onClose: () => void;
  onGenerate: (settings: Partial<PDFSettings>) => void;
  generating: boolean;
}

export default function PDFSettingsDialog({ open, onClose, onGenerate, generating }: PDFSettingsDialogProps) {
  const [settings, setSettings] = useState<Partial<PDFSettings>>({
    pageSize: 'A4',
    fontSize: 12,
    lineSpacing: 1.5,
    includeHeader: true,
    includePageNumbers: true,
  });

  const labelSx = {
    fontFamily: '"DM Mono", monospace',
    fontSize: '0.7rem',
    letterSpacing: '0.1em',
    textTransform: 'uppercase' as const,
    color: COLORS.inkFaint,
    mb: 1.5,
    display: 'block',
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Export to PDF</DialogTitle>
      <DialogContent sx={{ pt: '16px !important' }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Page Size */}
          <FormControl component="fieldset" fullWidth>
            <FormLabel component="legend" sx={labelSx}>Page size</FormLabel>
            <RadioGroup
              row
              value={settings.pageSize}
              onChange={(e) => setSettings({ ...settings, pageSize: e.target.value as 'A4' | 'Letter' })}
              sx={{ gap: 3 }}
            >
              {['A4', 'Letter'].map((v) => (
                <FormControlLabel
                  key={v}
                  value={v}
                  control={<Radio size="small" sx={{ '&.Mui-checked': { color: COLORS.gold } }} />}
                  label={<Typography sx={{ fontSize: '0.975rem', color: COLORS.inkLight }}>{v}</Typography>}
                />
              ))}
            </RadioGroup>
          </FormControl>

          <Divider />

          {/* Font Size */}
          <FormControl component="fieldset" fullWidth>
            <Typography sx={labelSx}>
              Font size — {settings.fontSize}pt
            </Typography>
            <Slider
              value={settings.fontSize}
              onChange={(_, value) => setSettings({ ...settings, fontSize: value as number })}
              min={10} max={14} step={1}
              marks={[{ value: 10, label: '10' }, { value: 12, label: '12' }, { value: 14, label: '14' }]}
              valueLabelDisplay="auto"
              sx={{
                color: COLORS.gold,
                '& .MuiSlider-markLabel': { fontSize: '0.78rem', color: COLORS.inkFaint },
                '& .MuiSlider-thumb': { backgroundColor: COLORS.gold },
                '& .MuiSlider-track': { backgroundColor: COLORS.gold, border: 'none' },
                '& .MuiSlider-rail': { backgroundColor: COLORS.border },
              }}
            />
          </FormControl>

          <Divider />

          {/* Line Spacing */}
          <FormControl component="fieldset" fullWidth>
            <FormLabel component="legend" sx={labelSx}>Line spacing</FormLabel>
            <RadioGroup
              row
              value={settings.lineSpacing}
              onChange={(e) => setSettings({ ...settings, lineSpacing: parseFloat(e.target.value) })}
              sx={{ gap: 3 }}
            >
              {[{ v: 1.5, label: '1.5 — Standard' }, { v: 2.0, label: '2.0 — Double' }].map(({ v, label }) => (
                <FormControlLabel
                  key={v}
                  value={v}
                  control={<Radio size="small" sx={{ '&.Mui-checked': { color: COLORS.gold } }} />}
                  label={<Typography sx={{ fontSize: '0.975rem', color: COLORS.inkLight }}>{label}</Typography>}
                />
              ))}
            </RadioGroup>
          </FormControl>

          <Divider />

          {/* Toggles */}
          {[
            { key: 'includeHeader', label: 'Include title & author header' },
            { key: 'includePageNumbers', label: 'Include page numbers' },
          ].map(({ key, label }) => (
            <Box key={key} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography sx={{ fontSize: '0.975rem', color: COLORS.inkLight }}>{label}</Typography>
              <Switch
                checked={!!(settings as Record<string, unknown>)[key]}
                onChange={(e) => setSettings({ ...settings, [key]: e.target.checked })}
                size="small"
                sx={{
                  '& .MuiSwitch-switchBase.Mui-checked': { color: COLORS.gold },
                  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: COLORS.gold },
                }}
              />
            </Box>
          ))}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button variant="outlined" onClick={onClose} disabled={generating}>
          Cancel
        </Button>
        <Button variant="contained" onClick={() => onGenerate(settings)} disabled={generating}>
          {generating ? <><CircularProgress size={16} sx={{ color: '#fff', mr: 1 }} />Generating…</> : 'Export PDF'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
