# VoiceScribe - Complete Development Prompt

```
Create VoiceScribe, a voice-to-text book writing application for elderly authors using Node.js and Express.

## PROJECT OVERVIEW
VoiceScribe is an elderly-friendly web application that helps authors with vision impairments convert voice recordings into formatted text and PDFs. The app records or accepts audio files, transcribes them using OpenAI Whisper API (supporting English and Kannada), provides basic spell-checking and formatting, and generates PDFs for email delivery.

## TECHNICAL REQUIREMENTS

### Backend Stack
- Node.js (v18 or later)
- Express.js framework
- SQLite3 for database (lightweight, file-based)
- Multer for file uploads
- PDFKit for PDF generation
- Nodemailer for email delivery
- Passport.js with Google OAuth 2.0 for authentication
- Axios for Whisper API calls
- nspell for English spell checking
- Socket.io for real-time transcription progress updates
- dotenv for environment configuration
- Winston or Morgan for logging

### Frontend Stack
- React (using Vite or Create React App)
- Material-UI or Ant Design (configured for large components)
- Tailwind CSS for styling
- React Context API for state management
- Axios for API calls
- react-media-recorder or RecordRTC for audio recording
- react-dropzone for file uploads
- react-pdf for PDF preview
- Progressive Web App (PWA) capabilities for mobile installation

### Deployment & Hosting
- Primary: Railway ($5/month) or Render ($7/month for always-on)
- Alternative: Fly.io (free tier) or Linode Nanode ($5/month)
- File storage: Local filesystem initially, S3 or Backblaze B2 for production
- SSL via deployment platform (automatic)
- Environment-based configuration for dev/production

## CORE FEATURES

### 1. Audio Recording & Upload
- Record audio directly in browser using Web Audio API
- Support audio file uploads: MP3, M4A, WAV, OGG, WebM formats
- Maximum file size: 100MB per recording
- Chunked upload for large files with progress bar
- Audio level visualization during recording
- Pause/resume recording functionality
- Recording timer display (MM:SS format)
- Language selection before recording (English or Kannada)
- Save recordings with metadata: filename, duration, size, language, timestamp
- Multiple recordings per project/chapter
- Ability to upload existing audio files from device

### 2. OpenAI Whisper API Integration
- API endpoint: https://api.openai.com/v1/audio/transcriptions
- Model: whisper-1
- Support for English ('en') and Kannada ('kn') languages
- Handle audio files larger than 25MB by splitting before upload
- Request format: multipart/form-data with audio file
- Response format: verbose_json to get timestamps for pause detection
- Implement retry logic: 3 attempts with exponential backoff (2s, 4s, 8s)
- Error handling for API failures with user-friendly messages
- Progress tracking via WebSocket or polling mechanism
- Store raw transcription text in database
- Optional: Store word-level timestamps for advanced features
- Cost tracking: Log audio duration for billing estimates ($0.006/minute)

### 3. Text Processing & Auto-Formatting

**Sentence Capitalization**:
- Capitalize first letter after period, exclamation mark, question mark
- Handle common abbreviations: Dr., Mr., Mrs., Prof., etc.
- Preserve acronyms (NASA, FBI, etc.)

**Paragraph Detection**:
- Use Whisper timestamps to detect pauses longer than 2 seconds
- Create new paragraph automatically
- Recognize spoken commands: "new paragraph", "paragraph break"
- Maintain minimum 2 sentences per paragraph unless explicit break

**Punctuation Correction**:
- Add missing periods at sentence ends based on pause detection
- Fix spacing around punctuation (remove before, add after)
- Handle quotation marks properly
- Correct common patterns: "comma" → ",", "period" → ".", "question mark" → "?"

**Chapter/Section Detection**:
- Recognize spoken keywords: "Chapter [number]", "Chapter [name]", "Section [name]", "Part [number]"
- Auto-format as headings with larger font and page break
- Build table of contents from detected chapters
- Support both English and Kannada chapter markers

**Smart Text Cleanup**:
- Remove filler words (configurable): um, uh, like, you know, actually
- Fix repeated words (stuttering)
- Normalize multiple spaces to single space
- Remove leading/trailing whitespace
- Option to preserve or remove filler words per user preference

### 4. Spell Checking

**English Spell Check**:
- Use nspell library with en_US dictionary
- Check each word against dictionary
- Provide top 3 suggestions for misspelled words
- Ignore words in all caps (acronyms)
- Ignore numbers and mixed alphanumeric
- Support custom dictionary per user/project

**Kannada Spell Check**:
- Implement basic word list dictionary (common Kannada words)
- UTF-8 and Unicode support for Kannada script
- Flag unknown words but provide limited suggestions
- Allow adding words to custom dictionary

**Custom Dictionary**:
- Allow users to add proper nouns, character names, technical terms
- Project-specific dictionary (per book)
- Import/export custom word lists

### 5. Document Editor

**Text Editor Interface**:
- Large, readable default font size: 18px
- Font size adjustment: 14px - 28px range with +/- buttons
- Font family options: serif (Times New Roman), sans-serif (Arial), monospace
- High contrast mode: dark text (#1f2937) on white background
- Line height adjustment: 1.5x, 2.0x, 2.5x options
- Text area takes up 80% of screen width, centered
- Auto-save every 30 seconds (configurable)
- Visual "Saving..." and "Saved" indicators
- Manual save button (large, prominent)

**Editing Features**:
- Full undo/redo history (at least 50 steps)
- Keyboard shortcuts: Ctrl+Z (undo), Ctrl+Y (redo), Ctrl+S (save), Ctrl+F (find)
- Find and Replace functionality with match highlighting
- Word count display (real-time update)
- Character count display
- Reading time estimate (based on 200 words/minute)

**Spell Check UI**:
- Red wavy underline for misspelled words
- Right-click or tap to see suggestions
- Click suggestion to replace word
- "Add to dictionary" option
- "Ignore all" for repeated words

**Chapter Navigation**:
- Collapsible sidebar showing all chapters/sections
- Click chapter name to jump to that section
- Current chapter highlighted
- Drag-and-drop to reorder chapters (optional)

**Toolbar** (large, touch-friendly icons):
- Save (floppy disk icon)
- Font size increase/decrease (A+ / A-)
- Bold, Italic (basic formatting)
- Insert chapter break
- Generate PDF
- Spell check on/off toggle
- Settings gear icon
- Help (?) icon

### 6. PDF Generation

**PDF Layout & Formatting**:
- Page size: A4 or US Letter (configurable in settings)
- Margins: 1 inch (2.54cm) on all sides
- Font: Times New Roman for English, Noto Sans Kannada for Kannada text
- Body text: 12pt font size (configurable: 10-14pt)
- Line spacing: Double-spaced (2.0) or 1.5-spaced (configurable)
- Paragraph indent: 0.5 inch first line indent (except after headings)
- Alignment: Left-aligned (justified optional)

**Headers & Footers**:
- Header (optional): Book title and author name, 10pt, centered
- Footer: Page numbers, centered, format "Page X of Y"
- First page: Title page with book title, author name, date (optional)

**Chapter Formatting**:
- Chapter headings: 16pt bold, centered or left-aligned
- Page break before each chapter
- 2 blank lines after chapter heading
- Keep heading with following paragraph (no orphans)

**Table of Contents**:
- Auto-generated from chapter markers
- Lists chapter titles with page numbers
- Placed at beginning of document (after optional title page)
- Clickable links in PDF (if supported)

**PDF Metadata**:
- Title: Project/book title
- Author: Author name from settings
- Subject: "Book draft created with VoiceScribe"
- Keywords: Auto-extracted important words
- Creator: "VoiceScribe"
- Creation date: Current timestamp

**Special Features**:
- Widow and orphan control (minimum 2 lines)
- Keep chapter headings with following text
- Support for Kannada Unicode characters
- Embedded fonts for Kannada support
- Optimize file size (compress images if any)

**Export Options**:
- Save PDF to server: /uploads/pdfs/{projectId}_{version}_{timestamp}.pdf
- Generate download link for user
- Preview PDF in browser before download
- Email PDF directly from app

### 7. Email Delivery

**Email Service Configuration**:
- Use Nodemailer with SMTP
- Support Gmail, SendGrid, or custom SMTP server
- Configure via environment variables: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS
- TLS/SSL support

**Email Composition**:
- Subject line template: "[{Book Title}] - Draft {Version} - {Date}"
- Example: "[My Novel] - Draft 3 - November 26, 2025"
- Body template (plain text):
```

