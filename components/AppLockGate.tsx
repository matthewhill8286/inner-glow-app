import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { palette } from '@/constants/theme';
import { Type } from '@/constants/typography';
import { GlowField } from '@/components/glow/Glow';
import { AppButton } from '@/components/ui/AppButton';
import { useUser } from '@/hooks/useUser';
import { authenticate, biometricSupport, isAppLockEnabled, shouldLock } from '@/lib/app-lock';
import type { BiometricKind } from '@/lib/profile-setup';
import FaceIdGlyph from '@/assets/svg/illustrations/profile/face-id.svg';

/**
 * Covers the app when the lock from profile setup (P4) is on: at launch, and when the app comes back
 * after 30 seconds or more in the background. It asks for Face ID or the fingerprint straight away and
 * offers a button to try again. The lock screen itself is not designed; it reuses the P4 look.
 */
export function AppLockGate() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { data: user } = useUser();
  const userId = user?.id ?? null;
  const [locked, setLocked] = useState(false);
  const [kind, setKind] = useState<BiometricKind | null>(null);
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
    void Promise.all([isAppLockEnabled(userId), biometricSupport()]).then(([enabled, support]) => {
      if (!active) return;
      setKind(support.kind);
      if (enabled && support.available) setLocked(true);
    });
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
    if (locked) void unlock();
  }, [locked, unlock]);

  if (!locked) return null;
  const method = kind ? t(`profileFlow.biometric.${kind}`) : t('profileFlow.biometric.faceId');
  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: palette.bg }]} accessibilityViewIsModal>
      <GlowField
        glows={[
          { color: palette.mustard, opacity: 0.28, x: 37.5, y: -10, width: 300, blur: 80 },
          { color: palette.lavenderSoft, opacity: 0.25, x: 67.5, y: 240, width: 240, blur: 50 },
        ]}
      />
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 24, paddingHorizontal: 24 }}>
        <FaceIdGlyph width={64} height={64} />
        <Text accessibilityRole="header" style={[Type.titleLg, { color: palette.ink, textAlign: 'center' }]}>
          {t('profileFlow.lock.title')}
        </Text>
        <Text style={[Type.bodySm, { color: palette.textMuted, textAlign: 'center' }]}>{t('profileFlow.lock.body')}</Text>
      </View>
      <View style={{ paddingHorizontal: 24, paddingBottom: insets.bottom + 48 }}>
        <AppButton title={t('profileFlow.lock.unlock', { method })} onPress={unlock} />
      </View>
    </View>
  );
}
