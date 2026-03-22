import { Request, Response } from 'express';
import { getTranscriptionByRecordingId, updateTranscription } from '../services/transcriptionService';
import { enqueueTranscription } from '../services/queueService';
import { quickFormat } from '../services/textFormattingService';

/**
 * Start transcription for a recording
 */
export const startTranscription = async (req: Request, res: Response) => {
  try {
    const { recordingId } = req.params;

    // Enqueue transcription job (Bull queue, max 2 concurrent)
    await enqueueTranscription(parseInt(recordingId));

    res.status(202).json({
      success: true,
      message: 'Transcription queued. Check recording status for progress.',
      data: { recordingId: parseInt(recordingId), status: 'queued' }
    });
  } catch (error: any) {
    console.error('Error starting transcription:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to start transcription',
      message: error.message
    });
  }
};

/**
 * Get transcription for a recording
 */
export const getTranscription = async (req: Request, res: Response) => {
  try {
    const { recordingId } = req.params;

    const transcription = await getTranscriptionByRecordingId(parseInt(recordingId));

    if (!transcription) {
      return res.status(404).json({
        success: false,
        error: 'Transcription not found'
      });
    }

    res.json({
      success: true,
      data: transcription
    });
  } catch (error: any) {
    console.error('Error fetching transcription:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch transcription',
      message: error.message
    });
  }
};

/**
 * Update transcription text
 */
export const updateTranscriptionText = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { formatted_text } = req.body;

    if (!formatted_text) {
      return res.status(400).json({
        success: false,
        error: 'formatted_text is required'
      });
    }

    const transcription = await updateTranscription(parseInt(id), formatted_text);

    res.json({
      success: true,
      data: transcription,
      message: 'Transcription updated successfully'
    });
  } catch (error: any) {
    console.error('Error updating transcription:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update transcription',
      message: error.message
    });
  }
};

/**
 * Reformat transcription text (apply auto-formatting)
 */
export const reformatTranscription = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Get current transcription
    const transcription = await getTranscriptionByRecordingId(parseInt(id));

    if (!transcription) {
      return res.status(404).json({
        success: false,
        error: 'Transcription not found'
      });
    }

    // Apply formatting to raw text
    const rawText: string = transcription.raw_text || '';
    const language: 'en' | 'kn' = (transcription.language as 'en' | 'kn') || 'en';
    const formattedText = quickFormat(rawText, language);

    // Update transcription
    const updated = await updateTranscription(transcription.id!, formattedText);

    res.json({
      success: true,
      data: updated,
      message: 'Transcription reformatted successfully'
    });
  } catch (error: any) {
    console.error('Error reformatting transcription:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reformat transcription',
      message: error.message
    });
  }
};
