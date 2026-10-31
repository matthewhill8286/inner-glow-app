import { Typography } from '@/constants/typography';
import { backTo } from '@/lib/navigation';
import { ScrollView, Text, Pressable, ActivityIndicator } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '@/supabase/supabase';
import { useUser } from '@/hooks/useUser';
import { Colors, UI } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { toast } from '@/components/Toast';

export default function BlockedUsers() {
  const { data: user } = useUser();
  const queryClient = useQueryClient();
  const colors = Colors[useColorScheme() ?? 'light'];
  const insets = useSafeAreaInsets();
  const query = useQuery({
    queryKey: ['blockedUsers', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('community_blocks')
        .select('blocked_id, created_at')
        .eq('blocker_id', user!.id);
      if (error) throw error;
      return data;
    },
  });
  async function unblock(id: string) {
    const { error } = await supabase
      .from('community_blocks')
      .delete()
      .eq('blocker_id', user!.id)
      .eq('blocked_id', id);
    if (error) {
      toast.error('Unable to unblock user');
      return;
    }
    for (const key of ['blockedUsers', 'communityFeed', 'communityPost', 'communityProfile'])
      void queryClient.invalidateQueries({ queryKey: [key] });
  }
  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={{ padding: 24, paddingTop: insets.top + 16, gap: 20 }}
    >
      <Pressable onPress={() => backTo(undefined, '/(tabs)/profile')}>
        <Text style={{ color: colors.text }}>← Back</Text>
      </Pressable>
      <Text style={{ ...Typography.heading, color: colors.text, fontSize: 24 }}>Blocked Users</Text>
      {query.isLoading && <ActivityIndicator />}
      {query.isError && (
        <Pressable onPress={() => query.refetch()}>
          <Text style={{ color: colors.text }}>Unable to load blocked users. Tap to retry.</Text>
        </Pressable>
      )}
      {query.data?.length === 0 && (
        <Text style={{ color: colors.mutedText }}>You have not blocked anyone.</Text>
      )}
      {query.data?.map((item, index) => (
        <Pressable
          key={item.blocked_id}
          onPress={() => unblock(item.blocked_id)}
          style={{ padding: 16, borderWidth: 1, borderColor: colors.border, borderRadius: 12 }}
        >
          <Text style={{ color: colors.text }}>
            Blocked user {index + 1} · {new Date(item.created_at).toLocaleDateString()}
          </Text>
          <Text style={{ color: colors.tint, marginTop: 8 }}>Unblock</Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}
