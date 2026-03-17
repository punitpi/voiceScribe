import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';
import { db } from '../config/database';
import { Recording, Transcription } from '../types/models';
import { formatTranscription } from './textFormattingService';
import { getSocketIO } from '../config/socket';
import { transcribeWithBhashini, isBhashiniAvailable } from './bhashiniService';

const WHISPER_API_URL = 'https://api.openai.com/v1/audio/transcriptions';

// Get API key at runtime, not at module load time
const getOpenAIKey = () => {
  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    console.error('OPENAI_API_KEY not found in process.env');
    console.error('Available env keys:', Object.keys(process.env).filter(k => k.includes('OPENAI')));
  }
  return key;
};

// Retry configuration
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000; // 1 second

/**
 * Sleep utility for retry delays
 */
const sleep = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Calculate exponential backoff delay
 */
const getRetryDelay = (attempt: number): number => {
  return INITIAL_RETRY_DELAY * Math.pow(2, attempt);
};

/**
 * Transcribe audio file using OpenAI Whisper API
 */
export const transcribeAudio = async (
  recordingId: number,
  onProgress?: (status: string) => void
): Promise<Transcription> => {
  try {
    const OPENAI_API_KEY = getOpenAIKey();
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

    // Get recording details
    const recording = await new Promise<Recording>((resolve, reject) => {
      db.get('SELECT * FROM recordings WHERE id = ?', [recordingId], (err, row: Recording) => {
        if (err) reject(err);
        else if (!row) reject(new Error('Recording not found'));
        else resolve(row);
      });
    });

    // Update recording status to 'transcribing'
    await updateRecordingStatus(recordingId, 'transcribing');
    onProgress?.('transcribing');

    // Emit Socket.IO event
    try {
      const io = getSocketIO();
      io.emit('transcription:progress', {
        recordingId,
        status: 'transcribing',
        progress: 10,
        message: 'Preparing audio file for transcription...'
      });
    } catch (err) {
      console.warn('Socket.IO not available:', err);
    }

    const audioFilePath = path.join('./uploads/audio', recording.filename);

    if (!fs.existsSync(audioFilePath)) {
      throw new Error('Audio file not found on disk');
    }

    // Prepare form data for Whisper API
    const formData = new FormData();
    formData.append('file', fs.createReadStream(audioFilePath));
    formData.append('model', 'whisper-1');
    // Set language to ensure transcription stays in original language (not translated)
    if (recording.language === 'kn') {
      formData.append('language', 'kn'); // Kannada
      // Add a prompt with Kannada text to improve accuracy
      // This helps Whisper understand the context and use proper Kannada vocabulary
      formData.append('prompt', 'ಈ ಆಡಿಯೋ ಕನ್ನಡ ಭಾಷೆಯಲ್ಲಿದೆ. ದಯವಿಟ್ಟು ಸರಿಯಾದ ಕನ್ನಡ ಪದಗಳನ್ನು ಮತ್ತು ವ್ಯಾಕರಣವನ್ನು ಬಳಸಿ.');
      // Lower temperature for more accurate/consistent transcription
      formData.append('temperature', '0');
    } else {
      formData.append('language', 'en'); // English
      formData.append('temperature', '0'); // Lower temperature for accuracy
    }
    formData.append('response_format', 'verbose_json'); // Get detailed response with timestamps

    let lastError: Error | null = null;
    let attempt = 0;

    // Retry loop with exponential backoff
    while (attempt < MAX_RETRIES) {
      try {
        console.log(`Transcription attempt ${attempt + 1}/${MAX_RETRIES} for recording ${recordingId}`);

        // Emit progress update before API call (25%)
        try {
          const io = getSocketIO();
          io.emit('transcription:progress', {
            recordingId,
            status: 'transcribing',
            progress: 25,
            message: 'Sending audio to AI transcription service...'
          });
        } catch (err) {
          console.warn('Socket.IO not available:', err);
        }

        const response = await axios.post(WHISPER_API_URL, formData, {
          headers: {
            'Authorization': `Bearer ${getOpenAIKey()}`,
            ...formData.getHeaders()
          },
          timeout: 300000 // 5 minutes timeout (increased for longer audio files)
        });

        const { text, duration, language, words } = response.data;

        // Emit progress update after transcription completes (50%)
        try {
          const io = getSocketIO();
          io.emit('transcription:progress', {
            recordingId,
            status: 'transcribing',
            progress: 50,
            message: 'Transcription complete, applying formatting...'
          });
        } catch (err) {
          console.warn('Socket.IO not available:', err);
        }

        // Apply auto-formatting to the transcription
        const timestamps = words && Array.isArray(words) ? words.map((w: any) => ({
          word: w.word,
          start: w.start,
          end: w.end
        })) : undefined;

        const formattedText = formatTranscription(text, timestamps, {
          removeFillersWords: true,
          pauseThreshold: 2.0,
          language: (language || recording.language) as 'en' | 'kn'
        });

        // Emit progress update after formatting (75%)
        try {
          const io = getSocketIO();
          io.emit('transcription:progress', {
            recordingId,
            status: 'transcribing',
            progress: 75,
            message: 'Formatting complete, saving to database...'
          });
        } catch (err) {
          console.warn('Socket.IO not available:', err);
        }

        // Create transcription record
        const transcription = await createTranscription({
          recording_id: recordingId,
          raw_text: text,
          formatted_text: formattedText,
          word_count: countWords(formattedText),
          language: language || recording.language,
          confidence: 1.0 // Whisper doesn't provide confidence scores
        });

        // Update recording duration if available
        if (duration) {
          await updateRecordingDuration(recordingId, Math.round(duration));
        }

        // Update recording status to 'completed'
        await updateRecordingStatus(recordingId, 'completed');
        onProgress?.('completed');

        // Emit Socket.IO event for completion
        try {
          const io = getSocketIO();
          io.emit('transcription:complete', {
            recordingId,
            transcriptionId: transcription.id,
            status: 'completed',
            progress: 100,
            message: 'Transcription completed successfully!',
            wordCount: transcription.word_count
          });
        } catch (err) {
          console.warn('Socket.IO not available:', err);
        }

        console.log(`✅ Transcription completed for recording ${recordingId}`);
        return transcription;

      } catch (error: any) {
        lastError = error;
        attempt++;

        if (attempt < MAX_RETRIES) {
          const delay = getRetryDelay(attempt - 1);
          console.log(`Transcription failed, retrying in ${delay}ms... (${error.message})`);
          await sleep(delay);
        }
      }
    }

    // All retries failed
    await updateRecordingStatus(recordingId, 'failed');
    onProgress?.('failed');

    // Emit Socket.IO event for failure
    try {
      const io = getSocketIO();
      io.emit('transcription:error', {
        recordingId,
        status: 'failed',
        error: lastError?.message || 'Unknown error',
        message: `Transcription failed after ${MAX_RETRIES} attempts`
      });
    } catch (err) {
      console.warn('Socket.IO not available:', err);
    }

    throw new Error(
      `Transcription failed after ${MAX_RETRIES} attempts: ${lastError?.message || 'Unknown error'}`
    );

  } catch (error: any) {
    console.error('Transcription error:', error);

    // Update recording status to 'failed'
    try {
      await updateRecordingStatus(recordingId, 'failed');
      onProgress?.('failed');
    } catch (updateError) {
      console.error('Error updating recording status:', updateError);
    }

    throw error;
  }
};

