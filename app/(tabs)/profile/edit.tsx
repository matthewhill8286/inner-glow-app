import { backTo, finishTo } from '@/lib/navigation';
import { PROFILE_GOALS, PROFILE_ROUTINES, profileChoiceValue } from '@/lib/profile-choices';
import { AppField } from '@/components/ui/AppField';
import { AppButton } from '@/components/ui/AppButton';
import { screenBottomPadding } from '@/lib/screen-layout';
import { Typography } from '@/constants/typography';
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useProfile } from '@/hooks/useProfile';
import { toast } from '@/components/Toast';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, UI } from '@/constants/theme';
import ScreenHeader from '@/components/ScreenHeader';

function RadioOption({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];
  const { fontScale } = useWindowDimensions();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityLabel={label}
      accessibilityState={{ checked: selected }}
      aria-checked={selected}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: selected ? '#828a6a' : colors.card,
        paddingVertical: 16,
        paddingHorizontal: 14,
        gap: 10,
        minWidth: 160 * Math.min(fontScale, 1.5),
        maxWidth: '100%',
        borderRadius: 16,
        flexBasis: '45%',
        flexGrow: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
      }}
    >
      <Text
        style={{
          fontFamily: Typography.family.body,
          fontSize: 16,
          fontWeight: Typography.weight.semibold,
          color: selected ? 'white' : colors.text,
          flex: 1,
        }}
      >
        {label}
      </Text>
      <View
        style={{
          width: 24,
          height: 24,
          flexShrink: 0,
          borderRadius: 12,
          borderWidth: 2,
          borderColor: selected ? 'white' : colors.text,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: selected ? 1 : 0.3,
        }}
      >
        {selected && (
          <View
            style={{
              width: 12,
              height: 12,
              borderRadius: 6,
              backgroundColor: 'white',
            }}
          />
        )}
      </View>
    </Pressable>
  );
}

export default function ProfileEdit() {
  const { t } = useTranslation();
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];
  const insets = useSafeAreaInsets();
  const { profile, isLoading, saveProfile, isSavingProfile } = useProfile();

  const [name, setName] = useState('');
  const [intention, setIntention] = useState('');
  const [routine, setRoutine] = useState('');

  useEffect(() => {
    if (profile) {
      setName(profile.name || '');
      setIntention(profile.intention || '');
      setRoutine(profile.routine || '');
    }
  }, [profile]);

  async function handleSave() {
    try {
      await saveProfile({
        ...profile,
        name: name.trim() || undefined,
        intention: intention || undefined,
        routine: routine || undefined,
      });
      toast.success(t('profileEdit.profileUpdated'));
      finishTo('/(tabs)/profile');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to save your profile.');
    }
  }

  if (isLoading) {
    return null;
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{
        flex: 1,
        backgroundColor: colors.background,
        paddingHorizontal: UI.spacing.xl,
      }}
    >
      <ScreenHeader
        title={t('profileEdit.title')}
        showBack
        onBack={() => backTo('/(tabs)/profile', '/(tabs)/profile')}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          paddingBottom: screenBottomPadding(insets.bottom, false),
          paddingTop: 14,
        }}
      >
        <AppField
          label={t('profileEdit.yourName')}
          value={name}
          onChangeText={setName}
          placeholder={t('profileEdit.namePlaceholder')}
          autoComplete="name"
          maxLength={80}
        />

        <Text style={[styles.label, { marginTop: 24, color: colors.mutedText }]}>
          {t('profileEdit.primaryGoal')}
        </Text>
        <View style={{ marginTop: 12, flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          {PROFILE_GOALS.map((key) => (
            <RadioOption
              key={key}
              label={t('profileSetup.' + key)}
              selected={intention === profileChoiceValue(key)}
              onPress={() => setIntention(profileChoiceValue(key))}
            />
          ))}
        </View>

        <Text style={[styles.label, { marginTop: 24, color: colors.mutedText }]}>
          {t('profileEdit.checkInTime')}
        </Text>
        <View style={{ marginTop: 12, flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          {PROFILE_ROUTINES.map((key) => (
            <RadioOption
              key={key}
              label={t('profileSetup.' + key)}
              selected={routine === profileChoiceValue(key)}
              onPress={() => setRoutine(profileChoiceValue(key))}
            />
          ))}
        </View>

        <AppButton
          title={t('profileEdit.saveChanges')}
          busy={isSavingProfile}
          onPress={handleSave}
          style={{ marginTop: 32 }}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  label: {
    fontFamily: Typography.family.body,
    fontSize: 16,
    fontWeight: Typography.weight.medium,
    color: '#6a5e55',
    marginLeft: 4,
  },
  input: {
    fontFamily: Typography.family.body,
    marginTop: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 20,
    fontSize: 16,
    fontWeight: Typography.weight.semibold,
  },
});