Hi,

Please find attached the latest draft of "{Book Title}".

Document Details:

- Version: {Version Number}
- Word Count: {Count}
- Pages: {Page Count}
- Generated: {Date and Time}

Best regards, VoiceScribe

```
- Attach PDF file
- Support HTML email template (optional, simple design)

**Recipient Management**:
- Configure default recipients in settings (typist email, author email)
- Support multiple recipients (To, CC, BCC)
- Validate email addresses before sending
- Save email history per project (sent to whom, when, which version)

**Delivery Features**:
- Send button with confirmation dialog
- Progress indicator while sending
- Success/failure notification
- Retry mechanism: 2 attempts with 5-second delay
- Error messages: "Email sent successfully" or specific error (invalid email, connection failed, etc.)
- Queue system for multiple emails (send one at a time)

**Email Log**:
- Track all sent emails: recipient, timestamp, PDF version, delivery status
- View email history per project
- Resend previous versions

### 8. Project & Document Management

**Project Structure**:
- Create new project (book)
- Project fields: Title, Author name, Language (English/Kannada), Description, Created date
- One project can contain multiple recordings and transcriptions
- Organize recordings by chapters/sections within project
- Version control: Draft 1, Draft 2, etc. with timestamps

**Recording Management**:
- List all recordings within a project
- Display: Recording name, Duration, Date, Transcription status (Pending/Processing/Complete/Failed)
- Play recording directly in app (audio player)
- Delete recording with confirmation
- Re-transcribe if transcription failed
- Download original audio file

**Document Operations**:
- Merge multiple transcriptions into single document
- Split document into chapters
- Duplicate document (create new version)
- Export document as TXT, DOCX (optional), or PDF
- Archive old versions (hide from main view but keep in database)
- Delete document with confirmation (move to trash, permanent delete after 30 days)

**Search & Filter**:
- Search projects by title or author
- Filter by language
- Sort by: Date created, Last modified, Title (A-Z)
- View archived projects separately

**Statistics Dashboard** (per project):
- Total recordings: Count
- Total audio duration: HH:MM:SS
- Word count: Current draft
- Page count estimate
- Transcription cost estimate (based on audio duration)
- Version history with word count per version

### 9. User Interface Design (Elderly-Friendly)

**Design Principles**:
- High contrast: Dark text (#1f2937) on white background (#ffffff)
- Large touch targets: Minimum 48px × 48px for all interactive elements
- Simple navigation: Maximum 3-4 main screens
- Clear visual hierarchy with generous whitespace
- Consistent layout across all screens
- Minimal cognitive load: One primary action per screen
- Forgiving UI: Confirmation dialogs for destructive actions

**Color Palette**:
- Primary: #2563eb (Blue - trust, calm)
- Primary hover: #1d4ed8
- Success: #10b981 (Green)
- Error: #ef4444 (Red)
- Warning: #f59e0b (Orange)
- Background: #ffffff (White)
- Text primary: #1f2937 (Almost black)
- Text secondary: #6b7280 (Gray)
- Border: #d1d5db (Light gray)

**Typography**:
- Font family: System fonts (Segoe UI, Roboto, Arial)
- Base size: 18px
- Large buttons: 20-24px
- Headings: 28-32px
- Line height: 1.6 minimum
- Font weight: 400 (normal), 600 (semibold for buttons/headings)

**Button Styles**:
- Large buttons: 60px height, minimum 120px width
- Border radius: 8px (rounded corners)
- Primary action: Blue background, white text, shadow
- Secondary action: White background, blue border, blue text
- Danger action: Red background, white text
- Icon buttons: 60px × 60px with 28px icons
- Button text: Semibold, 20px
- Hover state: Slightly darker shade + scale(1.02)
- Active state: Scale(0.98) for tactile feedback
- Disabled state: 50% opacity, no cursor

**Spacing**:
- Screen padding: 24px
- Component margin: 16-24px
- Element padding: 16px
- Button padding: 16px horizontal, 20px vertical

**Screen Layouts**:

1. **Login/Welcome Screen** (if using authentication):
 - VoiceScribe logo (large, centered)
 - Welcome message: "Welcome to VoiceScribe"
 - Large "Sign in with Google" button
 - Or simple email/password form if not using OAuth
 - Language selector (English/Kannada for UI)

2. **Dashboard** (Home):
 - Header: "VoiceScribe" logo (top left), Settings icon (top right), User name/avatar
 - Large "New Project" button (prominent, center top, blue, 200px width)
 - Projects grid: 2 columns on tablet/desktop, 1 column on mobile
 - Project card: Title (bold, 24px), Last modified date, Word count, Thumbnail/icon, Tap to open
 - Empty state: "No projects yet. Create your first project!" with arrow pointing to New Project button
 - Footer: Simple help link, About link

3. **New Project Screen**:
 - Header: "Create New Project" with back button
 - Large input fields:
   - Project Title (required)
   - Author Name
   - Language selector: English / Kannada (large radio buttons)
   - Description (optional)
 - Large "Create Project" button at bottom
 - Cancel button (secondary style)

4. **Project View Screen**:
 - Header: Project title (editable via pencil icon), Back to dashboard
 - Two large action buttons:
   - "Record New Audio" (microphone icon, blue)
   - "Upload Audio File" (upload icon, blue)
 - Recordings list below:
   - Each recording: Name, Duration, Date, Status badge (Transcribed/Processing/Failed)
   - Play button, Edit transcript button, Delete button (icon buttons)
 - "View Complete Document" button (shows merged transcriptions)
 - "Generate PDF" button (if transcriptions exist)

5. **Recording Screen**:
 - Header: "Recording" with back button, Language badge (EN/KN)
 - Center: Large circular record button (150px diameter, red when recording)
 - Below button: Timer (48px font, MM:SS)
 - Audio level bars (animated during recording)
 - Bottom buttons:
   - "Stop & Save" (large, green, only visible when recording)
   - "Discard" (secondary, only visible when recording)
   - "Pause" (yellow, toggles to "Resume")
 - Recording name input field (appears after stopping)

6. **Audio Upload Screen**:
 - Header: "Upload Audio" with back button
 - Large dropzone area: "Drag audio file here or click to browse"
 - Supported formats listed: MP3, M4A, WAV, OGG
 - Language selector: English / Kannada
 - Selected file preview: Name, size, duration (if detectable)
 - Progress bar during upload
 - "Upload & Transcribe" button (large, blue)
 - Cancel button

7. **Editor Screen**:
 - Header: Document title (editable), Back button, Save indicator ("Saved" / "Saving...")
 - Toolbar (top, large icons with labels):
   - Font size: A- and A+ buttons
   - Save button (floppy icon)
   - PDF button (document icon)
   - Settings (gear icon)
 - Sidebar (left, collapsible): Chapter navigation list
 - Main area: Text editor (80% width, centered, white background)
 - Footer: Word count, Character count, Reading time
 - Floating action button: "Generate PDF" (bottom right, always visible)

8. **PDF Preview Screen**:
 - Header: "PDF Preview" with back button
 - PDF viewer (embedded, scrollable)
 - Toolbar (bottom or top):
   - Download PDF button (large, blue)
   - Email PDF button (large, blue)
   - Print button (optional)
   - Settings button (adjust PDF settings)
 - Page navigation: Previous/Next page, Page counter (Page X of Y)

9. **Settings Screen**:
 - Header: "Settings" with back button
 - Sections (collapsible accordions):

   **Account**:
   - User name, Email (if using auth)
   - Change password / Sign out

   **Editor Preferences**:
   - Default font size: Slider (14-28px)
   - Line spacing: Dropdown (1.5x, 2.0x, 2.5x)
   - Auto-save interval: Dropdown (15s, 30s, 60s, Off)
   - High contrast mode: Toggle
   - Remove filler words: Toggle

   **PDF Settings**:
   - Page size: Dropdown (A4, Letter)
   - Font size: Slider (10-14pt)
   - Line spacing: Dropdown (1.5, 2.0)
   - Include header: Toggle
   - Include page numbers: Toggle

   **Email Configuration**:
   - Default recipient email: Input field
   - CC recipients: Input field (comma-separated)
   - Email subject template: Input field

   **Language & Region**:
   - App language: English / Kannada
   - Default recording language: English / Kannada

   **Storage & Data**:
   - Storage used: Display current usage
   - Clear cache button
   - Export all data button
   - Delete account button (with confirmation)

 - Large "Save Settings" button at bottom

10. **Help/Tutorial Screen** (optional):
  - Step-by-step guide with images/videos
  - FAQ section
  - Contact support (email link)
  - Video tutorial embed (if available)

**Responsive Design**:
- Mobile (< 768px): Single column, full-width components, larger touch targets
- Tablet (768px - 1024px): Two columns for lists, sidebar collapsible
- Desktop (> 1024px): Full sidebar, multi-column layouts
- Always prioritize readability and touch-friendliness

**Accessibility**:
- ARIA labels for all interactive elements
- Keyboard navigation support (Tab, Enter, Esc)
- Focus indicators (visible outline on focused elements)
- Screen reader friendly (semantic HTML)
- Alt text for all icons and images
- High contrast mode support
- Text scaling support (respects browser zoom)

**Loading & Error States**:
- Loading spinner: Large, centered, with descriptive text ("Transcribing audio...", "Generating PDF...")
- Progress bars for long operations (upload, transcription)
- Error messages: Red background, clear explanation, suggested action
- Success messages: Green background, auto-dismiss after 3 seconds
- Empty states: Friendly illustrations with clear call-to-action

**Animations**:
- Smooth transitions (200-300ms)
- Button press feedback (scale down on click)
- Recording pulse animation (for record button)
- Gentle fade-in for new content
- No jarring or distracting animations
- Respect prefers-reduced-motion for accessibility

### 10. Authentication & Security

**Option A: Tailscale Private Network (Recommended)**:
- No public internet access required
- Install Tailscale on server and father's phone
- App accessible only via Tailscale IP (e.g., http://100.x.x.x:3000)
- No authentication needed (network-level security)
- Middleware to verify request originates from Tailscale network
- Environment variable: TAILSCALE_NETWORK=100.x.x.x/24
- Reject all requests from outside Tailscale network (403 Forbidden)
- Simple, secure, no login complexity
- No password to remember for elderly user

**Option B: Google OAuth with Email Whitelist (If public)**:
- Implement Passport.js with Google OAuth 2.0 Strategy
- Environment variable: ALLOWED_EMAILS=email1@gmail.com,email2@gmail.com
- User clicks "Sign in with Google"
- After Google auth, check if email is in whitelist
- If not whitelisted: Show error "Access restricted. Contact administrator."
- If whitelisted: Create session, redirect to dashboard
- Session management: Express-session with secure cookies
- Session timeout: 30 days (remember me) or 24 hours
- Logout functionality: Clear session, redirect to login

**General Security**:
- HTTPS only (enforce in production)
- Helmet.js for security headers
- CORS configuration (restrict origins)
- Rate limiting: Max 100 requests per minute per IP (express-rate-limit)
- File upload validation:
- Check file extension and MIME type
- Scan file size before processing
- Sanitize filenames (remove special characters)
- SQL injection prevention: Use parameterized queries (SQLite prepared statements)
- XSS prevention: Sanitize user inputs, use Content Security Policy
- API key security: Store OpenAI API key in environment variable, never expose to frontend
- No sensitive data in logs (mask API keys, emails)

**Data Privacy**:
- Store only necessary user data
- Encrypt sensitive fields in database (optional: email, names)
- Regular backups: Daily automated backups to S3/B2
- Data retention policy: Keep deleted projects for 30 days before permanent deletion
- GDPR compliance (if applicable): Export user data, delete all user data on request

### 11. Database Schema

**Users Table**:
```

