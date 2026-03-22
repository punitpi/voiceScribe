import fs from 'fs/promises';
import path from 'path';

const AUDIO_DIR = path.resolve(
  process.env.UPLOAD_DIR ? path.join(process.env.UPLOAD_DIR, 'audio') : './uploads/audio'
);
const PDF_DIR = path.resolve('./data/pdfs');

function guardPath(filePath: string, root: string): void {
  const resolved = path.resolve(filePath);
  if (!resolved.startsWith(root + path.sep) && resolved !== root) {
    throw new Error(`Path traversal blocked: ${path.basename(filePath)}`);
  }
}

export const storageService = {
  AUDIO_DIR,
  PDF_DIR,

  async ensureDirs(): Promise<void> {
    await fs.mkdir(AUDIO_DIR, { recursive: true });
    await fs.mkdir(PDF_DIR, { recursive: true });
  },

  /** Move a temp upload file to the permanent audio directory */
  async saveAudio(tempPath: string, filename: string): Promise<string> {
    await fs.mkdir(AUDIO_DIR, { recursive: true });
    const dest = path.join(AUDIO_DIR, filename);
    guardPath(dest, AUDIO_DIR);
    await fs.rename(tempPath, dest);
    return dest;
  },

  /** Delete an audio file by filename. Silently ignores missing files. */
  async deleteAudio(filename: string): Promise<void> {
    const filePath = path.join(AUDIO_DIR, filename);
    guardPath(filePath, AUDIO_DIR);
    await fs.unlink(filePath).catch(() => { /* already deleted */ });
  },

  /** Resolve full path for an audio file. Throws on path traversal. */
  getAudioPath(filename: string): string {
    const filePath = path.join(AUDIO_DIR, filename);
    guardPath(filePath, AUDIO_DIR);
    return filePath;
  },

  /** Resolve full path for a PDF file. Throws on path traversal. */
  getPDFPath(filename: string): string {
    const filePath = path.join(PDF_DIR, filename);
    guardPath(filePath, PDF_DIR);
    return filePath;
  },

  /** Delete a PDF file by filename. Silently ignores missing files. */
  async deletePDF(filename: string): Promise<void> {
    const filePath = path.join(PDF_DIR, filename);
    guardPath(filePath, PDF_DIR);
    await fs.unlink(filePath).catch(() => { /* already deleted */ });
  },
};
