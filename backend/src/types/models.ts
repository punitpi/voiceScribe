/**
 * Database model interfaces for VoiceScribe
 */

export interface Project {
  id?: number;
  title: string;
  author_name?: string;
  language: 'en' | 'kn';
  description?: string;
  created_at?: string;
  updated_at?: string;
  archived?: number; // SQLite uses 0/1 for boolean
}

export interface Recording {
  id?: number;
  project_id: number;
  filename: string;
  original_filename?: string;
  duration?: number; // in seconds
  file_size?: number; // in bytes
  language: 'en' | 'kn';
  status: 'pending' | 'transcribing' | 'completed' | 'failed';
  created_at?: string;
}

export interface Transcription {
  id?: number;
  recording_id: number;
  raw_text?: string;
  formatted_text?: string;
  word_count?: number;
  language?: string;
  confidence?: number;
  created_at?: string;
  updated_at?: string;
}

export interface Document {
  id?: number;
  project_id: number;
  content?: string;
  version?: number;
  word_count?: number;
  character_count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface PDF {
  id?: number;
  document_id: number;
  filename: string;
  settings?: string; // JSON string of PDF settings
  file_size?: number;
  page_count?: number;
  created_at?: string;
}

export interface EmailLog {
  id?: number;
  project_id: number;
  pdf_id?: number;
  recipient: string;
  subject?: string;
  status: 'sent' | 'failed' | 'pending';
  error_message?: string;
  sent_at?: string;
}

export interface CustomDictionaryWord {
  id?: number;
  project_id?: number; // null for global words
  word: string;
  language: 'en' | 'kn';
  added_at?: string;
}

/**
 * PDF Generation Settings
 */
export interface PDFSettings {
  pageSize: 'A4' | 'Letter';
  fontSize: number; // 10-14pt
  lineSpacing: number; // 1.5 or 2.0
  includeHeader: boolean;
  includePageNumbers: boolean;
  margins: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
}

/**
 * API Request/Response types
 */

export interface CreateProjectRequest {
  title: string;
  author_name?: string;
  language?: 'en' | 'kn';
  description?: string;
}

export interface UpdateProjectRequest {
  title?: string;
  author_name?: string;
  description?: string;
}

export interface UploadRecordingRequest {
  language?: 'en' | 'kn';
}

export interface UpdateDocumentRequest {
  content: string;
}

export interface GeneratePDFRequest {
  settings?: Partial<PDFSettings>;
}

export interface SendEmailRequest {
  recipient: string;
  cc?: string[];
  bcc?: string[];
  subject?: string;
}

/**
 * API Response types
 */

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface ProjectStats {
  totalRecordings: number;
  totalDuration: number; // in seconds
  wordCount: number;
  pageCount: number;
  transcriptionCost: number; // in USD
}
