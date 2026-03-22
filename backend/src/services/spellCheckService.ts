/**
 * AI-powered Spell Checking Service using OpenAI
 */
import axios from 'axios';
import { getDb } from '../config/database';

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

// Get API key at runtime
const getOpenAIKey = () => {
  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    throw new Error('OPENAI_API_KEY not configured');
  }
  return key;
};

interface SpellCheckError {
  word: string;
  position: number;
  suggestions: string[];
  context: string;
  inCustomDictionary: boolean;
}

/**
 * Check text for spelling errors using OpenAI
 */
export const checkText = async (
  text: string,
  userId: number | null = null,
  projectId: number | null = null,
  language: 'en' | 'kn' = 'en'
): Promise<SpellCheckError[]> => {
  try {
    // Get custom dictionary words
    const customWords = await getCustomDictionary(userId, projectId);
    const customWordsStr = customWords.length > 0
      ? `\n\nCustom dictionary (these words are CORRECT): ${customWords.join(', ')}`
      : '';

    const prompt = `You are a spell checker. Analyze the following text and identify ONLY the misspelled words.

Text to check:
"""
${text}
"""
${customWordsStr}

Return a JSON array of misspelled words with this exact format:
[
  {
    "word": "mispeled_word",
    "position": 0,
    "suggestions": ["suggestion1", "suggestion2", "suggestion3"],
    "context": "the sentence containing the word"
  }
]

Rules:
1. ONLY include actual spelling errors
2. IGNORE proper nouns, acronyms, and technical terms
3. IGNORE words in the custom dictionary
4. Provide 3 suggestions per error
5. Return ONLY the JSON array, no other text
6. If no errors found, return []`;

    const response = await axios.post(
      OPENAI_API_URL,
      {
        model: 'gpt-4o-mini', // Fast and cheap model
        messages: [
          {
            role: 'system',
            content: 'You are a precise spell checker. Return only valid JSON arrays.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.1,
        max_tokens: 1000
      },
      {
        headers: {
          'Authorization': `Bearer ${getOpenAIKey()}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const content = response.data.choices[0]?.message?.content || '[]';

    // Try to parse JSON from the response
    let errors: SpellCheckError[] = [];
    try {
      // Extract JSON array from response (handle markdown code blocks)
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        errors = JSON.parse(jsonMatch[0]);
      }
    } catch (parseError) {
      console.error('Failed to parse spell check response:', content);
      return [];
    }

    // Add inCustomDictionary flag
    return errors.map(error => ({
      ...error,
      inCustomDictionary: false
    }));

  } catch (error: any) {
    console.error('Spell check error:', error.response?.data || error.message);
    return [];
  }
};

/**
 * Quick spell check - just count errors
 */
export const getWordStats = async (
  text: string,
  userId: number | null = null,
  projectId: number | null = null
): Promise<{
  totalWords: number;
  uniqueWords: number;
  misspelledCount: number;
}> => {
  const words = text.match(/\b[a-zA-Z]+\b/g) || [];
  const uniqueWords = new Set(words.map(w => w.toLowerCase()));

  const errors = await checkText(text, userId, projectId);

  return {
    totalWords: words.length,
    uniqueWords: uniqueWords.size,
    misspelledCount: errors.length
  };
};

/**
 * Add word to custom dictionary for a user/project
 */
export const addToCustomDictionary = async (
  userId: number | null,
  projectId: number | null,
  word: string,
  language: 'en' | 'kn' = 'en'
): Promise<void> => {
  await getDb().execute({
    sql: `INSERT INTO custom_dictionary (user_id, project_id, word, language)
          VALUES (?, ?, ?, ?)`,
    args: [userId, projectId, word.toLowerCase(), language],
  });
};

/**
 * Check if word is in custom dictionary
 */
export const isInCustomDictionary = async (
  userId: number | null,
  projectId: number | null,
  word: string
): Promise<boolean> => {
  const query = projectId
    ? 'SELECT COUNT(*) as count FROM custom_dictionary WHERE (user_id = ? OR user_id IS NULL) AND (project_id = ? OR project_id IS NULL) AND word = ?'
    : 'SELECT COUNT(*) as count FROM custom_dictionary WHERE (user_id = ? OR user_id IS NULL) AND project_id IS NULL AND word = ?';

  const args = projectId
    ? [userId, projectId, word.toLowerCase()]
    : [userId, word.toLowerCase()];

  const result = await getDb().execute({ sql: query, args });
  const row = result.rows[0] as unknown as { count: number };
  return row.count > 0;
};

/**
 * Get all custom dictionary words for a user/project
 */
export const getCustomDictionary = async (
  userId: number | null,
  projectId: number | null
): Promise<string[]> => {
  const query = projectId
    ? 'SELECT DISTINCT word FROM custom_dictionary WHERE (user_id = ? OR user_id IS NULL) AND (project_id = ? OR project_id IS NULL)'
    : 'SELECT DISTINCT word FROM custom_dictionary WHERE (user_id = ? OR user_id IS NULL) AND project_id IS NULL';

  const args = projectId ? [userId, projectId] : [userId];

  const result = await getDb().execute({ sql: query, args });
  return result.rows.map(row => (row as unknown as { word: string }).word);
};

/**
 * Remove word from custom dictionary
 */
export const removeFromCustomDictionary = async (
  userId: number | null,
  projectId: number | null,
  word: string
): Promise<void> => {
  const query = projectId
    ? 'DELETE FROM custom_dictionary WHERE user_id = ? AND project_id = ? AND word = ?'
    : 'DELETE FROM custom_dictionary WHERE user_id = ? AND project_id IS NULL AND word = ?';

  const args = projectId
    ? [userId, projectId, word.toLowerCase()]
    : [userId, word.toLowerCase()];

  await getDb().execute({ sql: query, args });
};

/**
 * Correct text automatically using OpenAI
 */
export const correctText = async (
  text: string,
  language: 'en' | 'kn' = 'en'
): Promise<string> => {
  try {
    const prompt = `Correct ONLY the spelling errors in the following text. Keep everything else exactly the same (grammar, punctuation, formatting, capitalization).

Text:
"""
${text}
"""

Return ONLY the corrected text, no explanations.`;

    const response = await axios.post(
      OPENAI_API_URL,
      {
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a spell checker. Correct only spelling errors. Do not change grammar, style, or formatting.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.1,
        max_tokens: 2000
      },
      {
        headers: {
          'Authorization': `Bearer ${getOpenAIKey()}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data.choices[0]?.message?.content?.trim() || text;

  } catch (error: any) {
    console.error('Text correction error:', error.response?.data || error.message);
    return text; // Return original text on error
  }
};