id: INTEGER PRIMARY KEY AUTOINCREMENT email: TEXT UNIQUE NOT NULL name: TEXT google_id: TEXT UNIQUE (if using OAuth) created_at: DATETIME DEFAULT CURRENT_TIMESTAMP last_login: DATETIME settings: JSON (user preferences)

```

**Projects Table**:
```

id: INTEGER PRIMARY KEY AUTOINCREMENT user_id: INTEGER FOREIGN KEY → Users(id) title: TEXT NOT NULL author_name: TEXT language: TEXT ('en' or 'kn') description: TEXT created_at: DATETIME DEFAULT CURRENT_TIMESTAMP updated_at: DATETIME DEFAULT CURRENT_TIMESTAMP archived: BOOLEAN DEFAULT 0

```

**Recordings Table**:
```

id: INTEGER PRIMARY KEY AUTOINCREMENT project_id: INTEGER FOREIGN KEY → Projects(id) filename: TEXT NOT NULL (stored file path) original_filename: TEXT duration: INTEGER (seconds) file_size: INTEGER (bytes) language: TEXT ('en' or 'kn') status: TEXT ('pending', 'transcribing', 'completed', 'failed') created_at: DATETIME DEFAULT CURRENT_TIMESTAMP

```

**Transcriptions Table**:
```

