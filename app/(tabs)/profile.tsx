import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, ScrollView, Platform, StyleSheet, Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useSubscription } from '@/hooks/useSubscription';
import { useProfile } from '@/hooks/useProfile';
import { Colors, UI } from '@/constants/theme';
import { authTokenVar } from '@/lib/state';
import { SkeletonRect } from '@/components/Skeleton';
import { SESSION_KEY } from '@/lib/storage';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/supabase/supabase';
import { useQueryClient } from '@tanstack/react-query';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { SUPPORTED_LANGUAGES, setLanguage, type LanguageCode } from '@/i18n';

async function signOut(queryClient: any) {
  await supabase.auth.signOut();
  await AsyncStorage.removeItem(SESSION_KEY);
  queryClient.clear();
  authTokenVar(null);
  router.replace('/(auth)/sign-in');
}

const SETTINGS_ITEMS: {
  key: string;
  emoji: string;
  label: string;
  tint: string;
  route: string;
}[] = [
  {
    key: 'notifications',
    emoji: '🔔',
    label: 'profilePage.notifications',
    tint: '#E8985A',
    route: '/(tabs)/notifications',
  },
  {
    key: 'categories',
    emoji: '📂',
    label: 'profilePage.manageCategories',
    tint: '#7B6DC9',
    route: '/(tabs)/settings',
  },
  {
    key: 'help',
    emoji: '💬',
    label: 'profilePage.helpCenter',
    tint: '#5A8FB5',
    route: '/(utils)/help-center',
  },
  {
    key: 'language',
    emoji: '🌐',
    label: 'profilePage.language',
    tint: '#5AAF8B',
    route: '__language__',
  },
  {
    key: 'security',
    emoji: '🔐',
    label: 'profilePage.twoFactorAuth',
    tint: '#5B8A5A',
    route: '/(auth)/two-factor-setup',
  },
  {
    key: 'utilities',
    emoji: '🔧',
    label: 'profilePage.errorUtilities',
    tint: '#8B6B47',
    route: '/(utils)/utilities',
  },
];

