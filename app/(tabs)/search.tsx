import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenStatusBar } from '@/components/ui/ScreenStatusBar';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Svg, { Circle } from 'react-native-svg';
import { palette, shadow } from '@/constants/theme';
import { Type } from '@/constants/typography';
import { Glow, GlowField } from '@/components/glow/Glow';
import { Icon, type IconName } from '@/components/icons/Icon';
import { IconButton } from '@/components/ui/IconButton';
import { AppButton } from '@/components/ui/AppButton';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { PRACTICES, practiceById, type Practice } from '@/data/practices';
import { useJournal } from '@/hooks/useJournal';
import { useChat } from '@/hooks/useChat';
import { backTo } from '@/lib/navigation';
import { openPractice } from '@/lib/practice-routes';
import { screenBottomPadding } from '@/lib/screen-layout';
import { talkTitle } from '@/lib/talks';
import {
  addRecent,
  DEFAULT_FILTERS,
  highlight,
  search,
  suggestions,
  type LengthFilter,
  type SearchFilters,
  type SearchItem,
  type SearchKind,
  type SearchType,
  type TimeFilter,
} from '@/lib/search';

const RECENT_KEY = 'search:recent:v1';
const POPULAR = ['deep-sleep', 'four-seven-eight', 'grounding'];
const TRY_WORDS = ['sleep', 'anxiety', 'breathing', 'focus'];

/** Row icon and tint per kind (05 §4.2). */
const LOOK: Record<SearchKind, { icon: IconName; tint: string }> = {
  sleep: { icon: 'line/moon', tint: 'rgba(216,180,216,0.30)' },
  breathing: { icon: 'line/leaf', tint: 'rgba(127,198,241,0.30)' },
  mindfulness: { icon: 'line/meditate', tint: 'rgba(142,127,166,0.30)' },
  relax: { icon: 'line/activity', tint: 'rgba(226,204,64,0.30)' },
  journal: { icon: 'line/journal', tint: 'rgba(226,204,64,0.30)' },
  talk: { icon: 'line/sparkle', tint: 'rgba(142,127,166,0.30)' },
  insight: { icon: 'line/chart', tint: 'rgba(127,198,241,0.30)' },
};
const TYPE_ICON: Record<SearchType, IconName> = {
  practice: 'line/meditate',
  journal: 'line/journal',
  talk: 'line/sparkle',
  insight: 'line/chart',
};

/** Insight screens that can be found by name. */
const INSIGHTS: { id: string; route: string }[] = [
  { id: 'sleep', route: '/(tabs)/sleep/insights' },
  { id: 'mood', route: '/(tabs)/mood/stats' },
  { id: 'score', route: '/(tabs)/freud-score/insights' },
  { id: 'journal', route: '/(tabs)/journal/stats' },
  { id: 'practice', route: '/(tabs)/mindful/history' },
];

const kindOf = (p: Practice): SearchKind =>
  p.category === 'sleep' ? 'sleep' : p.category === 'breathing' ? 'breathing' : p.category === 'mindfulness' ? 'mindfulness' : 'relax';

/**
 * Search (05 §4): idle (recent searches, popular practices, Ask Glow AI), typing suggestions,
 * results with type tabs and the filter sheet, and Nothing here yet. Practices, journal entries,
 * Glow AI talks and insight screens are searched on the device.
 */
