import { Request, Response } from 'express';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { authService } from '../services/authService';
import { featureFlagService } from '../services/featureFlagService';
import { analyticsService } from '../services/analyticsService';
import { logger } from '../config/logger';

const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

// Configure Google OAuth strategy if credentials are present
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL ?? 'http://localhost:3001/auth/google/callback',
    },
    async (_accessToken, _refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value ?? '';
        const name = profile.displayName ?? email;
        const user = await authService.findOrCreateGoogleUser(profile.id, email, name);
        done(null, user);
      } catch (err) {
        done(err as Error);
      }
    }
  ));
}

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password || !name) {
      res.status(400).json({ success: false, error: 'email, password, and name are required' });
      return;
    }
    if (password.length < 8) {
      res.status(400).json({ success: false, error: 'Password must be at least 8 characters' });
      return;
    }
    await authService.register(email, password, name);
    analyticsService.track(null, 'user_registered', { metadata: { email } });
    res.status(201).json({ success: true, message: 'Registration successful. Your account is pending admin approval.' });
  } catch (err: any) {
    const status = err.message === 'Email already registered' ? 409 : 500;
    res.status(status).json({ success: false, error: err.message });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ success: false, error: 'email and password are required' });
      return;
    }
    const { accessToken, user } = await authService.login(email, password);
    analyticsService.track(user.id, 'user_login');
    res.cookie('access_token', accessToken, COOKIE_OPTS);
    res.json({ success: true, data: { user } });
  } catch (err: any) {
    const status = err.message.includes('credentials') ? 401 : 403;
    res.status(status).json({ success: false, error: err.message });
  }
};

export const logout = (_req: Request, res: Response): void => {
  res.clearCookie('access_token');
  res.json({ success: true, message: 'Logged out successfully' });
};

export const me = async (req: Request, res: Response): Promise<void> => {
  const flags = await featureFlagService.getUserFlags(req.user!.id);
  res.json({ success: true, data: { ...req.user, flags } });
};

export const googleAuth = passport.authenticate('google', { scope: ['email', 'profile'], session: false });

export const googleCallback = (req: Request, res: Response): void => {
  const user = req.user as any;
  if (!user) {
    res.redirect(`${process.env.CORS_ORIGIN ?? 'http://localhost:5173'}/login?error=oauth_failed`);
    return;
  }

  if (user.status === 'pending') {
    res.redirect(`${process.env.CORS_ORIGIN ?? 'http://localhost:5173'}/login?error=pending_approval`);
    return;
  }

  const token = authService.issueToken(user);
  res.cookie('access_token', token, COOKIE_OPTS);
  res.redirect(process.env.CORS_ORIGIN ?? 'http://localhost:5173');
};

export const updateProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name } = req.body;
    if (!name?.trim()) {
      res.status(400).json({ success: false, error: 'name is required' });
      return;
    }
    const { getDb } = await import('../config/database');
    await getDb().execute({
      sql: 'UPDATE users SET name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      args: [name.trim(), req.user!.id],
    });
    res.json({ success: true, message: 'Profile updated' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const updateAnalyticsConsent = async (req: Request, res: Response): Promise<void> => {
  try {
    const { consent } = req.body; // true = accepted, false = declined
    if (typeof consent !== 'boolean') {
      res.status(400).json({ success: false, error: 'consent must be a boolean' });
      return;
    }
    const { getDb } = await import('../config/database');
    await getDb().execute({
      sql: 'UPDATE users SET analytics_consent = ? WHERE id = ?',
      args: [consent ? 1 : 0, req.user!.id],
    });
    res.json({ success: true, message: 'Analytics consent updated' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};
