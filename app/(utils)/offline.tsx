import React from 'react';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { UtilityState } from '@/components/ui/UtilityState';

/**
 * Offline (05 §5.1): the signal arcs. Try again restarts from the entry route, which checks the
 * session again; "Open offline mode" goes to the journal, which saves on the device.
 */
export default function NoInternetScreen() {
  const { t } = useTranslation();
  return (
    <UtilityState
      kind="offline"
      title={t('utilityStates.offline.title')}
      body={t('utilityStates.offline.body')}
      chip={t('utilityStates.offline.chip')}
      chipIcon="line/leaf"
      cta={t('utilityStates.offline.cta')}
      onCta={() => router.replace('/')}
      link={t('utilityStates.offline.link')}
      onLink={() => router.replace('/(tabs)/journal')}
      backLabel={t('common.back')}
    />
  );
}
