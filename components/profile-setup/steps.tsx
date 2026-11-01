import React, { useState } from 'react';
import { ActivityIndicator, Image, Pressable, Text, TextInput, View, type TextInputProps, useWindowDimensions } from 'react-native';
import { palette } from '@/constants/theme';
import { Type } from '@/constants/typography';
import { Icon, type IconName } from '@/components/icons/Icon';
import { Glow } from '@/components/glow/Glow';
import { Chip } from '@/components/ui/Chip';
import { Toggle } from '@/components/ui/controls';
import CheckinAura from '@/assets/svg/illustrations/setup/checkin-aura.svg';
import PrivateAura from '@/assets/svg/illustrations/profile/private-aura.svg';
import FaceIdGlyph from '@/assets/svg/illustrations/profile/face-id.svg';
import type { CheckinSlot, NotificationChoice } from '@/lib/profile-setup';

/* ── P1 · Let's get to know you (`6676:3017`) ─────────────────────────────────────── */

/**
 * Avatar: a 112 white circle with a 1.5 plum ring and a 40 user icon, a 36 plum "+" badge with a
 * background-coloured ring, and a mustard glow drawn over it (as in Figma) until a photo is chosen.
 */
export function AvatarPicker({
  photoUrl,
  busy,
  onPress,
  caption,
  accessibilityLabel,
}: {
  photoUrl?: string | null;
  busy: boolean;
  onPress: () => void;
  caption: string;
  accessibilityLabel: string;
}) {
  return (
    <View style={{ alignItems: 'center', gap: 14 }}>
      <Pressable accessibilityRole="button" accessibilityLabel={accessibilityLabel} onPress={onPress} disabled={busy} style={{ width: 120, height: 118 }}>
        <View style={{ width: 112, height: 112, borderRadius: 56, backgroundColor: palette.white, borderWidth: 1.5, borderColor: palette.plum, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }}>
          {photoUrl ? <Image source={{ uri: photoUrl }} style={{ width: 112, height: 112 }} /> : <Icon name="line/user" size={40} />}
          {busy && (
            <View style={{ position: 'absolute', inset: 0, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.6)' }}>
              <ActivityIndicator color={palette.plum} />
            </View>
          )}
        </View>
        {!photoUrl && <Glow color={palette.mustard} opacity={0.28} width={170} blur={30} style={{ position: 'absolute', left: -29.5, top: -29 }} />}
        <View style={{ position: 'absolute', left: 84, top: 82, width: 36, height: 36, borderRadius: 18, backgroundColor: palette.plum, borderWidth: 3, borderColor: palette.bg, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="line/plus" size={18} color={palette.white} />
        </View>
      </Pressable>
      <Text style={[Type.chip, { color: palette.lavender, textAlign: 'center' }]}>{caption}</Text>
    </View>
  );
}

/**
 * P1 field: SemiBold 13 ink label 8 above a 52 white box, radius 16, with a 1.5 plum stroke while
 * focused (no stroke otherwise), Medium 15 ink text and a Regular 15 subtle placeholder.
 */
export function ProfileField({ label, error, ...props }: TextInputProps & { label: string; error?: string | null }) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={{ gap: 8 }}>
      <Text style={[Type.chipSelected, { color: palette.ink }]}>{label}</Text>
      <TextInput
        {...props}
        accessibilityLabel={label}
        placeholderTextColor={palette.textSubtle}
        onFocus={(e) => {
          setFocused(true);
          props.onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          props.onBlur?.(e);
        }}
        style={[
          props.value ? Type.body : Type.bodyM,
          {
            height: 52,
            borderRadius: 16,
            paddingHorizontal: 20,
            backgroundColor: palette.white,
            color: palette.ink,
            borderWidth: 1.5,
            borderColor: error ? palette.danger : focused ? palette.plum : 'transparent',
          },
        ]}
      />
      {error ? (
        <Text accessibilityLiveRegion="polite" style={[Type.caption, { color: palette.danger }]}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}

/* ── P2 · When should we check in? (`6676:3066`, `6787:5765`, `6787:5819`) ───────────── */

/** Positions are in the 375 frame; the scene sits under the title, which ends at y 188. */
const CHECKIN_TOP = 188;

export function CheckinScene({
  time,
  caption,
  slot,
  slots,
  onPickSlot,
  onPressTime,
  timeLabel,
}: {
  time: string;
  caption: string;
  slot: CheckinSlot | null;
  slots: { key: CheckinSlot; label: string }[];
  onPickSlot: (slot: CheckinSlot) => void;
  onPressTime: () => void;
  timeLabel: string;
}) {
  const { width } = useWindowDimensions();
  const sx = width / 375;
  return (
    <View style={{ height: 495 - CHECKIN_TOP, marginHorizontal: -24 }}>
      <Glow color={palette.mustard} opacity={0.28} width={240} blur={50} style={{ position: 'absolute', left: 67.5 * sx, top: 210 - CHECKIN_TOP }} />
      <CheckinAura width={234.5} height={216} style={{ position: 'absolute', left: 188.75 * sx - 117.25, top: 226.8 - CHECKIN_TOP }} />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${timeLabel}, ${time}, ${caption}`}
        onPress={onPressTime}
        style={{ position: 'absolute', top: 290 - CHECKIN_TOP, left: 0, right: 0, alignItems: 'center', gap: 3 }}
      >
        <Text style={{ ...Type.display, fontWeight: '400', fontSize: 56, lineHeight: 67, color: palette.plum }}>{time}</Text>
        <Text style={[Type.bodySMedium, { color: palette.textMuted }]}>{caption}</Text>
      </Pressable>
      <View style={{ position: 'absolute', top: 460 - CHECKIN_TOP, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', gap: 8 }} accessibilityRole="radiogroup">
        {slots.map((s) => (
          <Chip key={s.key} kind="preset" label={s.label} selected={slot === s.key} onPress={() => onPickSlot(s.key)} />
        ))}
      </View>
    </View>
  );
}

/* ── P3 · Stay gently in touch (`6676:3118`) ──────────────────────────────────────── */

/**
 * White card, radius 24, padding 6/16. Rows: 40 bubble lavender @0.25 with a 20 icon, SemiBold 15 ink
 * title, Regular 12 subtle subtitle, and the library toggle with a `#FFF6D6` knob. 1px `#EFEAF2` dividers.
 */
export function NotificationCard({
  rows,
  values,
  onChange,
}: {
  rows: { key: NotificationChoice; icon: IconName; title: string; subtitle: string }[];
  values: Record<NotificationChoice, boolean>;
  onChange: (key: NotificationChoice, value: boolean) => void;
}) {
  return (
    <View style={{ marginTop: 42, backgroundColor: palette.white, borderRadius: 24, paddingVertical: 6, paddingHorizontal: 16 }}>
      {rows.map((row, i) => (
        <View key={row.key}>
          {i > 0 && <View style={{ height: 1, backgroundColor: palette.surfaceLilac }} />}
          <Pressable
            accessibilityRole="switch"
            accessibilityState={{ checked: values[row.key] }}
            accessibilityLabel={`${row.title}, ${row.subtitle}`}
            onPress={() => onChange(row.key, !values[row.key])}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14 }}
          >
            <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(142,127,166,0.25)', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name={row.icon} size={20} />
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={[Type.bodyMSemi, { color: palette.ink }]}>{row.title}</Text>
              <Text style={[Type.captionS, { color: palette.textSubtle }]}>{row.subtitle}</Text>
            </View>
            <View pointerEvents="none">
              <Toggle value={values[row.key]} onValueChange={() => {}} knobColor={palette.cream} />
            </View>
          </Pressable>
        </View>
      ))}
    </View>
  );
}

/* ── P4 · Keep your space private (`6676:3178`) ───────────────────────────────────── */

const PRIVACY_TOP = 205;

export function PrivacyScene() {
  const { width } = useWindowDimensions();
  const sx = width / 375;
  return (
    <View style={{ height: 470 - PRIVACY_TOP, marginHorizontal: -24 }} pointerEvents="none" accessibilityElementsHidden>
      <Glow color={palette.lavenderSoft} opacity={0.25} width={240} blur={50} style={{ position: 'absolute', left: 67.5 * sx, top: 240 - PRIVACY_TOP }} />
      <Glow color={palette.mustard} opacity={0.28} width={150} blur={40} style={{ position: 'absolute', left: 142.5 * sx, top: 305 - PRIVACY_TOP }} />
      <PrivateAura width={217.5} height={193.1} style={{ position: 'absolute', left: 179.25 * sx - 108.75, top: 268.1 - PRIVACY_TOP }} />
      <FaceIdGlyph width={64} height={64} style={{ position: 'absolute', left: 187.5 * sx - 32, top: 328 - PRIVACY_TOP }} />
    </View>
  );
}