id: INTEGER PRIMARY KEY AUTOINCREMENT recording_id: INTEGER FOREIGN KEY → Recordings(id) raw_text: TEXT (original Whisper output) formatted_text: TEXT (after auto-formatting) word_count: INTEGER language: TEXT confidence: REAL (average confidence from Whisper, if available) created_at: DATETIME DEFAULT CURRENT_TIMESTAMP updated_at: DATETIME DEFAULT CURRENT_TIMESTAMP

```

**Documents Table**:
```

id: INTEGER PRIMARY KEY AUTOINCREMENT project_id: INTEGER FOREIGN KEY → Projects(id) content: TEXT (merged and edited transcriptions) version: INTEGER word_count: INTEGER character_count: INTEGER created_at: DATETIME DEFAULT CURRENT_TIMESTAMP updated_at: DATETIME DEFAULT CURRENT_TIMESTAMP

```

**PDFs Table**:
```

id: INTEGER PRIMARY KEY AUTOINCREMENT document_id: INTEGER FOREIGN KEY → Documents(id) filename: TEXT (stored PDF path) settings: JSON (font size, spacing, etc. used for this PDF) file_size: INTEGER page_count: INTEGER created_at: DATETIME DEFAULT CURRENT_TIMESTAMP

```

**EmailLogs Table**:
```