/**
 * Create transcription record in database
 */
const createTranscription = async (data: Omit<Transcription, 'id' | 'created_at' | 'updated_at'>): Promise<Transcription> => {
  return new Promise((resolve, reject) => {
    db.run(
      `INSERT INTO transcriptions (recording_id, raw_text, formatted_text, word_count, language, confidence)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [data.recording_id, data.raw_text, data.formatted_text, data.word_count, data.language, data.confidence],
      function(err) {
        if (err) {
          reject(err);
        } else {
          db.get('SELECT * FROM transcriptions WHERE id = ?', [this.lastID], (err, row: Transcription) => {
            if (err) reject(err);
            else resolve(row);
          });
        }
      }
    );
  });
};

/**
 * Update recording status
 */
const updateRecordingStatus = async (recordingId: number, status: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    db.run(
      'UPDATE recordings SET status = ? WHERE id = ?',
      [status, recordingId],
      (err) => {
        if (err) reject(err);
        else resolve();
      }
    );
  });
};

/**
 * Update recording duration
 */
const updateRecordingDuration = async (recordingId: number, duration: number): Promise<void> => {
  return new Promise((resolve, reject) => {
    db.run(
      'UPDATE recordings SET duration = ? WHERE id = ?',
      [duration, recordingId],
      (err) => {
        if (err) reject(err);
        else resolve();
      }
    );
  });
};

/**
 * Count words in text
 */
const countWords = (text: string): number => {
  return text.trim().split(/\s+/).filter(word => word.length > 0).length;
};

/**
 * Get transcription by recording ID
 */
export const getTranscriptionByRecordingId = async (recordingId: number): Promise<Transcription | null> => {
  return new Promise((resolve, reject) => {
    db.get(
      'SELECT * FROM transcriptions WHERE recording_id = ? ORDER BY created_at DESC LIMIT 1',
      [recordingId],
      (err, row: Transcription) => {
        if (err) reject(err);
        else resolve(row || null);
      }
    );
  });
};

/**
 * Update transcription text (for manual edits)
 */
export const updateTranscription = async (
  transcriptionId: number,
  formattedText: string
): Promise<Transcription> => {
  const wordCount = countWords(formattedText);

  return new Promise((resolve, reject) => {
    db.run(
      `UPDATE transcriptions
       SET formatted_text = ?, word_count = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [formattedText, wordCount, transcriptionId],
      (err) => {
        if (err) {
          reject(err);
        } else {
          db.get('SELECT * FROM transcriptions WHERE id = ?', [transcriptionId], (err, row: Transcription) => {
            if (err) reject(err);
            else resolve(row);
          });
        }
      }
    );
  });
};
