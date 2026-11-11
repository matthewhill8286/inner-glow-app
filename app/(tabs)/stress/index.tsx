import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { router, type Href } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { palette } from '@/constants/theme';
import { Type } from '@/constants/typography';
import { Icon, type IconName } from '@/components/icons/Icon';
import { SettingsScreen, SettingsSection } from '@/components/settings/SettingsParts';
import { ListGroup, ListRow } from '@/components/ui/ListRow';
import { Tag } from '@/components/ui/Chip';
import { useStress } from '@/hooks/useStress';
import { PRACTICES } from '@/data/practices';
import { backTo } from '@/lib/navigation';
import { planFilled, stressEntryRoute } from '@/lib/stress-relief';
import { SourcesLink } from '@/components/SourcesLink';

const GLOWS = [
  { color: palette.rose, opacity: 0.25, x: -70, y: -30, width: 280, blur: 90 },
  { color: palette.sky, opacity: 0.25, x: 190, y: 160, width: 240, blur: 90 },
];

const TOOLS: { key: string; icon: IconName; tint: string; route: Href }[] = [
  { key: 'grounding', icon: 'line/leaf', tint: palette.cream, route: '/(tabs)/stress/grounding' },
  {
    key: 'breathing',
    icon: 'line/activity',
    tint: 'rgba(127,198,241,0.22)',
    route: { pathname: '/(tabs)/mindful/category/[category]', params: { category: 'breathing' } },
  },
  {
    key: 'body',
    icon: 'line/user',
    tint: 'rgba(255,179,190,0.28)',
    route: { pathname: '/(tabs)/mindful/category/[category]', params: { category: 'relax-body' } },
  },
  {
    key: 'mind',
    icon: 'line/meditate',
    tint: palette.surfaceLilac,
    route: { pathname: '/(tabs)/mindful/category/[category]', params: { category: 'relax-mind' } },
  },
];

const PRACTICE_IDS = PRACTICES.map((p) => p.id);

/**
 * Stress relief: the quick phrase and helpful actions from the stress plan, four quick tools
 * (grounding, then the Breathing and Relax practice lists), and the last exercise to pick up again.
 */
export default function StressHub() {
  const { t, i18n } = useTranslation();
  const { stressKit: kit, stressHistory } = useStress();
  const filled = planFilled(kit);
  const last = stressHistory.find((h) => stressEntryRoute(h.exerciseId, PRACTICE_IDS));
  const lastRoute = last ? stressEntryRoute(last.exerciseId, PRACTICE_IDS) : null;

  return (
    <SettingsScreen
      title={t('stressRelief.title')}
      backLabel={t('common.back')}
      onBack={() => backTo(undefined, '/(tabs)/home')}
      glows={GLOWS}
    >
      <View style={{ gap: 8 }}>
        <Text
          accessibilityRole="header"
          style={[Type.titleMd, { fontSize: 30, lineHeight: 38, color: palette.plumDeep }]}
        >
          {t('stressRelief.heading')}
        </Text>
        <Text style={[Type.bodySm, { color: palette.textMuted }]}>{t('stressRelief.body')}</Text>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityHint={t(filled ? 'stressRelief.editPlan' : 'stressRelief.buildPlan')}
        onPress={() => router.push('/(tabs)/stress/plan')}
        style={({ pressed }) => ({
          backgroundColor: palette.surface,
          borderRadius: 28,
          padding: 22,
          gap: 12,
          opacity: pressed ? 0.9 : 1,
        })}
      >
        <Text style={[Type.microBold, { fontSize: 12, lineHeight: 16, color: palette.lavender }]}>
          {t('stressRelief.phraseLabel').toUpperCase()}
        </Text>
        <Text style={[Type.titleSm, { color: palette.plumDeep }]}>
          {`“${kit?.quickPhrase?.trim() || t('stressRelief.defaultPhrase')}”`}
        </Text>
        {!!kit?.helpfulActions.length && (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            {kit.helpfulActions.slice(0, 3).map((a) => (
              <Tag key={a} label={a} variant="glow" />
            ))}
          </View>
        )}
        <View style={{ height: 1, backgroundColor: palette.border, marginTop: 4 }} />
        <View
          style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
        >
          <Text style={[Type.captionM, { color: palette.textMuted }]}>
            {t('stressRelief.planFilled', { filled })}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Text style={[Type.label, { color: palette.plum }]}>
              {t(filled ? 'stressRelief.editPlan' : 'stressRelief.buildPlan')}
            </Text>
            <Icon name="arrow/forward" size={16} color={palette.plum} />
          </View>
        </View>
      </Pressable>

      <SettingsSection label={t('stressRelief.toolsLabel').toUpperCase()}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
          {TOOLS.map((tool) => (
            <Pressable
              key={tool.key}
              accessibilityRole="button"
              accessibilityLabel={`${t(`stressRelief.tools.${tool.key}.title`)}, ${t(`stressRelief.tools.${tool.key}.meta`)}`}
              onPress={() => router.push(tool.route)}
              style={({ pressed }) => ({
                flexBasis: '47%',
                flexGrow: 1,
                minHeight: 136,
                backgroundColor: palette.surface,
                borderRadius: 24,
                padding: 16,
                justifyContent: 'space-between',
                opacity: pressed ? 0.85 : 1,
              })}
            >
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  backgroundColor: tool.tint,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Icon name={tool.icon} size={22} color={palette.plum} />
              </View>
              <View style={{ gap: 2, marginTop: 16 }}>
                <Text style={[Type.bodyStrong, { color: palette.ink }]}>
                  {t(`stressRelief.tools.${tool.key}.title`)}
                </Text>
                <Text style={[Type.captionM, { color: palette.textMuted }]}>
                  {t(`stressRelief.tools.${tool.key}.meta`)}
                </Text>
              </View>
            </Pressable>
          ))}
        </View>
      </SettingsSection>

      {last && lastRoute && (
        <SettingsSection label={t('stressRelief.lastLabel').toUpperCase()}>
          <ListGroup>
            <ListRow
              icon="line/play"
              label={last.title}
              supportingText={t('stressRelief.lastDone', {
                date: new Date(last.date).toLocaleDateString(i18n.language, {
                  day: 'numeric',
                  month: 'short',
                }),
              })}
              onPress={() => router.push(lastRoute as Href)}
            />
          </ListGroup>
        </SettingsSection>
      )}

      <ListGroup>
        <ListRow
          icon="line/meditate"
          label={t('stressRelief.allPractices')}
          onPress={() => router.push('/(tabs)/mindful')}
        />
        <ListRow
          icon="line/bot"
          label={t('stressRelief.talk')}
          onPress={() => router.push('/(tabs)/chat')}
        />
      </ListGroup>
      <SourcesLink topic="stress" style={{ marginTop: 16 }} />
    </SettingsScreen>
  );
}
