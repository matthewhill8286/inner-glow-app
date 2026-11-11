import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useTranslation } from 'react-i18next';
import { palette } from '@/constants/theme';
import { Type } from '@/constants/typography';
import { GlowField } from '@/components/glow/Glow';
import { Icon } from '@/components/icons/Icon';
import { NavBar } from '@/components/ui/IconButton';
import { LegalNote } from '@/components/ui/controls';
import { ScreenStatusBar } from '@/components/ui/ScreenStatusBar';
import { backTo } from '@/lib/navigation';
import { isSourceTopic, SOURCE_TOPICS, sourcesFor, type SourceTopic } from '@/lib/feature-sources';

/**
 * Sources and citations (App Review guideline 1.4.1): every page Inner Glow's scores, insights,
 * suggestions and assessment draw on, grouped by feature. Opened from the Sources link on those
 * screens, which puts its own topic first, and from the Help Centre and the legal hub.
 */
export default function SourcesScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { topic } = useLocalSearchParams<{ topic?: string }>();
  const first = isSourceTopic(topic) ? topic : null;
  const topics: SourceTopic[] = first
    ? [first, ...SOURCE_TOPICS.filter((x) => x !== first)]
    : [...SOURCE_TOPICS];
  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <ScreenStatusBar style="dark" />
      <GlowField
        glows={[
          { color: palette.lavenderSoft, opacity: 0.3, x: -70, y: -50, width: 280, blur: 90 },
          { color: palette.sky, opacity: 0.2, x: 200, y: 40, width: 220, blur: 90 },
        ]}
      />
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 10,
          paddingHorizontal: 24,
          paddingBottom: insets.bottom + 40,
        }}
      >
        <NavBar
          backLabel={t('common.back')}
          onBack={() => backTo(undefined, '/(tabs)/home')}
          title={t('sources.title')}
        />
        <Text
          style={[
            Type.body,
            { fontWeight: '400', lineHeight: 21, color: palette.plumDeep, marginTop: 16 },
          ]}
        >
          {t('sources.intro')}
        </Text>
        {topics.map((key) => (
          <View key={key} style={{ marginTop: 24 }}>
            <Text
              accessibilityRole="header"
              style={[
                Type.captionS,
                { fontWeight: '600', color: palette.lavender, marginBottom: 8 },
              ]}
            >
              {t(`sources.topics.${key}`)}
            </Text>
            <View
              style={{ borderRadius: 24, backgroundColor: palette.white, paddingHorizontal: 16 }}
            >
              {sourcesFor(key).map((c, i) => (
                <Pressable
                  key={c.url}
                  accessibilityRole="link"
                  accessibilityLabel={`${c.source}, ${c.title}`}
                  onPress={() => void WebBrowser.openBrowserAsync(c.url)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 12,
                    paddingVertical: 12,
                    borderTopWidth: i === 0 ? 0 : 1,
                    borderTopColor: palette.borderLilac,
                  }}
                >
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={[Type.captionS, { fontWeight: '600', color: palette.plum }]}>
                      {c.source}
                    </Text>
                    <Text
                      style={[
                        Type.bodyMSemi,
                        { fontWeight: '500', fontSize: 14, color: palette.ink },
                      ]}
                    >
                      {c.title}
                    </Text>
                  </View>
                  <Icon name="line/globe" size={16} color={palette.lavender} />
                </Pressable>
              ))}
            </View>
          </View>
        ))}
        <LegalNote text={t('sources.disclaimer')} style={{ marginTop: 24 }} />
      </ScrollView>
    </View>
  );
}
