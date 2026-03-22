import { Request, Response } from 'express';
import { getDb } from '../config/database';
import { Document, UpdateDocumentRequest } from '../types/models';

/**
 * Get document for a project
 */
export const getDocument = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;

    const result = await getDb().execute({
      sql: 'SELECT * FROM documents WHERE project_id = ? ORDER BY version DESC LIMIT 1',
      args: [projectId],
    });
    const document = result.rows[0] as unknown as Document | undefined;

    if (!document) {
      return res.status(404).json({
        success: false,
        error: 'Document not found'
      });
    }

    res.json({
      success: true,
      data: document
    });
  } catch (error: any) {
    console.error('Error fetching document:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch document',
      message: error.message
    });
  }
};

/**
 * Update document content
 */
export const updateDocument = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const { content }: UpdateDocumentRequest = req.body;

    if (content === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Content is required'
      });
    }

    // Get current document
    const currentDocResult = await getDb().execute({
      sql: 'SELECT * FROM documents WHERE project_id = ? ORDER BY version DESC LIMIT 1',
      args: [projectId],
    });
    const currentDoc = currentDocResult.rows[0] as unknown as Document | undefined;

    if (!currentDoc) {
      return res.status(404).json({
        success: false,
        error: 'Document not found'
      });
    }

    // Calculate word count and character count
    const wordCount = content.trim().split(/\s+/).filter(w => w.length > 0).length;
    const characterCount = content.length;
    const newVersion = ((currentDoc.version ?? 0) as number) + 1;

    // Insert new version
    await getDb().execute({
      sql: `INSERT INTO documents (project_id, content, version, word_count, character_count)
            VALUES (?, ?, ?, ?, ?)`,
      args: [projectId, content, newVersion, wordCount, characterCount],
    });

    // Cap at 10 versions — delete oldest beyond limit
    await getDb().execute({
      sql: `DELETE FROM documents
            WHERE project_id = ?
            AND id NOT IN (
              SELECT id FROM documents WHERE project_id = ? ORDER BY version DESC LIMIT 10
            )`,
      args: [projectId, projectId],
    });

    // Get the new document
    const newDocResult = await getDb().execute({
      sql: 'SELECT * FROM documents WHERE project_id = ? ORDER BY version DESC LIMIT 1',
      args: [projectId],
    });
    const newDoc = newDocResult.rows[0] as unknown as Document;

    res.json({
      success: true,
      data: newDoc,
      message: 'Document updated successfully'
    });
  } catch (error: any) {
    console.error('Error updating document:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update document',
      message: error.message
    });
  }
};

/**
 * Combine all transcriptions into document
 */
export const combineTranscriptions = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;

    // Single JOIN query — fixes N+1 (was 1+N queries, now always 1)
    const transcriptionsResult = await getDb().execute({
      sql: `SELECT COALESCE(t.formatted_text, t.raw_text) AS text
            FROM transcriptions t
            INNER JOIN recordings r ON r.id = t.recording_id
            WHERE r.project_id = ? AND r.status = 'completed'
            ORDER BY r.created_at ASC`,
      args: [projectId],
    });

    const transcriptionTexts = transcriptionsResult.rows
      .map(row => (row as unknown as { text: string }).text)
      .filter(t => t && t.trim().length > 0);

    if (transcriptionTexts.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No completed recordings found'
      });
    }

    // Combine all transcriptions with paragraph breaks
    const combinedContent = transcriptionTexts.join('\n\n');

    // Get current document
    const currentDocResult = await getDb().execute({
      sql: 'SELECT * FROM documents WHERE project_id = ? ORDER BY version DESC LIMIT 1',
      args: [projectId],
    });
    const currentDoc = currentDocResult.rows[0] as unknown as Document | undefined;

    if (!currentDoc) {
      return res.status(404).json({
        success: false,
        error: 'Document not found'
      });
    }

    // Calculate stats
    const wordCount = combinedContent.trim().split(/\s+/).filter(w => w.length > 0).length;
    const characterCount = combinedContent.length;
    const newVersion = ((currentDoc.version ?? 0) as number) + 1;

    // Insert new version with combined content
    await getDb().execute({
      sql: `INSERT INTO documents (project_id, content, version, word_count, character_count)
            VALUES (?, ?, ?, ?, ?)`,
      args: [projectId, combinedContent, newVersion, wordCount, characterCount],
    });

    // Cap at 10 versions
    await getDb().execute({
      sql: `DELETE FROM documents
            WHERE project_id = ?
            AND id NOT IN (
              SELECT id FROM documents WHERE project_id = ? ORDER BY version DESC LIMIT 10
            )`,
      args: [projectId, projectId],
    });

    // Get the new document
    const newDocResult = await getDb().execute({
      sql: 'SELECT * FROM documents WHERE project_id = ? ORDER BY version DESC LIMIT 1',
      args: [projectId],
    });
    const newDoc = newDocResult.rows[0] as unknown as Document;

    res.json({
      success: true,
      data: newDoc,
      message: `Combined ${transcriptionTexts.length} transcriptions into document`
    });
  } catch (error: any) {
    console.error('Error combining transcriptions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to combine transcriptions',
      message: error.message
    });
  }
};

