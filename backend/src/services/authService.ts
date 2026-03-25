import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getDb } from '../config/database';
import { AuthUser } from '../middleware/auth';
import { logger } from '../config/logger';

export const authService = {
  async register(email: string, password: string, name: string): Promise<void> {
    const existing = await getDb().execute({
      sql: 'SELECT id FROM users WHERE email = ?',
      args: [email],
    });
    if (existing.rows.length > 0) throw new Error('Email already registered');

    const hash = await bcrypt.hash(password, 12);
    await getDb().execute({
      sql: 'INSERT INTO users (email, password_hash, name, role, status) VALUES (?, ?, ?, ?, ?)',
      args: [email.toLowerCase().trim(), hash, name.trim(), 'user', 'pending'],
    });
  },

  async login(email: string, password: string): Promise<{ accessToken: string; user: AuthUser }> {
    const result = await getDb().execute({
      sql: 'SELECT id, email, name, role, status, password_hash FROM users WHERE email = ?',
      args: [email.toLowerCase().trim()],
    });
    const user = result.rows[0] as unknown as (AuthUser & { password_hash: string | null }) | undefined;

    if (!user || !user.password_hash) throw new Error('Invalid credentials');

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) throw new Error('Invalid credentials');

    if (user.status === 'pending') throw new Error('Account pending admin approval');
    if (user.status === 'rejected') throw new Error('Account access has been denied');

    const accessToken = jwt.sign(
      { id: user.id, email: user.email, name: user.name, role: user.role, status: user.status },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    return {
      accessToken,
      user: { id: user.id, email: user.email, name: user.name, role: user.role, status: user.status },
    };
  },

  async findOrCreateGoogleUser(googleId: string, email: string, name: string): Promise<AuthUser & { isNew: boolean }> {
    // Check by googleId first, then by email
    let result = await getDb().execute({
      sql: 'SELECT id, email, name, role, status FROM users WHERE google_id = ?',
      args: [googleId],
    });

    if (result.rows.length === 0) {
      // Check if email already exists (user registered with password)
      const emailResult = await getDb().execute({
        sql: 'SELECT id, email, name, role, status FROM users WHERE email = ?',
        args: [email.toLowerCase()],
      });

      if (emailResult.rows.length > 0) {
        // Link googleId to existing account
        await getDb().execute({
          sql: 'UPDATE users SET google_id = ? WHERE email = ?',
          args: [googleId, email.toLowerCase()],
        });
        const u = emailResult.rows[0] as unknown as AuthUser;
        return { ...u, isNew: false };
      }

      // Create new user
      await getDb().execute({
        sql: 'INSERT INTO users (email, name, google_id, role, status) VALUES (?, ?, ?, ?, ?)',
        args: [email.toLowerCase(), name, googleId, 'user', 'pending'],
      });
      result = await getDb().execute({
        sql: 'SELECT id, email, name, role, status FROM users WHERE google_id = ?',
        args: [googleId],
      });
      const u = result.rows[0] as unknown as AuthUser;
      return { ...u, isNew: true };
    }

    const u = result.rows[0] as unknown as AuthUser;
    return { ...u, isNew: false };
  },

  issueToken(user: AuthUser): string {
    return jwt.sign(
      { id: user.id, email: user.email, name: user.name, role: user.role, status: user.status },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );
  },

  /** Seed the first admin user on startup if no users exist */
  async seedAdminIfEmpty(): Promise<void> {
    const count = await getDb().execute('SELECT COUNT(*) as count FROM users');
    const row = count.rows[0] as unknown as { count: number };
    if (row.count > 0) return;

    const email = process.env.ADMIN_EMAIL ?? 'admin@voicescribe.local';
    const password = process.env.ADMIN_PASSWORD ?? 'changeme123';
    const hash = await bcrypt.hash(password, 12);

    await getDb().execute({
      sql: 'INSERT INTO users (email, password_hash, name, role, status) VALUES (?, ?, ?, ?, ?)',
      args: [email, hash, 'Admin', 'admin', 'approved'],
    });
    logger.info(`Admin user seeded: ${email} (change password immediately!)`);
  },
};
