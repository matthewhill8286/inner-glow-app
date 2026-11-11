import React from 'react';
import { Pressable, Text, type StyleProp, type ViewStyle } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { palette } from '@/constants/theme';
import { Type } from '@/constants/typography';
import { Icon } from '@/components/icons/Icon';
import type { SourceTopic } from '@/lib/feature-sources';

/** "Sources for this information": opens the citations behind the screen's scores or advice. */
export function SourcesLink({
  topic,
  style,
}: {
  topic: SourceTopic;
  style?: StyleProp<ViewStyle>;
}) {
  const { t } = useTranslation();
  return (
    <Pressable
      accessibilityRole="link"
      hitSlop={8}
      onPress={() => router.push({ pathname: '/(utils)/sources', params: { topic } })}
      style={[
        { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start' },
        style,
      ]}
    >
      <Icon name="line/note" size={14} color={palette.plum} />
      <Text
        style={[
          Type.captionM,
          { color: palette.plum, fontWeight: '600', textDecorationLine: 'underline' },
        ]}
      >
        {t('sources.link')}
      </Text>
    </Pressable>
  );
}
