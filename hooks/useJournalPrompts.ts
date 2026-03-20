import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/supabase/supabase';
import { useUser } from './useUser';

export const useJournalPrompts = () => {
  const { data: user } = useUser();

  const journalPromptQuery = useQuery({
    queryKey: ['prompts', user?.id],
    enabled: !!user,
    queryFn: async () => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('journal_prompts')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;

      return data;
    },
  });

  return {
    journalPrompt: journalPromptQuery.data || {},
    isLoading: journalPromptQuery.isLoading,
    isError: journalPromptQuery.isError,
    error: journalPromptQuery.error,
  };
};
