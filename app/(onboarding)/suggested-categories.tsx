import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { router } from 'expo-router';
import { ISSUES, IssueKey } from '@/data/issues';
import { suggestWithReasons } from '@/lib/suggestCategories';
import { MostCommonChips } from '@/components/MostCommonChips';
import { SkeletonRect } from '@/components/Skeleton';
import { useProfile } from '@/hooks/useProfile';

export default function SuggestedCategories() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { assessment, fetchAssessment, updateProfile } = useProfile();
  const [suggested, setSuggested] = useState<{ key: IssueKey; score: number; reasons: string[] }[]>(
    [],
  );
  const [selected, setSelected] = useState<Set<IssueKey>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (assessment) {
      const s = suggestWithReasons(assessment);
      setSuggested(s);
      setSelected(new Set(s.slice(0, 3).map((x) => x.key)));
      setLoading(false);
    }
  }, [assessment]);

  const selectedArray = useMemo(() => Array.from(selected), [selected]);

  async function onContinue() {
    await updateProfile({
      selectedIssues: selectedArray,
    });
    router.replace('/(tabs)/home');
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#6f6660', padding: 24, paddingTop: insets.top + 16 }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          marginBottom: 20,
          gap: 12,
        }}
      >
        <Pressable
          onPress={() => router.back()}
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.2)',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(255,255,255,0.1)',
          }}
        >
          <Text style={{ color: 'white', fontSize: 24 }}>←</Text>
        </Pressable>
        <Text style={{ color: 'white', fontSize: 18, fontWeight: '700' }}>{t('suggestedCategories.header')}</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        <View style={{ backgroundColor: 'white', borderRadius: 32, padding: 20, minHeight: 500 }}>
          {loading ? (
            <View style={{ gap: 14 }}>
              <SkeletonRect height={30} width={200} />
              <SkeletonRect height={20} width={240} />
              <View style={{ marginTop: 20, gap: 12 }}>
                <SkeletonRect height={100} borderRadius={20} />
                <SkeletonRect height={100} borderRadius={20} />
                <SkeletonRect height={100} borderRadius={20} />
                <SkeletonRect height={100} borderRadius={20} />
              </View>
            </View>
          ) : (
            <>
              <Text style={{ color: '#6a5e55', fontSize: 24, fontWeight: '900', marginTop: 10 }}>
                {t('suggestedCategories.title')}
              </Text>
              <Text style={{ color: '#6a5e55', opacity: 0.75, marginTop: 8, fontSize: 16 }}>
                {t('suggestedCategories.subtitle')}
              </Text>

              {suggested.length > 0 ? (
                <View style={{ marginTop: 16 }}>
                  <MostCommonChips
                    chips={suggested
                      .slice(0, 3)
                      .filter((s) => selected.has(s.key))
                      .map((s) => {
                        const item = ISSUES.find((i) => i.key === s.key);
                        const base = item?.title ?? String(s.key);
                        return { id: s.key, label: t('suggestedCategories.topPrefix', { name: base }) };
                      })}
                    selectedIds={
                      new Set(
                        suggested
                          .slice(0, 3)
                          .filter((s) => selected.has(s.key))
                          .map((s) => s.key as unknown as string),
                      )
                    }
                    onRemove={(chipId) =>
                      setSelected((prev) => {
                        const next = new Set(prev);
                        // chipId corresponds to IssueKey
                        next.delete(chipId as unknown as IssueKey);
                        return next;
                      })
                    }
                  />
                </View>
              ) : null}

              <View style={{ marginTop: 20, flex: 1 }}>
                {ISSUES.map((item) => {
                  const isOn = selected.has(item.key);
                  const why = suggested.find((s) => s.key === item.key);

                  return (
                    <Pressable
                      key={item.key}
                      onPress={() => {
                        setSelected((prev) => {
                          const next = new Set(prev);
                          if (next.has(item.key)) next.delete(item.key);
                          else next.add(item.key);
                          return next;
                        });
                      }}
                      style={{
                        padding: 16,
                        borderRadius: 20,
                        backgroundColor: isOn ? '#dff7df' : '#f8f8f8',
                        marginBottom: 12,
                        borderWidth: 2,
                        borderColor: isOn ? '#6bbf8e' : 'transparent',
                      }}
                    >
                      <Text style={{ fontSize: 17, fontWeight: '900', color: '#6a5e55' }}>
                        {item.title}
                      </Text>
                      <Text style={{ color: '#6a5e55', opacity: 0.7, marginTop: 4 }}>
                        {item.description}
                      </Text>
                      {why ? (
                        <View
                          style={{
                            marginTop: 10,
                            paddingTop: 10,
                            borderTopWidth: 1,
                            borderTopColor: 'rgba(0,0,0,0.05)',
                          }}
                        >
                          <Text style={{ fontWeight: '800', opacity: 0.75, color: '#6a5e55' }}>
                            Why:
                          </Text>
                          {why.reasons.slice(0, 2).map((r) => (
                            <Text key={r} style={{ opacity: 0.7, color: '#6a5e55' }}>
                              • {r}
                            </Text>
                          ))}
                        </View>
                      ) : null}
                    </Pressable>
                  );
                })}
              </View>
            </>
          )}
        </View>

        <View style={{ marginTop: 30 }}>
          <Pressable
            onPress={onContinue}
            disabled={loading || selected.size === 0}
            style={{
              paddingVertical: 20,
              borderRadius: 35,
              backgroundColor: '#a07b55',
              alignItems: 'center',
              flexDirection: 'row',
              justifyContent: 'center',
              gap: 10,
              opacity: 1,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.1,
              shadowRadius: 10,
              elevation: 4,
            }}
          >
            <Text style={{ color: 'white', fontWeight: '800', fontSize: 18 }} disabled={loading}>
              {t('suggestedCategories.continue')}
            </Text>
            <Text style={{ color: 'white', fontSize: 20 }}>→</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}
