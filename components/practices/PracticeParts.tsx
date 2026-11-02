import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Modal, Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import Svg, { Circle } from 'react-native-svg';
import { palette } from '@/constants/theme';
import { Type } from '@/constants/typography';
import { Icon } from '@/components/icons/Icon';
import { Glow } from '@/components/glow/Glow';
import { AppButton } from '@/components/ui/AppButton';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { ListGroup, ListRow } from '@/components/ui/ListRow';
import { CATEGORY_LOOK, SOUND_CHOICES, type Practice, type SoundKey } from '@/data/practices';
import { useAccessibilityPrefs } from '@/lib/accessibility-prefs';

/** Title and "N min · Tag" for a practice, from `practices.items`. */
export function usePracticeText() {
  const { t } = useTranslation();
  return (p: Practice) => ({
    title: t(`practices.items.${p.id}.title`),
    tag: t(`practices.items.${p.id}.tag`),
    level: t(`practices.items.${p.id}.level`),
    description: t(`practices.items.${p.id}.description`),
    meta: t('practices.meta', { minutes: p.listMinutes, tag: t(`practices.items.${p.id}.tag`) }),
  });
}

/** Practice row (07 §2.2): 72 high, white r24, a 44 tinted bubble, SemiBold 15 title, meta and a chevron. */
export function PracticeRow({ practice, onPress }: { practice: Practice; onPress: () => void }) {
  const text = usePracticeText()(practice);
  const look = CATEGORY_LOOK[practice.category];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${text.title}, ${text.meta}`}
      onPress={onPress}
      style={({ pressed }) => ({
        minHeight: 72,
        borderRadius: 24,
        backgroundColor: pressed ? palette.surfaceLilacSoft : palette.white,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        gap: 12,
      })}
    >
      <View
        style={{
          width: 44,
          height: 44,
          borderRadius: 22,
          backgroundColor: look.tint,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon name={look.icon} size={22} />
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={[Type.bodyMSemi, { lineHeight: 21, color: palette.plumDeep }]}>
          {text.title}
        </Text>
        <Text style={[Type.captionS, { color: palette.textMuted }]}>{text.meta}</Text>
      </View>
      <Icon name="arrow/chevron-right" size={20} />
    </Pressable>
  );
}

/** Favourite row (10 §3.6): 48 square tinted thumb, Medium 15 title, meta, and a filled heart that removes it. */
export function FavouriteRow({
  practice,
  onPress,
  onRemove,
}: {
  practice: Practice;
  onPress: () => void;
  onRemove: () => void;
}) {
  const { t } = useTranslation();
  const text = usePracticeText()(practice);
  const look = CATEGORY_LOOK[practice.category];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${text.title}, ${text.meta}`}
      onPress={onPress}
      style={({ pressed }) => ({
        minHeight: 72,
        borderRadius: 20,
        backgroundColor: pressed ? palette.surfaceLilacSoft : palette.white,
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingLeft: 12,
        paddingRight: 16,
        gap: 12,
      })}
    >
      <View
        style={{
          width: 48,
          height: 48,
          borderRadius: 14,
          backgroundColor: look.thumb,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon name={look.icon} size={22} />
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={[Type.bodyMMedium, { color: palette.ink }]}>{text.title}</Text>
        <Text style={[Type.captionS, { color: palette.textMuted }]}>{text.meta}</Text>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('practices.favourites.remove', { title: text.title })}
        onPress={onRemove}
        hitSlop={12}
      >
        <Icon name="line/heart-filled" size={20} color={palette.plum} />
      </Pressable>
    </Pressable>
  );
}