id: INTEGER PRIMARY KEY AUTOINCREMENT project_id: INTEGER FOREIGN KEY → Projects(id) pdf_id: INTEGER FOREIGN KEY → PDFs(id) recipient: TEXT subject: TEXT status: TEXT ('sent', 'failed') error_message: TEXT (if failed) sent_at: DATETIME DEFAULT CURRENT_TIMESTAMP

```

**CustomDictionary Table**:
```

id: INTEGER PRIMARY KEY AUTOINCREMENT user_id: INTEGER FOREIGN KEY → Users(id) project_id: INTEGER FOREIGN KEY → Projects(id) (null for global words) word: TEXT NOT NULL language: TEXT added_at: DATETIME DEFAULT CURRENT_TIMESTAMP

```

**Indexes** (for performance):
- Index on Projects(user_id)
- Index on Recordings(project_id)
- Index on Transcriptions(recording_id)
- Index on Documents(project_id)
- Index on EmailLogs(project_id)

### 12. API Endpoints

**Authentication** (if using Option B):
- GET /auth/google - Redirect to Google OAuth
- GET /auth/google/callback - Handle OAuth callback
- POST /auth/logout - Logout user
- GET /auth/me - Get current user info

**Projects**:
- GET /api/projects - List all projects for user
- POST /api/projects - Create new project
- GET /api/projects/:id - Get project details
- PUT /api/projects/:id - Update project
- DELETE /api/projects/:id - Delete project (soft delete)
- GET /api/projects/:id/stats - Get project statistics

**Recordings**:
- POST /api/projects/:id/recordings - Upload audio file
- GET /api/projects/:id/recordings - List recordings for project
- GET /api/recordings/:id - Get recording details
- DELETE /api/recordings/:id - Delete recording
- POST /api/recordings/:id/transcribe - Start transcription
- GET /api/recordings/:id/status - Get transcription status

**Transcriptions**:
- GET /api/transcriptions/:id - Get transcription text
- PUT /api/transcriptions/:id - Update formatted text
- POST /api/transcriptions/:id/reformat - Re-run auto-formatting

**Documents**:
- GET /api/projects/:id/document - Get merged document
- PUT /api/projects/:id/document - Update document content
- POST /api/projects/:id/document/merge - Merge all transcriptions
- GET /api/documents/:id/versions - Get version history

**PDFs**:
- POST /api/documents/:id/pdf - Generate PDF
- GET /api/pdfs/:id - Download PDF
- GET /api/pdfs/:id/preview - Preview PDF in browser
- POST /api/pdfs/:id/email - Email PDF

**Spell Check**:
- POST /api/spellcheck - Check text (body: {text, language})
- POST /api/dictionary/add - Add word to custom dictionary
- GET /api/dictionary - Get custom dictionary words

**Settings**:
- GET /api/settings - Get user settings
- PUT /api/settings - Update user settings

**WebSocket Events** (for real-time updates):
- connect - Client connects
- transcription:progress - Update transcription progress {recordingId, progress%}
- transcription:complete - Transcription finished {recordingId, transcriptionId}
- transcription:error - Transcription failed {recordingId, error}
- document:saved - Document auto-saved {documentId, timestamp}

### 13. Environment Variables

**Required**:
```

