import React from 'react';
import * as Notifications from 'expo-notifications';
import { useTranslation } from 'react-i18next';
import { UtilityState } from '@/components/ui/UtilityState';
import { toast } from '@/components/Toast';
import { backTo } from '@/lib/navigation';
import { scheduleNotification } from '@/lib/notifications';

/** Expected length of an update; there is no maintenance flag with a real ETA yet (05 §5.3). */
const ETA_MINUTES = 30;

/** Maintenance (05 §5.1): the moon. Notify me sets a reminder for when the update should be done. */
export default function MaintenanceScreen() {
  const { t } = useTranslation();
  const notify = async () => {
    try {
      await scheduleNotification(t('utilityStates.maintenance.notifyTitle'), t('utilityStates.maintenance.notifyBody'), { route: '/(tabs)/home' }, {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: ETA_MINUTES * 60,
      });
      toast.success(t('utilityStates.maintenance.notifySet'));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t('utilityStates.maintenance.notifyError'));
    }
  };
  return (
    <UtilityState
      kind="maintenance"
      title={t('utilityStates.maintenance.title')}
      body={t('utilityStates.maintenance.body')}
      chip={t('utilityStates.maintenance.chip', { minutes: ETA_MINUTES })}
      chipIcon="line/moon"
      cta={t('utilityStates.maintenance.cta')}
      onCta={notify}
      link={t('utilityStates.maintenance.link')}
      onLink={() => backTo(undefined, '/(tabs)/home')}
      backLabel={t('common.back')}
      onBack={() => backTo(undefined, '/(tabs)/home')}
    />
  );
}
