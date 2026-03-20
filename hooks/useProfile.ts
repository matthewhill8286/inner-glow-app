import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/supabase/supabase';
import { UserProfile } from '@/lib/types';
import { useUser } from './useUser';
import { queryKeys, STALE } from '@/lib/queryKeys';

export const useProfile = (opts?: { lazy?: boolean }) => {
  const lazy = opts?.lazy ?? false;
  const queryClient = useQueryClient();
  const { data: user } = useUser();
  const profileKey = queryKeys.profile.detail(user?.id);
  const assessmentKey = queryKeys.assessment.detail(user?.id);

  const profileQuery = useQuery({
    queryKey: profileKey,
    enabled: !!user,
    staleTime: STALE.long,
    queryFn: async () => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;

      const profile: UserProfile = {
        name: data.name,
        intention: data.intention,
        routine: data.routine,
        selectedIssues: data.selected_issues as string[] | undefined,
        updatedAt: data.updated_at,
      };

      return profile;
    },
  });

  const assessmentQuery = useQuery({
    queryKey: assessmentKey,
    enabled: !!user && !lazy,
    staleTime: STALE.long,
    queryFn: async () => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('assessments')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data || null;
    },
  });

  const saveProfileMutation = useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('profiles')
        .upsert({
          user_id: user.id,
          name: profile.name,
          intention: profile.intention,
          routine: profile.routine,
          selected_issues: profile.selectedIssues,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      const updatedProfile: UserProfile = {
        name: data.name,
        intention: data.intention,
        routine: data.routine,
        selectedIssues: data.selected_issues as string[] | undefined,
        updatedAt: data.updated_at,
      };
      return updatedProfile;
    },
    onMutate: async (profile) => {
      await queryClient.cancelQueries({ queryKey: profileKey });
      const previous = queryClient.getQueryData<UserProfile>(profileKey);
      queryClient.setQueryData<UserProfile>(profileKey, profile);
      return { previous };
    },
    onError: (_err, _profile, context) => {
      if (context?.previous) queryClient.setQueryData(profileKey, context.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: profileKey });
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (updates: Partial<UserProfile>) => {
      if (!user) throw new Error('Not authenticated');

      const dbUpdates: any = {
        user_id: user.id,
        updated_at: new Date().toISOString(),
      };
      if (updates.name !== undefined) dbUpdates.name = updates.name;
      if (updates.intention !== undefined) dbUpdates.intention = updates.intention;
      if (updates.routine !== undefined) dbUpdates.routine = updates.routine;
      if (updates.selectedIssues !== undefined) dbUpdates.selected_issues = updates.selectedIssues;

      const { data, error } = await supabase.from('profiles').upsert(dbUpdates).select().single();

      if (error) throw error;

      const updatedProfile: UserProfile = {
        name: data.name,
        intention: data.intention,
        routine: data.routine,
        selectedIssues: data.selected_issues as string[] | undefined,
        updatedAt: data.updated_at,
      };
      return updatedProfile;
    },
    onMutate: async (updates) => {
      await queryClient.cancelQueries({ queryKey: profileKey });
      const previous = queryClient.getQueryData<UserProfile>(profileKey);
      if (previous) {
        queryClient.setQueryData<UserProfile>(profileKey, { ...previous, ...updates });
      }
      return { previous };
    },
    onError: (_err, _updates, context) => {
      if (context?.previous) queryClient.setQueryData(profileKey, context.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: profileKey });
    },
  });

  const saveAssessmentMutation = useMutation({
    mutationFn: async (assessment: any) => {
      if (!user) throw new Error('Not authenticated');

      // Map camelCase app fields to snake_case DB columns
      const row: Record<string, any> = {
        user_id: user.id,
        updated_at: new Date().toISOString(),
      };
      if (assessment.goal !== undefined) row.goal = assessment.goal;
      if (assessment.gender !== undefined) row.gender = assessment.gender;
      if (assessment.age !== undefined) row.age = assessment.age;
      if (assessment.weight !== undefined) row.weight = assessment.weight;
      if (assessment.weightUnit !== undefined) row.weight_unit = assessment.weightUnit;
      if (assessment.mood !== undefined) row.mood = assessment.mood;
      if (assessment.soughtHelpBefore !== undefined) row.sought_help_before = assessment.soughtHelpBefore;
      if (assessment.physicalDistress !== undefined) row.physical_distress = assessment.physicalDistress;
      if (assessment.physicalDistressNotes !== undefined) row.physical_distress_notes = assessment.physicalDistressNotes;
      if (assessment.sleepQuality !== undefined) row.sleep_quality = assessment.sleepQuality;
      if (assessment.takingMeds !== undefined) row.taking_meds = assessment.takingMeds;
      if (assessment.meds !== undefined) row.meds = assessment.meds;
      if (assessment.otherSymptoms !== undefined) row.other_symptoms = assessment.otherSymptoms;
      if (assessment.stressLevel !== undefined) row.stress_level = assessment.stressLevel;
      if (assessment.soundCheck !== undefined) row.sound_check = assessment.soundCheck;
      if (assessment.expressionCheck !== undefined) row.expression_check = assessment.expressionCheck;

      const { error } = await supabase.from('assessments').upsert(row as any);

      if (error) throw error;
      return assessment;
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: assessmentKey });
    },
  });

  return {
    profile: profileQuery.data,
    assessment: assessmentQuery.data,
    isLoading: profileQuery.isLoading || (!lazy && assessmentQuery.isLoading),
    isError: profileQuery.isError || assessmentQuery.isError,
    error: profileQuery.error || assessmentQuery.error,
    fetchProfile: () => profileQuery.refetch(),
    fetchAssessment: () => assessmentQuery.refetch(),
    saveProfile: saveProfileMutation.mutateAsync,
    updateProfile: updateProfileMutation.mutateAsync,
    saveAssessment: saveAssessmentMutation.mutateAsync,
    isSavingProfile: saveProfileMutation.isPending,
    isUpdatingProfile: updateProfileMutation.isPending,
    isSavingAssessment: saveAssessmentMutation.isPending,
  };
};
