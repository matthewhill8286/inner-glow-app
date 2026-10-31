import { Typography } from '@/constants/typography';
import { backTo } from '@/lib/navigation';
import { WellnessIconText } from '@/components/WellnessIconText';
import { useState } from 'react';
import { ScrollView, Text, TextInput, Pressable, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, UI } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { supabase } from '@/supabase/supabase';
import { LegalLinks } from '@/components/LegalLinks';
import { toast } from '@/components/Toast';

export default function Support() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [reference, setReference] = useState<string | null>(null);
  const colors = Colors[useColorScheme() ?? 'light'];
  const insets = useSafeAreaInsets();
  async function submit() {
    setBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke('contact-support', {
        body: { email, message, consent },
      });
      if (error || !data?.received)
        throw new Error(
          'Unable to save your request. Check your email and message, or retry later.',
        );
      setReference(data.reference);
      setMessage('');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Unable to save request');
    } finally {
      setBusy(false);
    }
  }
  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={{ padding: 24, paddingTop: insets.top + 16, gap: 20 }}
    >
      <Pressable onPress={() => backTo(undefined, '/(tabs)/profile')}>
        <Text style={{ color: colors.text }}>← Back</Text>
      </Pressable>
      <Text style={{ ...Typography.heading, color: colors.text, fontSize: 24 }}>
        Contact Support
      </Text>
      <Text style={{ color: colors.text, lineHeight: 24 }}>
        Send app, payment, privacy or account questions to the Inner Glow support queue. This is not
        an emergency or medical advice service.
      </Text>
      {reference && (
        <Text selectable style={{ color: colors.tint }}>
          Your request was saved. Reference: {reference}
        </Text>
      )}
      <TextInput
        accessibilityLabel="Reply email"
        placeholder="Your email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        placeholderTextColor={colors.mutedText}
        style={{
          padding: 16,
          color: colors.text,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 12,
        }}
      />
      <TextInput
        accessibilityLabel="Support message"
        placeholder="How can we help? Please use at least 20 characters."
        value={message}
        onChangeText={setMessage}
        multiline
        maxLength={5000}
        placeholderTextColor={colors.mutedText}
        style={{
          padding: 16,
          minHeight: 160,
          color: colors.text,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 12,
        }}
      />
      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: consent }}
        onPress={() => setConsent(!consent)}
      >
        <WellnessIconText style={{ color: colors.text }}>
          {consent ? '☑' : '☐'} I agree to send my email and message to Inner Glow, stored in
          Supabase, so support can respond. I have read the Privacy Policy.
        </WellnessIconText>
      </Pressable>
      <Pressable
        disabled={
          busy ||
          !consent ||
          message.trim().length < 20 ||
          !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
        }
        onPress={submit}
        style={{
          backgroundColor: colors.tint,
          padding: 18,
          borderRadius: 12,
          opacity: busy || !consent ? 0.5 : 1,
        }}
      >
        {busy ? (
          <ActivityIndicator color="#FFF" />
        ) : (
          <Text style={{ color: '#FFF', textAlign: 'center' }}>Send Support Request</Text>
        )}
      </Pressable>
      <LegalLinks color={colors.mutedText} />
    </ScrollView>
  );
}
