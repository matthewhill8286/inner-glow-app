import { Platform, Share } from 'react-native';
import { File, Paths } from 'expo-file-system';
import { supabase } from '@/supabase/supabase';
import { buildExport, EXPORT_TABLES, exportFileName, type TableResult } from './data-export';

/**
 * Reads the signed-in person's rows (row level security limits each table to them), writes one
 * JSON file and opens the share sheet. iOS shares the file; Android shares the text, because
 * React Native's Share has no file support there.
 */
export async function exportMyData() {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Please sign in first');
  const results: Record<string, TableResult> = {};
  await Promise.all(
    EXPORT_TABLES.map(async ({ table, owner }) => {
      const { data, error } = await supabase.from(table as never).select('*').eq(owner, user.id);
      results[table] = error ? { error: error.message } : { rows: (data as unknown[]) ?? [] };
    }),
  );
  const now = new Date();
  const json = JSON.stringify(buildExport(user.email ?? null, results, now), null, 2);
  if (Platform.OS === 'ios') {
    const file = new File(Paths.cache, exportFileName(now));
    if (file.exists) file.delete();
    file.create();
    file.write(json);
    await Share.share({ url: file.uri, title: exportFileName(now) });
  } else {
    await Share.share({ title: exportFileName(now), message: json });
  }
}