/** Option pills (07 §2.6, 10 §2): h 30, lavender outline; selected filled lavender with white SemiBold. */
export function OptionPills<T extends string | number>({
  options,
  value,
  onChange,
  label,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  label: string;
}) {
  return (
    <View
      accessibilityRole="radiogroup"
      accessibilityLabel={label}
      style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}
    >
      {options.map((o) => {
        const on = o.value === value;
        return (
          <Pressable
            key={String(o.value)}
            accessibilityRole="radio"
            accessibilityState={{ selected: on }}
            onPress={() => onChange(o.value)}
            style={{
              height: 30,
              borderRadius: 999,
              paddingHorizontal: 12,
              justifyContent: 'center',
              borderWidth: 1,
              borderColor: palette.lavender,
              backgroundColor: on ? palette.lavender : 'transparent',
            }}
          >
            <Text
              style={[
                on ? Type.chipSelected : Type.chip,
                { fontSize: 13, color: on ? palette.white : palette.lavender },
              ]}
            >
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Confirmation toast (10 §2): a dark pill with a white icon, shown for 2 s. */
export function DarkToast({
  text,
  visible,
  bottom,
}: {
  text: string;
  visible: boolean;
  bottom: number;
}) {
  const opacity = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(opacity, {
      toValue: visible ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [visible, opacity]);
  return (
    <Animated.View
      pointerEvents="none"
      accessibilityLiveRegion="polite"
      style={{
        position: 'absolute',
        alignSelf: 'center',
        bottom,
        opacity,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        backgroundColor: palette.ink,
        borderRadius: 999,
        paddingVertical: 12,
        paddingHorizontal: 16,
      }}
    >
      <Icon name="line/heart" size={16} color={palette.white} />
      <Text
        style={[Type.bodySm, { fontFamily: Type.bodyMMedium.fontFamily, color: palette.white }]}
      >
        {text}
      </Text>
    </Animated.View>
  );
}

const ORB = 236;

/**
 * Breathing orb (07 §2.7, 10 §3.9–3.10): ring, halo, body, inner light and core. The ring, halo and
 * body scale between 0.8 (out) and 1.0 (in); the light and core stay fixed. Hold adds a slowly turning
 * dashed ring. Paused uses the flat lilac look from the End early frame (07 §2.8).
 */
export function BreathingOrb({
  scale,
  hold,
  paused,
}: {
  scale: Animated.Value | Animated.AnimatedInterpolation<number>;
  hold: boolean;
  paused: boolean;
}) {
  const reduceMotion = useAccessibilityPrefs((s) => s.reduceMotion);
  const spin = useRef(new Animated.Value(0)).current;
  const holdOpacity = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(holdOpacity, {
      toValue: hold ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
    if (!hold || reduceMotion || paused) return;
    const loop = Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 8000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [hold, reduceMotion, paused, spin, holdOpacity]);
  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <View
      style={{ width: 270, height: 270, alignItems: 'center', justifyContent: 'center' }}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Animated.View
        style={{ position: 'absolute', opacity: holdOpacity, transform: [{ rotate }] }}
      >
        <Svg width={270} height={270}>
          <Circle
            cx={135}
            cy={135}
            r={134}
            stroke={palette.plum}
            strokeOpacity={0.35}
            strokeWidth={1.5}
            strokeDasharray="4 6"
            fill="none"
          />
        </Svg>
      </Animated.View>
      <Animated.View
        style={{
          width: ORB,
          height: ORB,
          alignItems: 'center',
          justifyContent: 'center',
          transform: [{ scale }],
        }}
      >
        {paused ? (
          <Svg width={ORB} height={ORB} style={{ position: 'absolute' }}>
            <Circle cx={118} cy={118} r={118} fill="#EEE8F3" />
            <Circle cx={118} cy={118} r={86} fill="#DDD3E8" />
            <Circle cx={118} cy={118} r={55} fill={palette.lavender} />
          </Svg>
        ) : (
          <>
            <Svg width={ORB} height={ORB} style={{ position: 'absolute' }}>
              <Circle
                cx={118}
                cy={118}
                r={117.5}
                stroke={palette.plum}
                strokeWidth={1}
                fill="none"
              />
            </Svg>
            <Glow
              color={palette.lavenderSoft}
              opacity={0.25}
              width={172}
              blur={30}
              style={{ position: 'absolute' }}
            />
            <Glow
              color={palette.mustard}
              opacity={1}
              width={110}
              blur={18}
              style={{ position: 'absolute' }}
            />
          </>
        )}
      </Animated.View>
      {paused ? (
        <View
          style={{
            position: 'absolute',
            width: 48,
            height: 48,
            borderRadius: 24,
            backgroundColor: palette.lavender,
          }}
        />
      ) : (
        <>
          <Glow
            color={palette.cream}
            opacity={1}
            width={49.5}
            blur={8}
            style={{ position: 'absolute' }}
          />
          <View
            style={{
              position: 'absolute',
              width: 48,
              height: 48,
              borderRadius: 24,
              backgroundColor: palette.mustard,
            }}
          />
        </>
      )}
    </View>
  );
}

/** Choose a sound (10 §3.4): radio rows for the category's bundled sounds, then Done. */
export function SoundSheet({
  visible,
  category,
  value,
  onDone,
  onClose,
}: {
  visible: boolean;
  category: 'breathing' | 'mindfulness' | 'sleep';
  value: SoundKey;
  onDone: (key: SoundKey) => void;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const [chosen, setChosen] = React.useState<SoundKey>(value);
  useEffect(() => {
    if (visible) setChosen(value);
  }, [visible, value]);
  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      background={palette.bg}
      gap={20}
      closeLabel={t('common.close')}
    >
      <Text
        accessibilityRole="header"
        style={[Type.titleSm, { fontSize: 20, lineHeight: 28, color: palette.ink }]}
      >
        {t('practices.sounds.title')}
      </Text>
      <ListGroup style={{ alignSelf: 'stretch' }}>
        {SOUND_CHOICES[category].map((s) => (
          <ListRow
            key={s.key}
            icon={s.icon}
            label={t(`practices.sounds.${s.key}.name`)}
            supportingText={t(`practices.sounds.${s.key}.body`)}
            trailing="radio"
            selected={chosen === s.key}
            onPress={() => setChosen(s.key)}
          />
        ))}
      </ListGroup>
      <AppButton
        title={t('practices.sounds.done')}
        onPress={() => onDone(chosen)}
        style={{ alignSelf: 'stretch' }}
      />
    </BottomSheet>
  );
}

/** End practice early? (07 §2.8, new sheet style per 10 §3.8). */
export function EndEarlySheet({
  visible,
  elapsed,
  totalMinutes,
  onKeep,
  onEnd,
}: {
  visible: boolean;
  elapsed: number;
  totalMinutes: number;
  onKeep: () => void;
  onEnd: () => void;
}) {
  const { t } = useTranslation();
  const total = t('practices.minutes', { count: totalMinutes });
  const body =
    elapsed < 60
      ? t('practices.endEarly.bodySeconds', { count: Math.floor(elapsed), total })
      : t('practices.endEarly.bodyMinutes', { count: Math.floor(elapsed / 60), total });
  return (
    <BottomSheet
      visible={visible}
      onClose={onKeep}
      background={palette.bg}
      gap={12}
      closeLabel={t('practices.endEarly.keep')}
    >
      <Text
        accessibilityRole="header"
        style={[
          Type.titleMd,
          {
            fontSize: 22,
            lineHeight: 30,
            color: palette.plumDeep,
            alignSelf: 'stretch',
            marginTop: 8,
          },
        ]}
      >
        {t('practices.endEarly.title')}
      </Text>
      <Text style={[Type.bodySm, { color: palette.textMuted, alignSelf: 'stretch' }]}>{body}</Text>
      <View style={{ alignSelf: 'stretch', gap: 10, marginTop: 12 }}>
        <AppButton title={t('practices.endEarly.keep')} onPress={onKeep} />
        <AppButton title={t('practices.endEarly.end')} variant="outline" onPress={onEnd} />
      </View>
    </BottomSheet>
  );
}

/** Complete modal (07 §2.9, values from 10 §3.10): title, subtitle, Back to Mindful Hours, Reflect with Glow AI. */
export function CompleteModal({
  visible,
  title,
  body,
  onBack,
  onReflect,
}: {
  visible: boolean;
  title: string;
  body: string;
  onBack: () => void;
  onReflect: () => void;
}) {
  const { t } = useTranslation();
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onBack}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: 'rgba(36,26,46,0.55)',
          justifyContent: 'center',
          paddingHorizontal: 18,
        }}
      >
        <View
          accessibilityViewIsModal
          style={{
            backgroundColor: palette.white,
            borderRadius: 40,
            padding: 16,
            paddingTop: 28,
            gap: 12,
          }}
        >
          <Text
            accessibilityRole="header"
            style={[
              Type.titleMd,
              { fontSize: 22, lineHeight: 30, color: palette.plumDeep, textAlign: 'center' },
            ]}
          >
            {title}
          </Text>
          <Text
            style={[
              Type.bodyMMedium,
              { fontSize: 16, lineHeight: 26, color: palette.textMuted, textAlign: 'center' },
            ]}
          >
            {body}
          </Text>
          <View style={{ gap: 8, marginTop: 20 }}>
            <AppButton title={t('practices.complete.back')} onPress={onBack} />
            <AppButton
              title={t('practices.complete.reflect')}
              variant="secondary"
              icon="line/sparkle"
              iconPosition="left"
              onPress={onReflect}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}
