import React from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import Svg, { Circle, Line, Path } from 'react-native-svg';
import { palette } from '@/constants/theme';
import { Type } from '@/constants/typography';
import { Icon } from '@/components/icons/Icon';
import { Glow } from '@/components/glow/Glow';
import { SettingsScreen } from '@/components/settings/SettingsParts';
import { PracticeRow, usePracticeText } from '@/components/practices/PracticeParts';
import { thumbnailUrl } from '@/components/practices/VideoDetails';
import { PRACTICES, practiceById, type Practice } from '@/data/practices';
import { backTo } from '@/lib/navigation';
import { openPractice } from '@/lib/practice-routes';

type Category = 'breathing' | 'mindfulness' | 'sleep' | 'relax' | 'relax-body' | 'relax-mind';
const CATEGORIES: Category[] = [
  'breathing',
  'mindfulness',
  'sleep',
  'relax',
  'relax-body',
  'relax-mind',
];

function Heading({ title, body }: { title: string; body: string }) {
  return (
    <View style={{ gap: 10, marginBottom: 12 }}>
      <Text
        accessibilityRole="header"
        style={[
          Type.titleMd,
          { fontSize: 30, lineHeight: 38, color: palette.plumDeep, textAlign: 'center' },
        ]}
      >
        {title}
      </Text>
      <Text
        style={[
          Type.bodyMMedium,
          { fontSize: 16, lineHeight: 26, color: palette.textMuted, textAlign: 'center' },
        ]}
      >
        {body}
      </Text>
    </View>
  );
}

/** Release tension (07 §2.10): two choice cards with wave or aura art. */
function RelaxChoice() {
  const { t } = useTranslation();
  const card = (kind: 'body' | 'mind') => (
    <Pressable
      key={kind}
      accessibilityRole="button"
      accessibilityLabel={`${t(`practices.relax.${kind}Card`)}, ${t(`practices.relax.${kind}Meta`)}`}
      onPress={() =>
        router.push({
          pathname: '/(tabs)/mindful/category/[category]',
          params: { category: `relax-${kind}` },
        })
      }
      style={({ pressed }) => ({
        height: 152,
        borderRadius: 32,
        padding: 16,
        backgroundColor: palette.white,
        overflow: 'hidden',
        borderWidth: pressed ? 1 : 0,
        borderColor: palette.plum,
        boxShadow: '0px 8px 16px rgba(36,26,46,0.05)',
      })}
    >
      {kind === 'body' ? (
        <>
          <Glow
            color={palette.mustard}
            opacity={0.5}
            width={182}
            blur={40}
            style={{ position: 'absolute', left: 132, top: -15 }}
          />
          <Glow
            color={palette.rose}
            opacity={0.3}
            width={91}
            blur={30}
            style={{ position: 'absolute', left: 246, top: 0 }}
          />
          <Svg width={400} height={152} style={{ position: 'absolute', left: 0, top: 0 }}>
            {[12, 18, 24, 30, 36, 42].map((h, i) => (
              <Path
                key={h}
                d={`M0 ${100} Q 85 ${100 - h} 170 100 T 400 100`}
                stroke={palette.plum}
                strokeOpacity={0.38 - i * 0.05}
                fill="none"
              />
            ))}
          </Svg>
        </>
      ) : (
        <>
          <Glow
            color={palette.lavender}
            opacity={0.4}
            width={182}
            blur={40}
            style={{ position: 'absolute', left: 142, top: -15 }}
          />
          <Glow
            color={palette.sky}
            opacity={0.3}
            width={91}
            blur={30}
            style={{ position: 'absolute', left: 229, top: 15 }}
          />
          <Svg width={400} height={152} style={{ position: 'absolute', left: 0, top: 0 }}>
            {[12, 22, 32, 42, 52, 62, 72].map((r, i) => (
              <Circle
                key={r}
                cx={233}
                cy={76}
                r={r}
                stroke={palette.plum}
                strokeOpacity={0.35 - i * 0.04}
                fill="none"
              />
            ))}
          </Svg>
          <Glow
            color="#F2D96A"
            opacity={0.9}
            width={20}
            blur={6.7}
            style={{ position: 'absolute', left: 223, top: 66 }}
          />
        </>
      )}
      <Text style={[Type.bodyMSemi, { fontSize: 16, color: palette.ink }]}>
        {t(`practices.relax.${kind}Card`)}
      </Text>
      <Text
        style={[
          Type.micro,
          { fontSize: 12, lineHeight: 19, color: palette.textMuted, marginTop: 6 },
        ]}
      >
        {t(`practices.relax.${kind}Meta`)}
      </Text>
    </Pressable>
  );
  return (
    <>
      <Heading title={t('practices.relax.title')} body={t('practices.relax.body')} />
      <View style={{ gap: 16 }}>{(['body', 'mind'] as const).map(card)}</View>
      <Text
        style={[
          Type.bodyMMedium,
          { fontSize: 16, color: palette.textMuted, textAlign: 'center', marginTop: 12 },
        ]}
      >
        {t('practices.relax.caption')}
      </Text>
    </>
  );
}

