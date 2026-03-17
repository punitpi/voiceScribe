import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Box, Typography, Button } from '@mui/material';

const theme = createTheme();

export default function AppMinimal() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ p: 4 }}>
        <Typography variant="h3" gutterBottom>
          VoiceScribe is Working!
        </Typography>
        <Typography variant="body1" gutterBottom>
          If you see this, Material-UI is loaded correctly.
        </Typography>
        <Button variant="contained" sx={{ mt: 2 }}>
          Test Button
        </Button>
      </Box>
    </ThemeProvider>
  );
}
