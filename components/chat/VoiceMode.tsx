import React, { useEffect, useRef, useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Speech from 'expo-speech';
import { useTranslation } from 'react-i18next';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
import { palette } from '@/constants/theme';
import { Type } from '@/constants/typography';
import { Icon, type IconName } from '@/components/icons/Icon';
import { IconButton } from '@/components/ui/IconButton';
import { useVoiceAsk } from '@/hooks/useVoiceAsk';

type Mode = 'listening' | 'thinking' | 'speaking' | 'muted';

/**
 * Voice mode (`6699:3875` listening, `6787:5388` thinking, `6787:5420` muted). It listens, sends what
 * was said as a normal chat message, speaks the reply when Voice replies is on, then listens again.
 * Mute stops listening; End closes it; Text closes it and leaves the typed chat.
 */
export function VoiceMode({
  visible,
  onClose,
  onSay,
  thinking,
  reply,
  speakReplies,
  language,
}: {
  visible: boolean;
  onClose: () => void;
  onSay: (text: string) => void;
  thinking: boolean;
  /** The latest Glow AI reply, keyed by message id so each is spoken once. */
  reply: { id: string; text: string } | null;
  speakReplies: boolean;
  language: string;
}) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState<Mode>('listening');
  const [quote, setQuote] = useState('');
  const spoken = useRef<string | null>(reply?.id ?? null);
  const voice = useVoiceAsk((text) => {
    setQuote(text);
    onSay(text);
  });
  const { start, cancel, state } = voice;

  // Open listening; leave quietly.
  useEffect(() => {
    if (!visible) return;
    spoken.current = reply?.id ?? null;
    setQuote('');
    setMode('listening');
    start();
    return () => {
      cancel();
      void Speech.stop();
    };
    // Only on open and close.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  useEffect(() => {
    if (visible && thinking) setMode('thinking');
  }, [visible, thinking]);

  // Speak each new reply, then listen again unless muted.
  useEffect(() => {
    if (!visible || !reply || reply.id === spoken.current) return;
    spoken.current = reply.id;
    const listenAgain = () => {
      setMode((m) => {
        if (m === 'muted') return m;
        start();
        return 'listening';
      });
    };
    if (!speakReplies) return listenAgain();
    setMode('speaking');
    Speech.speak(reply.text, {
      language,
      onDone: listenAgain,
      onStopped: () => undefined,
      onError: listenAgain,
    });
  }, [visible, reply, speakReplies, language, start]);

  const toggleMute = () => {
    if (mode === 'muted') {
      setMode('listening');
      start();
    } else {
      cancel();
      void Speech.stop();
      setMode('muted');
    }
  };

  const status =
    mode === 'muted'
      ? t('voiceMode.muted')
      : mode === 'thinking' || state === 'transcribing'
        ? t('voiceMode.thinking')
        : mode === 'speaking'
          ? t('voiceMode.speaking')
          : t('voiceMode.listening');

  const button = (icon: IconName, label: string, onPress: () => void, main = false) => (
    <View style={{ alignItems: 'center', gap: 8 }}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        onPress={onPress}
        style={{
          width: main ? 72 : 56,
          height: main ? 72 : 56,
          borderRadius: main ? 36 : 28,
          backgroundColor: main ? palette.plum : palette.white,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon name={icon} size={main ? 24 : 20} color={main ? palette.mustard : palette.plum} />
      </Pressable>
      <Text style={[Type.captionS, { color: palette.plumDeep }]}>{label}</Text>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="fade"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: palette.bg,
          paddingTop: insets.top + 10,
          paddingHorizontal: 24,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, height: 44 }}>
          <IconButton variant="nav" accessibilityLabel={t('common.back')} onPress={onClose} />
          <View accessible accessibilityLabel={`Glow AI, ${status}`}>
            <Text style={[Type.bodyMSemi, { color: palette.ink }]}>Glow AI</Text>
            <Text
              accessibilityLiveRegion="polite"
              style={[Type.micro, { color: palette.lavender }]}
            >
              ● {status}
            </Text>
          </View>
        </View>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Svg width={280} height={280}>
            <Defs>
              <RadialGradient id="voiceLight" cx="50%" cy="50%" r="50%">
                <Stop offset="0" stopColor={palette.cream} />
                <Stop offset="0.5" stopColor={palette.gold} stopOpacity={0.5} />
                <Stop offset="1" stopColor={palette.lavenderSoft} stopOpacity={0.15} />
              </RadialGradient>
            </Defs>
            <Circle cx={140} cy={140} r={98} fill="url(#voiceLight)" />
            {[139, 120, 98].map((r) => (
              <Circle
                key={r}
                cx={140}
                cy={140}
                r={r}
                stroke={palette.plum}
                strokeOpacity={mode === 'listening' ? 0.6 : 0.35}
                strokeWidth={1}
                fill="none"
              />
            ))}
          </Svg>
          <View style={{ position: 'absolute' }}>
            <Icon name="line/sparkle" size={30} color={palette.plum} />
          </View>
          <Text
            style={[
              Type.bodyMSemi,
              {
                fontSize: 18,
                lineHeight: 24,
                color: palette.ink,
                textAlign: 'center',
                marginTop: 36,
                minHeight: 48,
              },
            ]}
          >
            {mode === 'muted' ? t('voiceMode.waiting') : quote ? `“${quote}”` : ''}
          </Text>
        </View>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-around',
            alignItems: 'flex-end',
            paddingBottom: insets.bottom + 24,
          }}
        >
          {button(
            mode === 'muted' ? 'line/mic-off' : 'line/mic',
            mode === 'muted' ? t('voiceMode.unmute') : t('voiceMode.mute'),
            toggleMute,
          )}
          {button('line/check', t('voiceMode.end'), onClose, true)}
          {button('line/chat', t('voiceMode.text'), onClose)}
        </View>
      </View>
    </Modal>
  );
}
