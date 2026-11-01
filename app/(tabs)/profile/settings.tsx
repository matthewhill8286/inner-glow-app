import React, { useCallback, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { palette } from '@/constants/theme';
import { Type } from '@/constants/typography';
import { Glow } from '@/components/glow/Glow';
import { AppButton } from '@/components/ui/AppButton';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { ListGroup, ListRow } from '@/components/ui/ListRow';
import { toast } from '@/components/Toast';
import { SettingsScreen, SettingsSection } from '@/components/settings/SettingsParts';
import { useSubscription } from '@/hooks/useSubscription';
import { useUser } from '@/hooks/useUser';
import { SUPPORTED_LANGUAGES } from '@/i18n';
import { biometricSupport, isAppLockEnabled } from '@/lib/app-lock';
import { backTo } from '@/lib/navigation';
import { notificationPermission } from '@/lib/notifications';
import { authTokenVar } from '@/lib/state';
import { SESSION_KEY } from '@/lib/storage';
import { supabase } from '@/supabase/supabase';

/** Log out of Inner Glow? (`6801:6965`): a bottom sheet with Log out (danger) and Stay signed in. */
function LogOutSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState(false);
  async function logOut() {
    setBusy(true);
    try {
      await supabase.auth.signOut();
      await AsyncStorage.removeItem(SESSION_KEY);
      // The sheet promises reminders on this phone stop until the person signs back in.
      await Notifications.cancelAllScheduledNotificationsAsync().catch(() => {});
      queryClient.clear();
      authTokenVar(null);
      onClose();
      router.replace('/(auth)/sign-in');
    } catch {
      toast.error(t('toasts.signOutError'));
    } finally {
      setBusy(false);
    }
  }
  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      background={palette.bg}
      gap={12}
      closeLabel={t('me.settings.stay')}
    >
      <Text
        accessibilityRole="header"
        style={[
          Type.titleSm,
          { fontSize: 20, lineHeight: 28, color: palette.ink, textAlign: 'center', marginTop: 8 },
        ]}
      >
        {t('me.settings.logoutTitle')}
      </Text>
      <Text style={[Type.captionM, { color: palette.textMuted, textAlign: 'center' }]}>
        {t('me.settings.logoutBody')}
      </Text>
      <View style={{ alignSelf: 'stretch', gap: 4, marginTop: 8 }}>
        <AppButton
          title={t('me.settings.logoutConfirm')}
          variant="danger"
          busy={busy}
          onPress={() => void logOut()}
        />
        <AppButton title={t('me.settings.stay')} variant="text" onPress={onClose} />
      </View>
    </BottomSheet>
  );
}

/**
 * Settings (06 P2, `6719:4516`): General, Your plan, Privacy & security, Support and Account, with
 * the app version below. Values are live: notification permission, language and the app lock's
 * biometric name. Community keeps its row under Support, since the design has no other way in.
 */
