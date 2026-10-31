import { Typography } from '@/constants/typography';
import { backTo } from '@/lib/navigation';
import { View, Text, ScrollView, Pressable, Linking } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

const policies = {
  privacy: [
    [
      'Information you provide',
      'Inner Glow stores your account email and profile, mood and sleep logs, stress and mindfulness records, journal entries, and AI conversation history to provide the features you use. Community profiles, posts and comments you publish are visible to other community members.',
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
      'Use Profile → Delete Account to permanently delete your account and its associated app data, including community posts and comments. Apple and payment providers retain their own transaction records. Deleting your account does not cancel an Apple subscription; manage it in Apple Settings. You can contact support with privacy, access or correction requests.',
    ],
  ],
  terms: [
    [
      'Wellness support',
      'Inner Glow provides general wellness tools and AI generated support. Its AI companions are not doctors or therapists. The app does not provide diagnosis, medical treatment or emergency care. AI responses may be inaccurate.',
    ],
    [
      'Monthly premium',
      'Monthly premium is an auto-renewable subscription. The price and one-month duration are shown before purchase. Payment is charged to your Apple Account at confirmation. It renews unless canceled at least 24 hours before the current period ends. Manage or cancel your subscription in Apple Settings. Access continues until the paid period expires.',
    ],
    [
      'Lifetime premium and free trial',
      'Lifetime premium is a one-time non-consumable purchase, with no recurring charge. The seven-day app trial does not require payment and does not automatically become a paid subscription. Restore Purchases restores eligible Apple purchases. Apple handles refunds for Apple purchases.',
    ],
    [
      'Community conduct',
      'Do not publish harassment, hate speech, threats, sexual exploitation, illegal content, spam or private information about another person. Posts and comments are screened before publishing. Use Report to send content for review and Block to hide a user. Content that violates these rules may be removed. You retain ownership of your content and allow Inner Glow to display content you publish to the community.',
    ],
    [
      'Account and license',
      'Keep your login details secure and provide accurate account information. You may delete your account in Profile. Use of the iOS app is also governed by Apple’s Standard End User License Agreement, available below.',
    ],
  ],
  community: [
    [
      'Community Guidelines',
      'Be respectful. Do not post harassment, hate speech, threats, sexual exploitation, illegal material, spam, or another person’s private information. Community content is screened before publication.',
    ],
    [
      'Report and block',
      'Use the safety menu beside a post or comment to report content or block its author. Reports go to the moderation queue. Blocked users’ posts and comments are hidden from you. Use Profile → Blocked Users to manage your list.',
    ],
  ],
};

export default function LegalScreen() {
  const { policy } = useLocalSearchParams<{ policy?: string }>();
  const key = policy === 'terms' || policy === 'community' ? policy : 'privacy';
  const colors = Colors[useColorScheme() ?? 'light'];
  const insets = useSafeAreaInsets();
  return (
    <ScrollView
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
        {key === 'privacy'
          ? 'Privacy Policy'
          : key === 'terms'
            ? 'Terms of Use'
            : 'Community Guidelines'}
      </Text>
      <Text style={{ color: colors.mutedText, marginVertical: 12 }}>Updated 13 October 2026</Text>
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
