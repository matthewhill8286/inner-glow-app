import React from 'react';
import { View, Text, Pressable, ScrollView, Platform, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, UI } from '@/constants/theme';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useSleep } from '@/hooks/useSleep';
import { showAlert } from '@/lib/state';
import { useTranslation } from 'react-i18next';

/* ── colors ──────────────────────────────────────── */
const SLEEP_COLORS = {
  core: '#5B8A5A',
  rem: '#7B6DC9',
  post: '#E8985A',
};

/* ── helpers ──────────────────────────────────────── */
function goBack(from?: string) {
  if (from) router.replace(from as any);
  else router.back();
}

function getQualityEmoji(q: number) {
  if (q >= 5) return '😴';
  if (q >= 4) return '😊';
  if (q >= 3) return '😐';
  if (q >= 2) return '😟';
  return '😫';
}

function getQualityLabel(q: number) {
  if (q >= 5) return 'Excellent';
  if (q >= 4) return 'Great';
  if (q >= 3) return 'Good';
  if (q >= 2) return 'Fair';
  return 'Poor';
}

/* ── Donut Ring Component ────────────────────────── */
function DonutRing({
  size,
  segments,
}: {
  size: number;
  segments: { color: string; pct: number; label: string; value: string; emoji: string }[];
}) {
  const strokeWidth = size * 0.16;
  const radius = size / 2;
  const innerR = radius - strokeWidth;

  return (
    <View style={{ alignItems: 'center', gap: 16 }}>
      <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
        {/* Base ring */}
        <View
          style={{
            position: 'absolute',
            width: size,
            height: size,
            borderRadius: radius,
            borderWidth: strokeWidth,
            borderColor: segments[0]?.color || '#5B8A5A',
          }}
        />
        {/* Second segment - top half */}
        {segments.length > 1 && (
          <View
            style={{
              width: size,
              height: size / 2,
              borderTopLeftRadius: radius,
              borderTopRightRadius: radius,
              overflow: 'hidden',
              position: 'absolute',
              top: 0,
            }}
          >
            <View
              style={{
                width: size,
                height: size,
                borderRadius: radius,
                borderWidth: strokeWidth,
                borderColor: segments[1]?.color || '#7B6DC9',
              }}
            />
          </View>
        )}
        {/* Third segment - top-left quarter */}
        {segments.length > 2 && (
          <View
            style={{
              width: size / 2,
              height: size / 3,
              borderTopLeftRadius: radius,
              overflow: 'hidden',
              position: 'absolute',
              top: 0,
              left: 0,
            }}
          >
            <View
              style={{
                width: size,
                height: size,
                borderRadius: radius,
                borderWidth: strokeWidth,
                borderColor: segments[2]?.color || '#E8985A',
              }}
            />
          </View>
        )}
        {/* Center content */}
        <View
          style={{
            width: innerR * 2 - 8,
            height: innerR * 2 - 8,
            borderRadius: innerR,
            backgroundColor: 'rgba(255,255,255,0.08)',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ color: '#FFF', fontSize: 14, fontWeight: '700' }}>Breakdown</Text>
        </View>
      </View>

      {/* Segment legend */}
      <View style={{ gap: 10, width: '100%' }}>
        {segments.map((seg, i) => (
          <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: 12,
                backgroundColor: seg.color + '25',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ fontSize: 16 }}>{seg.emoji}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: '#FFF', fontSize: 14, fontWeight: '800' }}>{seg.label}</Text>
              <Text style={{ color: 'rgba(255,255,255,0.60)', fontSize: 12 }}>{seg.value}</Text>
            </View>
            <View
              style={{
                backgroundColor: seg.color + '20',
                paddingHorizontal: 10,
                paddingVertical: 4,
                borderRadius: 8,
              }}
            >
              <Text style={{ color: seg.color, fontSize: 12, fontWeight: '700' }}>{seg.pct}%</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

/* ── Main Screen ─────────────────────────────────── */
export default function SleepDetailScreen() {
  const { t } = useTranslation();
  const { id, from } = useLocalSearchParams<{ id: string; from?: string }>();
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];
  const insets = useSafeAreaInsets();
  const { sleepEntries, deleteSleepEntry } = useSleep();

  const entry = sleepEntries.find((e) => e.id === id);

  const handleDelete = () => {
    showAlert('Delete Entry', 'Are you sure you want to delete this sleep entry?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteSleepEntry(id as string);
          goBack(from);
        },
      },
    ]);
  };

  if (!entry) {
    return (
      <View style={[s.container, { backgroundColor: colors.background }]}>
        <View style={s.header}>
          <Pressable
            onPress={() => goBack(from)}
            style={[s.backBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <MaterialIcons name="arrow-back" size={18} color={colors.text} />
          </Pressable>
          <Text style={[s.headerTitle, { color: colors.text }]}>{t('sleepDetail.title')}</Text>
        </View>
        <View style={s.centerContent}>
          <MaterialIcons name="hotel" size={52} color={colors.border} />
          <Text style={{ color: colors.mutedText, fontSize: 16, marginTop: 12 }}>
            {t('sleepDetail.entryNotFound')}
          </Text>
          <Pressable onPress={() => goBack(from)} style={{ marginTop: 16 }}>
            <Text style={{ color: colors.primary, fontWeight: '700' }}>
              {t('sleepDetail.goBack')}
            </Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const startDate = new Date(entry.startISO);
  const endDate = new Date(entry.endISO);
  const totalMs = endDate.getTime() - startDate.getTime();
  const totalHrs = Math.max(0, totalMs / (1000 * 60 * 60));

  // Simulate REM/Core/Post breakdown (since we don't have real phase data)
  const remHrs = totalHrs * 0.25;
  const coreHrs = totalHrs * 0.65;
  const postHrs = totalHrs * 0.1;

  const segments = [
    {
      color: SLEEP_COLORS.core,
      pct: 65,
      label: 'Core Sleep',
      value: `${coreHrs.toFixed(2)}h`,
      emoji: '🌙',
    },
    {
      color: SLEEP_COLORS.rem,
      pct: 25,
      label: 'REM Sleep',
      value: `${remHrs.toFixed(2)}h`,
      emoji: '💭',
    },
    {
      color: SLEEP_COLORS.post,
      pct: 10,
      label: 'Post REM',
      value: `${Math.round(postHrs * 60)}min`,
      emoji: '✨',
    },
  ];

  return (
    <View style={[s.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
        {/* ── Hero Card ────────────────────────── */}
        <View style={[s.heroCard, { backgroundColor: '#5A3E7A' }]}>
          <View style={[s.heroCircle1, { backgroundColor: 'rgba(255,255,255,0.06)' }]} />
          <View style={[s.heroCircle2, { backgroundColor: 'rgba(255,255,255,0.04)' }]} />

          {/* Back button overlay */}
          <Pressable
            onPress={() => goBack(from)}
            style={({ pressed }) => [s.heroBackBtn, { opacity: pressed ? 0.7 : 1 }]}
          >
            <MaterialIcons
              name={Platform.OS === 'ios' ? 'arrow-back-ios-new' : 'arrow-back'}
              size={18}
              color="rgba(255,255,255,0.8)"
            />
          </Pressable>

          <Text style={s.heroTitle}>{t('sleepDetail.youSleptFor')}</Text>
          <Text style={s.heroDuration}>{totalHrs.toFixed(2)}h</Text>
          <Text style={s.heroDate}>
            {startDate.toLocaleDateString(undefined, {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
            })}
          </Text>

          {/* Donut chart */}
          <View style={{ marginTop: 20 }}>
            <DonutRing size={160} segments={segments} />
          </View>
        </View>

        {/* ── Time Card ────────────────────────── */}
        <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={s.timeRow}>
            <View style={s.timeBlock}>
              <MaterialIcons name="nightlight-round" size={18} color="#7B6DC9" />
              <Text style={[s.timeLabel, { color: colors.mutedText }]}>
                {t('sleepDetail.bedtime')}
              </Text>
              <Text style={[s.timeValue, { color: colors.text }]}>
                {startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>
            <View style={[s.timeDivider, { backgroundColor: colors.divider }]} />
            <View style={s.timeBlock}>
              <MaterialIcons name="wb-sunny" size={18} color="#E8985A" />
              <Text style={[s.timeLabel, { color: colors.mutedText }]}>
                {t('sleepDetail.wakeUp')}
              </Text>
              <Text style={[s.timeValue, { color: colors.text }]}>
                {endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>
          </View>
        </View>

        {/* ── Quality Card ─────────────────────── */}
        {entry.quality && (
          <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={s.qualityRow}>
              <Text style={{ fontSize: 32 }}>{getQualityEmoji(entry.quality)}</Text>
              <View style={{ flex: 1 }}>
                <Text style={[s.qualityLabel, { color: colors.mutedText }]}>
                  {t('sleepDetail.sleepQuality')}
                </Text>
                <Text style={[s.qualityValue, { color: colors.text }]}>
                  {getQualityLabel(entry.quality)} ({entry.quality}/5)
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* ── Awakenings ───────────────────────── */}
        {entry.awakenings !== undefined && (
          <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={s.infoRow}>
              <MaterialIcons name="notification-important" size={20} color="#C45B5B" />
              <Text style={[s.infoLabel, { color: colors.text }]}>
                {t('sleepDetail.awakenings')}
              </Text>
              <Text style={[s.infoValue, { color: colors.text }]}>{entry.awakenings}</Text>
            </View>
          </View>
        )}

        {/* ── Notes ────────────────────────────── */}
        {entry.notes && (
          <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[s.notesLabel, { color: colors.mutedText }]}>
              {t('sleepDetail.notes')}
            </Text>
            <Text style={[s.notesText, { color: colors.text }]}>{entry.notes}</Text>
          </View>
        )}

        {/* ── Actions ──────────────────────────── */}
        <Pressable
          onPress={() => goBack(from)}
          style={({ pressed }) => [
            s.gotItBtn,
            { backgroundColor: '#8B6B47', transform: [{ scale: pressed ? 0.97 : 1 }] },
          ]}
        >
          <Text style={s.gotItText}>{t('sleepDetail.gotItThanks')}</Text>
        </Pressable>

        <Pressable
          onPress={handleDelete}
          style={({ pressed }) => [
            s.deleteBtn,
            { borderColor: '#C45B5B', opacity: pressed ? 0.7 : 1 },
          ]}
        >
          <MaterialIcons name="delete-outline" size={18} color="#C45B5B" />
          <Text style={s.deleteBtnText}>{t('sleepDetail.deleteEntry')}</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

/* ── Styles ──────────────────────────────────────── */
const s = StyleSheet.create({
  container: {
    flex: 1,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: UI.spacing.xl,
    marginTop: Platform.OS === 'ios' ? 44 : 24,
  } as any,
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  headerTitle: { fontSize: 22, fontWeight: '900' },

  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  scrollContent: {
    paddingBottom: 100,
    gap: 14,
  },

  /* hero */
  heroCard: {
    borderBottomLeftRadius: UI.radius.xxl,
    borderBottomRightRadius: UI.radius.xxl,
    padding: 24,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    alignItems: 'center',
    overflow: 'hidden',
    ...UI.shadow.md,
  } as any,
  heroCircle1: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    top: -60,
    right: -40,
  },
  heroCircle2: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    bottom: -50,
    left: -30,
  },
  heroBackBtn: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 52 : 32,
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitle: {
    color: 'rgba(255,255,255,0.70)',
    fontSize: 16,
    fontWeight: '700',
  },
  heroDuration: {
    color: '#FFF',
    fontSize: 42,
    fontWeight: '900',
    marginTop: 4,
  },
  heroDate: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 4,
  },

  /* cards */
  card: {
    borderRadius: UI.radius.xxl,
    padding: 18,
    marginHorizontal: UI.spacing.xl,
    borderWidth: 1,
    ...UI.shadow.sm,
  },

  /* time */
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeBlock: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  timeDivider: {
    width: 1,
    height: 40,
    marginHorizontal: 12,
  },
  timeLabel: { fontSize: 12, fontWeight: '600' },
  timeValue: { fontSize: 18, fontWeight: '900' },

  /* quality */
  qualityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  qualityLabel: { fontSize: 12, fontWeight: '600' },
  qualityValue: { fontSize: 16, fontWeight: '800' },

  /* info */
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  infoLabel: { flex: 1, fontSize: 14, fontWeight: '700' },
  infoValue: { fontSize: 18, fontWeight: '900' },

  /* notes */
  notesLabel: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  notesText: {
    fontSize: 14,
    lineHeight: 22,
    fontStyle: 'italic',
  },

  /* actions */
  gotItBtn: {
    marginHorizontal: UI.spacing.xl,
    paddingVertical: 16,
    borderRadius: UI.radius.lg,
    alignItems: 'center',
    ...UI.shadow.sm,
  },
  gotItText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginHorizontal: UI.spacing.xl,
    paddingVertical: 12,
    borderWidth: 1,
    borderRadius: UI.radius.lg,
  },
  deleteBtnText: {
    color: '#C45B5B',
    fontSize: 14,
    fontWeight: '700',
  },
});
