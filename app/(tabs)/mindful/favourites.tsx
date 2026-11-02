import React from 'react';
import { Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { palette } from '@/constants/theme';
import { Type } from '@/constants/typography';
import { LegalNote } from '@/components/ui/controls';
import { toast } from '@/components/Toast';
import { SettingsScreen } from '@/components/settings/SettingsParts';
import { FavouriteRow } from '@/components/practices/PracticeParts';
import { practiceById } from '@/data/practices';
import { useFavourites } from '@/hooks/usePractices';
import { backTo } from '@/lib/navigation';
import { openPractice } from '@/lib/practice-routes';

/**
 * Practices · Favourites (10 §3.6): saved practices, most recent first. The heart removes one. With
 * none saved, the note on how to save is the whole screen.
 */
export default function Favourites() {
  const { t } = useTranslation();
  const { ids, setFavourite } = useFavourites();
  const items = ids.map(practiceById).filter((p): p is NonNullable<typeof p> => !!p);

  return (
    <SettingsScreen
      title={t('practices.favourites.title')}
      backLabel={t('common.back')}
      onBack={() => backTo(undefined, '/(tabs)/mindful')}
      glows={[
        { color: palette.mustard, opacity: 0.15, x: 200, y: 40, width: 220, blur: 90 },
        { color: palette.rose, opacity: 0.25, x: -70, y: -50, width: 280, blur: 90 },
      ]}
      contentStyle={{ gap: 12 }}
    >
      <Text
        accessibilityRole="header"
        style={[
          Type.titleMd,
          { fontSize: 26, lineHeight: 34, color: palette.ink, marginBottom: 12 },
        ]}
      >
        {t('practices.favourites.heading')}
      </Text>
      {items.map((p) => (
        <FavouriteRow
          key={p.id}
          practice={p}
          onPress={() => openPractice(p)}
          onRemove={() =>
            void setFavourite(p.id, false).catch((err) =>
              toast.error(err instanceof Error ? err.message : String(err)),
            )
          }
        />
      ))}
      <LegalNote text={t('practices.favourites.note')} />
    </SettingsScreen>
  );
}