export default function SearchScreen() {
  const { t, i18n } = useTranslation();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { journalEntries } = useJournal();
  const { conversations } = useChat();
  const input = useRef<TextInput>(null);
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [recent, setRecent] = useState<string[]>([]);
  const [filters, setFilters] = useState<SearchFilters>(DEFAULT_FILTERS);
  const [draft, setDraft] = useState<SearchFilters>(DEFAULT_FILTERS);
  const [sheet, setSheet] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(RECENT_KEY)
      .then((raw) => raw && setRecent(JSON.parse(raw)))
      .catch(() => {});
  }, []);
  const saveRecent = (next: string[]) => {
    setRecent(next);
    AsyncStorage.setItem(RECENT_KEY, JSON.stringify(next)).catch(() => {});
  };

  // Each item knows how to open itself.
  const { items, open } = useMemo(() => {
    const routes = new Map<string, () => void>();
    const list: SearchItem[] = [];
    for (const p of PRACTICES) {
      const id = `practice:${p.id}`;
      list.push({
        id,
        type: 'practice',
        kind: kindOf(p),
        title: t(`practices.items.${p.id}.title`),
        body: `${t(`practices.items.${p.id}.tag`)} ${t(`practices.items.${p.id}.description`)}`,
        minutes: p.listMinutes,
      });
      routes.set(id, () => openPractice(p));
    }
    for (const j of journalEntries) {
      const id = `journal:${j.id}`;
      list.push({
        id,
        type: 'journal',
        kind: 'journal',
        title: j.title?.trim() || t('searchFlow.untitled'),
        body: j.content,
        at: Date.parse(j.createdAt),
      });
      routes.set(id, () => router.push({ pathname: '/(tabs)/journal/[id]', params: { id: j.id } }));
    }
    for (const c of conversations) {
      const id = `talk:${c.raw}`;
      list.push({
        id,
        type: 'talk',
        kind: 'talk',
        title: talkTitle(c.messages, t('searchFlow.talk')),
        body: c.messages.map((m) => m.content).join(' '),
        at: c.updatedAt,
      });
      routes.set(id, () =>
        router.push({ pathname: '/(tabs)/chat/[issueKey]', params: { issueKey: c.raw, persona: c.personaId, from: '/(tabs)/search' } }),
      );
    }
    for (const ins of INSIGHTS) {
      const id = `insight:${ins.id}`;
      list.push({ id, type: 'insight', kind: 'insight', title: t(`searchFlow.insights.${ins.id}`) });
      routes.set(id, () => router.push(ins.route as never));
    }
    return { items: list, open: routes };
  }, [journalEntries, conversations, t]);

  const results = useMemo(() => search(items, query, filters), [items, query, filters]);
  const draftCount = useMemo(() => search(items, query, draft).length, [items, query, draft]);
  const typed = suggestions(items, query);
  const popular = POPULAR.map((id) => items.find((i) => i.id === `practice:${id}`)).filter((x): x is SearchItem => !!x);

  const submit = (q = query) => {
    const value = q.trim();
    if (!value) return;
    setQuery(value);
    setSubmitted(true);
    saveRecent(addRecent(recent, value));
    input.current?.blur();
  };
  const choose = (item: SearchItem) => {
    if (query.trim()) saveRecent(addRecent(recent, query));
    open.get(item.id)?.();
  };
  const ask = () =>
    router.push({
      pathname: '/(tabs)/chat/new-conversation',
      params: { initialMessage: query.trim(), from: '/(tabs)/search' },
    });

  const tag = (item: SearchItem) => {
    if (item.type === 'practice') {
      const p = practiceById(item.id.slice(9))!;
      const cat = p.category.startsWith('relax') ? 'relax' : p.category;
      return `${t(`practices.categories.${cat}.title`)} · ${t('searchFlow.minutes', { count: item.minutes })}`;
    }
    if (item.type === 'journal')
      return `${t('searchFlow.types.journal')} · ${new Date(item.at!).toLocaleDateString(i18n.language, { day: 'numeric', month: 'short' })}`;
    if (item.type === 'talk')
      return `${t('searchFlow.talk')} · ${new Date(item.at!).toLocaleDateString(i18n.language, { weekday: 'short' })}`;
    return t('searchFlow.types.insight');
  };

  const mode = !query.trim() ? 'idle' : !submitted ? 'typing' : results.length ? 'results' : 'empty';

  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <ScreenStatusBar style="dark" />
      {mode === 'empty' && (
        <GlowField
          glows={[
            { color: palette.lavenderSoft, opacity: 0.45, x: 62.5, y: 165, width: 250, blur: 60 },
            { color: palette.mustard, opacity: 0.3, x: 147.5, y: 230, width: 160, blur: 50 },
          ]}
        />
      )}
      {/* Header (05 §4.1): back, the pill field and the filter button. */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 24, marginTop: insets.top + 14 }}>
        <IconButton variant="nav" accessibilityLabel={t('common.back')} onPress={() => backTo(undefined, '/(tabs)/home')} />
        <View
          style={{
            flex: 1,
            height: 48,
            borderRadius: 24,
            backgroundColor: palette.white,
            borderWidth: focused ? 1.5 : 0,
            borderColor: palette.plum,
            boxShadow: focused ? '0px 0px 0px 4px rgba(107,82,121,0.12)' : undefined,
            flexDirection: 'row',
            alignItems: 'center',
            paddingLeft: 16,
            paddingRight: 13,
            gap: 8,
          }}
        >
          <Icon name="line/search" size={20} color={query ? palette.plum : palette.textSubtle} />
          <TextInput
            ref={input}
            autoFocus
            value={query}
            onChangeText={(v) => {
              setQuery(v);
              setSubmitted(false);
            }}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            onSubmitEditing={() => submit()}
            returnKeyType="search"
            autoCapitalize="none"
            autoCorrect={false}
            placeholder={t('searchFlow.placeholder')}
            placeholderTextColor={palette.textSubtle}
            accessibilityLabel={t('searchFlow.placeholder')}
            style={[Type.bodySMedium, { flex: 1, color: palette.ink, paddingVertical: 0 }]}
          />
          {query ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('searchFlow.clear')}
              hitSlop={11}
              onPress={() => {
                setQuery('');
                setSubmitted(false);
                input.current?.focus();
              }}
              style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: palette.selected, alignItems: 'center', justifyContent: 'center' }}
            >
              <Icon name="arrow/close" size={12} color={palette.plum} />
            </Pressable>
          ) : null}
        </View>
        <IconButton
          variant="solid"
          icon="line/filter"
          iconSize={20}
          accessibilityLabel={t('searchFlow.filter.title')}
          onPress={() => {
            setDraft(filters);
            setSheet(true);
          }}
        />
      </View>

      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 20, paddingBottom: screenBottomPadding(insets.bottom) }}>
        {mode === 'idle' && (
          <>
            {recent.length > 0 && (
              <>
                <SectionTitle label={t('searchFlow.recent')} action={t('searchFlow.clearRecent')} onAction={() => saveRecent([])} />
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12, marginBottom: 28 }}>
                  {recent.map((r) => (
                    <WordChip key={r} label={r} onPress={() => submit(r)} />
                  ))}
                </View>
              </>
            )}
            <SectionTitle label={t('searchFlow.popular')} />
            <View style={{ gap: 10, marginTop: 12 }}>
              {popular.map((item) => (
                <ResultRow key={item.id} item={item} tag={tag(item)} query="" onPress={() => choose(item)} />
              ))}
            </View>
            <View style={{ marginTop: 28 }}>
              <SectionTitle label={t('searchFlow.notSure')} />
            </View>
            <AskCard subtitle={t('searchFlow.askIdle')} onPress={ask} style={{ marginTop: 12 }} />
          </>
        )}

        {mode === 'typing' && (
          <>
            {typed.length > 0 && (
              <View style={{ backgroundColor: palette.white, borderRadius: 22, paddingVertical: 6 }}>
                {typed.map((s) => (
                  <Pressable
                    key={s}
                    accessibilityRole="button"
                    onPress={() => submit(s)}
                    style={({ pressed }) => ({ minHeight: 45, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, opacity: pressed ? 0.7 : 1 })}
                  >
                    <Icon name="line/search" size={20} color={palette.lavender} />
                    <Highlighted text={s} query={query} style={[Type.bodyMMedium, { color: palette.ink }]} />
                  </Pressable>
                ))}
              </View>
            )}
            <AskCard subtitle={`“${query.trim()}”`} onPress={ask} style={{ marginTop: 16 }} />
          </>
        )}

        {mode === 'results' && (
          <>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={[Type.chipSelected, { color: palette.ink }]}>{t('searchFlow.results', { count: results.length })}</Text>
              <Text style={[Type.chip, { color: palette.lavender }]}>{t('searchFlow.relevant')}</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 12, marginHorizontal: -24 }} contentContainerStyle={{ gap: 8, paddingHorizontal: 24 }}>
              {(['all', 'practice', 'journal', 'talk'] as const).map((k) => {
                const on = k === 'all' ? filters.types.length === 0 : filters.types.length === 1 && filters.types[0] === k;
                return (
                  <TypeChip
                    key={k}
                    label={t(`searchFlow.tabs.${k}`)}
                    icon={k === 'all' ? undefined : TYPE_ICON[k]}
                    selected={on}
                    onPress={() => setFilters((f) => ({ ...f, types: k === 'all' ? [] : [k] }))}
                  />
                );
              })}
            </ScrollView>
            <View style={{ gap: 10, marginTop: 16 }}>
              {results.map((item) => (
                <ResultRow key={item.id} item={item} tag={tag(item)} query={query} onPress={() => choose(item)} />
              ))}
            </View>
          </>
        )}

        {mode === 'empty' && (
          <View style={{ alignItems: 'center' }}>
            <SearchingRings size={Math.min(260, width - 48)} />
            <Text accessibilityRole="header" style={[Type.titleLg, { lineHeight: 36, color: palette.ink, marginTop: 12 }]}>
              {t('searchFlow.emptyTitle')}
            </Text>
            <Text style={[Type.bodyS, { color: palette.textMuted, textAlign: 'center', marginTop: 8 }]}>
              {t('searchFlow.emptyBody', { query: query.trim() })}
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8, marginTop: 24 }}>
              {TRY_WORDS.map((w) => (
                <WordChip key={w} label={t(`searchFlow.try.${w}`)} onPress={() => submit(t(`searchFlow.try.${w}`))} />
              ))}
            </View>
            <AppButton title={t('searchFlow.ask')} icon="line/sparkle" iconPosition="left" onPress={ask} style={{ alignSelf: 'stretch', marginTop: 40 }} />
          </View>
        )}
      </ScrollView>

      {/* Filter sheet (05 §4.8): Show, Length and Time, with a live count. */}
      <BottomSheet visible={sheet} onClose={() => setSheet(false)} closeLabel={t('common.close')} overlayOpacity={0.5}>
        <View style={{ alignSelf: 'stretch', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={[Type.titleMd, { color: palette.ink }]}>{t('searchFlow.filter.title')}</Text>
          <Pressable accessibilityRole="button" hitSlop={10} onPress={() => setDraft(DEFAULT_FILTERS)}>
            <Text style={[Type.buttonS, { color: palette.lavender }]}>{t('searchFlow.filter.reset')}</Text>
          </Pressable>
        </View>
        <FilterGroup label={t('searchFlow.filter.show')}>
          {(['practice', 'journal', 'talk', 'insight'] as SearchType[]).map((k) => (
            <TypeChip
              key={k}
              label={t(`searchFlow.filter.types.${k}`)}
              icon={TYPE_ICON[k]}
              selected={draft.types.includes(k)}
              onPress={() =>
                setDraft((d) => ({ ...d, types: d.types.includes(k) ? d.types.filter((x) => x !== k) : [...d.types, k] }))
              }
            />
          ))}
        </FilterGroup>
        <FilterGroup label={t('searchFlow.filter.length')}>
          {(['short', 'mid', 'long'] as LengthFilter[]).map((k) => (
            <TypeChip
              key={k}
              label={t(`searchFlow.filter.lengths.${k}`)}
              selected={draft.length === k}
              onPress={() => setDraft((d) => ({ ...d, length: d.length === k ? 'any' : k }))}
            />
          ))}
        </FilterGroup>
        <FilterGroup label={t('searchFlow.filter.time')}>
          {(['week', 'month', 'all'] as TimeFilter[]).map((k) => (
            <TypeChip key={k} label={t(`searchFlow.filter.times.${k}`)} selected={draft.time === k} onPress={() => setDraft((d) => ({ ...d, time: k }))} />
          ))}
        </FilterGroup>
        <AppButton
          title={t('searchFlow.filter.show_results', { count: draftCount })}
          onPress={() => {
            setFilters(draft);
            setSheet(false);
            if (query.trim()) setSubmitted(true);
          }}
          style={{ alignSelf: 'stretch', marginTop: 8 }}
        />
      </BottomSheet>
    </View>
  );
}

