import Bull from 'bull';
import { REDIS_URL } from '../config/redis';
import { logger } from '../config/logger';
import { transcribeAudio } from './transcriptionService';

export interface TranscriptionJobData {
  recordingId: number;
}

export const transcriptionQueue = new Bull<TranscriptionJobData>('transcription', {
  redis: REDIS_URL,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: 100,
    removeOnFail: 50,
  },
});

// Process max 2 transcription jobs concurrently
transcriptionQueue.process(2, async (job) => {
  logger.info(`[Queue] Processing transcription for recording ${job.data.recordingId}`);
  await transcribeAudio(job.data.recordingId);
});

transcriptionQueue.on('completed', (job) => {
  logger.info(`[Queue] Transcription completed for recording ${job.data.recordingId}`);
});

transcriptionQueue.on('failed', (job, err) => {
  logger.error(`[Queue] Transcription failed for recording ${job?.data?.recordingId}`, { error: err.message });
});

/**
 * Enqueue a transcription job. Uses jobId to prevent duplicate jobs for the same recording.
 */
export const enqueueTranscription = async (recordingId: number): Promise<Bull.Job<TranscriptionJobData>> => {
  return transcriptionQueue.add(
    { recordingId },
    { jobId: `recording-${recordingId}` }
  );
};
