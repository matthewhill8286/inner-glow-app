import { AppButton } from '@/components/ui/AppButton';
import { CommunityHeader } from '@/components/community/CommunityHeader';
import { screenBottomPadding } from '@/lib/screen-layout';
import { communityStyles } from '@/components/community/styles';
import { Typography } from '@/constants/typography';
import { backTo } from '@/lib/navigation';
import { WellnessIconText } from '@/components/WellnessIconText';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { userScopedKey } from '@/lib/storage';
import { supabase } from '@/supabase/supabase';
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  TextInput,
  Platform,
  StyleSheet,
  Switch,
  KeyboardAvoidingView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Colors, UI } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import MaterialIcons from '@/components/AppIcon';
import { CATEGORIES, type PostCategory, type PostType } from '@/lib/community';
import { useMyProfile, useCreatePost } from '@/hooks/useCommunity';
import { toast } from '@/components/Toast';

/* ── safe back navigation helper ────────────────── */
function goBack(from?: string) {
  backTo(from, '/(tabs)/community');
}

type Step = 'category' | 'content';

export default function NewPostScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];
  const { from } = useLocalSearchParams<{ from?: string }>();

  const [step, setStep] = useState<Step>('category');
  const [selectedCategory, setSelectedCategory] = useState<PostCategory | null>(null);
  const postType: PostType = 'story';
  const [content, setContent] = useState('');
  const [hideFromCommunity, setHideFromCommunity] = useState(false);

  const { data: myProfile } = useMyProfile();
  const createPost = useCreatePost();

  useEffect(() => {
    void (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user) return;
      const raw = await AsyncStorage.getItem(userScopedKey('community:draft:v1', session.user.id));
      if (!raw) return;
      try {
        const draft = JSON.parse(raw);
        if (CATEGORIES.some((category) => category.key === draft.selectedCategory))
          setSelectedCategory(draft.selectedCategory);
        if (typeof draft.content === 'string') setContent(draft.content.slice(0, 2000));
        setHideFromCommunity(draft.hideFromCommunity === true);
      } catch {
        /* discard invalid draft */
      }
    })();
  }, []);

  const currentUser = myProfile ?? {
    name: 'You',
    avatar: '😊',
    verified: false,
    followers: 0,
    following: 0,
  };

  const canPost = content.trim().length > 0 && selectedCategory && !createPost.isPending;

  const handlePost = () => {
    if (!selectedCategory || !content.trim() || createPost.isPending) return;
    createPost.mutate(
      {
        category: selectedCategory,
        postType,
        content: content.trim(),
        isHidden: hideFromCommunity,
      },
      {
        onSuccess: async () => {
          const {
            data: { session },
          } = await supabase.auth.getSession();
          try {
            if (session?.user)
              await AsyncStorage.removeItem(userScopedKey('community:draft:v1', session.user.id));
          } catch {
            /* A local cache failure must not repeat a successful post. */
          }
          router.replace({
            pathname: '/(tabs)/community/post-success',
            params: {
              category: selectedCategory,
              content: content.substring(0, 100),
              from: from || '/(tabs)/community',
            },
          });
        },
        onError: (err) => {
          toast.error(err.message || t('toasts.postError'));
        },
      },
    );
  };

  const handleSaveDraft = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user) return;
      await AsyncStorage.setItem(
        userScopedKey('community:draft:v1', session.user.id),
        JSON.stringify({ selectedCategory, content, hideFromCommunity }),
      );
      toast.success(t('toasts.draftSaved'));
      goBack(from);
    } catch {
      toast.error(t('communityFixes.actionFailed'));
    }
  };

  return (
    <View style={[s.container, { backgroundColor: colors.background, paddingTop: insets.top + 6 }]}>
      {/* ── Header ─────────────────────────────── */}
      <CommunityHeader
        title={
          step === 'category'
            ? t('communityNewPost.stepCategoryTitle')
            : t('communityNewPost.stepContentTitle')
        }
        subtitle={
          step === 'category'
            ? t('communityNewPost.stepCategorySubtitle')
            : t('communityNewPost.stepContentSubtitle')
        }
        onBack={() => {
          if (step === 'content') setStep('category');
          else goBack(from);
        }}
      >
        <Text style={[Typography.caption, { color: colors.mutedText }]}>
          {step === 'category' ? '1 / 2' : '2 / 2'}
        </Text>
      </CommunityHeader>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={[
            s.scrollContent,
            { paddingBottom: screenBottomPadding(insets.bottom) },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {step === 'category' ? (
            /* ═══ STEP 1: CATEGORY SELECTION ═══════ */
            <>
              {/* category grid */}
              <Text style={[s.sectionTitle, { color: colors.text }]}>
                {t('communityNewPost.chooseTopicLabel')}
              </Text>
              <View style={s.categoryGrid}>
                {CATEGORIES.map((cat) => {
                  const selected = selectedCategory === cat.key;
                  return (
                    <Pressable
                      key={cat.key}
                      accessibilityRole="radio"
                      accessibilityState={{ checked: selected }}
                      aria-checked={selected}
                      onPress={() => setSelectedCategory(cat.key)}
                      style={({ pressed }) => [
                        s.categoryCard,
                        {
                          backgroundColor: selected ? cat.tint + '18' : colors.card,
                          borderColor: selected ? cat.tint : colors.border,
                          opacity: pressed ? 0.78 : 1,
                        },
                      ]}
                    >
                      <View style={[s.categoryEmoji, { backgroundColor: cat.tint + '15' }]}>
                        <WellnessIconText
                          style={{ fontFamily: Typography.family.body, fontSize: 24 }}
                        >
                          {cat.emoji}
                        </WellnessIconText>
                      </View>
                      <Text style={[s.categoryLabel, { color: selected ? cat.tint : colors.text }]}>
                        {cat.label}
                      </Text>
                      {selected && (
                        <View style={[s.checkMark, { backgroundColor: cat.tint }]}>
                          <MaterialIcons name="check" size={12} color="#FFF" />
                        </View>
                      )}
                    </Pressable>
                  );
                })}
              </View>

              <Text style={[s.toggleSub, { color: colors.mutedText, marginTop: 16 }]}>
                Share a text story with the community.
              </Text>
              <AppButton
                title={t('common.continue')}
                disabled={!selectedCategory}
                onPress={() => setStep('content')}
                style={{ marginTop: 20 }}
              />
            </>
          ) : (
            /* ═══ STEP 2: POST CONTENT ═════════════ */
            <>
              {/* author preview */}
              <View
                style={[
                  s.authorPreview,
                  { backgroundColor: colors.card, borderColor: colors.border },
                ]}
              >
                <View style={[s.avatarSmall, { backgroundColor: '#8B6B4718' }]}>
                  <WellnessIconText style={{ fontFamily: Typography.family.body, fontSize: 18 }}>
                    {currentUser.avatar}
                  </WellnessIconText>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={s.nameRowSmall}>
                    <Text style={[s.authorNameSmall, { color: colors.text }]}>
                      {currentUser.name}
                    </Text>
                    {currentUser.verified && (
                      <MaterialIcons name="verified" size={14} color={colors.accent} />
                    )}
                  </View>
                  <Text style={[s.authorStats, { color: colors.subtleText }]}>
                    {currentUser.followers} followers • {currentUser.following} following
                  </Text>
                </View>
                {selectedCategory && (
                  <View
                    style={[
                      s.catBadge,
                      {
                        backgroundColor:
                          (CATEGORIES.find((c) => c.key === selectedCategory)?.tint ||
                            colors.tint) + '15',
                      },
                    ]}
                  >
                    <WellnessIconText style={{ fontFamily: Typography.family.body, fontSize: 12 }}>
                      {CATEGORIES.find((c) => c.key === selectedCategory)?.emoji}
                    </WellnessIconText>
                    <Text
                      style={[
                        s.catBadgeText,
                        {
                          color:
                            CATEGORIES.find((c) => c.key === selectedCategory)?.tint || colors.tint,
                        },
                      ]}
                    >
                      {CATEGORIES.find((c) => c.key === selectedCategory)?.label}
                    </Text>
                  </View>
                )}
              </View>

              {/* text editor */}
              <View
                style={[s.editorCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              >
                <TextInput
                  style={[s.editorInput, { color: colors.text }]}
                  placeholder="What's on your mind? Share your thoughts, feelings, or a story..."
                  placeholderTextColor={colors.placeholder}
                  multiline
                  textAlignVertical="top"
                  value={content}
                  onChangeText={setContent}
                  maxLength={2000}
                  autoFocus
                />
                <View style={s.editorFooter}>
                  <Text style={[s.charCount, { color: colors.subtleText }]}>
                    {content.length}/2000
                  </Text>
                </View>
              </View>

              {/* hide from community */}
              <View
                style={[s.toggleRow, { backgroundColor: colors.card, borderColor: colors.border }]}
              >
                <View style={[s.toggleIcon, { backgroundColor: '#7B6DC915' }]}>
                  <WellnessIconText style={{ fontFamily: Typography.family.body, fontSize: 16 }}>
                    🔒
                  </WellnessIconText>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[s.toggleLabel, { color: colors.text }]}>Hide from Community?</Text>
                  <Text style={[s.toggleSub, { color: colors.mutedText }]}>
                    This post will be private.
                  </Text>
                </View>
                <Switch
                  value={hideFromCommunity}
                  onValueChange={setHideFromCommunity}
                  trackColor={{
                    false: theme === 'light' ? '#E0DCD6' : '#3A3A3A',
                    true: '#7B6DC9',
                  }}
                  thumbColor="#FFF"
                />
              </View>

              {/* action buttons */}
              <AppButton
                title={t('communityDesign.saveDraft')}
                variant="secondary"
                onPress={handleSaveDraft}
                style={{ marginTop: 16 }}
              />

              <AppButton
                title={t('communityDesign.publishPost')}
                busy={createPost.isPending}
                disabled={!canPost}
                onPress={handlePost}
                style={{ marginTop: 12 }}
              />
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

/* ── Styles ──────────────────────────────────────── */
const s = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: UI.spacing.xl,
    paddingTop: 0,
  },

  scrollContent: { paddingTop: 20, paddingBottom: 100 },

  /* section */
  sectionTitle: {
    ...{ ...Typography.section, fontSize: 20, marginBottom: 12 },
    ...communityStyles.sectionTitle,
  },

  /* category grid */
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  categoryCard: {
    ...{
      width: '31%',
      flexGrow: 1,
      alignItems: 'center',
      paddingVertical: 18,
      borderRadius: UI.radius.xl,
      borderWidth: 1.5,
      position: 'relative',
    },
    ...communityStyles.categoryCard,
  },
  categoryEmoji: {
    width: 50,
    height: 50,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  categoryLabel: {
    fontFamily: Typography.family.body,
    fontSize: 13,
    fontWeight: Typography.weight.medium,
  },
  checkMark: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* toggle row */
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: UI.radius.xl,
    borderWidth: 1,
    marginTop: 16,
  },
  toggleIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleLabel: {
    fontFamily: Typography.family.body,
    fontSize: 14,
    fontWeight: Typography.weight.medium,
  },
  toggleSub: { fontFamily: Typography.family.body, fontSize: 12, marginTop: 1 },

  /* ═══ STEP 2 ═══ */

  /* author preview */
  authorPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: UI.radius.xl,
    borderWidth: 1,
    ...UI.shadow.sm,
  },
  avatarSmall: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nameRowSmall: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  authorNameSmall: {
    fontFamily: Typography.family.body,
    fontSize: 14,
    fontWeight: Typography.weight.semibold,
  },
  authorStats: {
    fontFamily: Typography.family.body,
    fontSize: 12,
    fontWeight: Typography.weight.bold,
    marginTop: 1,
  },
  catBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  catBadgeText: {
    fontFamily: Typography.family.body,
    fontSize: 11,
    fontWeight: Typography.weight.medium,
  },

  /* editor */
  editorCard: {
    borderRadius: UI.radius.xl,
    borderWidth: 1,
    marginTop: 8,
    overflow: 'hidden',
    ...UI.shadow.sm,
  },
  editorInput: {
    ...Typography.body,
    padding: 16,
    minHeight: 180,
  },
  editorFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.04)',
  },
  charCount: {
    fontFamily: Typography.family.body,
    fontSize: 12,
    fontWeight: Typography.weight.bold,
  },
});