export default function Profile() {
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();
  const [email, setEmail] = useState<string | null>(null);
  const [showLanguagePicker, setShowLanguagePicker] = useState(false);
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];
  const insets = useSafeAreaInsets();
  const { profile, isLoading: profileLoading } = useProfile();
  const { subscription, isExpired, isLifetime } = useSubscription();
  const scrollRef = useRef<ScrollView>(null);

  useFocusEffect(useCallback(() => {
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }, []));

  const currentLang =
    SUPPORTED_LANGUAGES.find((l) => l.code === i18n.language) ?? SUPPORTED_LANGUAGES[0];

  useEffect(() => {
    (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setEmail(session?.user?.email ?? null);
    })();
  }, []);

  const subTypeLabel = isLifetime
    ? t('common.lifetimeAccess')
    : subscription?.type === 'monthly'
      ? t('common.monthlyAccess')
      : isExpired
        ? t('common.trialExpired')
        : t('common.freeTrial');

  const subEmoji = isLifetime ? '👑' : isExpired ? '⏰' : '✨';

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top + 6 }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [
            styles.backButton,
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
          <Text style={[styles.headerTitle, { color: colors.text }]}>{t('common.profile')}</Text>
          <Text style={[styles.headerSubtitle, { color: colors.mutedText }]}>
            {email || t('profilePage.notSignedIn')}
          </Text>
        </View>
      </View>

      <ScrollView ref={scrollRef} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {profileLoading ? (
          <View style={{ gap: 14 }}>
            <SkeletonRect height={180} borderRadius={UI.radius.xxl} />
            <SkeletonRect height={100} borderRadius={UI.radius.xxl} />
            <SkeletonRect height={260} borderRadius={UI.radius.xxl} />
          </View>
        ) : (
          <>
            {/* Profile hero card */}
            <View style={[styles.heroCard, { backgroundColor: '#8B6B47' }]}>
              <View style={styles.heroTop}>
                <View style={styles.heroAvatarWrap}>
                  <Text style={{ fontSize: 28 }}>🧘</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.heroName}>
                    {profile?.name || t('profilePage.yourProfile')}
                  </Text>
                  <Text style={styles.heroEmail}>{email || t('profilePage.setupProfile')}</Text>
                </View>
                <Pressable
                  onPress={() => router.push('/(tabs)/profile-edit')}
                  style={({ pressed }) => [styles.editBadge, { opacity: pressed ? 0.8 : 1 }]}
                >
                  <MaterialIcons name="edit" size={13} color="#8B6B47" />
                  <Text style={styles.editText}>{t('common.edit')}</Text>
                </Pressable>
              </View>

              {/* Goal & Routine */}
              <View style={styles.heroDivider} />
              <View style={styles.heroInfoRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.heroInfoLabel}>{t('profilePage.primaryGoal')}</Text>
                  <Text style={styles.heroInfoValue}>
                    {profile?.intention || t('common.notSet')}
                  </Text>
                </View>
                <View style={styles.heroInfoDivider} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.heroInfoLabel}>{t('profilePage.checkInRoutine')}</Text>
                  <Text style={styles.heroInfoValue}>{profile?.routine || t('common.notSet')}</Text>
                </View>
              </View>
            </View>

            {/* Subscription card */}
            <View
              style={[styles.subCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <View style={styles.subTop}>
                <View
                  style={[
                    styles.subIconWrap,
                    { backgroundColor: isExpired ? '#C45B5B20' : '#5B8A5A20' },
                  ]}
                >
                  <Text style={{ fontSize: 20 }}>{subEmoji}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.subTitle, { color: colors.text }]}>{subTypeLabel}</Text>
                  {subscription?.expiryDate && !isLifetime && (
                    <Text style={[styles.subExpiry, { color: colors.mutedText }]}>
                      {isExpired
                        ? t('profilePage.expired', {
                            date: new Date(subscription.expiryDate).toLocaleDateString(),
                          })
                        : t('profilePage.renews', {
                            date: new Date(subscription.expiryDate).toLocaleDateString(),
                          })}
                    </Text>
                  )}
                </View>
              </View>
              {!isLifetime && (
                <Pressable
                  onPress={() => router.push('/(utils)/trial-upgrade')}
                  style={({ pressed }) => [
                    styles.upgradeButton,
                    { transform: [{ scale: pressed ? 0.98 : 1 }] },
                  ]}
                >
                  <Text style={{ fontSize: 16 }}>⚡</Text>
                  <Text style={styles.upgradeText}>{t('profilePage.upgradeToPremium')}</Text>
                  <MaterialIcons name="arrow-forward" size={16} color="#FFFFFF" />
                </Pressable>
              )}
            </View>

            {/* Settings section */}
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                {t('profilePage.settingsTitle')}
              </Text>
            </View>

            <View
              style={[
                styles.settingsCard,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              {SETTINGS_ITEMS.map((item, index) => (
                <Pressable
                  key={item.key}
                  onPress={() => {
                    if (item.route === '__language__') {
                      setShowLanguagePicker(true);
                    } else {
                      router.push(item.route as any);
                    }
                  }}
                  style={({ pressed }) => [
                    styles.settingsRow,
                    {
                      borderBottomColor: colors.divider,
                      borderBottomWidth: index < SETTINGS_ITEMS.length - 1 ? 1 : 0,
                      backgroundColor: pressed
                        ? theme === 'light'
                          ? 'rgba(0,0,0,0.02)'
                          : 'rgba(255,255,255,0.03)'
                        : 'transparent',
                    },
                  ]}
                >
                  <View style={[styles.settingsIconWrap, { backgroundColor: item.tint + '15' }]}>
                    <Text style={{ fontSize: 16 }}>{item.emoji}</Text>
                  </View>
                  <Text style={[styles.settingsLabel, { color: colors.text }]}>
                    {t(item.label)}
                  </Text>
                  {item.key === 'language' && (
                    <Text style={{ fontSize: 13, color: colors.mutedText, fontWeight: '600' }}>
                      {currentLang.flag} {currentLang.label}
                    </Text>
                  )}
                  <MaterialIcons name="chevron-right" size={20} color={colors.mutedText} />
                </Pressable>
              ))}
            </View>

            {/* Sign out */}
            <Pressable
              onPress={() => signOut(queryClient)}
              style={({ pressed }) => [
                styles.signOutButton,
                {
                  backgroundColor: theme === 'light' ? '#C45B5B12' : '#C45B5B18',
                  borderColor: theme === 'light' ? '#C45B5B20' : '#C45B5B25',
                  transform: [{ scale: pressed ? 0.98 : 1 }],
                },
              ]}
            >
              <MaterialIcons
                name="logout"
                size={18}
                color={theme === 'light' ? '#C45B5B' : '#E87B7B'}
              />
              <Text
                style={[styles.signOutText, { color: theme === 'light' ? '#C45B5B' : '#E87B7B' }]}
              >
                {t('common.signOut')}
              </Text>
            </Pressable>

            {/* App version footer */}
            <Text style={[styles.versionText, { color: colors.subtleText }]}>
              {t('profilePage.version')} — Made with 💛
            </Text>
          </>
        )}
      </ScrollView>

      {/* Language picker modal */}
      <Modal
        visible={showLanguagePicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLanguagePicker(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowLanguagePicker(false)}>
          <View
            style={[
              styles.modalContent,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {t('profilePage.language')}
            </Text>

            {SUPPORTED_LANGUAGES.map((lang) => {
              const isSelected = i18n.language === lang.code;
              return (
                <Pressable
                  key={lang.code}
                  onPress={async () => {
                    await setLanguage(lang.code);
                    setShowLanguagePicker(false);
                  }}
                  style={({ pressed }) => [
                    styles.langRow,
                    {
                      backgroundColor: isSelected
                        ? '#5AAF8B15'
                        : pressed
                          ? theme === 'light'
                            ? 'rgba(0,0,0,0.03)'
                            : 'rgba(255,255,255,0.05)'
                          : 'transparent',
                      borderColor: isSelected ? '#5AAF8B' : colors.border,
                    },
                  ]}
                >
                  <Text style={{ fontSize: 24 }}>{lang.flag}</Text>
                  <Text
                    style={[
                      styles.langLabel,
                      {
                        color: colors.text,
                        fontWeight: isSelected ? '800' : '600',
                      },
                    ]}
                  >
                    {lang.label}
                  </Text>
                  {isSelected && (
                    <View style={styles.langCheck}>
                      <MaterialIcons name="check" size={16} color="#FFFFFF" />
                    </View>
                  )}
                </Pressable>
              );
            })}

            <Pressable
              onPress={() => setShowLanguagePicker(false)}
              style={({ pressed }) => [
                styles.modalClose,
                {
                  backgroundColor: theme === 'light' ? '#f2f2f2' : 'rgba(255,255,255,0.08)',
                  opacity: pressed ? 0.7 : 1,
                },
              ]}
            >
              <Text style={[styles.modalCloseText, { color: colors.text }]}>
                {t('common.close')}
              </Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: UI.spacing.xl,
  } as any,

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginTop: 6,
    marginBottom: 4,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '900',
  },
  headerSubtitle: {
    fontSize: 14,
    marginTop: 2,
  },

  scrollContent: {
    paddingTop: 16,
    paddingBottom: 100,
    gap: 14,
  },

  // Hero profile card
  heroCard: {
    borderRadius: UI.radius.xxl,
    padding: 20,
    ...UI.shadow.md,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  heroAvatarWrap: {
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.20)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroName: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
  },
  heroEmail: {
    color: 'rgba(255,255,255,0.70)',
    fontSize: 13,
    fontWeight: '500',
    marginTop: 2,
  },
  editBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.92)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  editText: {
    color: '#8B6B47',
    fontSize: 12,
    fontWeight: '800',
  },
  heroDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.18)',
    marginVertical: 16,
  },
  heroInfoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
  },
  heroInfoDivider: {
    width: 1,
    height: 36,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  heroInfoLabel: {
    color: 'rgba(255,255,255,0.60)',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  heroInfoValue: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },

  // Subscription card
  subCard: {
    borderRadius: UI.radius.xxl,
    padding: 18,
    borderWidth: 1,
    ...UI.shadow.sm,
  },
  subTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  subIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  subExpiry: {
    fontSize: 13,
    marginTop: 2,
  },
  upgradeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 14,
    backgroundColor: '#5B8A5A',
    paddingVertical: 13,
    borderRadius: UI.radius.md,
    ...UI.shadow.sm,
  },
  upgradeText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    flex: 1,
  },

  // Section
  sectionHeader: {
    marginTop: 6,
    marginBottom: -4,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '900',
  },

  // Settings card
  settingsCard: {
    borderRadius: UI.radius.xxl,
    borderWidth: 1,
    overflow: 'hidden',
    ...UI.shadow.sm,
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  settingsIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
  },

  // Sign out
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 15,
    borderRadius: UI.radius.lg,
    borderWidth: 1,
    marginTop: 6,
  },
  signOutText: {
    fontSize: 15,
    fontWeight: '800',
  },

  // Footer
  versionText: {
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
  },

  // Language modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  modalContent: {
    width: '100%',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    ...UI.shadow.md,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '900',
    marginBottom: 18,
    textAlign: 'center',
  },
  langRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 2,
    marginBottom: 10,
  },
  langLabel: {
    flex: 1,
    fontSize: 17,
  },
  langCheck: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#5AAF8B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalClose: {
    marginTop: 8,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  modalCloseText: {
    fontSize: 15,
    fontWeight: '700',
  },
});
