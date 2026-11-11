import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { palette } from '@/constants/theme';
import { Type } from '@/constants/typography';
import { GlowField } from '@/components/glow/Glow';
import { Icon } from '@/components/icons/Icon';
import { NavBar } from '@/components/ui/IconButton';
import { LegalNote } from '@/components/ui/controls';
import { AppButton } from '@/components/ui/AppButton';
import { ScreenStatusBar } from '@/components/ui/ScreenStatusBar';
import { SourcesLink } from '@/components/SourcesLink';
import { useSubscription } from '@/hooks/useSubscription';
import { formatSleep } from '@/lib/home';
import { backTo } from '@/lib/navigation';
import { screenBottomPadding } from '@/lib/screen-layout';
import { practiceById } from '@/data/practices';
import { supabase } from '@/supabase/supabase';

type WeekContent = {
  headline: string;
  noticed: string;
  suggestions: { practiceId: string | null; title: string; detail: string }[];
  scoreChange: number | null;
  avgSleepMinutes: number | null;
  practiceMinutes: number;
};

/**
 * Your week (`6801:6247`, Pro): last week's headline, what Glow AI noticed, the score change, average
 * sleep and practice minutes counted from the person's logs, and two things to try next week.
 */
export default function YourWeek() {
  const { t, i18n } = useTranslation();
  const insets = useSafeAreaInsets();
  const { hasFullAccess, isLoading } = useSubscription();
  const [state, setState] = useState<'loading' | 'ready' | 'empty' | 'error'>('loading');
  const [weekStart, setWeekStart] = useState<string | null>(null);
  const [content, setContent] = useState<WeekContent | null>(null);

  useEffect(() => {
    if (isLoading || !hasFullAccess) return;
    let live = true;
    void supabase.functions
      .invoke('weekly-reflection', { body: { locale: i18n.language } })
      .then(({ data, error }) => {
        if (!live) return;
        if (error) return setState('error');
        setWeekStart(data?.weekStart ?? null);
        setContent(data?.content ?? null);
        setState(data?.content ? 'ready' : 'empty');
      });
    return () => {
      live = false;
    };
  }, [hasFullAccess, isLoading, i18n.language]);

  const range = weekStart
    ? (() => {
        const start = new Date(`${weekStart}T00:00:00Z`);
        const end = new Date(start.getTime() + 6 * 86_400_000);
        const f = (d: Date) =>
          d.toLocaleDateString(i18n.language, { day: 'numeric', month: 'short', timeZone: 'UTC' });
        return `${f(start)} – ${f(end)}`;
      })()
    : '';

  const stat = (value: string, label: string) => (
    <View
      style={{
        flex: 1,
        borderRadius: 20,
        backgroundColor: palette.white,
        paddingVertical: 16,
        alignItems: 'center',
        gap: 4,
      }}
    >
      <Text style={[Type.titleSm, { fontSize: 20, color: palette.ink }]}>{value}</Text>
      <Text style={[Type.captionS, { color: palette.textMuted }]}>{label}</Text>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <ScreenStatusBar style="dark" />
      <GlowField
        glows={[
          { color: palette.lavenderSoft, opacity: 0.3, x: -70, y: -50, width: 280, blur: 90 },
          { color: palette.mustard, opacity: 0.3, x: 200, y: 40, width: 220, blur: 90 },
        ]}
      />
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 10,
          paddingHorizontal: 24,
          paddingBottom: screenBottomPadding(insets.bottom) + 80,
        }}
      >
        <NavBar
          backLabel={t('common.back')}
          onBack={() => backTo(undefined, '/(tabs)/freud-score')}
          title={t('yourWeek.nav')}
        />
        {!isLoading && !hasFullAccess ? (
          <View style={{ marginTop: 40, alignItems: 'center', gap: 12 }}>
            <Icon name="line/crown" size={36} color={palette.plum} />
            <Text style={[Type.titleSm, { color: palette.ink, textAlign: 'center' }]}>
              {t('yourWeek.proTitle')}
            </Text>
            <Text style={[Type.bodySm, { color: palette.textMuted, textAlign: 'center' }]}>
              {t('yourWeek.proBody')}
            </Text>
            <AppButton
              title={t('yourWeek.tryPro')}
              onPress={() =>
                router.push({ pathname: '/(utils)/trial-upgrade', params: { variant: 'home' } })
              }
              style={{ alignSelf: 'stretch', marginTop: 8 }}
            />
          </View>
        ) : state === 'loading' ? (
          <ActivityIndicator color={palette.plum} style={{ marginTop: 80 }} />
        ) : state !== 'ready' || !content ? (
          <Text
            style={[Type.body, { color: palette.textMuted, marginTop: 40, textAlign: 'center' }]}
          >
            {t(state === 'error' ? 'yourWeek.error' : 'yourWeek.empty')}
          </Text>
        ) : (
          <>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 16 }}>
              <View
                style={{
                  paddingHorizontal: 10,
                  paddingVertical: 3,
                  borderRadius: 999,
                  backgroundColor: palette.plum,
                }}
              >
                <Text style={[Type.captionS, { fontWeight: '700', color: palette.white }]}>
                  PRO
                </Text>
              </View>
              <Text style={[Type.captionM, { color: palette.textMuted }]}>{range}</Text>
            </View>
            <Text
              accessibilityRole="header"
              style={[
                Type.titleLg,
                { fontSize: 30, lineHeight: 36, color: palette.ink, marginTop: 14 },
              ]}
            >
              {content.headline}
            </Text>
            <View
              style={{
                marginTop: 20,
                borderRadius: 24,
                backgroundColor: palette.white,
                padding: 20,
                gap: 8,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Icon name="line/sparkle" size={16} color={palette.plum} />
                <Text style={[Type.captionS, { fontWeight: '600', color: palette.plum }]}>
                  {t('yourWeek.noticed')}
                </Text>
              </View>
              <Text style={[Type.body, { fontWeight: '400', lineHeight: 22, color: palette.ink }]}>
                {content.noticed}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
              {stat(
                content.scoreChange == null
                  ? '–'
                  : `${content.scoreChange >= 0 ? '+' : ''}${content.scoreChange}`,
                t('yourWeek.glowScore'),
              )}
              {stat(
                content.avgSleepMinutes == null ? '–' : formatSleep(content.avgSleepMinutes),
                t('yourWeek.avgSleep'),
              )}
              {stat(
                t('yourWeek.minutes', { count: content.practiceMinutes }),
                t('yourWeek.practice'),
              )}
            </View>
            {content.suggestions.length ? (
              <>
                <Text
                  style={[
                    Type.captionS,
                    { fontWeight: '600', color: palette.lavender, marginTop: 24, marginBottom: 8 },
                  ]}
                >
                  {t('yourWeek.tryNext')}
                </Text>
                <View
                  style={{
                    borderRadius: 24,
                    backgroundColor: palette.white,
                    paddingHorizontal: 16,
                  }}
                >
                  {content.suggestions.map((s, i) => {
                    const practice = s.practiceId ? practiceById(s.practiceId) : null;
                    return (
                      <Pressable
                        key={i}
                        accessibilityRole="button"
                        disabled={!practice}
                        onPress={() =>
                          practice &&
                          router.push({
                            pathname: '/(tabs)/mindful/practice/[id]',
                            params: { id: practice.id },
                          })
                        }
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 12,
                          paddingVertical: 14,
                          borderTopWidth: i ? 1 : 0,
                          borderTopColor: palette.borderLilac,
                        }}
                      >
                        <View
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: 18,
                            backgroundColor: palette.selected,
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Icon
                            name={i === 0 ? 'line/meditate' : 'line/moon'}
                            size={18}
                            color={palette.plum}
                          />
                        </View>
                        <View style={{ flex: 1, gap: 2 }}>
                          <Text style={[Type.bodyMSemi, { fontWeight: '500', color: palette.ink }]}>
                            {s.title}
                          </Text>
                          <Text style={[Type.captionS, { color: palette.textMuted }]}>
                            {s.detail}
                          </Text>
                        </View>
                        {practice ? <Icon name="arrow/chevron-right" size={18} /> : null}
                      </Pressable>
                    );
                  })}
                </View>
              </>
            ) : null}
            <LegalNote text={t('yourWeek.legal')} style={{ marginTop: 20 }} />
            <SourcesLink topic="score" style={{ marginTop: 10 }} />
          </>
        )}
      </ScrollView>
      {state === 'ready' && content ? (
        <View
          style={{
            position: 'absolute',
            left: 24,
            right: 24,
            bottom: screenBottomPadding(insets.bottom) - 4,
          }}
        >
          <AppButton title={t('yourWeek.talk')} onPress={() => router.push('/(tabs)/chat')} />
        </View>
      ) : null}
    </View>
  );
}
