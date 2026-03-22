import { getDb } from '../config/database';

export const featureFlagService = {
  async isEnabled(flagName: string, userId?: number): Promise<boolean> {
    if (userId) {
      const override = await getDb().execute({
        sql: 'SELECT enabled FROM user_feature_flags WHERE user_id = ? AND flag_name = ?',
        args: [userId, flagName],
      });
      if (override.rows.length > 0) {
        return Boolean((override.rows[0] as any).enabled);
      }
    }

    const global = await getDb().execute({
      sql: 'SELECT enabled_globally FROM feature_flags WHERE name = ?',
      args: [flagName],
    });
    return global.rows.length > 0 ? Boolean((global.rows[0] as any).enabled_globally) : false;
  },

  async getAllFlags(): Promise<{ name: string; description: string | null; enabled_globally: boolean }[]> {
    const result = await getDb().execute('SELECT name, description, enabled_globally FROM feature_flags ORDER BY name');
    return result.rows as unknown as { name: string; description: string | null; enabled_globally: boolean }[];
  },

  async setGlobalFlag(name: string, enabled: boolean): Promise<void> {
    await getDb().execute({
      sql: 'UPDATE feature_flags SET enabled_globally = ? WHERE name = ?',
      args: [enabled ? 1 : 0, name],
    });
  },

  async setUserFlag(userId: number, flagName: string, enabled: boolean): Promise<void> {
    await getDb().execute({
      sql: `INSERT INTO user_feature_flags (user_id, flag_name, enabled) VALUES (?, ?, ?)
            ON CONFLICT(user_id, flag_name) DO UPDATE SET enabled = excluded.enabled`,
      args: [userId, flagName, enabled ? 1 : 0],
    });
  },

  async getUserFlags(userId: number): Promise<Record<string, boolean>> {
    // Get all global flags
    const globalResult = await getDb().execute(
      'SELECT name, enabled_globally FROM feature_flags'
    );
    const flags: Record<string, boolean> = {};
    for (const row of globalResult.rows as any[]) {
      flags[row.name] = Boolean(row.enabled_globally);
    }

    // Apply per-user overrides
    const overrideResult = await getDb().execute({
      sql: 'SELECT flag_name, enabled FROM user_feature_flags WHERE user_id = ?',
      args: [userId],
    });
    for (const row of overrideResult.rows as any[]) {
      flags[row.flag_name] = Boolean(row.enabled);
    }

    return flags;
  },
};