/** Relax your body / mind (07 §2.11): video cards with the title, a line and the thumbnail. */
function VideoCard({ practice }: { practice: Practice }) {
  const { t } = useTranslation();
  const text = usePracticeText()(practice);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${text.title}, ${text.meta}`}
      onPress={() => openPractice(practice)}
      style={({ pressed }) => ({
        height: 187,
        borderRadius: 32,
        borderWidth: 1,
        borderColor: palette.plum,
        backgroundColor: pressed ? palette.surfaceLilacSoft : palette.white,
        overflow: 'hidden',
      })}
    >
      <View style={{ flexDirection: 'row', padding: 16, paddingBottom: 0, gap: 12, height: 63 }}>
        <View style={{ flex: 1 }}>
          <Text numberOfLines={1} style={[Type.bodyMSemi, { fontSize: 16, color: palette.ink }]}>
            {text.title}
          </Text>
          <Text
            numberOfLines={1}
            style={[Type.micro, { fontSize: 12, lineHeight: 19, color: palette.textMuted }]}
          >
            {t(`practices.goodFor.${practice.id}.0`)}
          </Text>
        </View>
        <Text style={[Type.micro, { fontSize: 12, color: palette.textMuted }]}>{text.meta}</Text>
      </View>
      <Image
        source={{ uri: thumbnailUrl(practice.video!.youtubeId) }}
        style={{ flex: 1, width: '100%' }}
        resizeMode="cover"
        accessibilityIgnoresInvertColors
      />
    </Pressable>
  );
}

/** Be Present / Wind Down (07 §2.14): the illustration and pill rows with each practice's line. */
function Illustration({ kind }: { kind: 'mindfulness' | 'sleep' }) {
  return (
    <View
      style={{ height: 190, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {kind === 'mindfulness' ? (
        <>
          <Glow
            color={palette.mustard}
            opacity={0.4}
            width={247}
            blur={40}
            style={{ position: 'absolute', left: 48, top: -28 }}
          />
          <Glow
            color={palette.lavender}
            opacity={0.35}
            width={152}
            blur={35}
            style={{ position: 'absolute', left: 155, top: 29 }}
          />
          <Svg width={343} height={190} style={{ position: 'absolute' }}>
            {[14, 24, 34, 44, 54, 64, 74, 84, 94].map((r, i) => (
              <Circle
                key={r}
                cx={171}
                cy={95}
                r={r}
                stroke={palette.plum}
                strokeOpacity={0.32 - i * 0.03}
                fill="none"
              />
            ))}
          </Svg>
          <Glow color="#F2D96A" opacity={0.9} width={26} blur={8.7} />
        </>
      ) : (
        <>
          <Glow
            color={palette.mustard}
            opacity={0.5}
            width={209}
            blur={36}
            style={{ position: 'absolute', left: 67, top: 38 }}
          />
          <Svg width={343} height={190} style={{ position: 'absolute' }}>
            <Path d="M131.5 142.5 A40 40 0 0 1 211.5 142.5 Z" fill="#F0C77A" />
            <Path
              d="M96.5 142.5 A75 75 0 0 1 246.5 142.5"
              stroke={palette.plum}
              strokeOpacity={0.15}
              fill="none"
            />
            <Path
              d="M116.5 142.5 A55 55 0 0 1 226.5 142.5"
              stroke={palette.plum}
              strokeOpacity={0.2}
              fill="none"
            />
            <Line
              x1={0}
              x2={343}
              y1={142.5}
              y2={142.5}
              stroke={palette.plum}
              strokeOpacity={0.35}
            />
          </Svg>
        </>
      )}
    </View>
  );
}

function PillRow({ practice }: { practice: Practice }) {
  const { t } = useTranslation();
  const text = usePracticeText()(practice);
  const sub = `${t('practices.minutes', { count: practice.listMinutes })} · ${t(`practices.choose.${practice.id}`)}`;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${text.title}, ${sub}`}
      onPress={() => openPractice(practice)}
      style={({ pressed }) => ({
        minHeight: 56,
        borderRadius: 999,
        backgroundColor: pressed ? palette.surfaceLilac : '#EFEAF2',
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 9,
        paddingLeft: 20,
        paddingRight: 17,
        boxShadow: '0px 8px 16px rgba(75,52,37,0.05)',
      })}
    >
      <View style={{ flex: 1 }}>
        <Text style={[Type.bodyMSemi, { fontSize: 16, lineHeight: 21, color: palette.plumDeep }]}>
          {text.title}
        </Text>
        <Text
          numberOfLines={1}
          style={[Type.micro, { fontSize: 12, lineHeight: 19, color: palette.textMuted }]}
        >
          {sub}
        </Text>
      </View>
      {/* The design's long plain arrow (`6190:4171`), 20 wide in plum. */}
      <Svg width={22} height={14} viewBox="0 0 22 14">
        <Path
          d="M1 7h19M14 1.5 20 7l-6 5.5"
          stroke={palette.plum}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </Svg>
    </Pressable>
  );
}

