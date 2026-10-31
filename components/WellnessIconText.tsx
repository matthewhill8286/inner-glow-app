import { Typography } from '@/constants/typography';
import React, { forwardRef } from 'react';
import { Animated, StyleSheet, Text, type TextProps } from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

type IconName = React.ComponentProps<typeof Feather>['name'];

/** Keeps stored mood/avatar values compatible while presenting one outline icon family. */
export const WELLNESS_SYMBOLS: Record<string, IconName> = {
  '🌸': 'feather',
  '🎨': 'edit-3',
  '🔐': 'shield',
  '🛡️': 'shield',
  '🔑': 'key',
  '😊': 'sunrise',
  '🙂': 'sunrise',
  '😄': 'sun',
  '😁': 'sun',
  '🤩': 'sun',
  '😌': 'wind',
  '😐': 'minus-circle',
  '😶': 'minus-circle',
  '😕': 'cloud',
  '😟': 'cloud',
  '😰': 'cloud',
  '😔': 'cloud',
  '😞': 'cloud',
  '😢': 'cloud-rain',
  '😭': 'cloud-rain',
  '😫': 'cloud-drizzle',
  '😤': 'activity',
  '😡': 'activity',
  '🤯': 'activity',
  '🥰': 'heart',
  '😴': 'moon',
  '🧘': 'wind',
  '🧠': 'compass',
  '📅': 'calendar',
  '📝': 'edit-3',
  '🌱': 'feather',
  '🌿': 'feather',
  '🌟': 'compass',
  '⭐': 'star',
  '★': 'star',
  '✨': 'compass',
  '👩': 'user',
  '👨': 'user',
  '🧑': 'user',
  '🤐': 'minus-circle',
  '🤖': 'compass',
  '💭': 'message-circle',
  '👋': 'user-plus',
  '🧑‍⚕️': 'compass',
  '👩‍⚕️': 'compass',
  '🎯': 'target',
  '💪': 'trending-up',
  '💞': 'heart',
  '💕': 'heart',
  '☀️': 'sun',
  '🎓': 'briefcase',
  '⚡': 'activity',
  '⚙️': 'settings',
  '🤲': 'heart',
  '🌊': 'wind',
  '🌙': 'moon',
  '🛏️': 'moon',
  '🎭': 'users',
  '💡': 'sun',
  '🌈': 'sun',
  '🌬️': 'wind',
  '💙': 'heart',
  '💚': 'heart',
  '💜': 'heart',
  '💛': 'heart',
  '❤️': 'heart',
  '🔥': 'trending-up',
  '⚖️': 'sliders',
  '💬': 'message-circle',
  '🤝': 'users',
  '🪞': 'user',
  '🕊️': 'feather',
  '💐': 'feather',
  '🌅': 'sunrise',
  '🌋': 'activity',
  '🧊': 'box',
  '🔔': 'bell',
  '🔕': 'bell-off',
  '🚀': 'arrow-up-right',
  '📋': 'clipboard',
  '🔒': 'lock',
  '🎙️': 'mic',
  '🎬': 'film',
  '🔗': 'link',
  '🎉': 'check-circle',
  '🗑️': 'trash-2',
  '🏃': 'activity',
  '🩺': 'plus-circle',
  '⏱': 'clock',
  '🎵': 'music',
  '🏋️': 'activity',
  '🏊': 'activity',
  '📱': 'smartphone',
  '📞': 'phone',
  '🔽': 'chevron-down',
  '📊': 'bar-chart-2',
  '⬆': 'trending-up',
  '🔍': 'search',
  '🔮': 'sun',
  '📖': 'book-open',
  '📈': 'trending-up',
  '📉': 'trending-down',
  '📩': 'mail',
  '📂': 'folder',
  '🌐': 'globe',
  '🔧': 'sliders',
  '👑': 'award',
  '⏰': 'clock',
  '👁️': 'eye',
  '👂': 'headphones',
  '👃': 'wind',
  '👅': 'coffee',
  '▶️': 'play',
  '🔄': 'refresh-cw',
  '🕐': 'clock',
  '🛟': 'life-buoy',
  '🧰': 'briefcase',
  '⚠️': 'alert-circle',
  '☑': 'check-square',
  '✅': 'check-circle',
  '🧖': 'feather',
  '💆': 'feather',
  '🧑‍🎨': 'user',
  '👩‍🦱': 'user',
  '👤': 'user',
  '📢': 'volume-2',
  '🇬🇧': 'globe',
  '🇬🇷': 'globe',
};

const escapePattern = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const symbolPattern = new RegExp(
  `(${Object.keys(WELLNESS_SYMBOLS)
    .sort((a, b) => b.length - a.length)
    .map(escapePattern)
    .join('|')})`,
  'g',
);

/** Used only for application-owned decoration, never for journal or chat message content. */
export const WellnessIconText = forwardRef<Text, TextProps>(function WellnessIconText(
  { children, style, ...props },
  ref,
) {
  const theme = useColorScheme() ?? 'light';
  const flat = StyleSheet.flatten(style);
  const size = flat?.fontSize ?? 20;
  const color = typeof flat?.color === 'string' ? flat.color : Colors[theme].primary;
  const renderChild = (child: React.ReactNode): React.ReactNode => {
    if (typeof child !== 'string') return child;
    return child.split(symbolPattern).map((part, index) => {
      const name = WELLNESS_SYMBOLS[part];
      return name ? (
        <Feather
          key={`${index}-${name}`}
          name={name}
          size={size}
          color={color}
          style={{
            fontFamily: Typography.family.body,
            fontWeight: Typography.weight.regular,
            fontStyle: 'normal',
          }}
          accessible={false}
        />
      ) : (
        part
      );
    });
  };
  return (
    <Text ref={ref} {...props} style={style}>
      {React.Children.map(children, renderChild)}
    </Text>
  );
});

export const AnimatedWellnessIconText = Animated.createAnimatedComponent(WellnessIconText);