function SectionTitle({ label, action, onAction }: { label: string; action?: string; onAction?: () => void }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
      <Text accessibilityRole="header" style={[Type.chipSelected, { color: palette.ink }]}>{label}</Text>
      {action ? (
        <Pressable accessibilityRole="button" hitSlop={10} onPress={onAction}>
          <Text style={[Type.chipSelected, { color: palette.lavender }]}>{action}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function WordChip({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => ({ height: 36, paddingHorizontal: 14, borderRadius: 999, justifyContent: 'center', backgroundColor: palette.white, borderWidth: 1, borderColor: palette.border, opacity: pressed ? 0.75 : 1 })}
    >
      <Text style={[Type.chip, { color: palette.textMuted }]}>{label}</Text>
    </Pressable>
  );
}

function TypeChip({ label, icon, selected, onPress }: { label: string; icon?: IconName; selected: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => ({
        height: 37,
        paddingLeft: icon ? 10 : 14,
        paddingRight: 14,
        borderRadius: 999,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: selected ? palette.selected : palette.white,
        borderWidth: selected ? 1.5 : 1,
        borderColor: selected ? palette.plum : palette.border,
        opacity: pressed ? 0.75 : 1,
      })}
    >
      {icon && <Icon name={icon} size={16} color={selected ? palette.plum : palette.textMuted} />}
      <Text style={[selected ? Type.chipSelected : Type.chip, { color: selected ? palette.plum : palette.textMuted }]}>{label}</Text>
    </Pressable>
  );
}

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={{ alignSelf: 'stretch', gap: 10 }}>
      <Text style={[Type.chipSelected, { color: palette.ink }]}>{label}</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{children}</View>
    </View>
  );
}

