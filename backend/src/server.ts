import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import { initDatabase, getDb } from './config/database';
import { initializeSocketIO } from './config/socket';
import { logger } from './config/logger';
import recordingsRouter from './routes/recordings';
import projectsRouter from './routes/projects';
import transcriptionsRouter from './routes/transcriptions';
import documentsRouter from './routes/documents';
import pdfsRouter from './routes/pdfs';
import spellCheckRouter from './routes/spellCheck';

// Load environment variables - use process.cwd() which is the backend directory
const envPath = path.join(process.cwd(), '.env');
dotenv.config({ path: envPath });
logger.info(`Loaded .env from: ${envPath}`);

// Validate required environment variables — crash fast if missing
const REQUIRED_ENV = ['SARVAM_API_KEY', 'JWT_SECRET'];
const OPTIONAL_ENV_WARNINGS = ['OPENAI_API_KEY', 'SMTP_HOST', 'GOOGLE_CLIENT_ID'];

function validateEnv(): void {
  const missing = REQUIRED_ENV.filter(k => !process.env[k]);
  if (missing.length > 0) {
    logger.error(`Missing required environment variables: ${missing.join(', ')}. Add them to backend/.env and restart.`);
    process.exit(1);
  }
  OPTIONAL_ENV_WARNINGS.forEach(k => {
    if (!process.env[k]) logger.warn(`Optional env var ${k} not set — related features disabled`);
  });
}

validateEnv();

// Create Express app and HTTP server
const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet());

// Rate limiting - max 100 requests per minute per IP
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100,
  message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true
}));

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Health check endpoint — checks all dependencies
app.get('/health', async (req: Request, res: Response) => {
  const checks: Record<string, 'ok' | 'error'> = {};

  try {
    await getDb().execute('SELECT 1');
    checks.database = 'ok';
  } catch {
    checks.database = 'error';
  }

  const allOk = Object.values(checks).every(v => v === 'ok');
  res.status(allOk ? 200 : 503).json({
    status: allOk ? 'ok' : 'degraded',
    checks,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV ?? 'development',
  });
});

// API routes
app.use('/api/projects', projectsRouter);
app.use('/api/recordings', recordingsRouter);
app.use('/api/transcriptions', transcriptionsRouter);
app.use('/api/documents', documentsRouter);
app.use('/api/pdfs', pdfsRouter);
app.use('/api/spellcheck', spellCheckRouter);

app.get('/api', (req: Request, res: Response) => {
  res.json({
    message: 'VoiceScribe API v1.0',
    endpoints: {
      health: '/health',
      projects: '/api/projects',
      recordings: '/api/recordings',
      documents: '/api/documents',
      pdfs: '/api/pdfs'
    }
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Cannot ${req.method} ${req.path}`
  });
});

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: any) => {
  logger.error('Unhandled error', { message: err.message, stack: err.stack });
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// Initialize database and start server
const startServer = async () => {
  try {
    // Initialize database
    await initDatabase();

    // Initialize Socket.IO
    initializeSocketIO(httpServer);

    // Start server with Socket.IO
    httpServer.listen(PORT, () => {
      logger.info(`VoiceScribe API running on http://localhost:${PORT} [${process.env.NODE_ENV ?? 'development'}]`);
    });
  } catch (error) {
    logger.error('Failed to start server', { error });
    process.exit(1);
  }
};

startServer();

export default app;
