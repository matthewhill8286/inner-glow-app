import { View, Text, Pressable } from 'react-native';
import { router } from 'expo-router';
import { palette } from '@/constants/theme';
import { Type } from '@/constants/typography';

export function LegalLinks({ color = palette.lavender }: { color?: string }) {
  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 20,
        marginVertical: 16,
        flexWrap: 'wrap',
      }}
    >
      {(['terms', 'privacy'] as const).map((policy) => (
        <Pressable
          key={policy}
          accessibilityRole="link"
          onPress={() => router.push({ pathname: '/(utils)/legal', params: { policy } })}
        >
          <Text style={[Type.label, { fontWeight: '700', color, textDecorationLine: 'underline' }]}>
            {policy === 'terms' ? 'Terms of Use' : 'Privacy Policy'}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}
