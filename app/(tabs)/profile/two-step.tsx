import React, { useCallback, useState } from 'react';
import { Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { palette } from '@/constants/theme';
import { Type } from '@/constants/typography';
import { Icon } from '@/components/icons/Icon';
import { AppButton } from '@/components/ui/AppButton';
import { ListGroup, ListRow } from '@/components/ui/ListRow';
import { SettingsScreen } from '@/components/settings/SettingsParts';
import { backTo } from '@/lib/navigation';
import { supabase } from '@/supabase/supabase';

/**
 * Settings · Two-step verification (`6801:6899`): the shield, "Add an extra lock", the method and
 * Turn on. Only the authenticator app is offered: the design's text-message option needs an SMS
 * provider that the project does not have. Turn on and Manage open the existing set-up flow.
 */
export default function TwoStep() {
  const { t } = useTranslation();
  const [on, setOn] = useState<boolean | null>(null);

  useFocusEffect(
    useCallback(() => {
      let live = true;
      void supabase.auth.mfa
        .listFactors()
        .then(({ data }) => live && setOn(!!data?.totp?.some((f) => f.status === 'verified')));
      return () => {
        live = false;
      };
    }, []),
  );

  return (
    <SettingsScreen
      title={t('me.twoStep.title')}
      backLabel={t('common.back')}
      onBack={() => backTo(undefined, '/(tabs)/profile/security')}
      cta={
        <AppButton
          title={t(on ? 'me.twoStep.manage' : 'me.twoStep.turnOn')}
          disabled={on === null}
          onPress={() => router.push('/(auth)/two-factor-setup')}
        />
      }
    >
      <View style={{ alignItems: 'center', gap: 16 }}>
        <View
          style={{
            width: 96,
            height: 96,
            borderRadius: 48,
            backgroundColor: palette.selected,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon name="line/shield" size={28} />
        </View>
        <Text
          accessibilityRole="header"
          style={[
            Type.titleMd,
            { fontSize: 28, lineHeight: 36, color: palette.ink, textAlign: 'center' },
          ]}
        >
          {t(on ? 'me.twoStep.headingOn' : 'me.twoStep.heading')}
        </Text>
        <Text style={[Type.bodySm, { color: palette.textMuted, textAlign: 'center' }]}>
          {t('me.twoStep.body')}
        </Text>
      </View>
      <ListGroup>
        <ListRow
          icon="line/lock"
          label={t('me.twoStep.app')}
          supportingText={t('me.twoStep.appBody')}
          trailing="radio"
          selected
        />
      </ListGroup>
    </SettingsScreen>
  );
}
