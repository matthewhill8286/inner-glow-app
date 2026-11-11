import React, { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { palette } from '@/constants/theme';
import { Type } from '@/constants/typography';
import { GlowField } from '@/components/glow/Glow';
import { NavBar } from '@/components/ui/IconButton';
import { ListGroup, ListRow } from '@/components/ui/ListRow';
import { LegalNote } from '@/components/ui/controls';
import { AppButton } from '@/components/ui/AppButton';
import { ScreenStatusBar } from '@/components/ui/ScreenStatusBar';
import { toast } from '@/components/Toast';
import { EXPORT_GROUPS, type ExportGroup } from '@/lib/data-export';
import { exportMyData } from '@/lib/data-export-run';
import { backTo } from '@/lib/navigation';

/**
 * Get a copy of your data (`6801:6640`): what to include, the format and Request my data. The file is
 * made on the phone and handed to the share sheet, where it can be saved or emailed; the frame's
 * emailed link needs an email service the app doesn't have yet.
 */
export default function YourData() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [groups, setGroups] = useState<ExportGroup[]>(['mood', 'journal', 'chats', 'sleep']);
  const [format, setFormat] = useState<'pdf' | 'json'>('pdf');
  const [busy, setBusy] = useState(false);

  const toggle = (g: ExportGroup, on: boolean) =>
    setGroups((cur) => (on ? [...cur, g] : cur.filter((x) => x !== g)));
  const request = async () => {
    setBusy(true);
    try {
      await exportMyData(
        groups,
        format,
        t('yourData.pdf', { returnObjects: true }) as Record<string, string>,
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t('aiData.exportError'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <ScreenStatusBar style="dark" />
      <GlowField
        glows={[
          { color: palette.lavenderSoft, opacity: 0.3, x: -70, y: -50, width: 280, blur: 90 },
          { color: palette.mustard, opacity: 0.25, x: 200, y: 40, width: 220, blur: 90 },
        ]}
      />
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 10,
          paddingHorizontal: 24,
          paddingBottom: insets.bottom + 120,
        }}
      >
        <NavBar
          backLabel={t('common.back')}
          onBack={() => backTo(undefined, '/(utils)/ai-privacy')}
          title={t('yourData.nav')}
        />
        <Text
          accessibilityRole="header"
          style={[
            Type.titleLg,
            { fontSize: 30, lineHeight: 36, color: palette.ink, marginTop: 16 },
          ]}
        >
          {t('yourData.title')}
        </Text>
        <Text
          style={[
            Type.body,
            { fontWeight: '400', lineHeight: 21, color: palette.textMuted, marginTop: 10 },
          ]}
        >
          {t('yourData.body')}
        </Text>
        <Text
          style={[
            Type.captionS,
            { fontWeight: '600', color: palette.lavender, marginTop: 20, marginBottom: 8 },
          ]}
        >
          {t('yourData.include')}
        </Text>
        <ListGroup>
          {EXPORT_GROUPS.map((g) => (
            <ListRow
              key={g}
              label={t(`yourData.groups.${g}`)}
              trailing="toggle"
              toggled={groups.includes(g)}
              onToggle={(on) => toggle(g, on)}
            />
          ))}
        </ListGroup>
        <Text
          style={[
            Type.captionS,
            { fontWeight: '600', color: palette.lavender, marginTop: 20, marginBottom: 8 },
          ]}
        >
          {t('yourData.format')}
        </Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {(['pdf', 'json'] as const).map((f) => (
            <Pressable
              key={f}
              accessibilityRole="radio"
              accessibilityState={{ selected: format === f }}
              onPress={() => setFormat(f)}
              style={{
                paddingHorizontal: 16,
                paddingVertical: 10,
                borderRadius: 999,
                borderWidth: format === f ? 1.5 : 1,
                borderColor: format === f ? palette.plum : palette.borderLilac,
                backgroundColor: format === f ? palette.selected : palette.white,
              }}
            >
              <Text style={[Type.captionM, { fontSize: 14, color: palette.plumDeep }]}>
                {t(`yourData.formats.${f}`)}
              </Text>
            </Pressable>
          ))}
        </View>
        <LegalNote text={t('yourData.legal')} style={{ marginTop: 20 }} />
      </ScrollView>
      <View style={{ position: 'absolute', left: 24, right: 24, bottom: insets.bottom + 24 }}>
        <AppButton
          title={t('yourData.request')}
          busy={busy}
          disabled={busy}
          onPress={() => void request()}
        />
      </View>
    </View>
  );
}
