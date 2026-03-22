import { createClient, Client } from '@libsql/client';

let client: Client;

export const getDb = (): Client => {
  if (!client) throw new Error('Database not initialized. Call initDatabase() first.');
  return client;
};

export const initDatabase = async (): Promise<void> => {
  const url = process.env.TURSO_URL ?? 'file:./data/voicescribe.db';
  const authToken = process.env.TURSO_AUTH_TOKEN; // undefined = local file mode

  client = createClient({ url, authToken });

  // WAL mode only for local file (no-op for remote Turso)
  if (url.startsWith('file:')) {
    await client.execute('PRAGMA journal_mode=WAL');
  }

  await runMigrations();
};

async function runMigrations(): Promise<void> {
  // Projects table
  await client.execute(`
    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      author_name TEXT,
      language TEXT DEFAULT 'en',
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      archived INTEGER DEFAULT 0
    )
  `);

  // Recordings table
  await client.execute(`
    CREATE TABLE IF NOT EXISTS recordings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL,
      filename TEXT NOT NULL,
      original_filename TEXT,
      duration INTEGER,
      file_size INTEGER,
      language TEXT DEFAULT 'en',
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    )
  `);

  // Transcriptions table
  await client.execute(`
    CREATE TABLE IF NOT EXISTS transcriptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      recording_id INTEGER NOT NULL,
      raw_text TEXT,
      formatted_text TEXT,
      word_count INTEGER DEFAULT 0,
      language TEXT,
      confidence REAL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (recording_id) REFERENCES recordings(id) ON DELETE CASCADE
    )
  `);

  // Documents table
  await client.execute(`
    CREATE TABLE IF NOT EXISTS documents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL,
      content TEXT,
      version INTEGER DEFAULT 1,
      word_count INTEGER DEFAULT 0,
      character_count INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    )
  `);

  // PDFs table
  await client.execute(`
    CREATE TABLE IF NOT EXISTS pdfs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      document_id INTEGER NOT NULL,
      filename TEXT NOT NULL,
      settings TEXT,
      file_size INTEGER,
      page_count INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
    )
  `);

  // Email logs table
  await client.execute(`
    CREATE TABLE IF NOT EXISTS email_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL,
      pdf_id INTEGER,
      recipient TEXT NOT NULL,
      subject TEXT,
      status TEXT DEFAULT 'pending',
      error_message TEXT,
      sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
      FOREIGN KEY (pdf_id) REFERENCES pdfs(id) ON DELETE SET NULL
    )
  `);

  // Custom dictionary table
  await client.execute(`
    CREATE TABLE IF NOT EXISTS custom_dictionary (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER,
      word TEXT NOT NULL,
      language TEXT DEFAULT 'en',
      added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    )
  `);

  // Users table
  await client.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT,
      name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user',
      status TEXT NOT NULL DEFAULT 'pending',
      google_id TEXT UNIQUE,
      analytics_consent INTEGER DEFAULT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Feature flags table
  await client.execute(`
    CREATE TABLE IF NOT EXISTS feature_flags (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      description TEXT,
      enabled_globally INTEGER NOT NULL DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // User feature flags table
  await client.execute(`
    CREATE TABLE IF NOT EXISTS user_feature_flags (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      flag_name TEXT NOT NULL,
      enabled INTEGER NOT NULL DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, flag_name)
    )
  `);

  // Analytics events table
  await client.execute(`
    CREATE TABLE IF NOT EXISTS analytics_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      event_type TEXT NOT NULL,
      entity_type TEXT,
      entity_id INTEGER,
      metadata TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Refresh tokens table
  await client.execute(`
    CREATE TABLE IF NOT EXISTS refresh_tokens (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token_hash TEXT NOT NULL UNIQUE,
      expires_at DATETIME NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Indexes
  await client.execute('CREATE INDEX IF NOT EXISTS idx_recordings_project ON recordings(project_id)');
  await client.execute('CREATE INDEX IF NOT EXISTS idx_transcriptions_recording ON transcriptions(recording_id)');
  await client.execute('CREATE INDEX IF NOT EXISTS idx_documents_project ON documents(project_id)');
  await client.execute('CREATE INDEX IF NOT EXISTS idx_pdfs_document ON pdfs(document_id)');
  await client.execute('CREATE INDEX IF NOT EXISTS idx_email_logs_project ON email_logs(project_id)');
  await client.execute('CREATE INDEX IF NOT EXISTS idx_custom_dictionary_project ON custom_dictionary(project_id)');
  await client.execute('CREATE INDEX IF NOT EXISTS idx_recordings_status ON recordings(status)');
  await client.execute('CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)');
  await client.execute('CREATE INDEX IF NOT EXISTS idx_users_status ON users(status)');
  await client.execute('CREATE INDEX IF NOT EXISTS idx_analytics_user ON analytics_events(user_id)');
  await client.execute('CREATE INDEX IF NOT EXISTS idx_analytics_event_type ON analytics_events(event_type)');
  await client.execute('CREATE INDEX IF NOT EXISTS idx_analytics_created ON analytics_events(created_at)');
  await client.execute('CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user ON refresh_tokens(user_id)');

  // Safe column additions — libSQL throws if column exists, just catch it
  const alterStatements = [
    'ALTER TABLE projects ADD COLUMN user_id INTEGER REFERENCES users(id) ON DELETE CASCADE',
    'ALTER TABLE custom_dictionary ADD COLUMN user_id INTEGER REFERENCES users(id)',
  ];
  for (const sql of alterStatements) {
    try { await client.execute(sql); } catch { /* column already exists */ }
  }

  // Seed default feature flags
  const DEFAULT_FLAGS = [
    { name: 'spell_check', description: 'Enable spell checking with AI' },
    { name: 'email_sharing', description: 'Enable PDF sharing via email' },
    { name: 'pdf_export', description: 'Enable PDF export' },
    { name: 'google_auth', description: 'Enable Google OAuth login' },
  ];
  for (const flag of DEFAULT_FLAGS) {
    await client.execute({
      sql: 'INSERT OR IGNORE INTO feature_flags (name, description, enabled_globally) VALUES (?, ?, 1)',
      args: [flag.name, flag.description],
    });
  }

  console.log('✅ Database tables initialized successfully');
}

/**
 * Close database connection gracefully
 */
export const closeDatabase = async (): Promise<void> => {
  if (client) {
    client.close();
    console.log('✅ Database connection closed');
  }
};

// Handle graceful shutdown
process.on('SIGINT', async () => {
  await closeDatabase();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await closeDatabase();
  process.exit(0);
});
