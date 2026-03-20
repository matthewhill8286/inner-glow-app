import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authTokenVar } from '@/lib/state';

export default function UpgradeRequired() {
  const insets = useSafeAreaInsets();

  async function signOut() {
    await AsyncStorage.removeItem('auth:session:v1');
    authTokenVar(null);
    router.replace('/(auth)/sign-in');
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#6f6660', padding: 24, justifyContent: 'center', paddingTop: insets.top + 6 }}>
      <View
        style={{ backgroundColor: 'white', borderRadius: 28, padding: 26, alignItems: 'center' }}
      >
        <Text style={{ fontSize: 24, fontWeight: '900', color: '#6a5e55', textAlign: 'center' }}>
          Trial Expired
        </Text>
        <Text style={{ opacity: 0.7, marginTop: 12, textAlign: 'center', lineHeight: 22 }}>
          Your 7-day free trial has come to an end. To continue using InnerGlow and access your data,
          please upgrade to lifetime access.
        </Text>

        <Pressable
          onPress={() => router.replace('/(utils)/trial-upgrade')}
          style={{
            marginTop: 30,
            backgroundColor: '#828a6a',
            paddingVertical: 16,
            paddingHorizontal: 32,
            borderRadius: 18,
            width: '100%',
            alignItems: 'center',
          }}
        >
          <Text style={{ color: 'white', fontWeight: '900', fontSize: 16 }}>Upgrade Now</Text>
        </Pressable>

        <Pressable onPress={() => router.replace('/(tabs)/home')} style={{ marginTop: 16 }}>
          <Text style={{ color: '#6a5e55', fontWeight: '800', opacity: 0.8 }}>
            Continue with limited features
          </Text>
        </Pressable>

        <Pressable onPress={signOut} style={{ marginTop: 20 }}>
          <Text style={{ color: '#6a5e55', fontWeight: '800', opacity: 0.6 }}>Sign out</Text>
        </Pressable>
      </View>
    </View>
  );
}
