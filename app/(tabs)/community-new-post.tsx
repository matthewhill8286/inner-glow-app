import React, { useState } from 'react';
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
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Colors, UI } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { CATEGORIES, type PostCategory, type PostType } from '@/lib/community';
import { useMyProfile, useCreatePost } from '@/hooks/useCommunity';

/* ── safe back navigation helper ────────────────── */
function goBack(from?: string) {
  if (from) {
    router.replace(from as any);
  } else {
    router.back();
  }
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
  const [postType, setPostType] = useState<PostType>('story');
  const [content, setContent] = useState('');
  const [hideFromCommunity, setHideFromCommunity] = useState(false);
  const [addMedia, setAddMedia] = useState(false);

  const { data: myProfile } = useMyProfile();
  const createPost = useCreatePost();

  const currentUser = myProfile ?? {
    name: 'You',
    avatar: '😊',
    verified: false,
    followers: 0,
    following: 0,
  };

  const canPost = content.trim().length > 0 && selectedCategory && !createPost.isPending;

  const handlePost = () => {
    if (!selectedCategory || !content.trim()) return;
    console.log('selectedCategory:', selectedCategory);
    console.log('postType:', postType);
    console.log('content:', content);
    console.log('hideFromCommunity:', hideFromCommunity);
    console.log('addMedia:', addMedia);

    createPost.mutate(
      { category: selectedCategory, postType, content: content.trim() },
      {
        onSuccess: () => {
          router.push({
            pathname: '/(tabs)/community-post-success',
            params: {
              category: selectedCategory,
              content: content.substring(0, 100),
              from: from || '/(tabs)/community',
            },
          });
        },
        onError: (err) => {
          Alert.alert(
            t('communityNewPost.errorAlertTitle'),
            err.message || t('communityNewPost.errorAlertMessage'),
          );
        },
      },
    );
  };

  const handleSaveDraft = () => {
    Alert.alert(t('communityNewPost.draftSavedTitle'), t('communityNewPost.draftSavedMessage'));
    goBack(from);
  };

  return (
    <View style={[s.container, { backgroundColor: colors.background, paddingTop: insets.top + 6 }]}>
      {/* ── Header ─────────────────────────────── */}
      <View style={[s.header, { marginTop: insets.top + 14 }]}>
        <Pressable
          onPress={() => {
            if (step === 'content') setStep('category');
            else goBack(from);
          }}
          style={({ pressed }) => [
            s.backBtn,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              opacity: pressed ? 0.7 : 1,
            },
          ]}
        >
          <MaterialIcons
            name={Platform.OS === 'ios' ? 'arrow-back-ios-new' : 'arrow-back'}
            size={18}
            color={colors.text}
          />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={[s.headerTitle, { color: colors.text }]}>
            {step === 'category'
              ? t('communityNewPost.stepCategoryTitle')
              : t('communityNewPost.stepContentTitle')}
          </Text>
          <Text style={[s.headerSub, { color: colors.mutedText }]}>
            {step === 'category'
              ? t('communityNewPost.stepCategorySubtitle')
              : t('communityNewPost.stepContentSubtitle')}
          </Text>
        </View>

        {/* step indicator */}
        <View style={s.stepIndicator}>
          <View style={[s.stepDot, { backgroundColor: '#8B6B47' }]} />
          <View
            style={[s.stepDot, { backgroundColor: step === 'content' ? '#8B6B47' : colors.border }]}
          />
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
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
                      onPress={() => setSelectedCategory(cat.key)}
                      style={({ pressed }) => [
                        s.categoryCard,
                        {
                          backgroundColor: selected ? cat.tint + '18' : colors.card,
                          borderColor: selected ? cat.tint : colors.border,
                          transform: [{ scale: pressed ? 0.96 : 1 }],
                        },
                      ]}
                    >
                      <View style={[s.categoryEmoji, { backgroundColor: cat.tint + '15' }]}>
                        <Text style={{ fontSize: 24 }}>{cat.emoji}</Text>
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

              {/* post type */}
              <Text style={[s.sectionTitle, { color: colors.text, marginTop: 24 }]}>Post Type</Text>
              <View style={s.typeRow}>
                {(['story', 'audio'] as PostType[]).map((type) => {
                  const active = postType === type;
                  return (
                    <Pressable
                      key={type}
                      onPress={() => setPostType(type)}
                      style={[
                        s.typeBtn,
                        {
                          backgroundColor: active ? '#8B6B47' : colors.card,
                          borderColor: active ? '#8B6B47' : colors.border,
                        },
                      ]}
                    >
                      <MaterialIcons
                        name={type === 'story' ? 'article' : 'mic'}
                        size={18}
                        color={active ? '#FFF' : colors.mutedText}
                      />
                      <Text style={[s.typeText, { color: active ? '#FFF' : colors.mutedText }]}>
                        {type === 'story' ? 'Story' : 'Audio'}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {/* add media toggle */}
              <View
                style={[s.toggleRow, { backgroundColor: colors.card, borderColor: colors.border }]}
              >
                <View style={[s.toggleIcon, { backgroundColor: '#E8985A15' }]}>
                  <Text style={{ fontSize: 16 }}>📷</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[s.toggleLabel, { color: colors.text }]}>Add Media</Text>
                  <Text style={[s.toggleSub, { color: colors.mutedText }]}>
                    Attach a photo or image.
                  </Text>
                </View>
                <Switch
                  value={addMedia}
                  onValueChange={setAddMedia}
                  trackColor={{
                    false: theme === 'light' ? '#E0DCD6' : '#3A3A3A',
                    true: '#E8985A',
                  }}
                  thumbColor="#FFF"
                />
              </View>

              {/* continue button */}
              <Pressable
                onPress={() => {
                  if (selectedCategory) setStep('content');
                }}
                disabled={!selectedCategory}
                style={({ pressed }) => [
                  s.continueBtn,
                  {
                    backgroundColor: selectedCategory ? '#8B6B47' : colors.border,
                    transform: [{ scale: pressed && selectedCategory ? 0.97 : 1 }],
                  },
                ]}
              >
                <Text style={s.continueBtnText}>Continue →</Text>
              </Pressable>
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
                  <Text style={{ fontSize: 18 }}>{currentUser.avatar}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={s.nameRowSmall}>
                    <Text style={[s.authorNameSmall, { color: colors.text }]}>
                      {currentUser.name}
                    </Text>
                    {currentUser.verified && (
                      <MaterialIcons name="verified" size={14} color="#5B8A5A" />
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
                          (CATEGORIES.find((c) => c.key === selectedCategory)?.tint || '#8B6B47') +
                          '15',
                      },
                    ]}
                  >
                    <Text style={{ fontSize: 12 }}>
                      {CATEGORIES.find((c) => c.key === selectedCategory)?.emoji}
                    </Text>
                    <Text
                      style={[
                        s.catBadgeText,
                        {
                          color:
                            CATEGORIES.find((c) => c.key === selectedCategory)?.tint || '#8B6B47',
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
                  <View style={s.editorActions}>
                    <Pressable style={s.editorActionBtn}>
                      <MaterialIcons name="image" size={20} color={colors.mutedText} />
                    </Pressable>
                    <Pressable style={s.editorActionBtn}>
                      <MaterialIcons name="tag-faces" size={20} color={colors.mutedText} />
                    </Pressable>
                  </View>
                </View>
              </View>

              {/* hide from community */}
              <View
                style={[s.toggleRow, { backgroundColor: colors.card, borderColor: colors.border }]}
              >
                <View style={[s.toggleIcon, { backgroundColor: '#7B6DC915' }]}>
                  <Text style={{ fontSize: 16 }}>🔒</Text>
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
              <Pressable
                onPress={handleSaveDraft}
                style={({ pressed }) => [
                  s.draftBtn,
                  {
                    borderColor: colors.border,
                    opacity: pressed ? 0.7 : 1,
                  },
                ]}
              >
                <MaterialIcons name="save" size={16} color={colors.mutedText} />
                <Text style={[s.draftBtnText, { color: colors.mutedText }]}>Save as Draft →</Text>
              </Pressable>

              <Pressable
                onPress={handlePost}
                disabled={!canPost}
                style={({ pressed }) => [
                  s.postBtn,
                  {
                    backgroundColor: canPost ? '#8B6B47' : colors.border,
                    transform: [{ scale: pressed && canPost ? 0.97 : 1 }],
                  },
                ]}
              >
                {createPost.isPending ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <MaterialIcons name="send" size={18} color="#FFF" />
                )}
                <Text style={s.postBtnText}>
                  {createPost.isPending ? 'Posting...' : 'Create Post →'}
                </Text>
              </Pressable>
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

  /* header */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginTop: 20,
    marginBottom: 4,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  headerTitle: { fontSize: 22, fontWeight: '900' },
  headerSub: { fontSize: 14, marginTop: 2 },
  stepIndicator: { flexDirection: 'row', gap: 5 },
  stepDot: { width: 8, height: 8, borderRadius: 4 },

  scrollContent: { paddingTop: 20, paddingBottom: 100 },

  /* section */
  sectionTitle: { fontSize: 16, fontWeight: '800', marginBottom: 12 },

  /* category grid */
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  categoryCard: {
    width: '31%',
    flexGrow: 1,
    alignItems: 'center',
    paddingVertical: 18,
    borderRadius: UI.radius.xl,
    borderWidth: 1.5,
    position: 'relative',
  },
  categoryEmoji: {
    width: 50,
    height: 50,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  categoryLabel: { fontSize: 13, fontWeight: '700' },
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

  /* type selector */
  typeRow: { flexDirection: 'row', gap: 10 },
  typeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: UI.radius.lg,
    borderWidth: 1,
  },
  typeText: { fontSize: 14, fontWeight: '700' },

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
  toggleLabel: { fontSize: 14, fontWeight: '700' },
  toggleSub: { fontSize: 12, marginTop: 1 },

  /* continue button */
  continueBtn: {
    paddingVertical: 16,
    borderRadius: UI.radius.lg,
    alignItems: 'center',
    marginTop: 24,
    ...UI.shadow.sm,
  },
  continueBtnText: { color: '#FFF', fontSize: 16, fontWeight: '800' },

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
  authorNameSmall: { fontSize: 14, fontWeight: '800' },
  authorStats: { fontSize: 12, fontWeight: '600', marginTop: 1 },
  catBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  catBadgeText: { fontSize: 11, fontWeight: '700' },

  /* editor */
  editorCard: {
    borderRadius: UI.radius.xl,
    borderWidth: 1,
    marginTop: 14,
    overflow: 'hidden',
    ...UI.shadow.sm,
  },
  editorInput: {
    padding: 16,
    fontSize: 15,
    lineHeight: 23,
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
  charCount: { fontSize: 12, fontWeight: '600' },
  editorActions: { flexDirection: 'row', gap: 12 },
  editorActionBtn: { padding: 4 },

  /* draft button */
  draftBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    borderRadius: UI.radius.lg,
    borderWidth: 1,
    marginTop: 16,
  },
  draftBtnText: { fontSize: 14, fontWeight: '700' },

  /* post button */
  postBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: UI.radius.lg,
    marginTop: 10,
    ...UI.shadow.sm,
  },
  postBtnText: { color: '#FFF', fontSize: 16, fontWeight: '800' },
});
