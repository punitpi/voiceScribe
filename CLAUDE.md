# VoiceScribe

Voice-to-text book writing application for elderly authors. React + Vite frontend, Express + TypeScript backend, SQLite database.

## Commands

```bash
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
│   ├── server.ts          # Express app entry point
│   ├── config/
│   │   ├── database.ts    # SQLite init + schema (all tables defined here)
│   │   └── socket.ts      # Socket.io setup
│   ├── routes/            # Express routers (recordings, projects, transcriptions, documents, pdfs, spellCheck)
│   ├── controllers/       # Request/response handling
│   ├── services/          # Business logic
│   │   ├── transcriptionService.ts   # Sarvam AI (Saaras v3) with retry + chunking
│   │   ├── sarvamService.ts          # Sarvam API client + ffmpeg chunking
│   │   ├── pdfService.ts             # pdfkit generation
│   │   ├── spellCheckService.ts
│   │   └── textFormattingService.ts
│   └── middleware/
│       └── upload.ts      # multer config (audio only, 100MB max)
├── frontend/src/
│   ├── pages/             # Dashboard, ProjectPage, DocumentPage
│   ├── components/        # AudioRecorder, AudioUploader, TextEditor, PDFSettingsDialog
│   └── theme/theme.ts     # elderlyTheme (MUI theme for large fonts/accessibility)
└── backend/data/          # SQLite DB lives here (voicescribe.db)
```

## API Routes

| Route | Purpose |
|-------|---------|
| `GET /health` | Health check |
| `/api/projects` | Project CRUD |
| `/api/recordings` | Audio file upload + management |
| `/api/transcriptions` | Trigger and retrieve transcriptions |
| `/api/documents` | Document content (compiled from transcriptions) |
| `/api/pdfs` | PDF generation and email |
| `/api/spellcheck` | Spell check with custom dictionary |

## Environment Setup

**backend/.env** (copy from `backend/.env.example`):
```
NODE_ENV=development
PORT=3001
DATABASE_URL=./data/voicescribe.db
SARVAM_API_KEY=your-sarvam-key  # Required for transcription (Saaras v3)
SMTP_HOST=smtp.gmail.com
SMTP_USER=your@gmail.com
SMTP_PASS=your-app-password  # Gmail app password, not account password
UPLOAD_DIR=./uploads
CORS_ORIGIN=http://localhost:5173
```

**frontend/.env** (copy from `frontend/.env.example`):
```
VITE_API_URL=http://localhost:3001
VITE_WS_URL=ws://localhost:3001
```

## Claude Code Automations

- **Hook**: ESLint auto-runs on edits to `frontend/src/**` (configured in `.claude/settings.json`)
- **Hook**: `.env` files are blocked from edits (deny permission in `.claude/settings.json`)
- **Skill `/dev-start`**: kills ports + starts both servers
- **Skill `/new-route`**: scaffolds route + controller + service
- **Subagent `security-reviewer`**: reviews uploads, SQLite, nodemailer, pdfkit risks
- **MCP: Playwright**: installed for UI testing (recording, transcription flows)

## Gotchas

- **SARVAM_API_KEY is required** for all transcriptions (`sarvamService.ts`). Set it in `backend/.env`. Sarvam Saaras v3 is used for both Kannada (`transcribe` mode) and English (`codemix` mode, handles code-switching).
- **Audio chunking**: Files are auto-split into 25-second WAV segments before sending to Sarvam (REST API limit is 30s). Uses `fluent-ffmpeg` + `@ffmpeg-installer/ffmpeg` (bundled binary — no system ffmpeg required). Chunks are created in a temp dir and cleaned up after transcription.
- **SQLite schema**: All table definitions are in `backend/src/config/database.ts`. No migrations — schema is created with `CREATE TABLE IF NOT EXISTS` on every startup.
- **Audio uploads** stored at `backend/uploads/audio/` with temp filenames, renamed by the controller after DB insert.
- **Socket.io** used for real-time transcription progress events to the frontend.
- **Rate limit**: 100 requests/minute per IP globally.
- **New routes**: Must be registered in `server.ts` and follow the routes → controllers → services pattern.
- **Frontend error handling**: Use `getErrorMessage(err, fallback)` from `frontend/src/utils/getErrorMessage.ts` in all catch blocks — uses `axios.isAxiosError` for proper typing. Never use `err: any`.
- **`react-hooks/set-state-in-effect` is a real custom ESLint rule** in this project — `eslint-disable-next-line react-hooks/set-state-in-effect` is valid and needed for intentional setState-in-effect patterns.
- **MUI v5 `Grid item` TS errors** are pre-existing throughout the codebase — `Grid item xs={...}` causes overload errors. Do not attempt to fix these.
- **Path containment**: Services that construct file paths from DB values must use `path.resolve` + `startsWith(UPLOAD_ROOT + path.sep)` guard before file ops (see `transcriptionService.ts`).
