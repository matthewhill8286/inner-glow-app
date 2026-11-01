import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import Svg, { Circle, Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { palette } from '@/constants/theme';
import { Type } from '@/constants/typography';
import { Icon } from '@/components/icons/Icon';
import { Glow, GlowField } from '@/components/glow/Glow';
import { IconButton } from '@/components/ui/IconButton';
import { ListGroup, ListRow } from '@/components/ui/ListRow';
import { ProfileAvatar } from '@/components/settings/SettingsParts';
import ProfileAura from '@/assets/svg/illustrations/profile/profile-aura.svg';
import { useProfile } from '@/hooks/useProfile';
import { useUser } from '@/hooks/useUser';
import { useSubscription } from '@/hooks/useSubscription';
import { useProfileStats } from '@/hooks/useProfileStats';
import { useAvatarUrl } from '@/lib/avatar';
import { screenBottomPadding } from '@/lib/screen-layout';

const RING = 68;
const RING_R = 32;
const RING_C = 2 * Math.PI * RING_R;
const BAR_MAX = 54;

function Stat({ value, label, onPress }: { value: number; label: string; onPress?: () => void }) {
  return (
    <Pressable
      accessible
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={`${value} ${label}`}
      onPress={onPress}
      disabled={!onPress}
      style={{ flex: 1, alignItems: 'center', gap: 4 }}
    >
      <Text style={[Type.body, { fontSize: 26, lineHeight: 32, color: palette.ink }]}>{value}</Text>
      <Text style={[Type.captionS, { color: palette.textMuted }]}>{label}</Text>
    </Pressable>
  );
}

/**
 * Profile (06 P1, `6719:4387`): the aura and avatar with an edit badge, name and joining month, the
 * plan pill, day streak / check-ins / mindful minutes, the Glow score ring, this week's mood bars,
 * and My plan, Settings and Help Centre. The streak opens Your streak.
 */
export default function Profile() {
  const { t, i18n } = useTranslation();
  const insets = useSafeAreaInsets();
  const { profile } = useProfile({ lazy: true });
  const { data: user } = useUser();
  const { data: photoUrl } = useAvatarUrl(profile?.avatarPath);
  const { hasFullAccess, isTrialActive } = useSubscription();
  const stats = useProfileStats();
  const joined = user?.created_at
    ? new Date(user.created_at).toLocaleDateString(i18n.language, {
        month: 'short',
        year: 'numeric',
      })
    : null;
  const days = t('me.profile.weekdays').split(',');
  const change = stats.scoreChange;

  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <GlowField
        glows={[
          { color: palette.lavenderSoft, opacity: 0.25, x: -70, y: -50, width: 300, blur: 90 },
          { color: palette.mustard, opacity: 0.18, x: 190, y: 60, width: 240, blur: 90 },
        ]}
      />
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 10,
          paddingHorizontal: 24,
          paddingBottom: screenBottomPadding(insets.bottom),
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ height: 44, alignItems: 'center', justifyContent: 'center' }}>
          <Text accessibilityRole="header" style={[Type.bodyMSemi, { color: palette.plumDeep }]}>
            {t('me.profile.title')}
          </Text>
          <IconButton
            variant="solid"
            icon="line/filter"
            iconSize={20}
            accessibilityLabel={t('me.profile.settings')}
            onPress={() => router.push('/(tabs)/profile/settings')}
            style={{ position: 'absolute', right: 0 }}
          />
        </View>

        <View style={{ height: 196, alignItems: 'center', marginTop: -20 }}>
          <View style={{ position: 'absolute', top: -28 }} pointerEvents="none">
            <ProfileAura width={248} height={248} />
          </View>
          <Glow
            color={palette.mustard}
            opacity={0.28}
            width={120}
            blur={40}
            style={{ position: 'absolute', top: 36 }}
          />
          <View style={{ marginTop: 48 }}>
            <ProfileAvatar size={96} name={profile?.name} photoUrl={photoUrl} />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('me.profile.edit')}
              onPress={() => router.push('/(tabs)/profile/edit')}
              hitSlop={8}
              style={{
                position: 'absolute',
                right: -4,
                bottom: -4,
                width: 30,
                height: 30,
                borderRadius: 15,
                backgroundColor: palette.white,
                borderWidth: 1,
                borderColor: palette.borderLilac,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon name="line/edit" size={16} />
            </Pressable>
          </View>
        </View>

        <Text
          style={[
            Type.titleMd,
            { fontSize: 24, lineHeight: 30, color: palette.ink, textAlign: 'center', marginTop: 8 },
          ]}
        >
          {profile?.name ?? ''}
        </Text>
        {joined && (
          <Text
            style={[Type.captionM, { color: palette.textMuted, textAlign: 'center', marginTop: 6 }]}
          >
            {t('me.profile.since', { date: joined })}
          </Text>
        )}

        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
            marginTop: 16,
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              backgroundColor: palette.selected,
              borderRadius: 999,
              paddingVertical: 6,
              paddingHorizontal: 12,
            }}
          >
            <View
              style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: palette.lavender }}
            />
            <Text style={[Type.buttonS, { fontSize: 12, color: palette.plum }]}>
              {hasFullAccess
                ? isTrialActive
                  ? t('me.profile.trial')
                  : t('me.profile.pro')
                : t('me.profile.free')}
            </Text>
          </View>
          {!hasFullAccess && (
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push('/(utils)/trial-upgrade')}
              hitSlop={10}
            >
              <Text style={[Type.buttonS, { fontSize: 12, color: '#B39A1E' }]}>
                {t('me.profile.tryPro')}
              </Text>
            </Pressable>
          )}
        </View>

        <View
          style={{
            backgroundColor: palette.white,
            borderRadius: 24,
            height: 84,
            flexDirection: 'row',
            alignItems: 'center',
            marginTop: 22,
          }}
        >
          <Stat
            value={stats.streak.count}
            label={t('me.profile.streak')}
            onPress={() => router.push('/(tabs)/profile/streak')}
          />
          <View style={{ width: 1, height: 40, backgroundColor: palette.surfaceLilac }} />
          <Stat value={stats.checkIns} label={t('me.profile.checkIns')} />
          <View style={{ width: 1, height: 40, backgroundColor: palette.surfaceLilac }} />
          <Stat value={stats.mindfulMinutes} label={t('me.profile.mindful')} />
        </View>

        <View style={{ flexDirection: 'row', gap: 9, marginTop: 12 }}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${t('me.profile.glowScore')} ${stats.score}`}
            onPress={() => router.push('/(tabs)/freud-score')}
            style={{
              flex: 1,
              height: 150,
              backgroundColor: palette.white,
              borderRadius: 24,
              padding: 16,
              overflow: 'hidden',
            }}
          >
            <Glow
              color={palette.mustard}
              opacity={0.3}
              width={100}
              blur={30}
              style={{ position: 'absolute', left: 30, top: 40 }}
            />
            <Text
              style={[Type.microBold, { fontSize: 12, lineHeight: 16, color: palette.lavender }]}
            >
              {t('me.profile.glowScore')}
            </Text>
            <View
              style={{
                width: RING,
                height: RING,
                alignSelf: 'center',
                marginTop: 8,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Svg width={RING} height={RING} style={{ position: 'absolute' }}>
                <Circle
                  cx={RING / 2}
                  cy={RING / 2}
                  r={RING_R}
                  stroke={palette.plum}
                  strokeOpacity={0.12}
                  strokeWidth={4}
                  fill="none"
                />
                <Circle
                  cx={RING / 2}
                  cy={RING / 2}
                  r={RING_R}
                  stroke={palette.plum}
                  strokeWidth={4}
                  strokeLinecap="round"
                  fill="none"
                  strokeDasharray={`${RING_C} ${RING_C}`}
                  strokeDashoffset={RING_C * (1 - Math.min(100, Math.max(0, stats.score)) / 100)}
                  transform={`rotate(-90 ${RING / 2} ${RING / 2})`}
                />
              </Svg>
              <Text style={[Type.body, { fontSize: 26, lineHeight: 32, color: palette.ink }]}>
                {stats.score}
              </Text>
            </View>
            <Text style={[Type.captionS, { color: palette.plum, marginTop: 'auto' }]}>
              {change === null
                ? t('me.profile.scoreNew')
                : change > 0
                  ? t('me.profile.scoreUp', { count: change })
                  : change < 0
                    ? t('me.profile.scoreDown', { count: -change })
                    : t('me.profile.scoreSame')}
            </Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/(tabs)/mood')}
            style={{
              flex: 1,
              height: 150,
              backgroundColor: palette.white,
              borderRadius: 24,
              padding: 16,
            }}
          >
            <Text
              style={[Type.microBold, { fontSize: 12, lineHeight: 16, color: palette.lavender }]}
            >
              {t('me.profile.moodWeek')}
            </Text>
            <Text
              numberOfLines={1}
              style={[
                Type.bodyMSemi,
                { fontSize: 18, lineHeight: 24, color: palette.ink, marginTop: 6 },
              ]}
            >
              {stats.weekMood ? t(`me.profile.moods.${stats.weekMood}`) : t('me.profile.moodNone')}
            </Text>
            <View
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants"
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'flex-end',
                marginTop: 'auto',
              }}
            >
              {stats.moodBars.map((value, i) => (
                <View key={i} style={{ alignItems: 'center', gap: 4 }}>
                  <Svg width={10} height={BAR_MAX}>
                    <Defs>
                      <LinearGradient id={`moodBar${i}`} x1="0" y1="0" x2="0" y2="1">
                        <Stop offset="0" stopColor={palette.mustard} />
                        <Stop offset="1" stopColor={palette.lavender} stopOpacity={0.6} />
                      </LinearGradient>
                    </Defs>
                    {value === null ? (
                      <Rect
                        x={0}
                        y={BAR_MAX - 10}
                        width={10}
                        height={10}
                        rx={5}
                        fill={palette.surfaceLilac}
                      />
                    ) : (
                      <Rect
                        x={0}
                        y={BAR_MAX - (BAR_MAX * value) / 5}
                        width={10}
                        height={(BAR_MAX * value) / 5}
                        rx={5}
                        fill={`url(#moodBar${i})`}
                      />
                    )}
                  </Svg>
                  <Text
                    style={[
                      Type.micro,
                      { fontSize: 10, lineHeight: 12, color: palette.textSubtle },
                    ]}
                  >
                    {days[i]}
                  </Text>
                </View>
              ))}
            </View>
          </Pressable>
        </View>

        <ListGroup style={{ marginTop: 12 }}>
          <ListRow
            icon="line/crown"
            label={t('me.profile.myPlan')}
            value={hasFullAccess ? t('me.profile.planPro') : t('me.profile.planFree')}
            onPress={() => router.push('/(tabs)/profile/plan')}
          />
          <ListRow
            icon="line/filter"
            label={t('me.profile.settings')}
            onPress={() => router.push('/(tabs)/profile/settings')}
          />
          <ListRow
            icon="line/chat"
            label={t('me.profile.help')}
            onPress={() => router.push('/(utils)/help-center')}
          />
        </ListGroup>
      </ScrollView>
    </View>
  );
}
