# VoiceScribe

Voice-to-text book writing application for elderly authors. React + Vite frontend, Express + TypeScript backend, Turso/libSQL database. Multi-user with JWT auth, admin approval flow, feature flags, and analytics.

## Commands

```bash
# Prerequisites for local dev
brew services start redis   # Required for Bull job queue

# Install all dependencies (root + backend + frontend)
npm run install:all

# Start both servers (backend :3001, frontend :5173)
npm run dev

# Kill ports if servers are stuck
npm run kill-ports

# Build everything
npm run build

# Backend only
npm run dev:backend

# Frontend only
npm run dev:frontend

# Lint frontend
npm run lint --prefix frontend
```

## Architecture

```
voiceScribe/
├── backend/src/
│   ├── server.ts          # Express app entry point; env validation; route registration
│   ├── config/
│   │   ├── database.ts    # Turso/libSQL init + schema (all tables + migrations here)
│   │   ├── redis.ts       # ioredis client for Bull queue
│   │   ├── socket.ts      # Socket.io setup
│   │   └── logger.ts      # Winston structured logger
│   ├── middleware/
│   │   ├── auth.ts        # requireAuth, requireAdmin — JWT cookie verification
│   │   ├── featureFlag.ts # requireFeatureFlag(name) middleware
│   │   └── upload.ts      # multer config (audio only, 100MB max)
│   ├── routes/            # auth, admin, recordings, projects, transcriptions, documents, pdfs, spellCheck
│   ├── controllers/       # Request/response handling
│   └── services/
│       ├── authService.ts           # register, login, Google OAuth, seedAdmin
│       ├── featureFlagService.ts    # global + per-user flag CRUD
│       ├── analyticsService.ts      # track(userId, eventType, metadata) — non-critical, swallows errors
│       ├── storageService.ts        # file I/O abstraction with path containment guards
│       ├── queueService.ts          # Bull transcription queue (concurrency: 2, retries: 3)
│       ├── transcriptionService.ts  # Sarvam AI (Saaras v3) with retry + chunking
│       ├── sarvamService.ts         # Sarvam API client + ffmpeg chunking
│       ├── spellCheckService.ts     # spell check with 5-min in-memory cache
│       ├── pdfService.ts            # pdfkit generation
│       └── textFormattingService.ts
├── frontend/src/
│   ├── pages/             # Dashboard, ProjectPage, DocumentPage, LoginPage, RegisterPage, AdminPage
│   ├── components/        # Layout, ProtectedRoute, AdminRoute, ConsentBanner, SettingsDialog, AudioRecorder, ...
│   ├── contexts/          # AuthContext (user, login, logout, flags)
│   ├── hooks/             # useFeatureFlag(flagName) → boolean
│   ├── services/          # api.ts — projectsApi, recordingsApi, authApi, adminApi (withCredentials: true)
│   └── theme/theme.ts     # elderlyTheme (MUI — parchment/ink/gold palette, large fonts)
└── backend/data/          # Turso local DB lives here (voicescribe.db)
```

## API Routes

| Route | Purpose | Auth |
|-------|---------|------|
| `GET /health` | Health check (DB + Redis) | Public |
| `POST /auth/register` | Register user (status: pending) | Public |
| `POST /auth/login` | Login → sets httpOnly JWT cookie | Public |
| `POST /auth/logout` | Clear cookie | Public |
| `GET /auth/me` | Current user + feature flags | requireAuth |
| `PATCH /auth/profile` | Update name | requireAuth |
| `POST /auth/analytics-consent` | Save analytics consent preference | requireAuth |
| `GET /auth/google` | Google OAuth start | Optional |
| `GET /admin/users` | List all users | requireAdmin |
| `PATCH /admin/users/:id/approve` | Approve user | requireAdmin |
| `PATCH /admin/users/:id/reject` | Reject user | requireAdmin |
| `PATCH /admin/users/:id/role` | Change role (user/admin) | requireAdmin |
| `GET /admin/feature-flags` | List all flags | requireAdmin |
| `PATCH /admin/feature-flags/:name` | Toggle global flag | requireAdmin |
| `/api/projects` | Project CRUD (user_id scoped) | requireAuth |
| `/api/recordings` | Audio upload + management | requireAuth |
| `/api/transcriptions` | Trigger + retrieve (Bull queue) | requireAuth |
| `/api/documents` | Document content | requireAuth |
| `/api/pdfs` | PDF generation (pdf_export flag) | requireAuth + featureFlag |
| `/api/spellcheck` | Spell check (spell_check flag) | requireAuth + featureFlag |

## Environment Setup

**backend/.env** (copy from `backend/.env.example`):
```
NODE_ENV=development
PORT=3001
TURSO_URL=file:./data/voicescribe.db   # local file mode; no auth token needed
TURSO_AUTH_TOKEN=                       # leave empty for local dev
REDIS_URL=redis://localhost:6379
JWT_SECRET=change-me-use-openssl-rand-hex-32   # REQUIRED
SARVAM_API_KEY=your-sarvam-key                 # REQUIRED for transcription
SMTP_HOST=smtp.gmail.com
SMTP_USER=your@gmail.com
SMTP_PASS=your-app-password
UPLOAD_DIR=./uploads
CORS_ORIGIN=http://localhost:5173
ADMIN_EMAIL=admin@voicescribe.local     # seeded on first startup
ADMIN_PASSWORD=changeme123             # change immediately!
GOOGLE_CLIENT_ID=                      # optional, enables Google OAuth
GOOGLE_CLIENT_SECRET=
GOOGLE_CALLBACK_URL=http://localhost:3001/auth/google/callback
```

