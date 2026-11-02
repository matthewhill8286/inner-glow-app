import React, { useState } from 'react';
import { Platform, Pressable, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
import { palette } from '@/constants/theme';
import { Type } from '@/constants/typography';
import { AppButton } from '@/components/ui/AppButton';
import { Toggle } from '@/components/ui/controls';
import { SettingsScreen } from '@/components/settings/SettingsParts';
import { toast } from '@/components/Toast';
import { useUser } from '@/hooks/useUser';
import { backTo } from '@/lib/navigation';
import { supabase } from '@/supabase/supabase';

/** Keys allowed by the `feedback.areas` check constraint, in the design's order. */
const AREAS = ['glow_ai', 'practices', 'sleep', 'journal', 'design', 'speed', 'broken', 'other'];
const MAX = 500;
/** Orb size and opacity per rating (06 §P12): it grows with the score. */
const ORBS = [
  { size: 12, opacity: 0.5 },
  { size: 19, opacity: 0.6 },
  { size: 26, opacity: 0.7 },
  { size: 33, opacity: 0.8 },
  { size: 40, opacity: 0.9 },
];

function RatingOrb({ index, selected }: { index: number; selected: boolean }) {
  const { size, opacity } = ORBS[index];
  const id = `fbOrb${index}${selected ? 's' : ''}`;
  return (
    <Svg width={size} height={size}>
      <Defs>
        <RadialGradient id={id} cx="50%" cy="50%" r="50%">
          <Stop offset="0" stopColor={palette.cream} />
          <Stop offset="1" stopColor={selected ? palette.gold : palette.lavenderSoft} stopOpacity={selected ? 1 : opacity} />
        </RadialGradient>
      </Defs>
      <Circle cx={size / 2} cy={size / 2} r={size / 2} fill={`url(#${id})`} />
    </Svg>
  );
}

/**
 * Send feedback (06 §P12): a five-step rating whose orb grows with the score, what could be better,
 * a note of up to 500 characters and an optional device-info switch. Sends to the `feedback`
 * table and opens Feedback sent.
 */
export default function FeedbackScreen() {
  const { t } = useTranslation();
  const { data: user } = useUser();
  const [rating, setRating] = useState<number | null>(null);
  const [areas, setAreas] = useState<string[]>([]);
  const [message, setMessage] = useState('');
  const [focused, setFocused] = useState(false);
  const [device, setDevice] = useState(true);
  const [busy, setBusy] = useState(false);

  const send = async () => {
    if (!rating || !user) return;
    setBusy(true);
    try {
      const { error } = await supabase.from('feedback' as never).insert({
        user_id: user.id,
        rating,
        areas,
        message: message.trim() || null,
        device_info: device
          ? { os: Platform.OS, osVersion: Device.osVersion, model: Device.modelName, app: Constants.expoConfig?.version ?? null }
          : null,
      } as never);
      if (error) throw new Error(error.message.includes('rate_limited') ? t('feedbackFlow.tooMany') : t('feedbackFlow.error'));
      router.replace('/(utils)/feedback-sent');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t('feedbackFlow.error'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <SettingsScreen
      title={t('feedbackFlow.header')}
      backLabel={t('common.back')}
      onBack={() => backTo(undefined, '/(tabs)/profile/settings')}
      glows={[
        { color: palette.lavenderSoft, opacity: 0.22, x: -70, y: -50, width: 280, blur: 90 },
        { color: palette.mustard, opacity: 0.15, x: 200, y: 40, width: 220, blur: 90 },
      ]}
      contentStyle={{ gap: 16 }}
      cta={<AppButton title={t('feedbackFlow.send')} busy={busy} disabled={!rating} onPress={send} />}
    >
      <Text accessibilityRole="header" style={[Type.titleMd, { fontSize: 24, lineHeight: 30, color: palette.ink, maxWidth: 300 }]}>
        {t('feedbackFlow.title')}
      </Text>

      <View accessibilityRole="radiogroup" style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
        {ORBS.map((_, i) => {
          const on = rating === i + 1;
          return (
            <Pressable
              key={i}
              accessibilityRole="radio"
              accessibilityLabel={t('feedbackFlow.ratingLabel', { value: i + 1 })}
              accessibilityState={{ selected: on }}
              onPress={() => setRating(i + 1)}
              style={{
                width: 59,
                height: 59,
                borderRadius: 30,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: on ? palette.selected : palette.white,
                borderWidth: on ? 1.5 : 1,
                borderColor: on ? palette.plum : palette.borderLilac,
                boxShadow: on ? '0px 0px 12px 0px rgba(226,204,64,0.50)' : undefined,
              }}
            >
              <RatingOrb index={i} selected={on} />
            </Pressable>
          );
        })}
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: -6 }}>
        <Text style={[Type.captionS, { color: palette.textMuted }]}>{t('feedbackFlow.low')}</Text>
        <Text style={[Type.captionS, { color: palette.textMuted }]}>{t('feedbackFlow.high')}</Text>
      </View>

      <Text style={[Type.chipSelected, { color: palette.ink, marginTop: 12 }]}>{t('feedbackFlow.better')}</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {AREAS.map((a) => {
          const on = areas.includes(a);
          return (
            <Pressable
              key={a}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: on }}
              onPress={() => setAreas((x) => (on ? x.filter((k) => k !== a) : [...x, a]))}
              style={{
                height: 36,
                paddingHorizontal: 14,
                borderRadius: 999,
                justifyContent: 'center',
                backgroundColor: on ? palette.selected : palette.white,
                borderWidth: on ? 1.5 : 1,
                borderColor: on ? palette.plum : palette.border,
              }}
            >
              <Text style={[on ? Type.chipSelected : Type.chip, { color: on ? palette.plum : palette.textMuted }]}>{t(`feedbackFlow.areas.${a}`)}</Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={[Type.chipSelected, { color: palette.ink, marginTop: 12 }]}>{t('feedbackFlow.more')}</Text>
      <View
        style={{
          minHeight: 140,
          borderRadius: 20,
          backgroundColor: palette.white,
          borderWidth: focused ? 1.5 : 1,
          borderColor: focused ? palette.plum : palette.borderLilac,
          padding: 16,
        }}
      >
        <TextInput
          value={message}
          onChangeText={setMessage}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          multiline
          maxLength={MAX}
          placeholder={t('feedbackFlow.placeholder')}
          placeholderTextColor={palette.textSubtle}
          accessibilityLabel={t('feedbackFlow.more')}
          textAlignVertical="top"
          style={[Type.bodyM, { flex: 1, minHeight: 90, lineHeight: 21, color: palette.ink, padding: 0 }]}
        />
        <Text style={[Type.note, { color: palette.textSubtle, alignSelf: 'flex-end' }]}>{`${message.length} / ${MAX}`}</Text>
      </View>

      <View style={{ minHeight: 60, borderRadius: 20, backgroundColor: palette.white, flexDirection: 'row', alignItems: 'center', paddingLeft: 20, paddingRight: 16 }}>
        <Text style={[Type.bodyMMedium, { flex: 1, color: palette.ink }]}>{t('feedbackFlow.device')}</Text>
        <Toggle value={device} onValueChange={setDevice} accessibilityLabel={t('feedbackFlow.device')} />
      </View>
    </SettingsScreen>
  );
}
