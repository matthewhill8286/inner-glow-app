import React, { useCallback, useState } from 'react';
import { Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { palette } from '@/constants/theme';
import { Type } from '@/constants/typography';
import { Glow } from '@/components/glow/Glow';
import { ListGroup, ListRow } from '@/components/ui/ListRow';
import { toast } from '@/components/Toast';
import { SettingsScreen, SettingsSection } from '@/components/settings/SettingsParts';
import ShieldArt from '@/assets/svg/illustrations/settings/shield.svg';
import { useUser } from '@/hooks/useUser';
import {
  authenticate,
  biometricSupport,
  isAppLockEnabled,
  setAppLockEnabled,
} from '@/lib/app-lock';
import { backTo } from '@/lib/navigation';
import { loadDeliveryPrefs, setDeliveryPrefs } from '@/lib/notifications';
import type { BiometricKind } from '@/lib/profile-setup';
import { supabase } from '@/supabase/supabase';

const KNOB = '#FFF6D6';

/** iOS names the method; other phones get the Android wording (`6787:7668`). */
function lockCopy(kind: BiometricKind | null): { label: string; body: string } {
  if (kind === 'faceId') return { label: 'me.security.faceId', body: 'me.security.faceIdBody' };
  if (kind === 'touchId') return { label: 'me.security.touchId', body: 'me.security.touchIdBody' };
  return { label: 'me.security.biometric', body: 'me.security.biometricBody' };
}

/**
 * Security (06 P5 `6720:4617`, Android 08 §2.10 `6787:7668`): the shield, App lock (biometric unlock
 * and Hide previews) and Account (Change password, Two-step verification, Active sessions). Turning
 * the lock on asks for the biometric first, so it cannot lock someone out.
 */
export default function Security() {
  const { t } = useTranslation();
  const { data: user } = useUser();
  const [support, setSupport] = useState<{ available: boolean; kind: BiometricKind | null }>({
    available: false,
    kind: null,
  });
  const [lockOn, setLockOn] = useState(false);
  const [hidePreviews, setHidePreviews] = useState(false);
  const [twoStep, setTwoStep] = useState<boolean | null>(null);
  const [devices, setDevices] = useState<number | null>(null);

  useFocusEffect(
    useCallback(() => {
      let live = true;
      void Promise.all([biometricSupport(), isAppLockEnabled(user?.id), loadDeliveryPrefs()]).then(
        ([s, on, d]) => {
          if (!live) return;
          setSupport(s);
          setLockOn(on);
          setHidePreviews(d.hidePreviews);
        },
      );
      void supabase.auth.mfa
        .listFactors()
        .then(({ data }) => live && setTwoStep(!!data?.totp?.some((f) => f.status === 'verified')));
      void supabase
        .rpc('list_my_sessions')
        .then(({ data }) => live && setDevices(data?.length ?? null));
      return () => {
        live = false;
      };
    }, [user?.id]),
  );

  async function toggleLock(on: boolean) {
    if (!user?.id) return;
    if (on && !(await authenticate(t('me.security.unlockPrompt'), t('common.cancel')))) return;
    await setAppLockEnabled(user.id, on);
    setLockOn(on);
  }
  async function toggleHidePreviews(on: boolean) {
    setHidePreviews(on);
    try {
      await setDeliveryPrefs({ hidePreviews: on });
    } catch {
      setHidePreviews(!on);
      toast.error(t('me.notifications.error'));
    }
  }

  const copy = lockCopy(support.kind);
  return (
    <SettingsScreen
      title={t('me.security.title')}
      backLabel={t('common.back')}
      onBack={() => backTo(undefined, '/(tabs)/profile/settings')}
      glows={[
        { color: palette.lavenderSoft, opacity: 0.25, x: -70, y: -50, width: 280, blur: 90 },
        { color: palette.sky, opacity: 0.18, x: 200, y: 60, width: 220, blur: 90 },
      ]}
    >
      <View style={{ alignItems: 'center', gap: 10 }}>
        <View style={{ width: 200, height: 140 }} pointerEvents="none">
          <Glow
            color={palette.mustard}
            opacity={0.28}
            width={120}
            blur={40}
            style={{ position: 'absolute', left: 40, top: 0 }}
          />
          <ShieldArt width={200} height={140} />
        </View>
        <Text
          accessibilityRole="header"
          style={[
            Type.titleMd,
            { fontSize: 22, lineHeight: 30, color: palette.ink, textAlign: 'center' },
          ]}
        >
          {t('me.security.heading')}
        </Text>
        <Text style={[Type.bodySm, { color: palette.textMuted, textAlign: 'center' }]}>
          {t('me.security.body')}
        </Text>
      </View>

      <SettingsSection label={t('me.security.appLock')}>
        <ListGroup>
          <ListRow
            icon="line/lock"
            label={t(copy.label)}
            supportingText={support.available ? t(copy.body) : t('me.security.noBiometrics')}
            trailing={support.available ? 'toggle' : 'none'}
            toggled={lockOn}
            onToggle={(v) => void toggleLock(v)}
            knobColor={KNOB}
          />
          <ListRow
            icon="line/eye"
            label={t('me.security.hidePreviews')}
            supportingText={t('me.security.hidePreviewsBody')}
            trailing="toggle"
            toggled={hidePreviews}
            onToggle={(v) => void toggleHidePreviews(v)}
            knobColor={KNOB}
          />
        </ListGroup>
      </SettingsSection>

      <SettingsSection label={t('me.security.account')}>
        <ListGroup>
          <ListRow
            label={t('me.security.changePassword')}
            onPress={() => router.push('/(tabs)/profile/password')}
          />
          <ListRow
            label={t('me.security.twoStep')}
            value={twoStep === null ? undefined : t(twoStep ? 'me.security.on' : 'me.security.off')}
            onPress={() => router.push('/(tabs)/profile/two-step')}
          />
          <ListRow
            label={t('me.security.sessions')}
            value={devices ? t('me.security.devices', { count: devices }) : undefined}
            onPress={() => router.push('/(tabs)/profile/sessions')}
          />
        </ListGroup>
      </SettingsSection>
    </SettingsScreen>
  );
}
