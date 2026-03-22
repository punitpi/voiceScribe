import { Request, Response } from 'express';
import { getDb } from '../config/database';
import { featureFlagService } from '../services/featureFlagService';
import { logger } from '../config/logger';

export const getUsers = async (_req: Request, res: Response): Promise<void> => {
  try {
    const result = await getDb().execute(
      'SELECT id, email, name, role, status, created_at FROM users ORDER BY created_at DESC'
    );
    res.json({ success: true, data: result.rows });
  } catch (err: any) {
    logger.error('Admin getUsers error', { error: err.message });
    res.status(500).json({ success: false, error: err.message });
  }
};

export const approveUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await getDb().execute({
      sql: "UPDATE users SET status = 'approved', updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      args: [id],
    });
    res.json({ success: true, message: 'User approved' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const rejectUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await getDb().execute({
      sql: "UPDATE users SET status = 'rejected', updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      args: [id],
    });
    res.json({ success: true, message: 'User rejected' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const updateUserRole = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    if (!['user', 'admin'].includes(role)) {
      res.status(400).json({ success: false, error: 'Invalid role' });
      return;
    }
    await getDb().execute({
      sql: 'UPDATE users SET role = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      args: [role, id],
    });
    res.json({ success: true, message: 'User role updated' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const getFeatureFlags = async (_req: Request, res: Response): Promise<void> => {
  try {
    const flags = await featureFlagService.getAllFlags();
    res.json({ success: true, data: flags });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const setGlobalFlag = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name } = req.params;
    const { enabled } = req.body;
    if (typeof enabled !== 'boolean') {
      res.status(400).json({ success: false, error: 'enabled must be a boolean' });
      return;
    }
    await featureFlagService.setGlobalFlag(name, enabled);
    res.json({ success: true, message: `Flag '${name}' ${enabled ? 'enabled' : 'disabled'}` });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const setUserFlag = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, flagName } = req.params;
    const { enabled } = req.body;
    if (typeof enabled !== 'boolean') {
      res.status(400).json({ success: false, error: 'enabled must be a boolean' });
      return;
    }
    await featureFlagService.setUserFlag(Number(userId), flagName, enabled);
    res.json({ success: true, message: `User flag '${flagName}' ${enabled ? 'enabled' : 'disabled'}` });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};
