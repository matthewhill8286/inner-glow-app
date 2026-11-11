import React, { useMemo, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import ViewShot from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import * as MediaLibrary from 'expo-media-library';
import { palette } from '@/constants/theme';
import { Type } from '@/constants/typography';
import { Glow, GlowField } from '@/components/glow/Glow';
import { NavBar } from '@/components/ui/IconButton';
import { LegalNote } from '@/components/ui/controls';
import { AppButton } from '@/components/ui/AppButton';
import { ScreenStatusBar } from '@/components/ui/ScreenStatusBar';
import { toast } from '@/components/Toast';
import { useMood } from '@/hooks/useMood';
import { useMindfulness } from '@/hooks/useMindfulness';
import { useJournal } from '@/hooks/useJournal';
import { useProfileStats } from '@/hooks/useProfileStats';
import { backTo } from '@/lib/navigation';
import { moodScoreOf } from '@/lib/mood-scale';
import { isShareTab, SHARE_TABS, weekCounts, weekHeadline, type ShareTab } from '@/lib/share-cards';

const LOOK: Record<ShareTab, { glow: string; glow2: string }> = {
  week: { glow: palette.lavenderSoft, glow2: palette.sky },
  streak: { glow: palette.mustard, glow2: palette.rose },
  score: { glow: palette.mustard, glow2: palette.lavenderSoft },
};

/**
 * Share (`6845:8140`, `6845:8203`): Weekly reflection, Streak and Glow score cards, Share and Save
 * image. The card is rendered to an image; only what's on it leaves the phone.
 */
export default function ShareScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ tab?: string }>();
  const [tab, setTab] = useState<ShareTab>(isShareTab(params.tab) ? params.tab : 'week');
  const [busy, setBusy] = useState<'share' | 'save' | null>(null);
  const shot = useRef<ViewShot>(null);
  const { moodCheckIns } = useMood();
  const { mindfulnessHistory } = useMindfulness();
  const { journalEntries } = useJournal();
  const stats = useProfileStats();

  const week = useMemo(
    () => weekCounts(moodCheckIns, mindfulnessHistory, journalEntries),
    [moodCheckIns, mindfulnessHistory, journalEntries],
  );
  const headline = useMemo(() => {
    const cutoff = Date.now() - 7 * 86_400_000;
    return weekHeadline(
      moodCheckIns.filter((m) => Date.parse(m.createdAt) >= cutoff).map((m) => moodScoreOf(m.mood)),
    );
  }, [moodCheckIns]);

  const capture = async () => {
    const uri = await shot.current?.capture?.();
    if (!uri) throw new Error('capture failed');
    return uri;
  };
  const share = async () => {
    setBusy('share');
    try {
      await Sharing.shareAsync(await capture(), {
        mimeType: 'image/png',
        dialogTitle: t('shareCards.title'),
      });
    } catch {
      toast.error(t('shareCards.error'));
    } finally {
      setBusy(null);
    }
  };
  const save = async () => {
    setBusy('save');
    try {
      const { granted } = await MediaLibrary.requestPermissionsAsync(true);
      if (!granted) {
        toast.info(t('shareCards.photosOff'));
        return;
      }
      await MediaLibrary.saveToLibraryAsync(await capture());
      toast.success(t('shareCards.saved'));
    } catch {
      toast.error(t('shareCards.error'));
    } finally {
      setBusy(null);
    }
  };

  const look = LOOK[tab];
  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <ScreenStatusBar style="dark" />
      <GlowField
        glows={[
          { color: palette.lavenderSoft, opacity: 0.3, x: -70, y: -50, width: 280, blur: 90 },
          { color: palette.mustard, opacity: 0.25, x: 200, y: 40, width: 220, blur: 90 },
        ]}
      />
      <View style={{ paddingTop: insets.top + 10, paddingHorizontal: 24 }}>
        <NavBar
          backLabel={t('common.back')}
          onBack={() => backTo(undefined, '/(tabs)/home')}
          title={t('shareCards.title')}
        />
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 16 }}>
          {SHARE_TABS.map((key) => {
            const on = key === tab;
            return (
              <Pressable
                key={key}
                accessibilityRole="tab"
                accessibilityState={{ selected: on }}
                onPress={() => setTab(key)}
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 8,
                  borderRadius: 999,
                  borderWidth: on ? 1.5 : 1,
                  borderColor: on ? palette.plum : palette.borderLilac,
                  backgroundColor: on ? palette.selected : palette.white,
                }}
              >
                <Text style={[Type.captionM, { fontSize: 14, color: palette.plumDeep }]}>
                  {t(`shareCards.tabs.${key}`)}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <ViewShot
          ref={shot}
          options={{ format: 'png', quality: 1, result: 'tmpfile' }}
          style={{ marginTop: 24, alignSelf: 'center' }}
        >
          <View
            style={{
              width: 280,
              height: 370,
              borderRadius: 28,
              backgroundColor: palette.bg,
              borderWidth: 1,
              borderColor: palette.borderLilac,
              overflow: 'hidden',
              padding: 24,
              justifyContent: 'space-between',
            }}
          >
            <Glow
              color={look.glow}
              opacity={0.45}
              width={240}
              blur={60}
              style={{ position: 'absolute', left: -40, top: -40 }}
            />
            <Glow
              color={look.glow2}
              opacity={0.35}
              width={220}
              blur={60}
              style={{ position: 'absolute', right: -70, bottom: 30 }}
            />
            <View style={{ gap: 10 }}>
              <Text
                style={[
                  Type.captionS,
                  { fontWeight: '600', letterSpacing: 0.6, color: palette.lavender },
                ]}
              >
                {t(`shareCards.eyebrow.${tab}`)}
              </Text>
              {tab === 'week' ? (
                <>
                  <Text
                    style={[Type.titleLg, { fontSize: 28, lineHeight: 33, color: palette.ink }]}
                  >
                    {t(`shareCards.headline.${headline}`)}
                  </Text>
                  <Text style={[Type.captionM, { fontSize: 14, color: palette.plumDeep }]}>
                    {t('shareCards.weekLine', week)}
                  </Text>
                </>
              ) : (
                <>
                  <Text
                    style={[
                      Type.titleLg,
                      { fontSize: 64, lineHeight: 70, fontWeight: '400', color: palette.ink },
                    ]}
                  >
                    {tab === 'streak' ? stats.streak.count : stats.score}
                  </Text>
                  <Text
                    style={[Type.bodyMSemi, { fontSize: 17, lineHeight: 22, color: palette.ink }]}
                  >
                    {t(tab === 'streak' ? 'shareCards.streakLine' : 'shareCards.scoreLine', {
                      count: stats.streak.count,
                    })}
                  </Text>
                </>
              )}
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View
                style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: palette.mustard }}
              />
              <Text style={[Type.captionM, { fontSize: 14, color: palette.plumDeep }]}>
                inner glow
              </Text>
            </View>
          </View>
        </ViewShot>
        <LegalNote text={t('shareCards.privacy')} style={{ marginTop: 20 }} />
      </View>
      <View
        style={{ position: 'absolute', left: 24, right: 24, bottom: insets.bottom + 24, gap: 4 }}
      >
        <AppButton
          title={t('shareCards.share')}
          busy={busy === 'share'}
          disabled={!!busy}
          onPress={() => void share()}
        />
        <AppButton
          title={t('shareCards.save')}
          variant="text"
          busy={busy === 'save'}
          disabled={!!busy}
          onPress={() => void save()}
        />
      </View>
    </View>
  );
}
