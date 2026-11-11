import { Type, Typography } from '@/constants/typography';
import { useTranslation } from 'react-i18next';
import { NavBar } from '@/components/ui/IconButton';
import { ListGroup, ListRow } from '@/components/ui/ListRow';
import { backTo } from '@/lib/navigation';
import { View, Text, ScrollView, Pressable, Linking } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, palette } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { KEYBOARD_DISMISS_MODE } from '@/lib/keyboard';

const policies = {
  privacy: [
    [
      'Information you provide',
      'Inner Glow stores your account email and profile, mood and sleep logs, stress and mindfulness records, journal entries, and AI conversation history to provide the features you use.',
    ],
    [
      'AI processing',
      'With your permission, the information required for an AI feature is sent through our Supabase backend to OpenAI. This can include conversation messages, mood and sleep entries, wellness context, or a voice recording you choose to transcribe. You can decline or withdraw permission in Profile. AI features will then stop sending this information.',
    ],
    [
      'Payments',
      'Apple processes iOS purchases. RevenueCat receives your app account identifier, purchase information and receipt information to validate and restore premium access. Inner Glow does not receive your card details from Apple. Purchases on the web or Android currently use Stripe.',
    ],
    [
      'Storage and notifications',
      'Supabase stores account and app data. Some data is cached on your device. Notification permission is optional. Push notification tokens are used to deliver reminders. We do not use advertising tracking in this app. Support requests store your reply email and message in Supabase. Requests made while signed in may be linked to your account. We use a protected hash of the request source to limit spam; the support form does not store your raw IP address.',
    ],
    [
      'Deletion and choices',
      'Use Profile → Delete Account to permanently delete your account and its associated app data. Apple and payment providers retain their own transaction records. Deleting your account does not cancel an Apple subscription; manage it in Apple Settings. You can contact support with privacy, access or correction requests.',
    ],
  ],
  terms: [
    [
      'Wellness support',
      'Inner Glow provides general wellness tools and AI generated support. Its AI companions are not doctors or therapists. The app does not provide diagnosis, medical treatment or emergency care. AI responses may be inaccurate.',
    ],
    [
      'Yearly and monthly premium',
      'Yearly and monthly premium are auto-renewable subscriptions. The price and duration are shown before purchase. Yearly premium starts with a seven-day free trial for eligible new subscribers. If you do not cancel at least 24 hours before the trial ends, the yearly price is charged to your Apple Account when the trial ends. Otherwise payment is charged at confirmation. Payment is charged to your Apple Account at confirmation. It renews unless canceled at least 24 hours before the current period ends. Manage or cancel your subscription in Apple Settings. Access continues until the paid period expires.',
    ],
    [
      'Earlier lifetime purchases',
      'Lifetime premium is no longer sold. If you bought it before, it stays a one-time purchase with no recurring charge. Restore Purchases restores eligible Apple purchases. Apple handles refunds for Apple purchases.',
    ],
    [
      'Account and license',
      'Keep your login details secure and provide accurate account information. You may delete your account in Profile. Use of the iOS app is also governed by Apple’s Standard End User License Agreement, available below.',
    ],
  ],
};

/**
 * Legal hub (`6801:6742`): the "not a medical service" card, then Terms of use, Privacy policy and the
 * AI use policy (Glow AI's data permission screen). The frame's cookie settings and open-source
 * licences rows are left out: the app sets no cookies, and the licence list isn't written yet.
 */
function LegalHub() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const policy = (key: 'terms' | 'privacy') =>
    router.push({ pathname: '/(utils)/legal', params: { policy: key } });
  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 10,
          paddingHorizontal: 24,
          paddingBottom: insets.bottom + 32,
        }}
      >
        <NavBar
          backLabel={t('common.back')}
          onBack={() => backTo(undefined, '/(tabs)/profile/settings')}
          title={t('legalHub.title')}
        />
        <View
          style={{
            marginTop: 16,
            borderRadius: 24,
            borderWidth: 1.5,
            borderColor: palette.rose,
            backgroundColor: palette.white,
            padding: 20,
            gap: 8,
          }}
        >
          <Text style={[Type.bodyMSemi, { fontSize: 17, color: palette.ink }]}>
            {t('legalHub.notMedicalTitle')}
          </Text>
          <Text style={[Type.captionM, { fontSize: 14, lineHeight: 19, color: palette.plumDeep }]}>
            {t('legalHub.notMedicalBody')}
          </Text>
        </View>
        <ListGroup style={{ marginTop: 20 }}>
          <ListRow
            icon="line/note"
            label={t('legalHub.terms')}
            supportingText={t('legalHub.termsBody')}
            onPress={() => policy('terms')}
          />
          <ListRow
            icon="line/lock"
            label={t('legalHub.privacy')}
            supportingText={t('legalHub.privacyBody')}
            onPress={() => policy('privacy')}
          />
          <ListRow
            icon="line/sparkle"
            label={t('legalHub.ai')}
            supportingText={t('legalHub.aiBody')}
            onPress={() => router.push('/(utils)/ai-privacy')}
          />
        </ListGroup>
      </ScrollView>
    </View>
  );
}

export default function LegalScreen() {
  const { policy } = useLocalSearchParams<{ policy?: string }>();
  if (policy !== 'terms' && policy !== 'privacy') return <LegalHub />;
  return <PolicyScreen policy={policy} />;
}

function PolicyScreen({ policy }: { policy: 'terms' | 'privacy' }) {
  const key = policy;
  const colors = Colors[useColorScheme() ?? 'light'];
  const insets = useSafeAreaInsets();
  return (
    <ScrollView
      keyboardDismissMode={KEYBOARD_DISMISS_MODE}
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={{
        padding: 24,
        paddingTop: insets.top + 16,
        paddingBottom: insets.bottom + 32,
      }}
    >
      <Pressable onPress={() => backTo(undefined, '/(tabs)/profile')}>
        <Text style={{ color: colors.text, marginBottom: 24 }}>← Back</Text>
      </Pressable>
      <Text style={{ ...Typography.heading, color: colors.text }}>
        {key === 'privacy' ? 'Privacy Policy' : 'Terms of Use'}
      </Text>
      <Text style={{ color: colors.mutedText, marginVertical: 12 }}>Updated 2 November 2026</Text>
      {policies[key].map(([title, content]) => (
        <View key={title} style={{ marginBottom: 24 }}>
          <Text style={{ ...Typography.section, color: colors.text, marginBottom: 8 }}>
            {title}
          </Text>
          <Text
            style={{
              fontFamily: Typography.family.body,
              color: colors.text,
              fontSize: 15,
              lineHeight: 24,
            }}
          >
            {content}
          </Text>
        </View>
      ))}
      {key === 'terms' && (
        <Pressable
          accessibilityRole="link"
          onPress={() =>
            Linking.openURL('https://www.apple.com/legal/internet-services/itunes/dev/stdeula/')
          }
        >
          <Text style={{ color: colors.tint, textDecorationLine: 'underline', marginBottom: 24 }}>
            Apple Standard End User License Agreement
          </Text>
        </Pressable>
      )}
      <Pressable accessibilityRole="link" onPress={() => router.push('/(utils)/support')}>
        <Text style={{ color: colors.tint }}>Contact Support</Text>
      </Pressable>
    </ScrollView>
  );
}
