import React from 'react';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { UtilityState } from '@/components/ui/UtilityState';
import { backTo } from '@/lib/navigation';

/** 500 (05 §5.1): the off-balance contours. Try again goes back to where the error happened. */
export default function InternalErrorScreen() {
  const { t } = useTranslation();
  return (
    <UtilityState
      kind="serverError"
      title={t('utilityStates.serverError.title')}
      body={t('utilityStates.serverError.body')}
      chip={t('utilityStates.serverError.chip')}
      chipIcon="line/activity"
      cta={t('utilityStates.serverError.cta')}
      onCta={() => backTo(undefined, '/(tabs)/home')}
      link={t('utilityStates.serverError.link')}
      onLink={() => router.push('/(utils)/support')}
      backLabel={t('common.back')}
      onBack={() => backTo(undefined, '/(tabs)/home')}
    />
  );
}
