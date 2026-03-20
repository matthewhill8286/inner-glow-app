import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, Pressable, FlatList } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ScreenHeader from '@/components/ScreenHeader';
import { router } from 'expo-router';
import { ISSUES, IssueKey } from '@/data/issues';
import { toast } from '@/components/Toast';

import { Colors, UI } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useProfile } from '@/hooks/useProfile';
import { SkeletonRect } from '@/components/Skeleton';

export default function Settings() {
  const insets = useSafeAreaInsets();
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];
  const { profile, isLoading: loading, updateProfile } = useProfile();

  const [selected, setSelected] = useState<Set<IssueKey>>(new Set());

  useEffect(() => {
    if (profile?.selectedIssues) {
      setSelected(new Set(profile.selectedIssues as IssueKey[]));
    }
  }, [profile]);

  const selectedArray = useMemo(() => Array.from(selected), [selected]);

  async function save() {
    if (selectedArray.length === 0) {
      toast.warning('Choose one or more sections to continue.');
      return;
    }
    await updateProfile({
      selectedIssues: selectedArray,
    });
    toast.success('Your preferences were updated.');
    router.back();
  }

  return (
    <View
      style={{
        flex: 1,
        padding: UI.spacing.xl,
        backgroundColor: colors.background,
        paddingTop: insets.top + 6,
      }}
    >
      <ScreenHeader title="Settings" subtitle="Choose which sections you want to see." />

      <View
        style={{
          marginTop: 14,
          backgroundColor: colors.card,
          borderRadius: 18,
          padding: 12,
          flex: 1,
        }}
      >
        {loading ? (
          <View style={{ gap: 10, padding: 6 }}>
            <SkeletonRect height={60} borderRadius={18} />
            <SkeletonRect height={60} borderRadius={18} />
            <SkeletonRect height={60} borderRadius={18} />
            <SkeletonRect height={60} borderRadius={18} />
            <SkeletonRect height={60} borderRadius={18} />
            <SkeletonRect height={60} borderRadius={18} />
          </View>
        ) : (
          <FlatList
            data={ISSUES}
            keyExtractor={(i) => i.key}
            contentContainerStyle={{ gap: 10, padding: 6 }}
            renderItem={({ item }) => {
              const isOn = selected.has(item.key);
              return (
                <Pressable
                  onPress={() => {
                    setSelected((prev) => {
                      const next = new Set(prev);
                      if (next.has(item.key)) next.delete(item.key);
                      else next.add(item.key);
                      return next;
                    });
                  }}
                  style={{
                    padding: 14,
                    borderRadius: 18,
                    backgroundColor: isOn ? colors.divider : colors.background,
                  }}
                >
                  <Text style={{ fontWeight: '900', color: colors.text }}>{item.title}</Text>
                  <Text style={{ color: colors.mutedText, marginTop: 4 }}>
                    {isOn ? 'Selected' : 'Tap to select'}
                  </Text>
                </Pressable>
              );
            }}
          />
        )}
      </View>

      <Pressable
        onPress={save}
        style={({ pressed }) => ({
          marginTop: 14,
          backgroundColor: colors.primary,
          padding: 16,
          borderRadius: 18,
          alignItems: 'center',
          opacity: pressed ? 0.7 : 1,
        })}
      >
        <Text style={{ color: colors.onPrimary, fontWeight: '900' }}>Save</Text>
      </Pressable>
    </View>
  );
}
