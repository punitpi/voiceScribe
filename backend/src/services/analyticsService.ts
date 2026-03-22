import { getDb } from '../config/database';
import { logger } from '../config/logger';

type EventType =
  | 'user_registered' | 'user_approved' | 'user_rejected' | 'user_login' | 'user_logout'
  | 'project_created' | 'project_deleted' | 'project_archived'
  | 'recording_uploaded' | 'recording_deleted'
  | 'transcription_started' | 'transcription_completed' | 'transcription_failed'
  | 'document_updated' | 'transcriptions_combined'
  | 'pdf_generated' | 'pdf_downloaded'
  | 'spell_check_run' | 'spell_check_word_added';

export const analyticsService = {
  async track(
    userId: number | null,
    eventType: EventType,
    opts?: { entityType?: string; entityId?: number; metadata?: Record<string, unknown> }
  ): Promise<void> {
    try {
      await getDb().execute({
        sql: 'INSERT INTO analytics_events (user_id, event_type, entity_type, entity_id, metadata) VALUES (?, ?, ?, ?, ?)',
        args: [
          userId,
          eventType,
          opts?.entityType ?? null,
          opts?.entityId ?? null,
          opts?.metadata ? JSON.stringify(opts.metadata) : null,
        ],
      });
    } catch (err) {
      logger.warn('Analytics track failed (non-critical)', { err, eventType });
    }
  },
};
