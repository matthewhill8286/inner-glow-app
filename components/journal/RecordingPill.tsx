import React, { useEffect, useState } from 'react';
import { Pressable, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { palette } from '@/constants/theme';
import { Type } from '@/constants/typography';
import { Icon } from '@/components/icons/Icon';
import { signedJournalAudio } from '@/lib/journal-audio';
import { usePlayer } from '@/lib/recorder';
import { clockFromMs } from '@/lib/voice-entry';

/**
 * "Recording · 0:42" (04 J4 pill, also on J5): plays a voice entry's recording. `uri` is a local
 * file during review; `path` is the stored recording, played through a signed URL.
 */
export function RecordingPill({
  uri,
  path,
  durationMs,
}: {
  uri?: string | null;
  path?: string | null;
  durationMs?: number | null;
}) {
  const { t } = useTranslation();
  const [source, setSource] = useState<string | null>(uri ?? null);
  useEffect(() => {
    if (uri) setSource(uri);
    else if (path) void signedJournalAudio(path).then(setSource);
  }, [uri, path]);
  const player = usePlayer(source);
  if (!source) return null;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={player.isPlaying ? t('journalVoice.pause') : t('journalVoice.play')}
      onPress={() => (player.isPlaying ? player.pause() : player.play())}
      style={{
        alignSelf: 'flex-start',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingVertical: 8,
        paddingLeft: 10,
        paddingRight: 14,
        borderRadius: 999,
        backgroundColor: palette.surfaceLilacSoft,
      }}
    >
      <Icon name={player.isPlaying ? 'line/pause' : 'line/play'} size={12} color={palette.plum} />
      <Text style={[Type.caption, { color: palette.plum }]}>
        {t('journalVoice.recording', { time: clockFromMs(durationMs ?? 0) })}
      </Text>
    </Pressable>
  );
}
