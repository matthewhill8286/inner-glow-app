import React, { useState } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { palette } from '@/constants/theme';
import { GlowField } from '@/components/glow/Glow';
import { NavBar } from '@/components/ui/IconButton';
import { PasscodePad } from '@/components/PasscodePad';
import { ScreenStatusBar } from '@/components/ui/ScreenStatusBar';
import { toast } from '@/components/Toast';
import { useUser } from '@/hooks/useUser';
import { backTo } from '@/lib/navigation';
import { setPasscode } from '@/lib/passcode';
import { setAppLockEnabled } from '@/lib/app-lock';

/** Security · Set a passcode: the pad twice, then the app lock turns on with it. */
export default function SetPasscode() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { data: user } = useUser();
  const [first, setFirst] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const done = () => backTo(undefined, '/(tabs)/profile/security');

  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <ScreenStatusBar style="dark" />
      <GlowField
        glows={[
          { color: palette.lavenderSoft, opacity: 0.3, x: -70, y: -50, width: 280, blur: 90 },
          { color: palette.mustard, opacity: 0.25, x: 200, y: 40, width: 220, blur: 90 },
        ]}
      />
      <View style={{ paddingTop: insets.top + 10, paddingHorizontal: 24 }}>
        <NavBar backLabel={t('common.back')} onBack={done} title={t('passcode.setNav')} />
      </View>
      <View style={{ flex: 1, justifyContent: 'center', paddingBottom: insets.bottom + 40 }}>
        <PasscodePad
          key={first ? 'confirm' : 'create'}
          title={t(first ? 'passcode.confirmTitle' : 'passcode.createTitle')}
          subtitle={t(first ? 'passcode.confirmBody' : 'passcode.createBody')}
          error={error}
          onComplete={async (code) => {
            if (!first) {
              setFirst(code);
              setError(null);
              return true;
            }
            if (code !== first) {
              setFirst(null);
              setError(t('passcode.mismatch'));
              return false;
            }
            if (!user) return false;
            await setPasscode(user.id, code);
            await setAppLockEnabled(user.id, true);
            toast.success(t('passcode.saved'));
            done();
            return true;
          }}
        />
      </View>
    </View>
  );
}
