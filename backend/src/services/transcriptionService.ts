import fs from 'fs';
import path from 'path';
import { getDb } from '../config/database';
import { Recording, Transcription } from '../types/models';
import { formatTranscription } from './textFormattingService';
import { getSocketIO } from '../config/socket';
import { transcribeWithSarvam } from './sarvamService';

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

type TranscriptionEvent = 'transcription:progress' | 'transcription:complete' | 'transcription:error';

const emitProgress = (event: TranscriptionEvent, payload: Record<string, unknown>): void => {
  try {
    getSocketIO().emit(event, payload);
  } catch {
    console.warn('Socket.IO not available');
  }
};

/**
 * Transcribe audio file using Sarvam AI (Saaras v3)
 */
export const transcribeAudio = async (
  recordingId: number,
  onProgress?: (status: string) => void
): Promise<Transcription> => {
  let statusUpdated = false;
  try {
    // Get recording details
    const recordingResult = await getDb().execute({
      sql: 'SELECT * FROM recordings WHERE id = ?',
      args: [recordingId],
    });
    const recording = recordingResult.rows[0] as unknown as Recording | undefined;
    if (!recording) throw new Error('Recording not found');

    // Update recording status to 'transcribing'
    await updateRecordingStatus(recordingId, 'transcribing');
    onProgress?.('transcribing');

    emitProgress('transcription:progress', { recordingId, status: 'transcribing', progress: 10, message: 'Preparing audio file for transcription...' });

    const UPLOAD_ROOT = path.resolve('./uploads/audio');
    const audioFilePath = path.resolve(UPLOAD_ROOT, recording.filename);
    if (!audioFilePath.startsWith(UPLOAD_ROOT + path.sep)) {
      throw new Error('Invalid recording filename');
    }

    if (!fs.existsSync(audioFilePath)) {
      throw new Error('Audio file not found on disk');
    }

    let lastError: Error | null = null;
    let attempt = 0;

    // Retry loop with exponential backoff
    while (attempt < MAX_RETRIES) {
      try {
        console.log(`Transcription attempt ${attempt + 1}/${MAX_RETRIES} for recording ${recordingId}`);

        emitProgress('transcription:progress', { recordingId, status: 'transcribing', progress: 25, message: 'Sending audio to AI transcription service...' });

        const language = (recording.language === 'kn' ? 'kn' : 'en') as 'en' | 'kn';
        const text = await transcribeWithSarvam(audioFilePath, language);

        emitProgress('transcription:progress', { recordingId, status: 'transcribing', progress: 50, message: 'Transcription complete, applying formatting...' });

        const formattedText = formatTranscription(text, undefined, {
          removeFillersWords: true,
          pauseThreshold: 2.0,
          language
        });

        emitProgress('transcription:progress', { recordingId, status: 'transcribing', progress: 75, message: 'Formatting complete, saving to database...' });

        // Create transcription record
        const transcription = await createTranscription({
          recording_id: recordingId,
          raw_text: text,
          formatted_text: formattedText,
          word_count: countWords(formattedText),
          language: recording.language,
          confidence: 1.0
        });

        // Update recording status to 'completed'
        await updateRecordingStatus(recordingId, 'completed');
        onProgress?.('completed');

        emitProgress('transcription:complete', { recordingId, transcriptionId: transcription.id, status: 'completed', progress: 100, message: 'Transcription completed successfully!', wordCount: transcription.word_count });

        console.log(`✅ Transcription completed for recording ${recordingId}`);
        return transcription;

      } catch (error: unknown) {
        lastError = error instanceof Error ? error : new Error(String(error));
        attempt++;

        if (attempt < MAX_RETRIES) {
          const delay = getRetryDelay(attempt - 1);
          console.log(`Transcription failed, retrying in ${delay}ms... (${lastError.message})`);
          await sleep(delay);
        }
      }
    }

    // All retries failed
    await updateRecordingStatus(recordingId, 'failed');
    statusUpdated = true;
    onProgress?.('failed');

    emitProgress('transcription:error', { recordingId, status: 'failed', error: lastError?.message || 'Unknown error', message: `Transcription failed after ${MAX_RETRIES} attempts` });

    throw new Error(
      `Transcription failed after ${MAX_RETRIES} attempts: ${lastError?.message || 'Unknown error'}`
    );

  } catch (error: unknown) {
    console.error('Transcription error:', error);

    if (!statusUpdated) {
      try {
        await updateRecordingStatus(recordingId, 'failed');
        onProgress?.('failed');
      } catch (updateError) {
        console.error('Error updating recording status:', updateError);
      }
    }

    throw error;
  }
};

/**
 * Create transcription record in database
 */
const createTranscription = async (data: Omit<Transcription, 'id' | 'created_at' | 'updated_at'>): Promise<Transcription> => {
  const insertResult = await getDb().execute({
    sql: `INSERT INTO transcriptions (recording_id, raw_text, formatted_text, word_count, language, confidence)
          VALUES (?, ?, ?, ?, ?, ?)`,
    args: [data.recording_id, data.raw_text ?? null, data.formatted_text ?? null, data.word_count ?? null, data.language ?? null, data.confidence ?? null],
  });

  const newId = Number(insertResult.lastInsertRowid);
  const result = await getDb().execute({
    sql: 'SELECT * FROM transcriptions WHERE id = ?',
    args: [newId],
  });
  return result.rows[0] as unknown as Transcription;
};

/**
 * Update recording status
 */
const updateRecordingStatus = async (recordingId: number, status: string): Promise<void> => {
  await getDb().execute({
    sql: 'UPDATE recordings SET status = ? WHERE id = ?',
    args: [status, recordingId],
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
  const result = await getDb().execute({
    sql: 'SELECT * FROM transcriptions WHERE recording_id = ? ORDER BY created_at DESC LIMIT 1',
    args: [recordingId],
  });
  return (result.rows[0] as unknown as Transcription) || null;
};

/**
 * Update transcription text (for manual edits)
 */
export const updateTranscription = async (
  transcriptionId: number,
  formattedText: string
): Promise<Transcription> => {
  const wordCount = countWords(formattedText);

  await getDb().execute({
    sql: `UPDATE transcriptions
          SET formatted_text = ?, word_count = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?`,
    args: [formattedText, wordCount, transcriptionId],
  });

  const result = await getDb().execute({
    sql: 'SELECT * FROM transcriptions WHERE id = ?',
    args: [transcriptionId],
  });
  return result.rows[0] as unknown as Transcription;
};