NODE_ENV=development|production PORT=3000 DATABASE_URL=./data/voicescribe.db

# OpenAI Whisper API

OPENAI_API_KEY=sk-...

# Email (SMTP)

SMTP_HOST=smtp.gmail.com SMTP_PORT=587 SMTP_USER=your-email@gmail.com SMTP_PASS=your-app-password DEFAULT_EMAIL_FROM=VoiceScribe\*\* \*\*[noreply@voicescribe.app](mailto:noreply@voicescribe.app)

# Authentication (Option B only)

GOOGLE_CLIENT_ID=your-client-id GOOGLE_CLIENT_SECRET=your-client-secret GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback ALLOWED_EMAILS=user1@gmail.com,user2@gmail.com SESSION_SECRET=your-random-secret-key

# Tailscale (Option A only)

TAILSCALE_NETWORK=100.64.0.0/10

# File Storage

UPLOAD_DIR=./uploads MAX_FILE_SIZE=104857600 # 100MB in bytes

# Frontend URL

FRONTEND_URL=http://localhost:5173

# Optional

CORS_ORIGIN=http://localhost:5173 LOG_LEVEL=info

```

**For Production**:
```

NODE_ENV=production PORT=3000 DATABASE_URL=/data/voicescribe.db

# Use production URLs

FRONTEND_URL=https://voicescribe.app GOOGLE_CALLBACK_URL=https://voicescribe.app/auth/google/callback

# File storage (S3 or B2)

AWS_ACCESS_KEY_ID=... AWS_SECRET_ACCESS_KEY=... AWS_REGION=us-east-1 S3_BUCKET=voicescribe-files

# Or Backblaze B2

B2_KEY_ID=... B2_APPLICATION_KEY=... B2_BUCKET=voicescribe-files

```

### 14. Deployment Instructions

**Prepare for Deployment**:
1. Build frontend: `cd frontend && npm run build`
2. Configure environment variables for production
3. Set up database in production
4. Test all features locally with production build
5. Set up file storage (S3 or B2)

**Deploy to Railway**:
1. Install Railway CLI: `npm install -g @railway/cli`
2. Login: `railway login`
3. Initialize: `railway init`
4. Add environment variables via Railway dashboard
5. Deploy: `railway up`
6. Configure custom domain (optional)
7. Set up automatic deployments from Git

**Deploy to Render**:
1. Create new Web Service on Render dashboard
2. Connect GitHub repository
3. Build command: `npm install && cd frontend && npm install && npm run build && cd ..`
4. Start command: `npm start`
5. Add environment variables in dashboard
6. Choose plan: Free or Starter ($7/month for always-on)
7. Deploy

**Deploy to Fly.io**:
1. Install Fly CLI: `curl -L https://fly.io/install.sh | sh`
2. Login: `fly auth login`
3. Launch: `fly launch`
4. Configure fly.toml file
5. Set secrets: `fly secrets set OPENAI_API_KEY=sk-...`
6. Deploy: `fly deploy`
7. Scale: `fly scale vm shared-cpu-1x --memory 256`

