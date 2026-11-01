import React from 'react';
import { Linking, Pressable, Share, Text, View } from 'react-native';
import { getLocales } from 'expo-localization';
import { useTranslation } from 'react-i18next';
import { palette } from '@/constants/theme';
import { Type } from '@/constants/typography';
import { Icon } from '@/components/icons/Icon';
import { Glow } from '@/components/glow/Glow';
import { AppButton } from '@/components/ui/AppButton';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { emergencyNumber } from '@/lib/talks';

/**
 * Support in chat (05 §3.7): the crisis sheet over the conversation, opened when the chat function
 * flags a high risk. Calls the region's emergency number. There is no trusted-contact feature, so
 * "Message someone I trust" opens the share sheet with a short message to send.
 */
export function CrisisSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { t } = useTranslation();
  const number = emergencyNumber(getLocales()[0]?.regionCode);

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      overlayOpacity={0.55}
      radius={36}
      background={palette.bg}
      gap={0}
      closeLabel={t('glowAi.crisis.okay')}
      style={{ overflow: 'hidden' }}
    >
      <Glow
        color={palette.mustard}
        opacity={0.35}
        width={260}
        blur={60}
        style={{ position: 'absolute', left: 57.5, top: -90 }}
      />
      <Icon name="line/heart" size={30} style={{ marginTop: 24 }} />
      <Text
        accessibilityRole="header"
        style={[
          Type.titleMd,
          { fontSize: 22, lineHeight: 31, color: palette.ink, textAlign: 'center', marginTop: 14 },
        ]}
      >
        {t('glowAi.crisis.title')}
      </Text>
      <Text
        style={[
          Type.bodySm,
          { color: palette.textMuted, textAlign: 'center', marginTop: 12, paddingHorizontal: 8 },
        ]}
      >
        {t('glowAi.crisis.body')}
      </Text>
      <View style={{ alignSelf: 'stretch', gap: 10, marginTop: 24 }}>
        <AppButton
          title={t('glowAi.crisis.call')}
          accessibilityLabel={t('glowAi.crisis.callLabel', { number })}
          onPress={() => void Linking.openURL(`tel:${number}`)}
        />
        <AppButton
          title={t('glowAi.crisis.trust')}
          variant="outline"
          onPress={() => void Share.share({ message: t('glowAi.crisis.trustMessage') })}
        />
      </View>
      <Pressable
        accessibilityRole="button"
        onPress={onClose}
        hitSlop={10}
        style={{ marginTop: 18 }}
      >
        <Text
          style={[
            Type.bodySm,
            { fontFamily: Type.bodyMMedium.fontFamily, color: palette.textSubtle },
          ]}
        >
          {t('glowAi.crisis.okay')}
        </Text>
      </Pressable>
    </BottomSheet>
  );
}
