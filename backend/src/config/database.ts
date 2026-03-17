import sqlite3 from 'sqlite3';
import path from 'path';

const DB_PATH = process.env.DATABASE_URL || './data/voicescribe.db';

// Create database connection
export const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('❌ Error opening database:', err);
    process.exit(1);
  } else {
    console.log('✅ Connected to SQLite database:', DB_PATH);
  }
});

/**
 * Initialize database with all required tables
 */
export const initDatabase = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    const schema = `
      -- Projects table
      CREATE TABLE IF NOT EXISTS projects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        author_name TEXT,
        language TEXT DEFAULT 'en',
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        archived INTEGER DEFAULT 0
      );

      -- Recordings table
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
      );

      -- Transcriptions table
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
      );

      -- Documents table
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
      );

      -- PDFs table
      CREATE TABLE IF NOT EXISTS pdfs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        document_id INTEGER NOT NULL,
        filename TEXT NOT NULL,
        settings TEXT,
        file_size INTEGER,
        page_count INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
      );

      -- Email logs table
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
      );

      -- Custom dictionary table
      CREATE TABLE IF NOT EXISTS custom_dictionary (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id INTEGER,
        word TEXT NOT NULL,
        language TEXT DEFAULT 'en',
        added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
      );

      -- Create indexes for better performance
      CREATE INDEX IF NOT EXISTS idx_recordings_project ON recordings(project_id);
      CREATE INDEX IF NOT EXISTS idx_transcriptions_recording ON transcriptions(recording_id);
      CREATE INDEX IF NOT EXISTS idx_documents_project ON documents(project_id);
      CREATE INDEX IF NOT EXISTS idx_pdfs_document ON pdfs(document_id);
      CREATE INDEX IF NOT EXISTS idx_email_logs_project ON email_logs(project_id);
      CREATE INDEX IF NOT EXISTS idx_custom_dictionary_project ON custom_dictionary(project_id);
      CREATE INDEX IF NOT EXISTS idx_recordings_status ON recordings(status);
    `;

    db.exec(schema, (err) => {
      if (err) {
        console.error('❌ Error initializing database:', err);
        reject(err);
      } else {
        console.log('✅ Database tables initialized successfully');
        resolve();
      }
    });
  });
};

/**
 * Close database connection gracefully
 */
export const closeDatabase = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    db.close((err) => {
      if (err) {
        console.error('❌ Error closing database:', err);
        reject(err);
      } else {
        console.log('✅ Database connection closed');
        resolve();
      }
    });
  });
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
