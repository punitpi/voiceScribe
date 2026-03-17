import { Request, Response } from 'express';
import { db } from '../config/database';
import { Document, UpdateDocumentRequest } from '../types/models';

/**
 * Get document for a project
 */
export const getDocument = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;

    const document = await new Promise<Document>((resolve, reject) => {
      db.get(
        'SELECT * FROM documents WHERE project_id = ? ORDER BY version DESC LIMIT 1',
        [projectId],
        (err, row: Document) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

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
    const currentDoc = await new Promise<Document>((resolve, reject) => {
      db.get(
        'SELECT * FROM documents WHERE project_id = ? ORDER BY version DESC LIMIT 1',
        [projectId],
        (err, row: Document) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

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
    await new Promise<void>((resolve, reject) => {
      db.run(
        `INSERT INTO documents (project_id, content, version, word_count, character_count)
         VALUES (?, ?, ?, ?, ?)`,
        [projectId, content, newVersion, wordCount, characterCount],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });

    // Get the new document
    const newDoc = await new Promise<Document>((resolve, reject) => {
      db.get(
        'SELECT * FROM documents WHERE project_id = ? ORDER BY version DESC LIMIT 1',
        [projectId],
        (err, row: Document) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

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

    // Get all completed recordings for the project
    const recordings = await new Promise<any[]>((resolve, reject) => {
      db.all(
        `SELECT r.id, r.created_at
         FROM recordings r
         WHERE r.project_id = ? AND r.status = 'completed'
         ORDER BY r.created_at ASC`,
        [projectId],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });

    if (recordings.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No completed recordings found'
      });
    }

    // Get transcriptions for all recordings
    const transcriptionTexts: string[] = [];
    for (const recording of recordings) {
      const transcription = await new Promise<any>((resolve, reject) => {
        db.get(
          'SELECT formatted_text, raw_text FROM transcriptions WHERE recording_id = ?',
          [recording.id],
          (err, row) => {
            if (err) reject(err);
            else resolve(row);
          }
        );
      });

      if (transcription) {
        const text = transcription.formatted_text || transcription.raw_text;
        if (text) {
          transcriptionTexts.push(text);
        }
      }
    }

    // Combine all transcriptions with paragraph breaks
    const combinedContent = transcriptionTexts.join('\n\n');

    // Get current document
    const currentDoc = await new Promise<Document>((resolve, reject) => {
      db.get(
        'SELECT * FROM documents WHERE project_id = ? ORDER BY version DESC LIMIT 1',
        [projectId],
        (err, row: Document) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

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
    await new Promise<void>((resolve, reject) => {
      db.run(
        `INSERT INTO documents (project_id, content, version, word_count, character_count)
         VALUES (?, ?, ?, ?, ?)`,
        [projectId, combinedContent, newVersion, wordCount, characterCount],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });

    // Get the new document
    const newDoc = await new Promise<Document>((resolve, reject) => {
      db.get(
        'SELECT * FROM documents WHERE project_id = ? ORDER BY version DESC LIMIT 1',
        [projectId],
        (err, row: Document) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

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
    const currentDoc = await new Promise<Document>((resolve, reject) => {
      db.get(
        'SELECT * FROM documents WHERE project_id = ? ORDER BY version DESC LIMIT 1',
        [projectId],
        (err, row: Document) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    if (!currentDoc) {
      return res.status(404).json({
        success: false,
        error: 'Document not found'
      });
    }

    // Get recordings completed after the last document update
    const recordings = await new Promise<any[]>((resolve, reject) => {
      db.all(
        `SELECT r.id, r.created_at
         FROM recordings r
         WHERE r.project_id = ?
           AND r.status = 'completed'
           AND r.created_at > ?
         ORDER BY r.created_at ASC`,
        [projectId, currentDoc.updated_at || currentDoc.created_at],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });

    if (recordings.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No new transcriptions found'
      });
    }

    // Get transcriptions for new recordings
    const newTranscriptionTexts: string[] = [];
    for (const recording of recordings) {
      const transcription = await new Promise<any>((resolve, reject) => {
        db.get(
          'SELECT formatted_text, raw_text FROM transcriptions WHERE recording_id = ?',
          [recording.id],
          (err, row) => {
            if (err) reject(err);
            else resolve(row);
          }
        );
      });

      if (transcription) {
        const text = transcription.formatted_text || transcription.raw_text;
        if (text) {
          newTranscriptionTexts.push(text);
        }
      }
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
    await new Promise<void>((resolve, reject) => {
      db.run(
        `INSERT INTO documents (project_id, content, version, word_count, character_count)
         VALUES (?, ?, ?, ?, ?)`,
        [projectId, appendedContent, newVersion, wordCount, characterCount],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });

    // Get the new document
    const newDoc = await new Promise<Document>((resolve, reject) => {
      db.get(
        'SELECT * FROM documents WHERE project_id = ? ORDER BY version DESC LIMIT 1',
        [projectId],
        (err, row: Document) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

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

    const history = await new Promise<Document[]>((resolve, reject) => {
      db.all(
        'SELECT id, project_id, version, word_count, character_count, created_at FROM documents WHERE project_id = ? ORDER BY version DESC',
        [projectId],
        (err, rows: Document[]) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });

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
