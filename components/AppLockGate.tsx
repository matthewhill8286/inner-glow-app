import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { palette } from '@/constants/theme';
import { Type } from '@/constants/typography';
import { GlowField } from '@/components/glow/Glow';
import { AppButton } from '@/components/ui/AppButton';
import { useUser } from '@/hooks/useUser';
import { authenticate, biometricSupport, isAppLockEnabled, shouldLock } from '@/lib/app-lock';
import { hasPasscode, MAX_ATTEMPTS, verifyPasscode } from '@/lib/passcode';
import { signOutOnPurpose } from '@/lib/session-expiry';
import { supabase } from '@/supabase/supabase';
import { router } from 'expo-router';
import { PasscodePad } from '@/components/PasscodePad';
import type { BiometricKind } from '@/lib/profile-setup';
import { Icon } from '@/components/icons/Icon';

/**
 * Covers the app when the lock from profile setup (P4) is on: at launch, and when the app comes back
 * after 30 seconds or more in the background. It asks for Face ID or the fingerprint straight away.
 * The screen follows Inner Glow is locked (`6832:8118`). With an in-app passcode set in Security,
 * "Use passcode instead" opens the pad (`6832:8264`); without one it opens the system prompt, which
 * offers the device passcode. Five wrong passcodes, or "Forgot passcode?", sign the person out.
 */
export function AppLockGate() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { data: user } = useUser();
  const userId = user?.id ?? null;
  const [locked, setLocked] = useState(false);
  const [kind, setKind] = useState<BiometricKind | null>(null);
  const [biometric, setBiometric] = useState(false);
  const [passcode, setPasscodeOn] = useState(false);
  const [pad, setPad] = useState(false);
  const [tries, setTries] = useState(0);
  const backgroundedAt = useRef<number | null>(null);
  const asking = useRef(false);

  const unlock = useCallback(async () => {
    if (asking.current) return;
    asking.current = true;
    const ok = await authenticate(t('profileFlow.lock.prompt'), t('common.cancel'));
    asking.current = false;
    if (ok) setLocked(false);
  }, [t]);

  // Lock at launch, and whenever the signed-in user changes.
  useEffect(() => {
    let active = true;
    setLocked(false);
    void Promise.all([isAppLockEnabled(userId), biometricSupport(), hasPasscode(userId)]).then(
      ([enabled, support, pass]) => {
        if (!active) return;
        setKind(support.kind);
        setBiometric(support.available);
        setPasscodeOn(pass);
        setPad(!support.available && pass);
        if (enabled && (support.available || pass)) setLocked(true);
      },
    );
    return () => {
      active = false;
    };
  }, [userId]);

  // The Face ID prompt makes the app "inactive", not "background", so only real trips away count.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'background') backgroundedAt.current = Date.now();
      if (state === 'active' && shouldLock(backgroundedAt.current, Date.now())) {
        backgroundedAt.current = null;
        void isAppLockEnabled(userId).then((enabled) => enabled && setLocked(true));
      }
    });
    return () => sub.remove();
  }, [userId]);

  useEffect(() => {
    if (locked && biometric) void unlock();
  }, [locked, biometric, unlock]);

  const signOut = async () => {
    await signOutOnPurpose();
    await supabase.auth.signOut().catch(() => undefined);
    setLocked(false);
    setPad(false);
    setTries(0);
    router.replace('/(auth)/sign-in');
  };

  if (!locked) return null;
  const method = kind ? t(`profileFlow.biometric.${kind}`) : t('profileFlow.biometric.faceId');
  if (pad && userId)
    return (
      <View
        style={[StyleSheet.absoluteFill, { backgroundColor: palette.bg, justifyContent: 'center' }]}
        accessibilityViewIsModal
      >
        <GlowField
          glows={[
            { color: palette.lavenderSoft, opacity: 0.3, x: -70, y: -50, width: 280, blur: 90 },
            { color: palette.mustard, opacity: 0.25, x: 200, y: 40, width: 220, blur: 90 },
          ]}
        />
        <PasscodePad
          title={t('passcode.enterTitle')}
          subtitle={t('passcode.enterBody')}
          error={tries ? t('passcode.wrong', { count: MAX_ATTEMPTS - tries }) : null}
          onBiometric={biometric ? () => void unlock() : undefined}
          onComplete={async (code) => {
            if (await verifyPasscode(userId, code)) {
              setTries(0);
              setPad(false);
              setLocked(false);
              return true;
            }
            const next = tries + 1;
            setTries(next);
            if (next >= MAX_ATTEMPTS) void signOut();
            return false;
          }}
        />
        <Pressable
          accessibilityRole="button"
          hitSlop={8}
          onPress={() => void signOut()}
          style={{ marginTop: 28, alignSelf: 'center' }}
        >
          <Text style={[Type.bodySm, { fontWeight: '600', color: palette.lavender }]}>
            {t('passcode.forgot')}
          </Text>
        </Pressable>
      </View>
    );
  return (
    <View
      style={[StyleSheet.absoluteFill, { backgroundColor: palette.bg }]}
      accessibilityViewIsModal
    >
      <GlowField
        glows={[
          { color: palette.lavenderSoft, opacity: 0.45, x: 62.5, y: 175, width: 250, blur: 60 },
          { color: palette.mustard, opacity: 0.35, x: 147.5, y: 240, width: 160, blur: 50 },
        ]}
      />
      <View
        style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 }}
      >
        <Svg width={190} height={190}>
          <Defs>
            <RadialGradient id="lockLight" cx="50%" cy="50%" r="50%">
              <Stop offset="0" stopColor={palette.mustard} stopOpacity={0.9} />
              <Stop offset="1" stopColor={palette.mustard} stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Circle cx={95} cy={95} r={94.5} stroke={palette.plum} strokeWidth={1} fill="none" />
          <Circle cx={95} cy={95} r={74} stroke={palette.plum} strokeWidth={1.5} fill="none" />
          <Circle cx={95} cy={95} r={30} fill="url(#lockLight)" />
        </Svg>
        <Text
          accessibilityRole="header"
          style={[
            Type.titleLg,
            { fontSize: 26, color: palette.ink, textAlign: 'center', marginTop: 56 },
          ]}
        >
          {t('appLock.title')}
        </Text>
        <Text
          style={[
            Type.bodySm,
            {
              fontWeight: '400',
              lineHeight: 20,
              color: palette.textMuted,
              textAlign: 'center',
              marginTop: 11,
              maxWidth: 287,
            },
          ]}
        >
          {t('appLock.body')}
        </Text>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            marginTop: 28,
            paddingLeft: 12,
            paddingRight: 14,
            paddingVertical: 6,
            borderRadius: 999,
            backgroundColor: palette.selected,
          }}
        >
          <Icon name="line/shield" size={14} color={palette.plum} />
          <Text style={[Type.caption, { fontWeight: '600', color: palette.plum }]}>
            {t('appLock.on', { method })}
          </Text>
        </View>
      </View>
      <View style={{ paddingHorizontal: 24, paddingBottom: insets.bottom + 24, gap: 16 }}>
        <AppButton title={t('profileFlow.lock.unlock', { method })} onPress={unlock} />
        {/* iOS offers the device passcode in the same system prompt; there is no separate in-app passcode. */}
        <Pressable
          accessibilityRole="button"
          hitSlop={8}
          onPress={() => (passcode ? setPad(true) : void unlock())}
        >
          <Text
            style={[
              Type.body,
              { fontSize: 14, fontWeight: '600', color: palette.lavender, textAlign: 'center' },
            ]}
          >
            {t('appLock.passcode')}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
