import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  Text,
  TextInput,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { Colors, palette, shadow } from '@/constants/theme';
import CitationSection from '@/components/CitationSection';
import type { ChatMessage } from '@/lib/types';
import { Type } from '@/constants/typography';
import { Icon, type IconName } from '@/components/icons/Icon';
import { IconButton } from '@/components/ui/IconButton';
import { Glow, MiniGlowOrb } from '@/components/glow/Glow';
import Svg, { Path } from 'react-native-svg';

/**
 * Chat header (05 §2.2, updated in 09 §3.2): the library back button, the mini orb, "Glow AI" in
 * SemiBold 15 ink and a "● status" line in Medium 11 lavender. The design's voice button on the
 * right waits for voice mode; that slot holds an optional action, such as ending the talk.
 */
export function ChatHeader({
  status,
  onBack,
  backLabel,
  title,
  action,
  style,
}: {
  status: string;
  onBack: () => void;
  backLabel: string;
  title: string;
  action?: { icon: IconName; label: string; onPress: () => void };
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[{ height: 44, flexDirection: 'row', alignItems: 'center', gap: 14 }, style]}>
      <IconButton variant="nav" accessibilityLabel={backLabel} onPress={onBack} />
      <MiniGlowOrb />
      <View accessible accessibilityLabel={`${title}, ${status}`} style={{ flex: 1 }}>
        <Text
          accessibilityRole="header"
          style={[Type.bodyMSemi, { lineHeight: 21, color: palette.ink }]}
        >
          {title}
        </Text>
        <Text style={[Type.micro, { lineHeight: 15, color: palette.lavender }]}>● {status}</Text>
      </View>
      {action && (
        <IconButton
          variant="filled"
          icon={action.icon}
          accessibilityLabel={action.label}
          onPress={action.onPress}
        />
      )}
    </View>
  );
}

/**
 * Composer (05 §2.3, `6699:3725`): one white 56 pill, radius 28, soft shadow, Regular 15 text, and
 * a 44 plum button inside it. Empty, the button is the mic and asks by voice (`useVoiceAsk`); with
 * text it sends. While listening, the field shows the level bars with cancel, and the button sends.
 */
export type ComposerVoice = {
  state: 'idle' | 'listening' | 'transcribing';
  levels: number[];
  start: () => void;
  send: () => void;
  cancel: () => void;
  labels: { mic: string; cancel: string; send: string; listening: string; transcribing: string };
};

