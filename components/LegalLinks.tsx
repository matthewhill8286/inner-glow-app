import { View, Text, Pressable } from 'react-native';
import { router } from 'expo-router';

export function LegalLinks({ color = '#8B6B47' }: { color?: string }) {
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
          <Text style={{ color, textDecorationLine: 'underline' }}>
            {policy === 'terms' ? 'Terms of Use' : 'Privacy Policy'}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}
