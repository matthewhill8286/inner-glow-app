import { profileChoiceLabel } from '@/lib/profile-choices';
import { Typography } from '@/constants/typography';
import { UI } from '@/constants/theme';
import { backTo } from '@/lib/navigation';
import { WellnessIconText } from '@/components/WellnessIconText';
import React, { useMemo, useState } from 'react';
import { View, Text, Pressable, TextInput, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import ProfileProgressRing from '@/components/ProfileProgressRing';
import Chips from '@/components/Chips';
import { useProfile } from '@/hooks/useProfile';
import { SUPPORTED_LANGUAGES, setLanguage, type LanguageCode } from '@/i18n';

type StepKey = 'intro' | 'language' | 'name' | 'intention' | 'routine' | 'finish';
const STEPS: StepKey[] = ['intro', 'language', 'name', 'intention', 'routine', 'finish'];

export default function ProfileSetup() {
  const { t, i18n } = useTranslation();
  const insets = useSafeAreaInsets();
  const { saveProfile, isSavingProfile: saving } = useProfile();

  const [step, setStep] = useState(0);
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageCode>(
    i18n.language as LanguageCode,
  );
  const [name, setName] = useState('');
  const [intention, setIntention] = useState<string | undefined>();
  const [routine, setRoutine] = useState<string | undefined>();

  const progress = useMemo(() => Math.round(((step + 1) / STEPS.length) * 100), [step]);
  const stepKey = STEPS[step];

  async function next() {
    if (stepKey === 'language') {
      await setLanguage(selectedLanguage);
    }
    if (stepKey === 'finish') {
      await saveProfile({
        name: name.trim() || undefined,
        intention: intention,
        routine: routine,
      });
      router.replace('/(onboarding)/profile-completion');
      return;
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  function back() {
    if (step === 0) {
      backTo(undefined, '/(tabs)/home');
      return;
    }
    setStep((s) => Math.max(s - 1, 0));
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#6f6660', padding: 24, paddingTop: insets.top + 16 }}>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 20,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Pressable
            onPress={back}
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
            <Text style={{ fontFamily: Typography.family.body, color: 'white', fontSize: 24 }}>
              ←
            </Text>
          </Pressable>
          <Text style={{ ...Typography.section, color: 'white' }}>{t('profileSetup.title')}</Text>
        </View>
        <ProfileProgressRing progress={progress} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={{
            paddingVertical: 24,
            paddingHorizontal: 20,
            backgroundColor: 'white',
            borderRadius: 32,
            minHeight: 400,
          }}
        >
          {stepKey === 'intro' && (
            <>
              <Text
                style={{ ...Typography.heading, fontSize: 24, marginTop: 18, color: '#6a5e55' }}
              >
                {t('profileSetup.heading')}
              </Text>
              <Text
                style={{
                  fontFamily: Typography.family.body,
                  opacity: 0.7,
                  marginTop: 10,
                  color: '#6a5e55',
                  fontSize: 16,
                }}
              >
                {t('profileSetup.subtitle')}
              </Text>
            </>
          )}

          {stepKey === 'language' && (
            <>
              <Text style={{ ...Typography.heading, marginTop: 18, color: '#6a5e55' }}>
                {t('profileSetup.languageQuestion')}
              </Text>
              <Text style={{ opacity: 0.7, marginTop: 8, color: '#6a5e55' }}>
                {t('profileSetup.languageSubtitle')}
              </Text>
              <View style={{ marginTop: 20, gap: 10 }}>
                {SUPPORTED_LANGUAGES.map((lang) => {
                  const isSelected = selectedLanguage === lang.code;
                  return (
                    <Pressable
                      key={lang.code}
                      onPress={() => setSelectedLanguage(lang.code)}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 14,
                        paddingVertical: 16,
                        paddingHorizontal: 18,
                        borderRadius: 16,
                        backgroundColor: isSelected ? '#a07b5515' : '#f2f2f2',
                        borderWidth: 2,
                        borderColor: isSelected ? '#a07b55' : 'transparent',
                      }}
                    >
                      <WellnessIconText
                        style={{ fontFamily: Typography.family.body, fontSize: 26 }}
                      >
                        {lang.flag}
                      </WellnessIconText>
                      <Text
                        style={{
                          fontFamily: Typography.family.body,
                          flex: 1,
                          fontSize: 17,
                          fontWeight: isSelected ? Typography.weight.bold : '600',
                          color: '#6a5e55',
                        }}
                      >
                        {lang.label}
                      </Text>
                      {isSelected && (
                        <View
                          style={{
                            width: 24,
                            height: 24,
                            borderRadius: 12,
                            backgroundColor: '#a07b55',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Text
                            style={{
                              fontFamily: Typography.family.body,
                              color: 'white',
                              fontSize: 14,
                              fontWeight: Typography.weight.semibold,
                            }}
                          >
                            ✓
                          </Text>
                        </View>
                      )}
                    </Pressable>
                  );
                })}
              </View>
            </>
          )}

          {stepKey === 'name' && (
            <>
              <Text style={{ ...Typography.heading, marginTop: 18, color: '#6a5e55' }}>
                {t('profileSetup.nameQuestion')}
              </Text>
              <Text style={{ opacity: 0.7, marginTop: 8, color: '#6a5e55' }}>
                {t('profileSetup.nameOptional')}
              </Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder={t('profileSetup.namePlaceholder')}
                style={{
                  fontFamily: Typography.family.body,
                  marginTop: 16,
                  paddingVertical: 14,
                  paddingHorizontal: 16,
                  borderRadius: 16,
                  backgroundColor: '#f2f2f2',
                  fontSize: 16,
                }}
              />
            </>
          )}

          {stepKey === 'intention' && (
            <>
              <Text style={{ ...Typography.heading, marginTop: 18, color: '#6a5e55' }}>
                {t('profileSetup.intentionQuestion')}
              </Text>
              <Text style={{ opacity: 0.7, marginTop: 8, color: '#6a5e55' }}>
                {t('profileSetup.pickOne')}
              </Text>
              <Chips
                options={[
                  t('profileSetup.goalCalm'),
                  t('profileSetup.goalFocus'),
                  t('profileSetup.goalSleep'),
                  t('profileSetup.goalStress'),
                  t('profileSetup.goalConfidence'),
                  t('profileSetup.goalBalance'),
                ]}
                value={profileChoiceLabel(intention, 'goal', t) ?? undefined}
                onChange={(v) => setIntention(v as string)}
              />
            </>
          )}

          {stepKey === 'routine' && (
            <>
              <Text style={{ ...Typography.heading, marginTop: 18, color: '#6a5e55' }}>
                {t('profileSetup.routineQuestion')}
              </Text>
              <Text style={{ opacity: 0.7, marginTop: 8, color: '#6a5e55' }}>
                {t('profileSetup.pickOne')}
              </Text>
              <Chips
                options={[
                  t('profileSetup.routineMorning'),
                  t('profileSetup.routineEvening'),
                  t('profileSetup.routineAnytime'),
                ]}
                value={profileChoiceLabel(routine, 'routine', t) ?? undefined}
                onChange={(v) => setRoutine(v as string)}
              />
            </>
          )}

          {stepKey === 'finish' && (
            <>
              <Text style={{ ...Typography.heading, marginTop: 18, color: '#6a5e55' }}>
                {t('profileSetup.allSet')}
              </Text>
              <Text style={{ opacity: 0.7, marginTop: 10, color: '#6a5e55' }}>
                {t('profileSetup.nextSuggestion')}
              </Text>

              <View
                style={{
                  marginTop: 24,
                  backgroundColor: '#f9f9f9',
                  padding: 18,
                  borderRadius: 20,
                }}
              >
                <Text
                  style={{
                    fontFamily: Typography.family.body,
                    fontWeight: Typography.weight.semibold,
                    color: '#6a5e55',
                  }}
                >
                  {t('profileSetup.language')}
                </Text>
                <Text style={{ opacity: 0.7, color: '#6a5e55' }}>
                  {SUPPORTED_LANGUAGES.find((l) => l.code === selectedLanguage)?.label ??
                    selectedLanguage}
                </Text>

                <Text
                  style={{
                    fontFamily: Typography.family.body,
                    fontWeight: Typography.weight.semibold,
                    marginTop: 12,
                    color: '#6a5e55',
                  }}
                >
                  {t('profileSetup.name')}
                </Text>
                <Text style={{ opacity: 0.7, color: '#6a5e55' }}>
                  {name.trim() || t('common.notSet')}
                </Text>

                <Text
                  style={{
                    fontFamily: Typography.family.body,
                    fontWeight: Typography.weight.semibold,
                    marginTop: 12,
                    color: '#6a5e55',
                  }}
                >
                  {t('profileSetup.goal')}
                </Text>
                <Text style={{ opacity: 0.7, color: '#6a5e55' }}>
                  {profileChoiceLabel(intention, 'goal', t) ?? t('common.notSet')}
                </Text>

                <Text
                  style={{
                    fontFamily: Typography.family.body,
                    fontWeight: Typography.weight.semibold,
                    marginTop: 12,
                    color: '#6a5e55',
                  }}
                >
                  {t('profileSetup.routine')}
                </Text>
                <Text style={{ opacity: 0.7, color: '#6a5e55' }}>
                  {profileChoiceLabel(routine, 'routine', t) ?? t('common.notSet')}
                </Text>
              </View>
            </>
          )}
        </View>

        <View style={{ marginTop: 30 }}>
          <Pressable
            onPress={next}
            disabled={saving}
            style={{
              paddingVertical: 20,
              borderRadius: 35,
              backgroundColor: '#a07b55',
              alignItems: 'center',
              flexDirection: 'row',
              justifyContent: 'center',
              gap: 10,
              opacity: saving ? 0.7 : 1,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.1,
              shadowRadius: 10,
              elevation: 4,
            }}
          >
            <Text
              style={{
                fontFamily: Typography.family.body,
                color: 'white',
                fontWeight: Typography.weight.semibold,
                fontSize: 18,
              }}
            >
              {saving
                ? t('profileSetup.saving')
                : stepKey === 'finish'
                  ? t('common.complete')
                  : t('common.next')}
            </Text>
            {!saving && (
              <Text style={{ fontFamily: Typography.family.body, color: 'white', fontSize: 20 }}>
                →
              </Text>
            )}
          </Pressable>
        </View>

        <Pressable
          onPress={() => router.replace('/(onboarding)/suggested-categories')}
          style={{ marginTop: 20 }}
        >
          <Text
            style={{
              fontFamily: Typography.family.body,
              color: 'white',
              opacity: 0.65,
              textAlign: 'center',
              fontWeight: Typography.weight.semibold,
            }}
          >
            {t('profileSetup.skipSetup')}
          </Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}
