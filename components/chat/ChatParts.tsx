import React from 'react';
import { Pressable, Text, TextInput, View, type StyleProp, type ViewStyle } from 'react-native';
import { Colors, palette, shadow } from '@/constants/theme';
import CitationSection from '@/components/CitationSection';
import type { ChatMessage } from '@/lib/types';
import { Type } from '@/constants/typography';
import { Icon, type IconName } from '@/components/icons/Icon';
import { IconButton } from '@/components/ui/IconButton';
import { MiniGlowOrb } from '@/components/glow/Glow';

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
 * Composer (05 §2.3): one white 56 pill, radius 28, soft shadow, Regular 15 text, and a 44 plum
 * button inside it. The design's empty state shows a mic for voice mode, which is not built yet, so
 * the button is always "send" and dims while the field is empty.
 */
export function Composer({
  value,
  onChangeText,
  onSend,
  placeholder,
  sendLabel,
  disabled = false,
  style,
}: {
  value: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  placeholder: string;
  sendLabel: string;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const canSend = !!value.trim() && !disabled;
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
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={sendLabel}
        accessibilityState={{ disabled: !canSend }}
        disabled={!canSend}
        onPress={onSend}
        style={({ pressed }) => ({
          width: 44,
          height: 44,
          borderRadius: 22,
          backgroundColor: pressed ? palette.plumDeep : palette.plum,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: canSend ? 1 : 0.45,
        })}
      >
        <Icon name="line/send" size={20} color={palette.white} />
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
 * message once it has been saved.
 */
export function MessageBubble({
  item,
  dayStamp,
  receipt,
}: {
  item: ChatMessage;
  dayStamp?: string;
  receipt?: string;
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
      {receipt ? (
        <Text
          style={[Type.micro, { lineHeight: 15, color: palette.textSubtle, alignSelf: 'flex-end' }]}
        >
          {receipt}
        </Text>
      ) : null}
    </View>
  );
}