/**
 * Append new transcriptions to document (only those created after last document update)
 */
export const appendNewTranscriptions = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;

    // Get current document
    const currentDocResult = await getDb().execute({
      sql: 'SELECT * FROM documents WHERE project_id = ? ORDER BY version DESC LIMIT 1',
      args: [projectId],
    });
    const currentDoc = currentDocResult.rows[0] as unknown as Document | undefined;

    if (!currentDoc) {
      return res.status(404).json({
        success: false,
        error: 'Document not found'
      });
    }

    // Single JOIN query for new transcriptions — fixes N+1
    const newTranscriptionsResult = await getDb().execute({
      sql: `SELECT COALESCE(t.formatted_text, t.raw_text) AS text
            FROM transcriptions t
            INNER JOIN recordings r ON r.id = t.recording_id
            WHERE r.project_id = ?
              AND r.status = 'completed'
              AND r.created_at > ?
            ORDER BY r.created_at ASC`,
      args: [projectId, currentDoc.updated_at ?? currentDoc.created_at ?? null],
    });

    const newTranscriptionTexts = newTranscriptionsResult.rows
      .map(row => (row as unknown as { text: string }).text)
      .filter(t => t && t.trim().length > 0);

    if (newTranscriptionTexts.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No new transcriptions found'
      });
    }

    // Append new transcriptions to existing content
    const appendedContent = [
      currentDoc.content || '',
      ...newTranscriptionTexts
    ].filter(text => text.trim()).join('\n\n');

    // Calculate stats
    const wordCount = appendedContent.trim().split(/\s+/).filter(w => w.length > 0).length;
    const characterCount = appendedContent.length;
    const newVersion = (currentDoc.version || 0) + 1;

    // Insert new version with appended content
    await getDb().execute({
      sql: `INSERT INTO documents (project_id, content, version, word_count, character_count)
            VALUES (?, ?, ?, ?, ?)`,
      args: [projectId, appendedContent, newVersion, wordCount, characterCount],
    });

    // Cap at 10 versions
    await getDb().execute({
      sql: `DELETE FROM documents
            WHERE project_id = ?
            AND id NOT IN (
              SELECT id FROM documents WHERE project_id = ? ORDER BY version DESC LIMIT 10
            )`,
      args: [projectId, projectId],
    });

    // Get the new document
    const newDocResult = await getDb().execute({
      sql: 'SELECT * FROM documents WHERE project_id = ? ORDER BY version DESC LIMIT 1',
      args: [projectId],
    });
    const newDoc = newDocResult.rows[0] as unknown as Document;

    res.json({
      success: true,
      data: newDoc,
      message: `Appended ${newTranscriptionTexts.length} new transcription(s) to document`
    });
  } catch (error: any) {
    console.error('Error appending transcriptions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to append transcriptions',
      message: error.message
    });
  }
};

/**
 * Get document version history
 */
export const getDocumentHistory = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;

    const result = await getDb().execute({
      sql: 'SELECT id, project_id, version, word_count, character_count, created_at FROM documents WHERE project_id = ? ORDER BY version DESC',
      args: [projectId],
    });
    const history = result.rows as unknown as Document[];

    res.json({
      success: true,
      data: history
    });
  } catch (error: any) {
    console.error('Error fetching document history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch document history',
      message: error.message
    });
  }
};
