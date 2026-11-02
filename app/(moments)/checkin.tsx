import React, { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import * as Notifications from 'expo-notifications';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
import { palette } from '@/constants/theme';
import { Type } from '@/constants/typography';
import { Glow } from '@/components/glow/Glow';
import { Icon } from '@/components/icons/Icon';
import { LegalNote } from '@/components/ui/controls';
import TypingBubble from '@/components/TypingBubble';
import { MomentShell, closeMoment } from '@/components/moments/MomentShell';
import { toast } from '@/components/Toast';
import { useProfile } from '@/hooks/useProfile';
import { greetingKey } from '@/lib/home';
import { greetingName } from '@/lib/profile-stats';
import { scheduleNotification } from '@/lib/notifications';

/**
 * Glow AI check-in (03 §3.5): the orb, the check-in time, Glow AI's opening lines, quick replies
 * (start, remind me in 10 minutes, skip today) and a reply box. Replies open a Glow AI talk seeded
 * with what was chosen or typed; the reply box sends nothing until the talk opens.
 */
export default function CheckInMoment() {
  const { t } = useTranslation();
  const { profile } = useProfile({ lazy: true });
  const [reply, setReply] = useState('');
  const name = greetingName(profile);
  const time = profile?.checkinTime ?? '08:30';
  const greeting = t(`moments.checkin.${greetingKey(new Date().getHours())}`, { name });

  const openChat = (message: string) =>
    router.replace({ pathname: '/(tabs)/chat/new-conversation', params: { initialMessage: message, from: '/(tabs)/chat' } });

  const remind = async () => {
    try {
      await scheduleNotification(t('moments.checkin.remindTitle'), t('moments.checkin.remindBody'), { route: '/(moments)/checkin' }, {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: 600,
      });
      toast.success(t('moments.checkin.reminded'));
      closeMoment();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t('moments.error'));
    }
  };

  const bubble = (text: string) => (
    <View style={{ alignSelf: 'flex-start', maxWidth: '86%', backgroundColor: palette.white, borderRadius: 22, borderTopLeftRadius: 6, paddingVertical: 12, paddingHorizontal: 16 }}>
      <Text style={[Type.body, { fontWeight: '400', lineHeight: 21, color: palette.ink }]}>{text}</Text>
    </View>
  );
  const chip = (label: string, onPress: () => void, primary = false) => (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => ({ height: 37, paddingHorizontal: 16, borderRadius: 999, justifyContent: 'center', backgroundColor: primary ? palette.plum : palette.white, opacity: pressed ? 0.8 : 1 })}
    >
      <Text style={[Type.label, { fontWeight: '700', color: primary ? palette.white : palette.plumDeep }]}>{label}</Text>
    </Pressable>
  );

  return (
    <MomentShell
      glows={[
        { color: palette.lavenderSoft, opacity: 0.35, x: -60, y: 30, width: 280, blur: 90 },
        { color: palette.sky, opacity: 0.3, x: 170, y: 120, width: 240, blur: 90 },
      ]}
    >
      <View style={{ alignItems: 'center', height: 150 }}>
        <Glow color={palette.lavenderSoft} opacity={0.7} width={120} blur={24} style={{ position: 'absolute', top: 0 }} />
        <Glow color={palette.sky} opacity={0.7} width={90} blur={20} style={{ position: 'absolute', top: 24, marginLeft: 50 }} />
        <View style={{ position: 'absolute', top: 28, width: 64, height: 64, borderRadius: 32, backgroundColor: palette.white, alignItems: 'center', justifyContent: 'center', boxShadow: '0px 0px 24px 6px rgba(216,180,216,0.70)' }}>
          <Svg width={64} height={64} style={{ position: 'absolute' }}>
            <Defs>
              <RadialGradient id="ciOrb" cx="50%" cy="50%" r="50%">
                <Stop offset="0" stopColor={palette.white} />
                <Stop offset="1" stopColor={palette.cream} />
              </RadialGradient>
            </Defs>
            <Circle cx={32} cy={32} r={32} fill="url(#ciOrb)" />
          </Svg>
          <Icon name="line/sparkle" size={30} color={palette.plum} />
        </View>
        <View style={{ position: 'absolute', top: 120, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.85)', borderRadius: 999, paddingVertical: 5, paddingLeft: 10, paddingRight: 12 }}>
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: palette.lavender }} />
          <Text style={[Type.labelM, { color: palette.ink }]}>{t('moments.checkin.status', { time })}</Text>
        </View>
      </View>

      <View style={{ gap: 10, marginTop: 24 }}>
        {bubble(`${greeting} ${t('moments.checkin.opening', { time })}`)}
        {bubble(t('moments.checkin.question'))}
        <TypingBubble />
      </View>

      <Text style={[Type.labelM, { letterSpacing: 0.48, color: palette.textSubtle, marginTop: 28 }]}>{t('moments.checkin.quickReply').toUpperCase()}</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
        {chip(t('moments.checkin.ready'), () => openChat(t('moments.checkin.readyPrompt')), true)}
        {chip(t('moments.checkin.later'), () => void remind())}
        {chip(t('moments.checkin.skip'), closeMoment)}
      </View>

      <LegalNote text={t('moments.checkin.legal')} style={{ marginTop: 28 }} />
      <View style={{ marginTop: 16, height: 56, borderRadius: 28, backgroundColor: palette.white, flexDirection: 'row', alignItems: 'center', paddingLeft: 20, paddingRight: 6 }}>
        <TextInput
          value={reply}
          onChangeText={setReply}
          placeholder={t('moments.checkin.placeholder')}
          placeholderTextColor={palette.textSubtle}
          accessibilityLabel={t('moments.checkin.placeholder')}
          returnKeyType="send"
          onSubmitEditing={() => reply.trim() && openChat(reply.trim())}
          style={[Type.bodyM, { flex: 1, color: palette.ink }]}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={reply.trim() ? t('moments.checkin.send') : t('moments.checkin.voice')}
          onPress={() => openChat(reply.trim())}
          style={({ pressed }) => ({ width: 44, height: 44, borderRadius: 22, backgroundColor: palette.plum, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.8 : 1 })}
        >
          <Icon name={reply.trim() ? 'line/send' : 'line/mic'} size={20} color={palette.white} />
        </Pressable>
      </View>
    </MomentShell>
  );
}
