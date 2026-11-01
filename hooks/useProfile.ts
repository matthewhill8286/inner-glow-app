import { normalizeProfileChoice } from '@/lib/profile-choices';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/supabase/supabase';
import { UserProfile } from '@/lib/types';
import { useUser } from './useUser';
import { queryKeys, STALE } from '@/lib/queryKeys';

/** Maps a `profiles` row to the app's profile. Times come back as "08:30:00"; the app uses "08:30". */
function profileFromRow(data: Record<string, any>): UserProfile {
  return {
    name: data.name,
    intention: normalizeProfileChoice(data.intention, 'goal'),
    routine: normalizeProfileChoice(data.routine, 'routine'),
    selectedIssues: data.selected_issues as string[] | undefined,
    avatarPath: data.avatar_path ?? null,
    birthday: data.birthday ?? null,
    checkinTime: typeof data.checkin_time === 'string' ? data.checkin_time.slice(0, 5) : null,
    notificationPrefs: (data.notification_prefs as Record<string, boolean> | null) ?? {},
    nickname: data.nickname ?? null,
    aiTone: data.ai_tone ?? 'gentle',
    aiMemory: data.ai_memory ?? true,
    aiJournal: data.ai_journal ?? true,
    aiVoiceReplies: data.ai_voice_replies ?? false,
    updatedAt: data.updated_at,
  };
}

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

      return profileFromRow(data);
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
          intention: normalizeProfileChoice(profile.intention, 'goal'),
          routine: normalizeProfileChoice(profile.routine, 'routine'),
          selected_issues: profile.selectedIssues,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      return profileFromRow(data);
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
      if (updates.intention !== undefined)
        dbUpdates.intention = normalizeProfileChoice(updates.intention, 'goal');
      if (updates.routine !== undefined)
        dbUpdates.routine = normalizeProfileChoice(updates.routine, 'routine');
      if (updates.selectedIssues !== undefined) dbUpdates.selected_issues = updates.selectedIssues;
      if (updates.avatarPath !== undefined) dbUpdates.avatar_path = updates.avatarPath;
      if (updates.birthday !== undefined) dbUpdates.birthday = updates.birthday;
      if (updates.checkinTime !== undefined) dbUpdates.checkin_time = updates.checkinTime;
      if (updates.notificationPrefs !== undefined) dbUpdates.notification_prefs = updates.notificationPrefs;
      if (updates.nickname !== undefined) dbUpdates.nickname = updates.nickname?.trim() || null;
      if (updates.aiTone !== undefined) dbUpdates.ai_tone = updates.aiTone;
      if (updates.aiMemory !== undefined) dbUpdates.ai_memory = updates.aiMemory;
      if (updates.aiJournal !== undefined) dbUpdates.ai_journal = updates.aiJournal;
      if (updates.aiVoiceReplies !== undefined) dbUpdates.ai_voice_replies = updates.aiVoiceReplies;

      const { data, error } = await supabase.from('profiles').upsert(dbUpdates).select().single();

      if (error) throw error;

      return profileFromRow(data);
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
      if (assessment.soughtHelpBefore !== undefined)
        row.sought_help_before = assessment.soughtHelpBefore;
      if (assessment.physicalDistress !== undefined)
        row.physical_distress = assessment.physicalDistress;
      if (assessment.physicalDistressNotes !== undefined)
        row.physical_distress_notes = assessment.physicalDistressNotes;
      if (assessment.sleepQuality !== undefined) row.sleep_quality = assessment.sleepQuality;
      if (assessment.takingMeds !== undefined) row.taking_meds = assessment.takingMeds;
      if (assessment.meds !== undefined) row.meds = assessment.meds;
      if (assessment.otherSymptoms !== undefined) row.other_symptoms = assessment.otherSymptoms;
      if (assessment.stressLevel !== undefined) row.stress_level = assessment.stressLevel;
      if (assessment.moodScore !== undefined) row.mood_score = assessment.moodScore;
      if (assessment.stressBand !== undefined) row.stress_band = assessment.stressBand;
      if (assessment.medications !== undefined) row.medications = assessment.medications;
      if (assessment.reflectionText !== undefined) row.reflection_text = assessment.reflectionText;
      if (assessment.soundCheck !== undefined) row.sound_check = assessment.soundCheck;
      if (assessment.expressionCheck !== undefined)
        row.expression_check = assessment.expressionCheck;

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
