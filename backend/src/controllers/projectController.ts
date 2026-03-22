import { Request, Response } from 'express';
import { getDb } from '../config/database';
import { Project, CreateProjectRequest, UpdateProjectRequest } from '../types/models';

/**
 * Create a new project
 */
export const createProject = async (req: Request, res: Response) => {
  try {
    const { title, author_name, language = 'en', description }: CreateProjectRequest = req.body;

    if (!title || title.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Project title is required'
      });
    }

    const insertResult = await getDb().execute({
      sql: `INSERT INTO projects (title, author_name, language, description)
            VALUES (?, ?, ?, ?)`,
      args: [title.trim(), author_name || null, language, description || null],
    });

    const newId = Number(insertResult.lastInsertRowid);

    // Get the created project
    const projectResult = await getDb().execute({
      sql: 'SELECT * FROM projects WHERE id = ?',
      args: [newId],
    });
    const project = projectResult.rows[0] as unknown as Project;

    // Create initial document for the project
    await getDb().execute({
      sql: `INSERT INTO documents (project_id, content, version, word_count, character_count)
            VALUES (?, ?, 1, 0, 0)`,
      args: [newId, ''],
    });

    res.status(201).json({
      success: true,
      data: project,
      message: 'Project created successfully'
    });
  } catch (error: any) {
    console.error('Error creating project:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create project',
      message: error.message
    });
  }
};

/**
 * Get all projects (non-archived)
 */
export const getAllProjects = async (req: Request, res: Response) => {
  try {
    const { include_archived = 'false' } = req.query;

    const sql = include_archived === 'true'
      ? 'SELECT * FROM projects ORDER BY updated_at DESC'
      : 'SELECT * FROM projects WHERE archived = 0 ORDER BY updated_at DESC';

    const result = await getDb().execute({ sql, args: [] });
    const projects = result.rows as unknown as Project[];

    res.json({
      success: true,
      data: projects
    });
  } catch (error: any) {
    console.error('Error fetching projects:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch projects',
      message: error.message
    });
  }
};

/**
 * Get a single project by ID
 */
export const getProject = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await getDb().execute({
      sql: 'SELECT * FROM projects WHERE id = ?',
      args: [id],
    });
    const project = result.rows[0] as unknown as Project | undefined;

    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }

    res.json({
      success: true,
      data: project
    });
  } catch (error: any) {
    console.error('Error fetching project:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch project',
      message: error.message
    });
  }
};

/**
 * Update a project
 */
export const updateProject = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, author_name, description }: UpdateProjectRequest = req.body;

    // Check if project exists
    const checkResult = await getDb().execute({
      sql: 'SELECT * FROM projects WHERE id = ?',
      args: [id],
    });
    const project = checkResult.rows[0] as unknown as Project | undefined;

    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }

    // Build update query dynamically
    const updates: string[] = [];
    const values: any[] = [];

    if (title !== undefined) {
      updates.push('title = ?');
      values.push(title.trim());
    }
    if (author_name !== undefined) {
      updates.push('author_name = ?');
      values.push(author_name);
    }
    if (description !== undefined) {
      updates.push('description = ?');
      values.push(description);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No fields to update'
      });
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    await getDb().execute({
      sql: `UPDATE projects SET ${updates.join(', ')} WHERE id = ?`,
      args: values,
    });

    // Get updated project
    const updatedResult = await getDb().execute({
      sql: 'SELECT * FROM projects WHERE id = ?',
      args: [id],
    });
    const updatedProject = updatedResult.rows[0] as unknown as Project;

    res.json({
      success: true,
      data: updatedProject,
      message: 'Project updated successfully'
    });
  } catch (error: any) {
    console.error('Error updating project:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update project',
      message: error.message
    });
  }
};

/**
 * Archive/unarchive a project
 */
export const archiveProject = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { archived = true } = req.body;

    const checkResult = await getDb().execute({
      sql: 'SELECT * FROM projects WHERE id = ?',
      args: [id],
    });
    const project = checkResult.rows[0] as unknown as Project | undefined;

    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }

    await getDb().execute({
      sql: 'UPDATE projects SET archived = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      args: [archived ? 1 : 0, id],
    });

    res.json({
      success: true,
      message: `Project ${archived ? 'archived' : 'unarchived'} successfully`
    });
  } catch (error: any) {
    console.error('Error archiving project:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to archive project',
      message: error.message
    });
  }
};

/**
 * Delete a project permanently
 */
export const deleteProject = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const checkResult = await getDb().execute({
      sql: 'SELECT * FROM projects WHERE id = ?',
      args: [id],
    });
    const project = checkResult.rows[0] as unknown as Project | undefined;

    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }

    // Delete project (will cascade delete recordings, documents, etc.)
    await getDb().execute({
      sql: 'DELETE FROM projects WHERE id = ?',
      args: [id],
    });

    res.json({
      success: true,
      message: 'Project deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting project:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete project',
      message: error.message
    });
  }
};

/**
 * Get project statistics
 */
export const getProjectStats = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const checkResult = await getDb().execute({
      sql: 'SELECT * FROM projects WHERE id = ?',
      args: [id],
    });
    const project = checkResult.rows[0] as unknown as Project | undefined;

    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }

    // Get total recordings count and duration
    const recordingStatsResult = await getDb().execute({
      sql: 'SELECT COUNT(*) as count, COALESCE(SUM(duration), 0) as total_duration FROM recordings WHERE project_id = ?',
      args: [id],
    });
    const recordingStats = recordingStatsResult.rows[0] as unknown as { count: number; total_duration: number };

    // Get document word count
    const documentStatsResult = await getDb().execute({
      sql: 'SELECT word_count FROM documents WHERE project_id = ? ORDER BY version DESC LIMIT 1',
      args: [id],
    });
    const documentStats = documentStatsResult.rows[0] as unknown as { word_count: number } | undefined;

    // Calculate estimated pages (250 words per page)
    const wordCount = documentStats?.word_count || 0;
    const pageCount = Math.ceil(wordCount / 250);

    // Estimate transcription cost (Whisper API: $0.006 per minute)
    const totalMinutes = (recordingStats.total_duration || 0) / 60;
    const transcriptionCost = totalMinutes * 0.006;

    res.json({
      success: true,
      data: {
        totalRecordings: recordingStats.count,
        totalDuration: recordingStats.total_duration || 0,
        wordCount,
        pageCount,
        transcriptionCost: parseFloat(transcriptionCost.toFixed(2))
      }
    });
  } catch (error: any) {
    console.error('Error fetching project stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch project stats',
      message: error.message
    });
  }
};
