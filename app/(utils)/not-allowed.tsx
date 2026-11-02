import React from 'react';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { UtilityState } from '@/components/ui/UtilityState';
import { backTo } from '@/lib/navigation';

/** Private (05 §5.1): the lock ring. Sign in replaces the old mailto to a retired address. */
export default function NotAllowedScreen() {
  const { t } = useTranslation();
  return (
    <UtilityState
      kind="private"
      title={t('utilityStates.private.title')}
      body={t('utilityStates.private.body')}
      chip={t('utilityStates.private.chip')}
      chipIcon="line/lock"
      cta={t('utilityStates.private.cta')}
      onCta={() => router.replace('/(auth)/sign-in')}
      link={t('utilityStates.private.link')}
      onLink={() => router.replace('/(tabs)/home')}
      backLabel={t('common.back')}
      onBack={() => backTo(undefined, '/(tabs)/home')}
    />
  );
}
