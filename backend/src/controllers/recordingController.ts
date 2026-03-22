import { Request, Response } from 'express';
import { getDb } from '../config/database';
import { Recording } from '../types/models';
import path from 'path';
import fs from 'fs';

/**
 * Upload a new audio recording
 */
export const uploadRecording = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No audio file provided'
      });
    }

    const { project_id, language = 'en' } = req.body;

    if (!project_id) {
      // Clean up uploaded file
      fs.unlinkSync(req.file.path);
      return res.status(400).json({
        success: false,
        error: 'project_id is required'
      });
    }

    // Verify project exists
    const projectResult = await getDb().execute({
      sql: 'SELECT id FROM projects WHERE id = ?',
      args: [project_id],
    });

    if (!projectResult.rows[0]) {
      // Clean up uploaded file
      fs.unlinkSync(req.file.path);
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }

    // Get count of recordings for this project to generate sequential filename
    const countResult = await getDb().execute({
      sql: 'SELECT COUNT(*) as count FROM recordings WHERE project_id = ?',
      args: [project_id],
    });
    const countRow = countResult.rows[0] as unknown as { count: number };
    const count = countRow?.count || 0;

    const recordingNumber = count + 1;
    const ext = path.extname(req.file.originalname);
    const newFilename = `recording-${recordingNumber}${ext}`;
    const oldPath = req.file.path;
    const newPath = path.join(path.dirname(oldPath), newFilename);

    // Rename the file
    fs.renameSync(oldPath, newPath);

    // Create recording record
    const recording: Recording = {
      project_id: parseInt(project_id),
      filename: newFilename,
      original_filename: req.file.originalname,
      file_size: req.file.size,
      language: language as 'en' | 'kn',
      status: 'pending'
    };

    const insertResult = await getDb().execute({
      sql: `INSERT INTO recordings (project_id, filename, original_filename, file_size, language, status)
            VALUES (?, ?, ?, ?, ?, ?)`,
      args: [recording.project_id, recording.filename, recording.original_filename ?? null,
             recording.file_size ?? null, recording.language, recording.status],
    });

    const newId = Number(insertResult.lastInsertRowid);

    // Get the created recording
    const createdResult = await getDb().execute({
      sql: 'SELECT * FROM recordings WHERE id = ?',
      args: [newId],
    });
    const createdRecording = createdResult.rows[0] as unknown as Recording;

    res.status(201).json({
      success: true,
      data: createdRecording,
      message: 'Audio file uploaded successfully'
    });
  } catch (error: any) {
    console.error('Error uploading recording:', error);

    // Clean up file if it was uploaded
    if (req.file) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (unlinkError) {
        console.error('Error deleting file:', unlinkError);
      }
    }

    res.status(500).json({
      success: false,
      error: 'Failed to upload recording',
      message: error.message
    });
  }
};

/**
 * Get all recordings for a project
 */
export const getRecordingsByProject = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;

    const result = await getDb().execute({
      sql: 'SELECT * FROM recordings WHERE project_id = ? ORDER BY created_at DESC',
      args: [projectId],
    });
    const recordings = result.rows as unknown as Recording[];

    res.json({
      success: true,
      data: recordings
    });
  } catch (error: any) {
    console.error('Error fetching recordings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch recordings',
      message: error.message
    });
  }
};

/**
 * Get a single recording by ID
 */
export const getRecording = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await getDb().execute({
      sql: 'SELECT * FROM recordings WHERE id = ?',
      args: [id],
    });
    const recording = result.rows[0] as unknown as Recording | undefined;

    if (!recording) {
      return res.status(404).json({
        success: false,
        error: 'Recording not found'
      });
    }

    res.json({
      success: true,
      data: recording
    });
  } catch (error: any) {
    console.error('Error fetching recording:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch recording',
      message: error.message
    });
  }
};

/**
 * Delete a recording
 */
export const deleteRecording = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Get recording details
    const result = await getDb().execute({
      sql: 'SELECT * FROM recordings WHERE id = ?',
      args: [id],
    });
    const recording = result.rows[0] as unknown as Recording | undefined;

    if (!recording) {
      return res.status(404).json({
        success: false,
        error: 'Recording not found'
      });
    }

    // Delete file from disk
    const filePath = path.join('./uploads/audio', recording.filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Delete from database (will cascade delete transcriptions)
    await getDb().execute({
      sql: 'DELETE FROM recordings WHERE id = ?',
      args: [id],
    });

    res.json({
      success: true,
      message: 'Recording deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting recording:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete recording',
      message: error.message
    });
  }
};

/**
 * Download audio file
 */
export const downloadRecording = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await getDb().execute({
      sql: 'SELECT * FROM recordings WHERE id = ?',
      args: [id],
    });
    const recording = result.rows[0] as unknown as Recording | undefined;

    if (!recording) {
      return res.status(404).json({
        success: false,
        error: 'Recording not found'
      });
    }

    const filePath = path.join('./uploads/audio', recording.filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        error: 'Audio file not found on disk'
      });
    }

    res.download(filePath, recording.original_filename || recording.filename);
  } catch (error: any) {
    console.error('Error downloading recording:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to download recording',
      message: error.message
    });
  }
};
