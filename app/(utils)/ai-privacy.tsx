import { Typography } from '@/constants/typography';
import { backTo } from '@/lib/navigation';
import { useEffect, useState } from 'react';
import { ScrollView, Text, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useUser } from '@/hooks/useUser';
import { aiPermission, requestAIPermission, setAIPermission } from '@/lib/ai-privacy';
import { Colors, UI } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { LegalLinks } from '@/components/LegalLinks';

export default function AIPrivacy() {
  const { data: user } = useUser();
  const [allowed, setAllowed] = useState(false);
  const queryClient = useQueryClient();
  const colors = Colors[useColorScheme() ?? 'light'];
  const insets = useSafeAreaInsets();
  useEffect(() => {
    if (user) void aiPermission(user.id).then((value) => setAllowed(value === 'allowed'));
  }, [user]);
  async function toggle() {
    if (!user) return;
    if (allowed) {
      await setAIPermission(user.id, false);
      setAllowed(false);
    } else setAllowed(await requestAIPermission(user.id, true));
    queryClient.removeQueries({ queryKey: ['moodInsights'] });
    queryClient.removeQueries({ queryKey: ['sleepInsights'] });
  }
  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={{ padding: 24, paddingTop: insets.top + 16, gap: 24 }}
    >
      <Pressable onPress={() => backTo(undefined, '/(tabs)/profile')}>
        <Text style={{ color: colors.text }}>← Back</Text>
      </Pressable>
      <Text style={{ ...Typography.heading, color: colors.text, fontSize: 24 }}>
        AI Data Permission
      </Text>
      <Text style={{ color: colors.text, lineHeight: 24 }}>
        AI features send the relevant information you provide through Supabase to OpenAI. This may
        include personal health details in chat messages, mood and sleep entries, wellness context
        and voice recordings you choose to transcribe.
      </Text>
      <Text style={{ color: colors.text }}>
        AI processing is currently {allowed ? 'allowed' : 'disabled'}.
      </Text>
      <Pressable
        onPress={toggle}
        disabled={!user}
        style={{ padding: 18, borderRadius: 12, backgroundColor: colors.tint }}
      >
        <Text style={{ color: '#FFF', textAlign: 'center' }}>
          {allowed ? 'Withdraw AI Permission' : 'Review and Allow AI Processing'}
        </Text>
      </Pressable>
      <Text style={{ color: colors.mutedText }}>
        Withdrawing permission stops new AI requests. Existing saved entries and conversations
        remain until you delete them or delete your account. Community publishing uses separate
        content screening disclosed when you publish.
      </Text>
      <LegalLinks color={colors.mutedText} />
    </ScrollView>
  );
}
