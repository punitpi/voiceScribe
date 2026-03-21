import { SarvamAIClient } from 'sarvamai';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import fs from 'fs';
import path from 'path';
import os from 'os';

ffmpeg.setFfmpegPath(ffmpegInstaller.path);

const CHUNK_DURATION = 25; // seconds, under Sarvam's 30s REST limit

const getSarvamClient = () => {
  const key = process.env.SARVAM_API_KEY;
  if (!key) throw new Error('SARVAM_API_KEY is not configured');
  return new SarvamAIClient({ apiSubscriptionKey: key });
};

// Split audio file into CHUNK_DURATION-second WAV chunks.
// Returns { chunks, tempDir } so the caller can always clean up the temp dir.
export const chunkAudioFile = (inputPath: string): Promise<{ chunks: string[]; tempDir: string }> => {
  return new Promise((resolve, reject) => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'voicescribe-chunks-'));
    const outputPattern = path.join(tempDir, 'chunk_%03d.wav');

    ffmpeg(inputPath)
      .outputOptions([
        `-f segment`,
        `-segment_time ${CHUNK_DURATION}`,
        `-c:a pcm_s16le`,
        `-ar 16000`,
        `-ac 1`
      ])
      .output(outputPattern)
      .on('end', () => {
        const chunks = fs.readdirSync(tempDir)
          .filter(f => f.startsWith('chunk_') && f.endsWith('.wav'))
          .sort()
          .map(f => path.join(tempDir, f));
        resolve({ chunks, tempDir });
      })
      .on('error', (err) => {
        reject(new Error(`ffmpeg chunking failed: ${err.message}`));
      })
      .run();
  });
};

// Transcribe a single chunk (must be ≤30s)
const transcribeChunk = async (
  client: SarvamAIClient,
  chunkPath: string,
  language: 'en' | 'kn',
  mode: 'codemix' | 'transcribe'
): Promise<string> => {
  const response = await client.speechToText.transcribe({
    file: fs.createReadStream(chunkPath) as any,
    model: 'saaras:v3',
    mode,
    language_code: language === 'kn' ? 'kn-IN' : 'en-IN',
  });
  return (response as any).transcript ?? '';
};

// Main export: transcribe full audio file with chunking.
// Chunks are processed sequentially to respect Sarvam API rate limits.
export const transcribeWithSarvam = async (
  audioFilePath: string,
  language: 'en' | 'kn'
): Promise<string> => {
  const mode = language === 'kn' ? 'transcribe' : 'codemix';
  const client = getSarvamClient();
  const { chunks, tempDir } = await chunkAudioFile(audioFilePath);

  try {
    const parts: string[] = [];
    for (const chunk of chunks) {
      parts.push(await transcribeChunk(client, chunk, language, mode));
    }
    return parts.join(' ').trim();
  } finally {
    chunks.forEach(c => { try { fs.unlinkSync(c); } catch { /* ignore */ } });
    try { fs.rmdirSync(tempDir); } catch { /* ignore */ }
  }
};
