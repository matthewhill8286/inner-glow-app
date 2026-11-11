import React, { useEffect, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { palette } from '@/constants/theme';
import { Type } from '@/constants/typography';
import { AppButton } from '@/components/ui/AppButton';
import { Checkbox, LegalNote } from '@/components/ui/controls';
import { SettingsScreen } from '@/components/settings/SettingsParts';
import { toast } from '@/components/Toast';
import { useUser } from '@/hooks/useUser';
import { backTo } from '@/lib/navigation';
import { supabase } from '@/supabase/supabase';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
/** The contact-support function accepts 20 to 5000 characters. */
const MIN = 20;
const MAX = 5000;

/**
 * Message our team / Report a problem (06 §P11): the existing support request, restyled. The reply
 * email starts as the account's email. A problem report is labelled so support can triage it.
 */
export default function SupportMessageScreen() {
  const { t } = useTranslation();
  const { kind } = useLocalSearchParams<{ kind?: string }>();
  const problem = kind === 'problem';
  const { data: user } = useUser();
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [reference, setReference] = useState<string | null>(null);

  useEffect(() => {
    if (user?.email) setEmail((e) => e || user.email!);
  }, [user?.email]);

  const ready = consent && EMAIL.test(email.trim()) && message.trim().length >= MIN;
  const submit = async () => {
    setBusy(true);
    try {
      const body = problem
        ? `${t('supportMessage.problemPrefix')}\n\n${message.trim()}`
        : message.trim();
      const { data, error } = await supabase.functions.invoke('contact-support', {
        body: { email: email.trim(), message: body, consent },
      });
      if (error || !data?.received) throw new Error(t('supportMessage.error'));
      setMessage('');
      router.replace({
        pathname: '/(utils)/message-sent',
        params: { email: email.trim(), reference: String(data.reference ?? '') },
      });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t('supportMessage.error'));
    } finally {
      setBusy(false);
    }
  };

  const field = {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: palette.borderLilac,
    backgroundColor: palette.white,
    paddingHorizontal: 16,
    color: palette.ink,
  };

  return (
    <SettingsScreen
      title={t(problem ? 'supportMessage.problemTitle' : 'supportMessage.title')}
      backLabel={t('common.back')}
      onBack={() => backTo(undefined, '/(utils)/support')}
      contentStyle={{ gap: 16 }}
      cta={
        <AppButton
          title={t('supportMessage.send')}
          busy={busy}
          disabled={!ready}
          onPress={submit}
        />
      }
    >
      <Text style={[Type.bodyS, { lineHeight: 20, color: palette.textMuted }]}>
        {t(problem ? 'supportMessage.problemBody' : 'supportMessage.body')}
      </Text>
      {reference && (
        <View style={{ backgroundColor: palette.selected, borderRadius: 16, padding: 14 }}>
          <Text selectable style={[Type.bodySMedium, { color: palette.plum }]}>
            {t('supportMessage.sent', { reference })}
          </Text>
        </View>
      )}
      <View style={{ gap: 8 }}>
        <Text style={[Type.labelM, { color: palette.lavender }]}>
          {t('supportMessage.emailLabel')}
        </Text>
        <TextInput
          accessibilityLabel={t('supportMessage.emailLabel')}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          style={[Type.bodyM, field, { height: 52 }]}
        />
      </View>
      <View style={{ gap: 8 }}>
        <Text style={[Type.labelM, { color: palette.lavender }]}>
          {t('supportMessage.messageLabel')}
        </Text>
        <TextInput
          accessibilityLabel={t('supportMessage.messageLabel')}
          placeholder={t('supportMessage.placeholder', { min: MIN })}
          placeholderTextColor={palette.textSubtle}
          value={message}
          onChangeText={setMessage}
          multiline
          maxLength={MAX}
          textAlignVertical="top"
          style={[
            Type.bodyM,
            field,
            { minHeight: 160, paddingTop: 16, paddingBottom: 16, lineHeight: 21 },
          ]}
        />
        {/* Send stays disabled until the minimum is met, so say how far there is to go (TestFlight report 43). */}
        {message.trim().length > 0 && message.trim().length < MIN && (
          <Text
            accessibilityLiveRegion="polite"
            style={[Type.captionS, { color: palette.textMuted }]}
          >
            {t('supportMessage.minHint', { count: MIN - message.trim().length })}
          </Text>
        )}
      </View>
      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: consent }}
        onPress={() => setConsent(!consent)}
        style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}
      >
        <Checkbox
          checked={consent}
          onChange={setConsent}
          accessibilityLabel={t('supportMessage.consent')}
        />
        <Text style={[Type.captionM, { flex: 1, lineHeight: 18, color: palette.textMuted }]}>
          {t('supportMessage.consent')}
        </Text>
      </Pressable>
      <LegalNote text={t('contactUs.legal')} />
    </SettingsScreen>
  );
}
