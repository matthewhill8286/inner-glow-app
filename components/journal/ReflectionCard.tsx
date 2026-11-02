import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { palette } from '@/constants/theme';
import { Type } from '@/constants/typography';
import { Icon } from '@/components/icons/Icon';
import { Glow } from '@/components/glow/Glow';
import { AppButton } from '@/components/ui/AppButton';
import { usePracticeText } from '@/components/practices/PracticeParts';
import { practiceById } from '@/data/practices';
import { useJournal } from '@/hooks/useJournal';
import { useSubscription } from '@/hooks/useSubscription';
import { useUser } from '@/hooks/useUser';
import { aiPermission, invokeAI } from '@/lib/ai-privacy';
import { openPractice } from '@/lib/practice-routes';
import type { JournalEntry } from '@/lib/types';

/**
 * Reflection card (04 J5): Glow AI's reflection on the entry and one practice to try. Pro users who
 * already allow AI get it as soon as the entry opens; otherwise "Reflect with Glow AI" asks first.
 * Free users see what Pro adds (that state is not designed). Editing the entry clears the reflection.
 */
export function ReflectionCard({ entry }: { entry: JournalEntry }) {
  const { t, i18n } = useTranslation();
  const { hasFullAccess, isLoading: accessLoading } = useSubscription();
  const { data: user } = useUser();
  const { setReflection } = useJournal();
  const practiceText = usePracticeText();
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const asked = useRef<string | null>(null);

  const reflect = useCallback(async () => {
    setBusy(true);
    setFailed(false);
    try {
      const { data } = await invokeAI('journal-reflection', {
        body: { action: 'reflect', entryId: entry.id, locale: i18n.language },
      });
      if (!data?.reflection) throw new Error('No reflection');
      setReflection(entry.id, data.reflection, data.practiceId ?? null);
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  }, [entry.id, i18n.language, setReflection]);

  // Ask once per entry, and only without a prompt: people who have not allowed AI tap the button.
  useEffect(() => {
    if (
      entry.reflection ||
      !hasFullAccess ||
      !user ||
      entry.id.startsWith('temp-') ||
      asked.current === entry.id
    )
      return;
    asked.current = entry.id;
    void aiPermission(user.id).then((p) => {
      if (p === 'allowed') void reflect();
    });
  }, [entry.id, entry.reflection, hasFullAccess, user, reflect]);

  const practice = practiceById(entry.reflectionPracticeId ?? undefined);
  const pText = practice ? practiceText(practice) : null;

  return (
    <View
      style={{
        backgroundColor: palette.white,
        borderRadius: 24,
        padding: 20,
        overflow: 'hidden',
        gap: 16,
      }}
    >
      <Glow
        color={palette.mustard}
        opacity={0.28}
        width={160}
        blur={40}
        style={{ position: 'absolute', left: 200, top: -60 }}
      />
      <Glow
        color={palette.lavenderSoft}
        opacity={0.25}
        width={120}
        blur={30}
        style={{ position: 'absolute', left: 180, top: 10 }}
      />
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: palette.plum,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon name="line/sparkle" size={18} color={palette.white} />
        </View>
        <View style={{ gap: 2 }}>
          <Text style={[Type.bodyMSemi, { lineHeight: 21, color: palette.ink }]}>
            {t('journalReflection.title')}
          </Text>
          <Text style={[Type.captionS, { color: palette.textSubtle }]}>
            {t('journalReflection.from')}
          </Text>
        </View>
      </View>

      {entry.reflection ? (
        <>
          <Text
            accessibilityLiveRegion="polite"
            style={[Type.bodyS, { lineHeight: 21.7, color: palette.ink }]}
          >
            {entry.reflection}
          </Text>
          {practice && pText && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${t('journalReflection.tryPractice')}: ${pText.title}, ${pText.meta}`}
              onPress={() => openPractice(practice)}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                minHeight: 74,
                borderRadius: 18,
                backgroundColor: palette.surfaceLilacSoft,
                paddingHorizontal: 16,
                opacity: pressed ? 0.85 : 1,
              })}
            >
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: palette.white,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Icon name="line/leaf" size={20} color={palette.plum} />
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={[Type.label, { color: palette.ink }]}>{pText.title}</Text>
                <Text style={[Type.captionS, { color: palette.textMuted }]}>{pText.meta}</Text>
              </View>
              <Icon name="arrow/chevron-right" size={18} color={palette.plum} />
            </Pressable>
          )}
        </>
      ) : busy ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 }}>
          <ActivityIndicator color={palette.plum} />
          <Text style={[Type.bodyS, { color: palette.textMuted }]}>
            {t('journalReflection.thinking')}
          </Text>
        </View>
      ) : accessLoading ? null : hasFullAccess ? (
        <View style={{ gap: 12 }}>
          <Text style={[Type.bodyS, { lineHeight: 21, color: palette.textMuted }]}>
            {t(failed ? 'journalReflection.failed' : 'journalReflection.invite')}
          </Text>
          <AppButton
            title={t(failed ? 'journalReflection.retry' : 'journalReflection.reflect')}
            variant="secondary"
            size="s"
            onPress={() => void reflect()}
            style={{ alignSelf: 'flex-start' }}
          />
        </View>
      ) : (
        <View style={{ gap: 12 }}>
          <Text style={[Type.bodyS, { lineHeight: 21, color: palette.textMuted }]}>
            {t('journalReflection.pro')}
          </Text>
          <AppButton
            title={t('journalReflection.tryPro')}
            variant="secondary"
            size="s"
            onPress={() =>
              router.push({ pathname: '/(utils)/trial-upgrade', params: { variant: 'home' } })
            }
            style={{ alignSelf: 'flex-start' }}
          />
        </View>
      )}
    </View>
  );
}
