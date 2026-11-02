import React from 'react';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { UtilityState } from '@/components/ui/UtilityState';
import { backTo } from '@/lib/navigation';

/** 404 (05 §5.1): the drifting path. Also shown for unknown routes by `app/+not-found.tsx`. */
export default function NotFoundScreen() {
  const { t } = useTranslation();
  return (
    <UtilityState
      kind="notFound"
      title={t('utilityStates.notFound.title')}
      body={t('utilityStates.notFound.body')}
      chip={t('utilityStates.notFound.chip')}
      chipIcon="line/chart"
      cta={t('utilityStates.notFound.cta')}
      onCta={() => router.replace('/(tabs)/home')}
      link={t('utilityStates.notFound.link')}
      onLink={() => backTo(undefined, '/(tabs)/home')}
      backLabel={t('common.back')}
      onBack={() => backTo(undefined, '/(tabs)/home')}
    />
  );
}
