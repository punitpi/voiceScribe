/**
 * Text Auto-Formatting Service
 * Handles capitalization, paragraph detection, punctuation, and text cleanup
 */

interface WordTimestamp {
  word: string;
  start: number;
  end: number;
}

interface FormattingOptions {
  removeFillersWords?: boolean;
  minParagraphSentences?: number;
  pauseThreshold?: number; // seconds for paragraph break
  language?: 'en' | 'kn';
}

// Common abbreviations that should not trigger sentence end
const ABBREVIATIONS = [
  'Dr', 'Mr', 'Mrs', 'Ms', 'Prof', 'Sr', 'Jr',
  'vs', 'etc', 'Inc', 'Ltd', 'Co', 'Corp',
  'St', 'Ave', 'Rd', 'Blvd', 'Dept', 'Fig',
  'Vol', 'No', 'Rev', 'Gen', 'Rep', 'Sen',
  'U.S', 'U.K', 'Ph.D', 'M.D', 'B.A', 'M.A'
];

// Common filler words to remove
const FILLER_WORDS = [
  'um', 'uh', 'umm', 'uhh', 'er', 'ah', 'like',
  'you know', 'i mean', 'sort of', 'kind of',
  'actually', 'basically', 'literally', 'seriously',
  'honestly', 'right', 'okay'
];

// Spoken punctuation that should be converted
const SPOKEN_PUNCTUATION: { [key: string]: string } = {
  'comma': ',',
  'period': '.',
  'question mark': '?',
  'exclamation mark': '!',
  'exclamation point': '!',
  'colon': ':',
  'semicolon': ';',
  'dash': '—',
  'hyphen': '-',
  'quote': '"',
  'apostrophe': "'",
  'open quote': '"',
  'close quote': '"',
  'new paragraph': '\n\n',
  'paragraph break': '\n\n',
  'new line': '\n'
};

// Chapter/section keywords (English and Kannada)
const CHAPTER_KEYWORDS = {
  en: ['chapter', 'section', 'part', 'volume', 'book', 'act', 'scene'],
  kn: ['ಅಧ್ಯಾಯ', 'ಭಾಗ', 'ವಿಭಾಗ', 'ಖಂಡ']
};

/**
 * Capitalize first letter of each sentence
 */
export const capitalizeSentences = (text: string): string => {
  // Start of text
  text = text.charAt(0).toUpperCase() + text.slice(1);

  // After sentence-ending punctuation
  text = text.replace(/([.!?])\s+([a-z])/g, (match, punct, letter) => {
    return punct + ' ' + letter.toUpperCase();
  });

  // After line breaks
  text = text.replace(/\n([a-z])/g, (match, letter) => {
    return '\n' + letter.toUpperCase();
  });

  return text;
};

/**
 * Check if a word is an abbreviation
 */
const isAbbreviation = (word: string): boolean => {
  const cleaned = word.replace(/\./g, '');
  return ABBREVIATIONS.includes(cleaned);
};

/**
 * Smart capitalize that respects abbreviations
 */
export const smartCapitalize = (text: string): string => {
  const sentences: string[] = [];
  let currentSentence = '';
  const words = text.split(/\s+/);

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    currentSentence += (currentSentence ? ' ' : '') + word;

    // Check if sentence ends
    if (word.match(/[.!?]$/)) {
      const wordWithoutPunct = word.replace(/[.!?]$/, '');

      // Don't break if it's an abbreviation
      if (!isAbbreviation(wordWithoutPunct)) {
        sentences.push(currentSentence);
        currentSentence = '';
      }
    }
  }

  // Add any remaining text
  if (currentSentence) {
    sentences.push(currentSentence);
  }

  // Capitalize first letter of each sentence
  return sentences
    .map(s => s.trim())
    .filter(s => s)
    .map(s => s.charAt(0).toUpperCase() + s.slice(1))
    .join(' ');
};

/**
 * Remove filler words from text
 */
export const removeFillerWords = (text: string, language: 'en' | 'kn' = 'en'): string => {
  if (language !== 'en') {
    // Only implemented for English currently
    return text;
  }

  let cleaned = text;

  // Remove multi-word fillers first
  const multiWordFillers = FILLER_WORDS.filter(f => f.includes(' '));
  multiWordFillers.forEach(filler => {
    const regex = new RegExp(`\\b${filler}\\b`, 'gi');
    cleaned = cleaned.replace(regex, '');
  });

  // Remove single-word fillers
  const singleWordFillers = FILLER_WORDS.filter(f => !f.includes(' '));
  singleWordFillers.forEach(filler => {
    const regex = new RegExp(`\\b${filler}\\b`, 'gi');
    cleaned = cleaned.replace(regex, '');
  });

  // Clean up multiple spaces
  cleaned = cleaned.replace(/\s{2,}/g, ' ');

  // Clean up spaces around punctuation
  cleaned = cleaned.replace(/\s+([,.:;!?])/g, '$1');

  return cleaned.trim();
};