export default function Settings() {
  const { t, i18n } = useTranslation();
  const { data: user } = useUser();
  const { hasFullAccess } = useSubscription();
  const [logOutOpen, setLogOutOpen] = useState(false);
  const [notificationsOn, setNotificationsOn] = useState<boolean | null>(null);
  const [lockLabel, setLockLabel] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      let live = true;
      void notificationPermission().then((on) => live && setNotificationsOn(on));
      void Promise.all([isAppLockEnabled(user?.id), biometricSupport()]).then(([on, support]) => {
        if (live)
          setLockLabel(
            on && support.kind ? t(`me.settings.biometrics.${support.kind}`) : t('me.settings.off'),
          );
      });
      return () => {
        live = false;
      };
    }, [user?.id, t]),
  );

  const language =
    SUPPORTED_LANGUAGES.find((l) => l.code === i18n.language)?.label ??
    SUPPORTED_LANGUAGES[0].label;
  const go = (pathname: string) => () => router.push(pathname as never);

  return (
    <SettingsScreen
      title={t('me.settings.title')}
      backLabel={t('common.back')}
      onBack={() => backTo(undefined, '/(tabs)/profile')}
      largeTitle={t('me.settings.title')}
      glows={[{ color: palette.lavenderSoft, opacity: 0.22, x: -70, y: -50, width: 280, blur: 90 }]}
    >
      <SettingsSection label={t('me.settings.general')}>
        <ListGroup>
          <ListRow
            icon="line/user"
            label={t('me.settings.personal')}
            onPress={go('/(tabs)/profile/edit')}
          />
          <ListRow
            icon="line/bell"
            label={t('me.settings.notifications')}
            value={
              notificationsOn === null
                ? undefined
                : t(notificationsOn ? 'me.settings.on' : 'me.settings.off')
            }
            onPress={go('/(tabs)/profile/notifications')}
          />
          <ListRow
            icon="line/globe"
            label={t('me.settings.language')}
            value={language}
            onPress={go('/(tabs)/profile/language')}
          />
          <ListRow
            icon="line/eye"
            label={t('me.settings.accessibility')}
            onPress={go('/(tabs)/profile/accessibility')}
          />
        </ListGroup>
      </SettingsSection>

      <SettingsSection label={t('me.settings.yourPlan')}>
        <View
          style={{
            minHeight: 96,
            backgroundColor: palette.white,
            borderRadius: 24,
            overflow: 'hidden',
            flexDirection: 'row',
            alignItems: 'center',
            padding: 20,
            gap: 12,
          }}
        >
          <Glow
            color={palette.mustard}
            opacity={0.3}
            width={160}
            blur={50}
            style={{ position: 'absolute', left: 200, top: -40 }}
          />
          <Glow
            color={palette.lavenderSoft}
            opacity={0.3}
            width={100}
            blur={40}
            style={{ position: 'absolute', left: 240, top: 20 }}
          />
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={[Type.bodyMSemi, { fontSize: 17, lineHeight: 22, color: palette.ink }]}>
              {t(hasFullAccess ? 'me.settings.proPlan' : 'me.settings.freePlan')}
            </Text>
            <Text style={[Type.captionM, { color: palette.textMuted }]}>
              {t(hasFullAccess ? 'me.settings.proBody' : 'me.settings.freeBody')}
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            onPress={go(hasFullAccess ? '/(tabs)/profile/plan' : '/(utils)/trial-upgrade')}
            style={({ pressed }) => ({
              height: 36,
              borderRadius: 18,
              paddingHorizontal: 14,
              backgroundColor: pressed ? palette.plumDeep : palette.plum,
              alignItems: 'center',
              justifyContent: 'center',
            })}
          >
            <Text style={[Type.buttonS, { fontSize: 13, color: palette.white }]}>
              {t(hasFullAccess ? 'me.settings.viewPlan' : 'me.settings.seePlans')}
            </Text>
          </Pressable>
        </View>
      </SettingsSection>

      <SettingsSection label={t('me.settings.privacy')}>
        <ListGroup>
          <ListRow
            icon="line/lock"
            label={t('me.settings.security')}
            value={lockLabel ?? undefined}
            onPress={go('/(tabs)/profile/security')}
          />
          <ListRow
            icon="line/bot"
            label={t('me.settings.glowData')}
            onPress={go('/(tabs)/chat/customize')}
          />
          <ListRow
            icon="line/plus"
            label={t('me.settings.connected')}
            onPress={go('/(tabs)/profile/connected-apps')}
          />
        </ListGroup>
      </SettingsSection>

      <SettingsSection label={t('me.settings.support')}>
        <ListGroup>
          <ListRow
            icon="line/chat"
            label={t('me.settings.help')}
            onPress={go('/(utils)/help-center')}
          />
          <ListRow
            icon="line/users"
            label={t('me.settings.community')}
            onPress={go('/(tabs)/community')}
          />
          <ListRow
            icon="line/star"
            label={t('me.settings.feedback')}
            onPress={go('/(utils)/support')}
          />
          <ListRow icon="line/note" label={t('me.settings.legal')} onPress={go('/(utils)/legal')} />
        </ListGroup>
      </SettingsSection>

      <SettingsSection label={t('me.settings.account')}>
        <ListGroup>
          <ListRow
            icon="line/logout"
            label={t('me.settings.logout')}
            trailing="none"
            onPress={() => setLogOutOpen(true)}
          />
          <ListRow
            icon="line/trash"
            label={t('me.settings.deleteAccount')}
            tone="danger"
            onPress={go('/(utils)/delete-account')}
          />
        </ListGroup>
      </SettingsSection>

      <Text
        style={[Type.captionS, { color: palette.textSubtle, textAlign: 'center', marginTop: -16 }]}
      >
        {t('me.settings.version', { version: Constants.expoConfig?.version ?? '' })}
      </Text>
      <LogOutSheet visible={logOutOpen} onClose={() => setLogOutOpen(false)} />
    </SettingsScreen>
  );
}
