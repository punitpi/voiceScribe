// API Types
export interface Project {
  id?: number;
  title: string;
  author_name?: string;
  language: 'en' | 'kn' | 'en-kn';
  description?: string;
  created_at?: string;
  updated_at?: string;
  archived?: number;
}

export interface Recording {
  id?: number;
  project_id: number;
  filename: string;
  original_filename?: string;
  duration?: number;
  file_size?: number;
  language: 'en' | 'kn' | 'en-kn';
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
  content: string;
  version: number;
  word_count: number;
  character_count: number;
  created_at?: string;
  updated_at?: string;
}

export interface PDF {
  id?: number;
  document_id: number;
  filename: string;
  settings?: string;
  file_size?: number;
  page_count?: number;
  created_at?: string;
}

export interface PDFSettings {
  pageSize: 'A4' | 'Letter';
  fontSize: number;
  lineSpacing: number;
  includeHeader: boolean;
  includePageNumbers: boolean;
  margins: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
}

export interface ProjectStats {
  totalRecordings: number;
  totalDuration: number;
  wordCount: number;
  pageCount: number;
  transcriptionCost: number;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