export function Composer({
  value,
  onChangeText,
  onSend,
  placeholder,
  sendLabel,
  disabled = false,
  voice,
  style,
}: {
  value: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  placeholder: string;
  sendLabel: string;
  disabled?: boolean;
  /** Shows the mic while the field is empty. Without it the button is always send. */
  voice?: ComposerVoice;
  style?: StyleProp<ViewStyle>;
}) {
  const canSend = !!value.trim() && !disabled;
  const listening = voice?.state === 'listening';
  const transcribing = voice?.state === 'transcribing';
  const showMic = !!voice && !value.trim() && !listening;
  return (
    <View
      style={[
        {
          minHeight: 56,
          borderRadius: 28,
          backgroundColor: palette.white,
          boxShadow: shadow.soft,
          flexDirection: 'row',
          alignItems: 'flex-end',
          paddingLeft: 20,
          paddingRight: 6,
          paddingVertical: 6,
        },
        style,
      ]}
    >
      {listening ? (
        <View
          accessibilityLiveRegion="polite"
          accessibilityLabel={voice.labels.listening}
          style={{ flex: 1, height: 44, flexDirection: 'row', alignItems: 'center', gap: 10 }}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={voice.labels.cancel}
            onPress={voice.cancel}
            hitSlop={8}
            style={{ marginLeft: -8 }}
          >
            <Icon name="arrow/close" size={20} color={palette.plum} />
          </Pressable>
          <View style={{ flex: 1, height: 32, flexDirection: 'row', alignItems: 'center', gap: 3 }}>
            {voice.levels.map((level, i) => (
              <View
                key={i}
                style={{
                  width: 3,
                  height: Math.max(4, Math.round(4 + 24 * Math.min(1, level))),
                  borderRadius: 2,
                  backgroundColor: palette.plum,
                  opacity: 0.35 + 0.65 * Math.min(1, level * 1.4),
                }}
              />
            ))}
          </View>
        </View>
      ) : transcribing ? (
        <View style={{ flex: 1, height: 44, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <ActivityIndicator size="small" color={palette.plum} />
          <Text style={[Type.bodyM, { color: palette.textMuted }]}>
            {voice.labels.transcribing}
          </Text>
        </View>
      ) : (
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={palette.textSubtle}
          multiline
          maxLength={2000}
          accessibilityLabel={placeholder}
          style={[
            Type.bodyM,
            {
              lineHeight: 21,
              flex: 1,
              color: palette.ink,
              paddingTop: 11,
              paddingBottom: 11,
              maxHeight: 120,
            },
          ]}
        />
      )}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={showMic ? voice.labels.mic : listening ? voice.labels.send : sendLabel}
        accessibilityState={{ disabled: showMic || listening ? disabled : !canSend }}
        disabled={transcribing || (showMic || listening ? disabled : !canSend)}
        onPress={showMic ? voice.start : listening ? voice.send : onSend}
        style={({ pressed }) => ({
          width: 44,
          height: 44,
          borderRadius: 22,
          backgroundColor: pressed ? palette.plumDeep : palette.plum,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: showMic || listening ? (disabled ? 0.45 : 1) : canSend ? 1 : 0.45,
        })}
      >
        {listening ? (
          <View
            style={{ width: 14, height: 14, borderRadius: 3, backgroundColor: palette.white }}
          />
        ) : (
          <Icon name={showMic ? 'line/mic' : 'line/send'} size={20} color={palette.white} />
        )}
      </Pressable>
    </View>
  );
}

/** Starter row (05 §3.2): 54 high, white, radius 20, a 20 icon, Medium 15 ink label and a chevron. */
export function StarterRow({
  icon,
  label,
  onPress,
}: {
  icon: IconName;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => ({
        minHeight: 54,
        borderRadius: 20,
        backgroundColor: pressed ? palette.surfaceLilacSoft : palette.white,
        flexDirection: 'row',
        alignItems: 'center',
        paddingLeft: 18,
        paddingRight: 16,
        gap: 14,
      })}
    >
      <Icon name={icon} size={20} />
      <Text style={[Type.bodyMMedium, { lineHeight: 21, flex: 1, color: palette.ink }]}>
        {label}
      </Text>
      <Icon name="arrow/chevron-right" size={18} />
    </Pressable>
  );
}

/**
 * Talk row on the Glow AI home (05 §3.1): 76 high, white, radius 22, a 44 lavender @0.14 circle with
 * a 22 icon, SemiBold 15 title, Regular 12 subtle summary and a Medium 11 date at the top right.
 */
export function TalkCard({
  icon,
  title,
  summary,
  date,
  onPress,
}: {
  icon: IconName;
  title: string;
  summary: string;
  date: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${summary}. ${date}`}
      onPress={onPress}
      style={({ pressed }) => ({
        minHeight: 76,
        borderRadius: 22,
        backgroundColor: pressed ? palette.surfaceLilacSoft : palette.white,
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        gap: 12,
      })}
    >
      <View
        style={{
          width: 44,
          height: 44,
          borderRadius: 22,
          backgroundColor: 'rgba(142,127,166,0.14)',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon name={icon} size={22} />
      </View>
      <View style={{ flex: 1, gap: 4 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text
            numberOfLines={1}
            style={[Type.bodyMSemi, { lineHeight: 21, flex: 1, color: palette.ink }]}
          >
            {title}
          </Text>
          <Text style={[Type.micro, { lineHeight: 15, color: palette.textSubtle }]}>{date}</Text>
        </View>
        <Text
          numberOfLines={1}
          style={[Type.captionS, { lineHeight: 17, color: palette.textSubtle }]}
        >
          {summary}
        </Text>
      </View>
    </Pressable>
  );
}

/**
 * User: plum #6B5279, white Regular 15 text. AI: white, ink text, no border. Radius 22 with a 6
 * corner on the speaker's side, padding 16/12, max width 292. No avatars. A day stamp in Medium 11
 * subtle sits above the first message of each day, and "Sent · HH:mm" sits under the latest user
 * message once it has been saved. A message that failed shows "Not sent · Tap to retry" in
 * SemiBold 12 danger instead (`6817:7082`), and tapping it sends the message again.
 */
export function MessageBubble({
  item,
  dayStamp,
  receipt,
  failed,
}: {
  item: ChatMessage;
  dayStamp?: string;
  receipt?: string;
  failed?: { label: string; onRetry: () => void; busy?: boolean };
}) {
  const isUser = item.role === 'user';
  const hasCitations = !isUser && item.citations && item.citations.length > 0;

  return (
    <View style={{ gap: 6 }}>
      {dayStamp ? (
        <Text
          style={[
            Type.micro,
            { lineHeight: 15, color: palette.textSubtle, textAlign: 'center', marginBottom: 6 },
          ]}
        >
          {dayStamp}
        </Text>
      ) : null}
      <View
        style={{
          alignSelf: isUser ? 'flex-end' : 'flex-start',
          maxWidth: 292,
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderRadius: 22,
          borderBottomRightRadius: isUser ? 6 : 22,
          borderBottomLeftRadius: isUser ? 22 : 6,
          backgroundColor: isUser ? palette.plum : palette.white,
        }}
      >
        <Text style={[Type.bodyM, { lineHeight: 22, color: isUser ? palette.white : palette.ink }]}>
          {item.content}
        </Text>
        {hasCitations && (
          <CitationSection
            citations={item.citations!}
            accentColor={palette.plum}
            colors={Colors.light as any}
            compact
          />
        )}
      </View>
      {failed ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={failed.label}
          disabled={failed.busy}
          onPress={failed.onRetry}
          hitSlop={10}
          style={{
            alignSelf: 'flex-end',
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            opacity: failed.busy ? 0.5 : 1,
          }}
        >
          <Icon name="arrow/replay" size={14} color={palette.danger} strokeWidth={1.6} />
          <Text style={[Type.caption, { color: palette.danger }]}>{failed.label}</Text>
        </Pressable>
      ) : receipt ? (
        <Text
          style={[Type.micro, { lineHeight: 15, color: palette.textSubtle, alignSelf: 'flex-end' }]}
        >
          {receipt}
        </Text>
      ) : null}
    </View>
  );
}

/**
 * Practice card in the chat (`6699:3808`): white, radius 22, 260 wide, padding 16/16/10, with a
 * soft category glow on the right. A Medium 10 lavender eyebrow ("BREATHING · 4 MIN"), the
 * SemiBold 16 ink name and a 24-high plum Start pill with a play icon and SemiBold 12 white label.
 */
export function ChatPracticeCard({
  eyebrow,
  title,
  startLabel,
  glow,
  onStart,
}: {
  eyebrow: string;
  title: string;
  startLabel: string;
  glow: string;
  onStart: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${startLabel}, ${title}`}
      onPress={onStart}
      style={({ pressed }) => ({
        alignSelf: 'flex-start',
        width: 260,
        borderRadius: 22,
        overflow: 'hidden',
        backgroundColor: palette.white,
        paddingTop: 16,
        paddingHorizontal: 16,
        paddingBottom: 10,
        gap: 5,
        opacity: pressed ? 0.9 : 1,
      })}
    >
      <Glow
        color={glow}
        opacity={0.18}
        width={120}
        blur={26}
        style={{ position: 'absolute', left: 150, top: -30 }}
      />
      <Text style={[Type.micro, { fontSize: 10, lineHeight: 12, color: palette.lavender }]}>
        {eyebrow.toUpperCase()}
      </Text>
      <Text style={[Type.bodyStrong, { lineHeight: 19, letterSpacing: 0, color: palette.ink }]}>
        {title}
      </Text>
      <View
        style={{
          alignSelf: 'flex-start',
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          height: 24,
          paddingLeft: 10,
          paddingRight: 12,
          borderRadius: 999,
          backgroundColor: palette.plum,
        }}
      >
        <Svg width={10} height={10} viewBox="0 0 10 10">
          <Path
            d="M3 2.2v5.6a.5.5 0 0 0 .76.43l4.4-2.8a.5.5 0 0 0 0-.86l-4.4-2.8A.5.5 0 0 0 3 2.2Z"
            fill={palette.white}
          />
        </Svg>
        <Text style={[Type.caption, { lineHeight: 14, color: palette.white }]}>{startLabel}</Text>
      </View>
    </Pressable>
  );
}

