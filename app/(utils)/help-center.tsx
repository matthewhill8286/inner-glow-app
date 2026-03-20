import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';

export default function Screen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.page, { paddingTop: insets.top + 6 }]}>
      <Text style={styles.h1}>Help Center</Text>
      <Text style={styles.sub}>FAQs, contact, policies (placeholder).</Text>

      <View style={{ marginTop: 16, gap: 10 }}>
        <Pressable onPress={() => router.push('/(tabs)/profile')} style={styles.link}>
          <Text style={styles.linkText}>Back to Profile</Text>
        </Pressable>
        <Pressable onPress={() => router.push('/resources')} style={styles.link}>
          <Text style={styles.linkText}>Resources</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles: any = {
  page: { flex: 1, backgroundColor: '#f6f4f2', padding: 24 },
  h1: { fontSize: 26, fontWeight: '900' },
  sub: { opacity: 0.7, marginTop: 8 },
  link: { backgroundColor: 'white', padding: 14, borderRadius: 18 },
  linkText: { fontWeight: '900' },
};