/**
 * Fix repeated words (stuttering)
 */
export const removeRepeatedWords = (text: string): string => {
  // Match repeated words (case insensitive)
  return text.replace(/\b(\w+)(\s+\1\b)+/gi, '$1');
};

/**
 * Replace spoken punctuation with actual punctuation
 */
export const replaceSpokenPunctuation = (text: string): string => {
  let result = text;

  Object.entries(SPOKEN_PUNCTUATION).forEach(([spoken, punct]) => {
    const regex = new RegExp(`\\b${spoken}\\b`, 'gi');
    result = result.replace(regex, punct);
  });

  return result;
};

/**
 * Fix spacing around punctuation
 */
export const fixPunctuationSpacing = (text: string): string => {
  let fixed = text;

  // Remove space before punctuation
  fixed = fixed.replace(/\s+([,.:;!?])/g, '$1');

  // Add space after punctuation if missing
  fixed = fixed.replace(/([,.:;!?])([A-Za-z])/g, '$1 $2');

  // Handle quotation marks
  fixed = fixed.replace(/"\s+/g, '" ');
  fixed = fixed.replace(/\s+"/g, ' "');

  // Clean up multiple spaces
  fixed = fixed.replace(/\s{2,}/g, ' ');

  return fixed.trim();
};

/**
 * Detect paragraphs based on pauses in timestamps
 */
export const detectParagraphs = (
  text: string,
  timestamps?: WordTimestamp[],
  pauseThreshold: number = 2.0
): string => {
  if (!timestamps || timestamps.length === 0) {
    // Fallback: split on multiple sentence ends
    return text.replace(/([.!?])\s+([A-Z])/g, '$1\n\n$2');
  }

  let result = '';
  let currentParagraph = '';

  for (let i = 0; i < timestamps.length; i++) {
    const current = timestamps[i];
    const next = timestamps[i + 1];

    currentParagraph += (currentParagraph ? ' ' : '') + current.word;

    if (next) {
      const pause = next.start - current.end;

      // If pause is longer than threshold, start new paragraph
      if (pause >= pauseThreshold) {
        result += currentParagraph.trim() + '\n\n';
        currentParagraph = '';
      }
    }
  }

  // Add remaining text
  if (currentParagraph) {
    result += currentParagraph.trim();
  }

  return result;
};

/**
 * Detect and format chapter markers
 */
export const detectChapterMarkers = (text: string, language: 'en' | 'kn' = 'en'): string => {
  const keywords = CHAPTER_KEYWORDS[language];
  if (!keywords || !Array.isArray(keywords)) {
    return text;
  }

  let result = text;

  keywords.forEach(keyword => {
    // Match "Chapter 1", "Chapter One", "Chapter: Introduction", etc.
    const patterns = [
      new RegExp(`\\b${keyword}\\s+(\\d+)`, 'gi'),
      new RegExp(`\\b${keyword}\\s+([a-z]+)`, 'gi'),
      new RegExp(`\\b${keyword}:?\\s+([^.]+)`, 'gi')
    ];

    patterns.forEach(pattern => {
      result = result.replace(pattern, (match) => {
        // Add markers for chapter (will be styled in frontend)
        return `\n\n## ${match.trim()}\n\n`;
      });
    });
  });

  return result;
};

/**
 * Main formatting function
 */
export const formatTranscription = (
  text: string,
  timestamps?: WordTimestamp[],
  options: FormattingOptions = {}
): string => {
  const {
    removeFillersWords = true,
    minParagraphSentences = 2,
    pauseThreshold = 2.0,
    language = 'en'
  } = options;

  let formatted = text;

  // Step 1: Replace spoken punctuation
  formatted = replaceSpokenPunctuation(formatted);

  // Step 2: Remove filler words (if enabled)
  if (removeFillersWords) {
    formatted = removeFillerWords(formatted, language);
  }

  // Step 3: Remove repeated words
  formatted = removeRepeatedWords(formatted);

  // Step 4: Fix punctuation spacing
  formatted = fixPunctuationSpacing(formatted);

  // Step 5: Detect paragraphs using timestamps
  formatted = detectParagraphs(formatted, timestamps, pauseThreshold);

  // Step 6: Detect chapter markers
  formatted = detectChapterMarkers(formatted, language);

  // Step 7: Smart capitalization
  formatted = smartCapitalize(formatted);

  // Step 8: Final cleanup
  formatted = formatted.replace(/\n{3,}/g, '\n\n'); // Max 2 line breaks
  formatted = formatted.replace(/^\s+|\s+$/g, ''); // Trim

  return formatted;
};

/**
 * Quick format without timestamps (for manual text)
 */
export const quickFormat = (text: string, language: 'en' | 'kn' = 'en'): string => {
  return formatTranscription(text, undefined, { language });
};
