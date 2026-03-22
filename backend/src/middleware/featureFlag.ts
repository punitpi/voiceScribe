import { Request, Response, NextFunction } from 'express';
import { featureFlagService } from '../services/featureFlagService';

export const requireFeatureFlag = (flagName: string) =>
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const enabled = await featureFlagService.isEnabled(flagName, req.user?.id);
    if (!enabled) {
      res.status(403).json({ success: false, error: `Feature '${flagName}' is not enabled` });
      return;
    }
    next();
  };
