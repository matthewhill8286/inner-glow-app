import { Typography } from '@/constants/typography';
import { backTo } from '@/lib/navigation';
import * as FileSystem from 'expo-file-system/legacy';
import { useState } from 'react';
import {
  ScrollView,
  Text,
  TextInput,
  Pressable,
  Linking,
  ActivityIndicator,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, UI } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { supabase } from '@/supabase/supabase';
import { resetSubscription } from '@/hooks/useSubscription';
import { authTokenVar, showAlert } from '@/lib/state';
import { toast } from '@/components/Toast';

export default function DeleteAccount() {
  const [confirmation, setConfirmation] = useState('');
  const [busy, setBusy] = useState(false);
  const queryClient = useQueryClient();
  const colors = Colors[useColorScheme() ?? 'light'];
  const insets = useSafeAreaInsets();
  async function removeAccount() {
    setBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke('delete-account', {
        body: { confirmation: 'DELETE' },
      });
      if (error || !data?.deleted)
        throw new Error('Account deletion failed. Please retry or contact support.');
      await supabase.auth.signOut({ scope: 'local' });
      await AsyncStorage.clear();
      if (Platform.OS !== 'web' && FileSystem.cacheDirectory) {
        const files = await FileSystem.readDirectoryAsync(FileSystem.cacheDirectory).catch(
          () => [],
        );
        for (const name of files.filter((name) =>
          /^recording-.*\.(m4a|caf|wav|mp4|webm)$/i.test(name),
        )) {
          await FileSystem.deleteAsync(`${FileSystem.cacheDirectory}${name}`, { idempotent: true });
        }
      }
      resetSubscription();
      queryClient.clear();
      authTokenVar(null);
      router.replace('/(auth)/sign-in');
      toast.success('Your account and app data have been deleted.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Unable to delete account');
    } finally {
      setBusy(false);
    }
  }
  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={{ padding: 24, paddingTop: insets.top + 16, gap: 20 }}
    >
      <Pressable disabled={busy} onPress={() => backTo(undefined, '/(tabs)/profile')}>
        <Text style={{ color: colors.text }}>← Back</Text>
      </Pressable>
      <Text style={{ ...Typography.heading, color: colors.text, fontSize: 24 }}>
        Delete Account
      </Text>
      <Text style={{ color: colors.text, lineHeight: 24 }}>
        This permanently deletes your account, profile, wellness logs, journal entries, chat
        history, community posts and comments. This cannot be undone.
      </Text>
      <Text style={{ color: colors.text, lineHeight: 24 }}>
        Deleting your account does not cancel a paid subscription. Cancel it with your payment
        provider before deleting your account to prevent further charges.
      </Text>
      {Platform.OS === 'ios' && (
        <Pressable onPress={() => Linking.openURL('https://apps.apple.com/account/subscriptions')}>
          <Text style={{ color: colors.tint }}>Manage Apple subscriptions</Text>
        </Pressable>
      )}
      <Text style={{ color: colors.text }}>Type DELETE to confirm.</Text>
      <TextInput
        value={confirmation}
        onChangeText={setConfirmation}
        autoCapitalize="characters"
        autoCorrect={false}
        editable={!busy}
        accessibilityLabel="Type DELETE to confirm account deletion"
        style={{
          color: colors.text,
          padding: 16,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 12,
        }}
      />
      <Pressable
        disabled={busy || confirmation !== 'DELETE'}
        onPress={() =>
          showAlert(
            'Permanently delete your account?',
            'Your account and associated app data will be deleted.',
            [
              { text: 'Keep Account', style: 'cancel' },
              {
                text: 'Delete Account',
                style: 'destructive',
                onPress: () => {
                  void removeAccount();
                },
              },
            ],
          )
        }
        style={{
          backgroundColor: '#C45B5B',
          padding: 18,
          borderRadius: 12,
          opacity: busy || confirmation !== 'DELETE' ? 0.5 : 1,
        }}
      >
        {busy ? (
          <ActivityIndicator color="#FFF" />
        ) : (
          <Text
            style={{
              fontFamily: Typography.family.body,
              color: '#FFF',
              textAlign: 'center',
              fontWeight: Typography.weight.semibold,
            }}
          >
            Permanently Delete Account
          </Text>
        )}
      </Pressable>
    </ScrollView>
  );
}
