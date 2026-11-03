import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';

/** Recording file types the `transcribe-audio` function accepts, by extension. */
const MIME: Record<string, string> = {
  m4a: 'audio/m4a',
  mp4: 'audio/mp4',
  mp3: 'audio/mpeg',
  wav: 'audio/wav',
  webm: 'audio/webm',
  caf: 'audio/x-caf',
};

export function audioMimeType(uri: string): string {
  const ext = uri.split('.').pop()?.toLowerCase() ?? 'm4a';
  return MIME[ext] ?? 'audio/m4a';
}

/** The recording as base64, for the `transcribe-audio` function. */
export async function audioBase64(uri: string): Promise<string> {
  if (Platform.OS !== 'web') return new FileSystem.File(uri).base64();
  const blob = await (await fetch(uri)).blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(String(reader.result).split(',')[1] ?? '');
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
