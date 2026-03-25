import axios from 'axios';
import type { Project, Recording, Transcription, Document, PDF, PDFSettings, ProjectStats, ApiResponse } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Auth API (uses /auth/* prefix, not /api/*)
const authAxios = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

export interface AuthUser {
  id: number;
  email: string;
  name: string;
  role: 'user' | 'admin';
  status: 'pending' | 'approved' | 'rejected';
  flags: Record<string, boolean>;
}

export const authApi = {
  register: (email: string, password: string, name: string) =>
    authAxios.post<{ success: boolean; message?: string; error?: string }>('/auth/register', { email, password, name }),
  login: (email: string, password: string) =>
    authAxios.post<{ success: boolean; data?: { user: AuthUser }; error?: string }>('/auth/login', { email, password }),
  logout: () => authAxios.post('/auth/logout'),
  me: () => authAxios.get<{ success: boolean; data: AuthUser }>('/auth/me'),
  updateProfile: (name: string) => authAxios.patch('/auth/profile', { name }),
  updateConsent: (consent: boolean) => authAxios.post('/auth/analytics-consent', { consent }),
};

export const adminApi = {
  getUsers: () => authAxios.get<{ success: boolean; data: any[] }>('/admin/users'),
  approveUser: (id: number) => authAxios.patch(`/admin/users/${id}/approve`),
  rejectUser: (id: number) => authAxios.patch(`/admin/users/${id}/reject`),
  updateUserRole: (id: number, role: 'user' | 'admin') => authAxios.patch(`/admin/users/${id}/role`, { role }),
  getFeatureFlags: () => authAxios.get<{ success: boolean; data: any[] }>('/admin/feature-flags'),
  setGlobalFlag: (name: string, enabled: boolean) => authAxios.patch(`/admin/feature-flags/${name}`, { enabled }),
};

// Re-export types for convenience
export type { Project, Recording, Transcription, Document, PDF, PDFSettings, ProjectStats, ApiResponse };

// Projects API
export const projectsApi = {
  create: (data: Partial<Project>) =>
    api.post<ApiResponse<Project>>('/projects', data),

  getAll: (includeArchived = false) =>
    api.get<ApiResponse<Project[]>>('/projects', {
      params: { include_archived: includeArchived },
    }),

  getById: (id: number) =>
    api.get<ApiResponse<Project>>(`/projects/${id}`),

  getStats: (id: number) =>
    api.get<ApiResponse<ProjectStats>>(`/projects/${id}/stats`),

  update: (id: number, data: Partial<Project>) =>
    api.put<ApiResponse<Project>>(`/projects/${id}`, data),

  archive: (id: number, archived = true) =>
    api.patch<ApiResponse>(`/projects/${id}/archive`, { archived }),

  delete: (id: number) =>
    api.delete<ApiResponse>(`/projects/${id}`),
};

// Recordings API
export const recordingsApi = {
  upload: (projectId: number, audioFile: File, language: 'en' | 'kn' | 'en-kn' = 'en') => {
    const formData = new FormData();
    formData.append('audio', audioFile);
    formData.append('project_id', projectId.toString());
    formData.append('language', language);

    return api.post<ApiResponse<Recording>>('/recordings/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  getByProject: (projectId: number) =>
    api.get<ApiResponse<Recording[]>>(`/recordings/project/${projectId}`),

  getById: (id: number) =>
    api.get<ApiResponse<Recording>>(`/recordings/${id}`),

  download: (id: number) =>
    api.get(`/recordings/${id}/download`, {
      responseType: 'blob',
    }),

  delete: (id: number) =>
    api.delete<ApiResponse>(`/recordings/${id}`),
};

// Transcriptions API
export const transcriptionsApi = {
  start: (recordingId: number) =>
    api.post<ApiResponse>(`/transcriptions/recording/${recordingId}/start`),

  getByRecording: (recordingId: number) =>
    api.get<ApiResponse<Transcription>>(`/transcriptions/recording/${recordingId}`),

  update: (id: number, formattedText: string) =>
    api.put<ApiResponse<Transcription>>(`/transcriptions/${id}`, {
      formatted_text: formattedText,
    }),
};

// Documents API
export const documentsApi = {
  getByProject: (projectId: number) =>
    api.get<ApiResponse<Document>>(`/documents/project/${projectId}`),

  update: (projectId: number, content: string) =>
    api.put<ApiResponse<Document>>(`/documents/project/${projectId}`, { content }),

  combineTranscriptions: (projectId: number) =>
    api.post<ApiResponse<Document>>(`/documents/project/${projectId}/combine`),

  appendNewTranscriptions: (projectId: number) =>
    api.post<ApiResponse<Document>>(`/documents/project/${projectId}/append`),

  getHistory: (projectId: number) =>
    api.get<ApiResponse<Document[]>>(`/documents/project/${projectId}/history`),
};

// PDFs API
export const pdfsApi = {
  generate: (documentId: number, settings?: Partial<PDFSettings>) =>
    api.post<ApiResponse<PDF>>(`/pdfs/document/${documentId}/generate`, { settings }),

  getByDocument: (documentId: number) =>
    api.get<ApiResponse<PDF[]>>(`/pdfs/document/${documentId}`),

  download: (id: number) =>
    api.get(`/pdfs/${id}/download`, {
      responseType: 'blob',
    }),

  delete: (id: number) =>
    api.delete<ApiResponse>(`/pdfs/${id}`),
};

export default api;
