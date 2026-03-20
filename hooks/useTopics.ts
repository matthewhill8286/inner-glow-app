import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/supabase/supabase';

export const useTopics = () => {
  const topicsQuery = useQuery({
    queryKey: ['topics'],
    queryFn: async () => {
      const { data, error } = await supabase.from('topics').select('*');

      if (error) throw error;

      return data;
    },
  });

  return {
    topics: topicsQuery.data || [],
    isLoading: topicsQuery.isLoading,
    isError: topicsQuery.isError,
    error: topicsQuery.error,
  };
};
