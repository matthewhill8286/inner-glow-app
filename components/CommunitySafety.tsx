import { Typography } from '@/constants/typography';
import { Pressable, Text } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { supabase } from '@/supabase/supabase';
import { useUser } from '@/hooks/useUser';
import { showAlert } from '@/lib/state';
import { toast } from '@/components/Toast';

export function CommunitySafety({
  authorId,
  targetId,
  targetType,
  onBlocked,
}: {
  authorId: string;
  targetId?: string;
  targetType?: 'post' | 'comment';
  onBlocked?: () => void;
}) {
  const { data: user } = useUser();
  const queryClient = useQueryClient();
  if (!user || authorId === user.id) return null;
  async function invalidate() {
    await Promise.all(
      ['communityFeed', 'communityPost', 'communityProfile', 'communityNotifs', 'blockedUsers'].map(
        (key) => queryClient.invalidateQueries({ queryKey: [key] }),
      ),
    );
  }
  async function report(reason: 'harassment' | 'harmful' | 'spam' | 'other') {
    if (!targetId || !targetType) return;
    const { error } = await supabase.rpc('report_community_content', {
      p_target_type: targetType,
      p_target_id: targetId,
      p_reason: reason,
    });
    if (error) {
      toast.error('Unable to send report. Please retry.');
      return;
    }
    toast.success('Report sent for review. This content is hidden from you.');
    await invalidate();
  }
  async function block() {
    if (!user) return;
    const { error } = await supabase
      .from('community_blocks')
      .upsert({ blocker_id: user.id, blocked_id: authorId });
    if (error) {
      toast.error('Unable to block user. Please retry.');
      return;
    }
    toast.success('User blocked');
    onBlocked?.();
    await invalidate();
  }
  return (
    <Pressable
      accessibilityLabel="Report content or block user"
      onPress={() =>
        showAlert('Community safety', 'Choose an action.', [
          ...(targetId
            ? [
                {
                  text: 'Report',
                  onPress: () =>
                    showAlert('Report content', 'Why are you reporting this content?', [
                      {
                        text: 'Harassment',
                        onPress: () => {
                          void report('harassment');
                        },
                      },
                      {
                        text: 'Harmful',
                        onPress: () => {
                          void report('harmful');
                        },
                      },
                      {
                        text: 'Spam',
                        onPress: () => {
                          void report('spam');
                        },
                      },
                      {
                        text: 'Other',
                        onPress: () => {
                          void report('other');
                        },
                      },
                      { text: 'Cancel', style: 'cancel' },
                    ]),
                },
              ]
            : []),
          {
            text: 'Block User',
            style: 'destructive',
            onPress: () =>
              showAlert(
                'Block this user?',
                'Their posts and comments will be hidden. You can unblock them in Profile.',
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Block',
                    style: 'destructive',
                    onPress: () => {
                      void block();
                    },
                  },
                ],
              ),
          },
          {
            text: 'Guidelines',
            onPress: () =>
              router.push({ pathname: '/(utils)/legal', params: { policy: 'community' } }),
          },
          { text: 'Cancel', style: 'cancel' },
        ])
      }
      style={{ padding: 10 }}
    >
      <Text
        style={{
          fontFamily: Typography.family.body,
          color: '#8B6B47',
          fontWeight: Typography.weight.semibold,
        }}
      >
        •••
      </Text>
    </Pressable>
  );
}
