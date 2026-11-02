import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import { supabase } from '@/supabase/supabase';

/**
 * Voice entry recordings live in the private `journal-audio` bucket, at "<user id>/<entry id>.<ext>"
 * (20261107_journal_audio_bucket.sql). `journal_entries.audio_url` stores that path, and the app plays
 * it through a short-lived signed URL.
 */
const BUCKET = 'journal-audio';
const TYPES: Record<string, string> = {
  m4a: 'audio/m4a',
  mp4: 'audio/mp4',
  caf: 'audio/x-caf',
  wav: 'audio/wav',
  webm: 'audio/webm',
  mp3: 'audio/mpeg',
};

/** True for a bucket path, as opposed to an old local file URI or nothing. */
export function isStoredAudio(path?: string | null): path is string {
  return !!path && !/^[a-z]+:\/\//i.test(path) && !path.startsWith('/');
}

export async function uploadJournalAudio(
  userId: string,
  entryId: string,
  uri: string,
): Promise<string> {
  const ext = uri.split('.').pop()?.toLowerCase() ?? 'm4a';
  const path = `${userId}/${entryId}.${ext}`;
  const body =
    Platform.OS === 'web'
      ? await (await fetch(uri)).arrayBuffer()
      : await new FileSystem.File(uri).bytes();
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, body, { contentType: TYPES[ext] ?? 'audio/m4a', upsert: true });
  if (error) throw error;
  return path;
}

export async function signedJournalAudio(path: string): Promise<string | null> {
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, 60 * 60);
  return error ? null : data.signedUrl;
}

export async function removeJournalAudio(path?: string | null) {
  if (isStoredAudio(path)) await supabase.storage.from(BUCKET).remove([path]);
}