/** The matched part of a title in bold plum (05 §4.2). */
function Highlighted({ text, query, style }: { text: string; query: string; style: React.ComponentProps<typeof Text>['style'] }) {
  const at = highlight(text, query);
  if (!at) return <Text numberOfLines={1} style={[style, { flex: 1 }]}>{text}</Text>;
  return (
    <Text numberOfLines={1} style={[style, { flex: 1 }]}>
      {text.slice(0, at[0])}
      <Text style={{ fontWeight: '700', color: palette.plum }}>{text.slice(at[0], at[1])}</Text>
      {text.slice(at[1])}
    </Text>
  );
}

function ResultRow({ item, tag, query, onPress }: { item: SearchItem; tag: string; query: string; onPress: () => void }) {
  const look = LOOK[item.kind];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${item.title}, ${tag}`}
      onPress={onPress}
      style={({ pressed }) => ({ minHeight: 72, borderRadius: 22, backgroundColor: palette.white, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, opacity: pressed ? 0.85 : 1 })}
    >
      <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: look.tint, alignItems: 'center', justifyContent: 'center' }}>
        <Icon name={look.icon} size={20} color={palette.plum} />
      </View>
      <View style={{ flex: 1, gap: 4, alignItems: 'flex-start' }}>
        <View style={{ flexDirection: 'row' }}>
          <Highlighted text={item.title} query={query} style={[Type.bodyMSemi, { color: palette.ink }]} />
        </View>
        <View style={{ backgroundColor: palette.selected, borderRadius: 999, paddingVertical: 2, paddingHorizontal: 8 }}>
          <Text style={[Type.microBold, { fontWeight: '600', color: palette.plum }]}>{tag}</Text>
        </View>
      </View>
      <Icon name="arrow/chevron-right" size={18} />
    </Pressable>
  );
}

function AskCard({ subtitle, onPress, style }: { subtitle: string; onPress: () => void; style?: object }) {
  const { t } = useTranslation();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        { minHeight: 72, borderRadius: 22, backgroundColor: palette.white, borderWidth: 1, borderColor: 'rgba(107,82,121,0.35)', overflow: 'hidden', flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, opacity: pressed ? 0.85 : 1, boxShadow: shadow.soft },
        style,
      ]}
    >
      <Glow color={palette.mustard} opacity={0.4} width={110} blur={24} style={{ position: 'absolute', right: -20, top: -35 }} />
      <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: palette.plum, alignItems: 'center', justifyContent: 'center' }}>
        <Icon name="line/sparkle" size={20} color={palette.white} />
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={[Type.bodyMSemi, { color: palette.ink }]}>{t('searchFlow.ask')}</Text>
        <Text numberOfLines={1} style={[Type.captionS, { color: palette.textMuted }]}>{subtitle}</Text>
      </View>
      <Icon name="arrow/chevron-right" size={18} />
    </Pressable>
  );
}

/** "Searching rings" (05 §4.7): six circles, the outer three dashed, around a search glyph. */
function SearchingRings({ size }: { size: number }) {
  const c = size / 2;
  const rings = [
    { d: 32, o: 0.28 },
    { d: 64, o: 0.24 },
    { d: 96, o: 0.2 },
    { d: 128, o: 0.16, dash: true },
    { d: 160, o: 0.12, dash: true },
    { d: 192, o: 0.08, dash: true },
  ];
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }} accessibilityElementsHidden>
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        {rings.map((r) => (
          <Circle key={r.d} cx={c} cy={c} r={r.d / 2} stroke={palette.plum} strokeOpacity={r.o} strokeWidth={1} strokeDasharray={r.dash ? '3 6' : undefined} fill="none" />
        ))}
      </Svg>
      <Icon name="line/search" size={20} color={palette.plum} />
    </View>
  );
}