/**
 * Be present / Wind down list group (`6186:3168`, `6190:4171`): a white sheet with 40 radius,
 * a soft upward shadow and 15 padding, holding the rows 12 apart.
 */
function ListSheet({ children }: { children: React.ReactNode }) {
  return (
    <View
      style={{
        marginTop: 24,
        marginHorizontal: -23,
        backgroundColor: palette.white,
        borderRadius: 40,
        paddingHorizontal: 15,
        paddingTop: 14,
        paddingBottom: 28,
        gap: 12,
        boxShadow: '0px -17px 38px rgba(36,26,46,0.05)',
      }}
    >
      {children}
    </View>
  );
}

/**
 * A practice category: Breathing · Choose a technique (07 §2.5), Release tension and the Relax video
 * lists (§2.10–2.11), and Be Present / Wind Down (§2.14).
 */
export default function CategoryPractices() {
  const { t } = useTranslation();
  const { category: raw } = useLocalSearchParams<{ category: string }>();
  const category: Category = CATEGORIES.includes(raw as Category) ? (raw as Category) : 'breathing';
  const items = PRACTICES.filter((p) => p.category === category);
  const back = () =>
    backTo(
      undefined,
      category.startsWith('relax-') ? '/(tabs)/mindful/category/relax' : '/(tabs)/mindful',
    );
  const relax = category.startsWith('relax');
  const glows = relax
    ? [{ color: palette.rose, opacity: 0.3, x: 180, y: 110, width: 230, blur: 90 }]
    : category === 'breathing'
      ? [
          { color: palette.sky, opacity: 0.3, x: 150, y: 40, width: 270, blur: 90 },
          { color: palette.mustard, opacity: 0.2, x: -60, y: 20, width: 220, blur: 90 },
        ]
      : [
          {
            color: category === 'sleep' ? palette.lavenderSoft : palette.lavender,
            opacity: category === 'sleep' ? 0.3 : 0.1,
            x: -40,
            y: 40,
            width: 260,
            blur: 90,
          },
          { color: palette.sky, opacity: 0.3, x: 170, y: 120, width: 240, blur: 90 },
        ];

  return (
    <SettingsScreen
      // Be present and Wind down show only the back button in the nav bar, as in their frames.
      title={category === 'mindfulness' || category === 'sleep' ? '' : t('practices.all.mindful')}
      backLabel={t('common.back')}
      onBack={back}
      glows={glows}
      contentStyle={{ gap: 12 }}
    >
      {category === 'relax' && <RelaxChoice />}
      {(category === 'relax-body' || category === 'relax-mind') && (
        <>
          <Heading
            title={t(`practices.relax.${category === 'relax-body' ? 'body' : 'mind'}Title`)}
            body={t(`practices.relax.${category === 'relax-body' ? 'body' : 'mind'}Body`)}
          />
          <View style={{ gap: 20 }}>
            {items.map((p) => (
              <VideoCard key={p.id} practice={p} />
            ))}
          </View>
        </>
      )}
      {(category === 'mindfulness' || category === 'sleep') && (
        <>
          <Heading
            title={t(`practices.categories.${category}.heading`)}
            body={t(`practices.categories.${category}.body`)}
          />
          <Illustration kind={category} />
          <ListSheet>
            {items.map((p) => (
              <PillRow key={p.id} practice={p} />
            ))}
          </ListSheet>
        </>
      )}
      {category === 'breathing' && (
        <>
          <View style={{ gap: 8, marginBottom: 14 }}>
            <Text
              accessibilityRole="header"
              style={[Type.titleMd, { fontSize: 30, lineHeight: 38, color: palette.plumDeep }]}
            >
              {t('practices.categories.breathing.heading')}
            </Text>
            <Text style={[Type.bodySm, { color: palette.textMuted }]}>
              {t('practices.categories.breathing.body')}
            </Text>
          </View>
          {items.map((p) => (
            <PracticeRow key={p.id} practice={p} onPress={() => openPractice(p)} />
          ))}
          <Pressable
            accessibilityRole="button"
            onPress={() => openPractice(practiceById('four-seven-eight')!)}
            style={{
              marginTop: 14,
              borderRadius: 24,
              backgroundColor: 'rgba(127,198,241,0.18)',
              padding: 18,
              flexDirection: 'row',
              gap: 12,
              alignItems: 'center',
            }}
          >
            <Icon name="line/sparkle" size={20} />
            <Text style={[Type.captionM, { flex: 1, color: palette.textMuted }]}>
              {t('practices.tip')}
            </Text>
          </Pressable>
        </>
      )}
    </SettingsScreen>
  );
}