**Deploy to Linode**:
1. Create Linode Nanode (1GB, $5/month)
2. SSH into server
3. Install Node.js: `curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -`
4. Clone repository
5. Install dependencies: `npm install`
6. Build frontend: `cd frontend && npm run build`
7. Set up PM2: `npm install -g pm2`
8. Create ecosystem.config.js for PM2
9. Start app: `pm2 start ecosystem.config.js`
10. Set up Nginx as reverse proxy
11. Configure SSL with Let's Encrypt
12. Set up automatic backups

**Database Migration**:
- Create migration scripts in `/migrations` folder
- Run on first deployment to create tables
- Version control schema changes

**File Storage Migration** (Local to S3/B2):
- Set up S3 or B2 bucket
- Configure CORS for browser uploads
- Write migration script to copy existing files
- Update upload/download logic to use cloud storage
- Keep local storage as fallback

**Monitoring & Logging**:
- Set up error tracking: Sentry or LogRocket
- Log aggregation: Papertrail or Loggly
- Uptime monitoring: UptimeRobot or Pingdom
- Set up alerts for API errors, high memory usage
- Monitor Whisper API usage and costs

**Backup Strategy**:
- Daily automated database backups to S3/B2
- Keep last 30 days of backups
- Weekly full backup (database + files)
- Test restore process monthly

### 15. Cost Breakdown & Optimization

**Monthly Costs (Estimated)**:

**Hosting**:
- Railway Starter: $5/month
- Render Starter: $7/month
- Fly.io (1 VM): $5-7/month
- Linode Nanode: $5/month
- **Recommended**: Railway ($5) - easiest deployment

**Storage**:
- Local (included in hosting): $0
- S3 Standard: ~$0.50-2/month for 50GB
- Backblaze B2: ~$0.25-1/month for 50GB
- **Recommended**: Start with local, migrate to B2 if needed

**OpenAI Whisper API**:
- Cost: $0.006 per minute of audio
- Estimate: 2 hours/week = 8 hours/month = 480 minutes
- Monthly: 480 × $0.006 = $2.88
- **Variable based on usage**: $2-10/month

**Email**:
- Gmail SMTP: Free (up to 500 emails/day)
- SendGrid Free: 100 emails/day
- **Cost**: $0

**Domain** (optional):
- .com domain: ~$12/year = $1/month
- **Optional**: Can use Railway/Render subdomain for free

**Total Monthly Cost**:
- **Minimal**: $5 (Railway) + $2 (Whisper) = ~$7/month
- **Typical**: $5 (Railway) + $5 (Whisper) + $1 (B2 storage) = ~$11/month
- **With domain**: Add $1/month

**Cost Optimization Tips**:
- Use free tier services where possible (Fly.io, Render free tier for testing)
- Optimize audio files before sending to Whisper (remove silence, compress)
- Cache transcriptions to avoid re-processing
- Implement audio chunking to process only new content
- Monitor API usage with alerts
- Consider local Whisper model for testing (WhisperX, faster-whisper)

### 16. Testing Requirements

**Unit Tests**:
- Test audio upload validation
- Test Whisper API integration (mock API calls)
- Test text formatting functions
- Test spell checking
- Test PDF generation
- Test email sending (mock SMTP)

**Integration Tests**:
- Test complete flow: Upload → Transcribe → Edit → PDF → Email
- Test authentication flow
- Test database operations
- Test file storage operations

