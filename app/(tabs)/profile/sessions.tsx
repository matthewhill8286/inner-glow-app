import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Text } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { palette } from '@/constants/theme';
import { Type } from '@/constants/typography';
import { AppButton } from '@/components/ui/AppButton';
import { LegalNote } from '@/components/ui/controls';
import { ListGroup, ListRow } from '@/components/ui/ListRow';
import { StatusState } from '@/components/ui/StatusState';
import { toast } from '@/components/Toast';
import { SettingsScreen, SettingsSection } from '@/components/settings/SettingsParts';
import { backTo } from '@/lib/navigation';
import { deviceFromUserAgent } from '@/lib/sessions';
import { showAlert } from '@/lib/state';
import { supabase } from '@/supabase/supabase';

type Session = {
  id: string;
  user_agent: string | null;
  created_at: string;
  last_active: string;
  is_current: boolean;
};

/**
 * Settings · Active sessions (08 §2.8, `6787:7485`): this device, the other devices with when they
 * were last active, and Sign out of other devices. Tapping another device signs just that one out.
 * The list comes from `list_my_sessions`; the design's city needs IP lookup and is left out.
 */
export default function ActiveSessions() {
  const { t, i18n } = useTranslation();
  const [sessions, setSessions] = useState<Session[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const { data, error } = await supabase.rpc('list_my_sessions');
    setFailed(!!error);
    if (!error) setSessions((data ?? []) as Session[]);
  }, []);
  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const lastActive = (iso: string) => {
    const days = Math.floor((Date.now() - Date.parse(iso)) / 86_400_000);
    const when =
      days < 1
        ? t('me.sessions.today')
        : days < 7
          ? t('me.sessions.daysAgo', { count: days })
          : new Date(iso).toLocaleDateString(i18n.language, { day: 'numeric', month: 'short' });
    return t('me.sessions.lastActive', { when });
  };

  const signOutOne = (s: Session) => {
    const device = deviceFromUserAgent(s.user_agent).name;
    showAlert(t('me.sessions.signOutOne', { device }), t('me.sessions.signOutOneBody'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('me.sessions.signOut'),
        style: 'destructive',
        onPress: () =>
          void supabase.rpc('revoke_my_session', { p_session_id: s.id }).then(({ error }) => {
            if (error) toast.error(error.message);
            else toast.success(t('me.sessions.done'));
            void load();
          }),
      },
    ]);
  };
  const signOutOthers = () =>
    showAlert(t('me.sessions.signOutOthersTitle'), t('me.sessions.signOutOthersBody'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('me.sessions.signOut'),
        style: 'destructive',
        onPress: async () => {
          setBusy(true);
          const { error } = await supabase.auth.signOut({ scope: 'others' });
          setBusy(false);
          if (error) toast.error(error.message);
          else toast.success(t('me.sessions.done'));
          void load();
        },
      },
    ]);

  const current = sessions?.find((s) => s.is_current);
  const others = sessions?.filter((s) => !s.is_current) ?? [];
  const icon = (ua: string | null) =>
    deviceFromUserAgent(ua).kind === 'web' ? 'line/globe' : 'line/activity';

  return (
    <SettingsScreen
      title={t('me.sessions.title')}
      backLabel={t('common.back')}
      onBack={() => backTo(undefined, '/(tabs)/profile/security')}
      contentStyle={{ gap: 24 }}
      cta={
        others.length ? (
          <AppButton
            title={t('me.sessions.signOutOthers')}
            variant="secondary"
            busy={busy}
            onPress={signOutOthers}
          />
        ) : undefined
      }
    >
      <Text
        accessibilityRole="header"
        style={[Type.titleMd, { fontSize: 26, lineHeight: 34, color: palette.ink }]}
      >
        {t('me.sessions.heading')}
      </Text>
      {failed ? (
        <StatusState
          title={t('me.sessions.title')}
          message={t('me.sessions.error')}
          onRetry={() => void load()}
        />
      ) : !sessions ? (
        <ActivityIndicator color={palette.plum} />
      ) : (
        <>
          {current && (
            <SettingsSection label={t('me.sessions.thisDevice')}>
              <ListGroup>
                <ListRow
                  icon={icon(current.user_agent)}
                  label={deviceFromUserAgent(current.user_agent).name}
                  supportingText={t('me.sessions.activeNow')}
                  trailing="none"
                />
              </ListGroup>
            </SettingsSection>
          )}
          <SettingsSection label={t('me.sessions.others')}>
            {others.length ? (
              <ListGroup>
                {others.map((s) => (
                  <ListRow
                    key={s.id}
                    icon={icon(s.user_agent)}
                    label={deviceFromUserAgent(s.user_agent).name}
                    supportingText={lastActive(s.last_active)}
                    onPress={() => signOutOne(s)}
                  />
                ))}
              </ListGroup>
            ) : (
              <Text style={[Type.captionM, { color: palette.textMuted }]}>
                {t('me.sessions.none')}
              </Text>
            )}
          </SettingsSection>
          <LegalNote text={t('me.sessions.note')} />
        </>
      )}
    </SettingsScreen>
  );
}
