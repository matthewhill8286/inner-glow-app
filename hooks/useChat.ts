import { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/supabase/supabase';
import { ChatMessage } from '@/lib/types';
import { useUser } from './useUser';
import { parseChatKey, type ParsedChatKey } from '@/lib/chatKeys';
import { queryKeys, STALE } from '@/lib/queryKeys';

/* ── Types ──────────────────────────────────────────── */

export interface ConversationMeta extends ParsedChatKey {
  messages: ChatMessage[];
  lastMessage: ChatMessage | null;
  updatedAt: number; // epoch ms for sorting
}

export interface ChatStats {
  totalConversations: number;
  totalMessages: number;
}

/* ── Hook ───────────────────────────────────────────── */

export const useChat = () => {
  const queryClient = useQueryClient();
  const { data: user } = useUser();
  const key = queryKeys.chat.list(user?.id);

  /* ── Fetch all chat histories on mount ─────────── */
  const chatHistoryQuery = useQuery({
    queryKey: key,
    enabled: !!user,
    staleTime: STALE.medium,
    queryFn: async () => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('chat_histories')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;

      const allHistory: Record<string, ChatMessage[]> = {};
      for (const row of data || []) {
        allHistory[row.issue_key] = (row.messages as ChatMessage[]) || [];
      }
      return allHistory;
    },
  });

  const history = useMemo(() => chatHistoryQuery.data || {}, [chatHistoryQuery.data]);

  /* ── Derived: parsed conversation list ─────────── */
  const conversations: ConversationMeta[] = useMemo(() => {
    return Object.entries(history)
      .filter(([, msgs]) => msgs.length > 0)
      .map(([k, messages]) => {
        const parsed = parseChatKey(k);
        const lastMessage = messages[messages.length - 1] ?? null;
        return {
          ...parsed,
          messages,
          lastMessage,
          updatedAt: lastMessage?.createdAt ? new Date(lastMessage.createdAt).getTime() : 0,
        };
      })
      .sort((a, b) => b.updatedAt - a.updatedAt);
  }, [history]);

  /* ── Derived: aggregate stats ──────────────────── */
  const stats: ChatStats = useMemo(() => {
    const keys = Object.keys(history);
    return {
      totalConversations: keys.length,
      totalMessages: Object.values(history).reduce((sum, msgs) => sum + msgs.length, 0),
    };
  }, [history]);

  /* ── Persist messages (upsert) ─────────────────── */
  const saveMessagesMutation = useMutation({
    mutationFn: async ({ issueKey, messages }: { issueKey: string; messages: ChatMessage[] }) => {
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase.from('chat_histories').upsert(
        {
          user_id: user.id,
          issue_key: issueKey,
          messages: messages as any,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,issue_key' },
      );

      if (error) throw error;
      return { issueKey, messages };
    },
    // Chat messages are managed locally — just sync the cache after save
    onSuccess: ({ issueKey, messages }) => {
      queryClient.setQueryData(key, (old: Record<string, ChatMessage[]> | undefined) => ({
        ...(old || {}),
        [issueKey]: messages,
      }));
    },
  });

  /* ── Clear a single conversation ───────────────── */
  const clearHistoryMutation = useMutation({
    mutationFn: async (issueKey: string) => {
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('chat_histories')
        .delete()
        .eq('user_id', user.id)
        .eq('issue_key', issueKey);

      if (error) throw error;
      return issueKey;
    },
    onMutate: async (issueKey) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<Record<string, ChatMessage[]>>(key);
      queryClient.setQueryData(key, (old: Record<string, ChatMessage[]> | undefined) => {
        if (!old) return {};
        const next = { ...old };
        delete next[issueKey];
        return next;
      });
      return { previous };
    },
    onError: (_err, _issueKey, context) => {
      if (context?.previous) queryClient.setQueryData(key, context.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: key });
    },
  });

  return {
    /* raw data */
    history,
    conversations,
    stats,

    /* loading / error */
    isLoading: chatHistoryQuery.isLoading,
    isError: chatHistoryQuery.isError,
    error: chatHistoryQuery.error,

    /* mutations */
    saveMessages: (issueKey: string, messages: ChatMessage[]) =>
      saveMessagesMutation.mutateAsync({ issueKey, messages }),
    clearHistory: clearHistoryMutation.mutateAsync,
    isSaving: saveMessagesMutation.isPending,
    isClearing: clearHistoryMutation.isPending,
  };
};