/**
 * Quick replies under the latest reply (`6699:3808`): pills that wrap with an 8 gap, padding 9/14.
 * The first is the suggested one: selected fill with a 1.5 plum stroke and SemiBold 13 plum. The
 * others are white with a 1px `#E6E0EA` stroke and Medium 13 muted text.
 */
export function QuickReplies({
  replies,
  onPick,
}: {
  replies: string[];
  onPick: (reply: string) => void;
}) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
      {replies.map((reply, i) => {
        const first = i === 0;
        return (
          <Pressable
            key={reply}
            accessibilityRole="button"
            accessibilityLabel={reply}
            onPress={() => onPick(reply)}
            style={({ pressed }) => ({
              paddingVertical: 9,
              paddingHorizontal: 14,
              borderRadius: 999,
              backgroundColor: first ? palette.selected : palette.white,
              borderWidth: first ? 1.5 : 1,
              borderColor: first ? palette.plum : '#E6E0EA',
              opacity: pressed ? 0.85 : 1,
            })}
          >
            <Text
              style={[
                first ? Type.chipSelected : Type.chip,
                { lineHeight: 16, color: first ? palette.plum : palette.textMuted },
              ]}
            >
              {reply}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/**
 * Offline banner at the top of a talk (`6817:7082`): white, radius 20, a 1.5 rose stroke, padding
 * 14/14/14/16, a 36 rose @0.30 circle with an 18 icon, then a SemiBold 14 title and Regular 12 body.
 */
export function OfflineBanner({ title, body }: { title: string; body: string }) {
  return (
    <View
      accessible
      accessibilityRole="alert"
      accessibilityLabel={`${title}. ${body}`}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        borderRadius: 20,
        borderWidth: 1.5,
        borderColor: palette.rose,
        backgroundColor: palette.white,
        paddingVertical: 14,
        paddingRight: 14,
        paddingLeft: 16,
      }}
    >
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 18,
          backgroundColor: 'rgba(255,179,190,0.30)',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon name="line/globe" size={18} color={palette.plumDeep} />
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={[Type.label, { letterSpacing: 0, color: palette.ink }]}>{title}</Text>
        <Text style={[Type.captionS, { color: palette.textMuted }]}>{body}</Text>
      </View>
    </View>
  );
}