**Manual Testing Checklist**:
- [ ] Record audio and verify transcription accuracy
- [ ] Upload various audio formats (MP3, M4A, WAV)
- [ ] Test with English audio
- [ ] Test with Kannada audio
- [ ] Test auto-formatting features
- [ ] Test spell check suggestions
- [ ] Test PDF generation with different settings
- [ ] Test email delivery
- [ ] Test on mobile device (father's phone)
- [ ] Test with poor internet connection
- [ ] Test file size limits
- [ ] Test session persistence
- [ ] Test all error states

**User Acceptance Testing** (with father):
- Can father easily record audio?
- Can he read the transcribed text?
- Can he make simple edits?
- Can he generate and receive PDF via email?
- Does the UI make sense to him?
- Are buttons large enough?
- Is text readable?

### 17. Documentation Requirements

**README.md**:
- Project overview
- Features list
- Tech stack
- Installation instructions
- Environment setup
- Running locally
- Deployment guide
- Contributing guidelines

**USER_GUIDE.md**:
- How to create a project
- How to record audio
- How to upload audio files
- How to edit transcription
- How to generate PDF
- How to email PDF
- Settings explanation
- Troubleshooting common issues

**API_DOCUMENTATION.md**:
- List all API endpoints
- Request/response formats
- Authentication
- Error codes
- WebSocket events

**DEPLOYMENT.md**:
- Step-by-step deployment for each platform
- Environment variables explanation
- SSL setup
- Domain configuration
- Monitoring setup
- Backup procedures

**CODE_COMMENTS**:
- Comment all complex logic
- JSDoc for functions
- Explain Whisper API integration
- Document PDF generation settings
- Explain database schema choices

### 18. Future Enhancements (Post-MVP)

**Phase 2 Features**:
- Voice commands during recording ("new paragraph", "delete that", "chapter break")
- Better Kannada spell check with ML model
- Collaborative editing (share with typist for real-time corrections)
- Audio playback with text highlighting (click word to hear it)
- Speaker diarization (detect multiple speakers)
- Export to DOCX format (Microsoft Word)
- Import existing documents
- Mobile app (React Native or Flutter)
- Offline mode (record and transcribe later)
- Advanced PDF templates (different book formats)

**Phase 3 Features**:
- AI-powered style suggestions (improve sentence structure)
- Character/plot tracking for fiction writers
- Citation management for non-fiction
- Integration with publishing platforms
- Multi-language support (add more Indian languages)
- Text-to-speech for proofreading (read document aloud)
- Version diffing (compare document versions)
- Cloud sync across devices
- Backup to Google Drive or Dropbox

**Accessibility Improvements**:
- Full screen reader support
- Voice control for entire app
- Large cursor mode
- Keyboard-only navigation
- Color blind friendly palette
- Adjustable interface contrast
- Focus indicators customization

### 19. Success Metrics

**Performance Metrics**:
- Page load time: < 2 seconds
- Audio upload: < 5 seconds for 10MB file
- Transcription: Real-time or faster (1 hour audio → 1 hour or less)
- PDF generation: < 30 seconds for 100 pages
- Auto-save: < 1 second response time

**Quality Metrics**:
- Transcription accuracy: > 90% for clear audio
- Spell check accuracy: > 85%
- PDF formatting: Professional, consistent
- Email delivery rate: > 98%

**User Experience Metrics**:
- Time to create first project: < 2 minutes
- Time to generate first PDF: < 10 minutes (including recording)
- Error rate: < 5% of operations
- User satisfaction: Positive feedback from father
- Reduction in typist back-and-forth: From 5 rounds to 1-2 rounds

**Business Metrics**:
- Monthly hosting cost: < $15
- API costs: < $10/month
- Uptime: > 99% (< 7 hours downtime/month)

## DELIVERABLES

1. **Complete working application** with all core features
2. **Deployment** on chosen platform (Railway recommended)
3. **Documentation**: README, User Guide, API docs, Deployment guide
4. **Environment configuration** files (.env.example)
5. **Database schema** with migration scripts
6. **Test suite** with unit and integration tests
7. **Mobile-responsive frontend** that works on father's Android phone
8. **Production-ready build** with error handling and logging

## DEVELOPMENT APPROACH

**Start with MVP (Week 1-2)**:
1. Set up project structure (backend + frontend)
2. Basic authentication (choose Tailscale or OAuth)
3. Audio recording and upload
4. Whisper API integration
5. Display transcribed text
6. Basic text editor
7. Simple PDF generation
8. Email functionality

**Add Polish (Week 3)**:
1. Auto-formatting
2. Spell checking
3. Improved UI/UX
4. Project management
5. Settings page
6. Error handling

**Test & Deploy (Week 4)**:
1. Testing with father
2. Bug fixes
3. Performance optimization
4. Documentation
5. Production deployment
6. Monitoring setup

## CRITICAL REQUIREMENTS

1. **Elderly-friendly UI is paramount** - Large buttons, high contrast, simple navigation
2. **Transcription accuracy** - Must be > 90% to reduce editing burden
3. **Reliable email delivery** - Critical for workflow with typist
4. **Cost-effective** - Must stay under $15/month
5. **Mobile-first** - Father will use Android phone primarily
6. **Data persistence** - Never lose work (auto-save, backups)
7. **Error resilience** - Handle API failures gracefully
8. **Privacy** - Keep father's work secure

## IMPLEMENTATION NOTES

- Use async/await for all asynchronous operations
- Implement proper error boundaries in React
- Use environment variables for all configuration
- Implement rate limiting to prevent API abuse
- Add comprehensive logging for debugging
- Use TypeScript for better type safety (optional but recommended)
- Follow REST API best practices
- Implement CORS properly
- Use prepared statements for SQL to prevent injection
- Validate all user inputs on both frontend and backend
- Compress audio files before sending to Whisper if possible
- Implement request queuing for Whisper API (don't overwhelm API)
- Use WebSockets for real-time transcription updates
- Implement graceful degradation (if WebSocket fails, use polling)
- Add loading states for all async operations
- Implement proper session management
- Use HTTPS in production (mandatory)
- Set up automatic deployments from Git
- Monitor error rates and set up alerts
- Implement health check endpoint for monitoring
- Add request logging for debugging
- Use semantic versioning for releases

START WITH THE MVP AND ITERATE. PRIORITIZE SIMPLICITY AND RELIABILITY OVER FEATURES.
```
