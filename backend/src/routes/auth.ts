import { Router } from 'express';
import passport from 'passport';
import { register, login, logout, me, googleAuth, googleCallback, updateProfile, updateAnalyticsConsent } from '../controllers/authController';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.get('/me', requireAuth, me);
router.patch('/profile', requireAuth, updateProfile);
router.post('/analytics-consent', requireAuth, updateAnalyticsConsent);

// Google OAuth — only registered if credentials are configured
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  router.get('/google', googleAuth);
  router.get('/google/callback',
    passport.authenticate('google', { session: false, failureRedirect: '/login?error=oauth_failed' }),
    googleCallback
  );
}

export default router;
