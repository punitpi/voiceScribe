import { Box } from '@mui/material';
import { COLORS } from '../theme/theme';

interface LanguagePillProps {
  language: 'en' | 'kn';
}

export default function LanguagePill({ language }: LanguagePillProps) {
  return (
    <Box
      sx={{
        fontFamily: '"DM Mono", monospace',
        fontSize: '0.7rem',
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        color: COLORS.gold,
        backgroundColor: COLORS.goldPale,
        px: 1.5,
        py: 0.5,
        borderRadius: 3,
        display: 'inline-block',
      }}
    >
      {language === 'kn' ? 'ಕನ್ನಡ' : 'English'}
    </Box>
  );
}