**frontend/.env** (copy from `frontend/.env.example`):
```
VITE_API_URL=http://localhost:3001
VITE_WS_URL=ws://localhost:3001
```

## Auth Flow

1. Admin account is seeded on first startup from `ADMIN_EMAIL` / `ADMIN_PASSWORD` env vars.
2. New users register → status = `pending`. They cannot log in until approved.
3. Admin approves users at `/admin` → status = `approved`.
4. Login issues a 7-day JWT stored in an httpOnly `access_token` cookie.
5. `requireAuth` middleware verifies JWT + re-fetches user from DB on every request.
6. `requireAdmin` chains requireAuth + role check.

## Feature Flags

Four default flags are seeded on startup: `spell_check`, `email_sharing`, `pdf_export`, `google_auth`.
- All flags default to `enabled_globally = 1`.
- Admin can toggle flags globally via `/admin` panel or `PATCH /admin/feature-flags/:name`.
- Per-user overrides stored in `user_feature_flags` table.
- Frontend: use `useFeatureFlag('spell_check')` hook to gate UI elements.
- Backend: use `requireFeatureFlag('spell_check')` middleware on routes.

## Job Queue (Bull + Redis)

- Transcriptions are enqueued via `enqueueTranscription(recordingId)` in `queueService.ts`.
- Worker runs with `concurrency: 2` and `attempts: 3` (exponential backoff).
- `jobId: recording-${id}` prevents duplicate jobs.
- **Redis must be running** (`brew services start redis`) or the server will fail to start.

## Analytics

- `analyticsService.track(userId, eventType, metadata)` inserts into `analytics_events` table.
- Failures are swallowed (non-critical) — a dead analytics call should never break a user flow.
- Consent is stored in `users.analytics_consent` (1 = accepted, 0 = declined, NULL = not asked).
- Frontend ConsentBanner stores choice in `localStorage` key `analytics_consent`.

## Claude Code Automations

- **Hook**: ESLint auto-runs on edits to `frontend/src/**` (configured in `.claude/settings.json`)
- **Hook**: TypeScript check auto-runs on edits to `backend/src/**`
- **Hook**: `.env` files are blocked from edits (deny permission in `.claude/settings.json`)
- **Skill `/dev-start`**: kills ports + starts both servers
- **Skill `/new-route`**: scaffolds route + controller + service
- **Subagent `security-reviewer`**: reviews uploads, DB, nodemailer, pdfkit risks
- **MCP: Playwright**: installed for UI testing (recording, transcription flows)

## Gotchas

- **SARVAM_API_KEY and JWT_SECRET are required** — the server crashes on startup if missing.
- **Redis must be running** for Bull queue. `brew services start redis` before `npm run dev`.
- **First admin user**: seeded automatically on first startup using `ADMIN_EMAIL` + `ADMIN_PASSWORD`.
- **libSQL vs sqlite3**: `@libsql/client` uses `client.execute({ sql, args })` returning `{ rows: Row[] }`. All DB calls are async/await. Use `rows[0]` for single rows, cast with `as unknown as YourType`. `Number(result.lastInsertRowid)` for new IDs.
- **Turso local mode**: `TURSO_URL=file:./data/voicescribe.db` with no `TURSO_AUTH_TOKEN` is identical to SQLite. No Turso account needed for local dev.
- **Audio chunking**: Files are auto-split into 25-second WAV segments before sending to Sarvam (REST API limit is 30s). Uses `fluent-ffmpeg` + `@ffmpeg-installer/ffmpeg` (bundled binary — no system ffmpeg required).
- **Audio uploads** stored at `backend/uploads/audio/` via `storageService.saveAudio()`.
- **Socket.io** used for real-time transcription progress events to the frontend.
- **Rate limit**: 100 requests/minute per IP globally.
- **New routes**: Must be registered in `server.ts`, use `requireAuth`, and follow the routes → controllers → services pattern.
- **Frontend error handling**: Use `getErrorMessage(err, fallback)` from `frontend/src/utils/getErrorMessage.ts` in all catch blocks — uses `axios.isAxiosError` for proper typing. Never use `err: any`.
- **axios `withCredentials: true`** is set on the api.ts axios instance — required for httpOnly cookie auth to work cross-origin in local dev.
- **`react-hooks/set-state-in-effect` is a real custom ESLint rule** in this project — `eslint-disable-next-line react-hooks/set-state-in-effect` is valid and needed for intentional setState-in-effect patterns.
- **MUI v5 `Grid item` TS errors** are pre-existing throughout the codebase — `Grid item xs={...}` causes overload errors. Do not attempt to fix these.
- **Path containment**: `storageService.ts` guards all file paths. Never construct paths from user input without using `storageService` methods.
- **Multi-tenancy**: All project queries must filter by `user_id = req.user.id`. The `projectController` enforces this — follow the same pattern for any new resource type.
