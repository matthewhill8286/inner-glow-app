import React from 'react';
import { Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { palette } from '@/constants/theme';
import { Type } from '@/constants/typography';
import { Icon, type IconName } from '@/components/icons/Icon';

/**
 * Dark confirmation pill ("Saved to favourites", frame `6787:6370`, 00-foundations §11.7):
 * `#241A2E` r999, padding 12/16, gap 10, white 16pt icon, Medium 14 white. Centred 16 above the CTA.
 * This is the presentational pill; `components/Toast.tsx` keeps the queued light toasts.
 */
export function Toast({ message, icon, style }: { message: string; icon?: IconName; style?: StyleProp<ViewStyle> }) {
  return (
    <View
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      style={[{ alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, paddingHorizontal: 16, borderRadius: 999, backgroundColor: palette.ink }, style]}
    >
      {icon && <Icon name={icon} size={16} color={palette.white} accent={palette.white} />}
      <Text style={[Type.bodySMedium, { color: palette.white }]}>{message}</Text>
    </View>
  );
}
