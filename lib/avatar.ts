import * as ImagePicker from 'expo-image-picker';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/supabase/supabase';

/**
 * Profile photos (P1). They go to the private `avatars` bucket under "<user id>/avatar.<ext>" and
 * are shown through short-lived signed URLs, so nobody else can load them.
 */
const BUCKET = 'avatars';
const SIGNED_URL_SECONDS = 60 * 60;

/** Opens the photo library with a square crop. Returns null when the person cancels. */
export async function pickAvatar(): Promise<{ uri: string; mimeType: string } | null> {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.7,
  });
  if (result.canceled || !result.assets?.[0]) return null;
  const asset = result.assets[0];
  return { uri: asset.uri, mimeType: asset.mimeType ?? 'image/jpeg' };
}

export function avatarPath(userId: string, mimeType: string): string {
  const ext = mimeType === 'image/png' ? 'png' : mimeType === 'image/webp' ? 'webp' : mimeType === 'image/heic' ? 'heic' : 'jpg';
  return `${userId}/avatar.${ext}`;
}

/** Uploads the picked photo, replacing any earlier one, and returns its storage path. */
export async function uploadAvatar(userId: string, photo: { uri: string; mimeType: string }): Promise<string> {
  const path = avatarPath(userId, photo.mimeType);
  const body = await (await fetch(photo.uri)).arrayBuffer();
  const { error } = await supabase.storage.from(BUCKET).upload(path, body, { contentType: photo.mimeType, upsert: true });
  if (error) throw error;
  return path;
}

/** A signed URL for showing the photo, refreshed before it runs out. */
export function useAvatarUrl(path: string | null | undefined) {
  return useQuery({
    queryKey: ['avatar-url', path],
    enabled: !!path,
    staleTime: (SIGNED_URL_SECONDS - 300) * 1000,
    queryFn: async () => {
      const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path!, SIGNED_URL_SECONDS);
      if (error) throw error;
      return data.signedUrl;
    },
  });
}
