import React from 'react';
import { View, Text, Pressable, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Linking from 'expo-linking';
import { router } from 'expo-router';

export default function Resources() {
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1, padding: 24, backgroundColor: '#f6f4f2', paddingTop: insets.top + 6 }}>
      <View
        style={{
          marginTop: 14,
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Text style={{ fontSize: 24, fontWeight: '900' }}>Get support now</Text>
        <Pressable
          onPress={() => router.back()}
          style={{ padding: 10, borderRadius: 14, backgroundColor: '#eee' }}
        >
          <Text style={{ fontWeight: '900' }}>Back</Text>
        </Pressable>
      </View>

      <Text style={{ marginTop: 12, opacity: 0.8 }}>
        If you feel at risk of harming yourself or someone else, seek immediate help.
      </Text>

      <Pressable
        onPress={() =>
          Linking.openURL(
            Platform.select({ ios: 'tel:988', android: 'tel:988', default: 'tel:988' }),
          )
        }
        style={{ marginTop: 16, padding: 14, borderRadius: 18, backgroundColor: 'white' }}
      >
        <Text style={{ fontSize: 16, fontWeight: '900' }}>Call 988 (US & Canada)</Text>
        <Text style={{ opacity: 0.7, marginTop: 4 }}>Suicide & Crisis Lifeline</Text>
      </Pressable>

      <Pressable
        onPress={() => Linking.openURL('https://findahelpline.com')}
        style={{ marginTop: 12, padding: 14, borderRadius: 18, backgroundColor: 'white' }}
      >
        <Text style={{ fontSize: 16, fontWeight: '900' }}>Find a helpline (global)</Text>
        <Text style={{ opacity: 0.7, marginTop: 4 }}>Directory by country</Text>
      </Pressable>
    </View>
  );
}
