import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, UI } from '@/constants/theme';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

export default function PaymentFailure() {
  const insets = useSafeAreaInsets();
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.iconCircle}>
          <MaterialIcons name="close" size={44} color="#FFF" />
        </View>

        <Text style={[styles.title, { color: colors.text }]}>Payment Failed</Text>
        <Text style={[styles.message, { color: colors.mutedText }]}>
          We couldn't process your payment. Please check your card details and try again.
        </Text>

        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [
            styles.retryButton,
            { transform: [{ scale: pressed ? 0.97 : 1 }] },
          ]}
        >
          <MaterialIcons name="refresh" size={18} color="#FFF" />
          <Text style={styles.retryButtonText}>Try Again</Text>
        </Pressable>

        <Pressable
          onPress={() => router.replace('/(tabs)/home')}
          style={({ pressed }) => [
            styles.cancelButton,
            { opacity: pressed ? 0.6 : 1 },
          ]}
        >
          <Text style={[styles.cancelButtonText, { color: colors.mutedText }]}>Cancel</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    ...UI.shadow.md,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#C45B5B',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    ...UI.shadow.sm,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 12,
  },
  message: {
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 28,
    lineHeight: 22,
    paddingHorizontal: 8,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#8B6B47',
    paddingVertical: 16,
    borderRadius: 16,
    width: '100%',
    ...UI.shadow.sm,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: '900',
    fontSize: 16,
  },
  cancelButton: {
    paddingVertical: 14,
  },
  cancelButtonText: {
    fontWeight: '700',
    fontSize: 15,
  },
});
