export type SearchCategory =
  | 'Sleep'
  | 'Mood'
  | 'Meditation'
  | 'Journal'
  | 'Community'
  | 'Home'
  | 'AI Chatbot'
  | 'Resources';

export type SearchItem = {
  key: string;
  titleKey: string;
  subtitleKey: string;
  category: SearchCategory;
  categoryKey: string;
  path: string;
  icon: string;
  iconBg: string;
};

export const SEARCH_ITEMS: SearchItem[] = [
  // ── Home ──
  {
    key: 'home',
    titleKey: 'search.items.homeTitle',
    subtitleKey: 'search.items.homeSubtitle',
    category: 'Home',
    categoryKey: 'search.categories.home',
    path: '/(tabs)/home',
    icon: 'home',
    iconBg: '#8B6B47',
  },
  // ── Mood ──
  {
    key: 'mood-history',
    titleKey: 'search.items.moodHistoryTitle',
    subtitleKey: 'search.items.moodHistorySubtitle',
    category: 'Mood',
    categoryKey: 'search.categories.mood',
    path: '/(tabs)/mood/history',
    icon: 'mood',
    iconBg: '#E8985A',
  },
  {
    key: 'mood-improvements',
    titleKey: 'search.items.moodImprovementsTitle',
    subtitleKey: 'search.items.moodImprovementsSubtitle',
    category: 'Mood',
    categoryKey: 'search.categories.mood',
    path: '/(tabs)/mood/stats',
    icon: 'trending-up',
    iconBg: '#5B8A5A',
  },
  {
    key: 'my-mood',
    titleKey: 'search.items.myMoodTitle',
    subtitleKey: 'search.items.myMoodSubtitle',
    category: 'Mood',
    categoryKey: 'search.categories.mood',
    path: '/(tabs)/mood/check-in',
    icon: 'emoji-emotions',
    iconBg: '#E8985A',
  },
  // ── Sleep ──
  {
    key: 'sleep-quality',
    titleKey: 'search.items.sleepQualityTitle',
    subtitleKey: 'search.items.sleepQualitySubtitle',
    category: 'Sleep',
    categoryKey: 'search.categories.sleep',
    path: '/(tabs)/sleep',
    icon: 'bedtime',
    iconBg: '#5A3E7A',
  },
  {
    key: 'sleep-history',
    titleKey: 'search.items.sleepHistoryTitle',
    subtitleKey: 'search.items.sleepHistorySubtitle',
    category: 'Sleep',
    categoryKey: 'search.categories.sleep',
    path: '/(tabs)/sleep/history',
    icon: 'history',
    iconBg: '#5A3E7A',
  },
  {
    key: 'sleep-insights',
    titleKey: 'search.items.sleepInsightsTitle',
    subtitleKey: 'search.items.sleepInsightsSubtitle',
    category: 'Sleep',
    categoryKey: 'search.categories.sleep',
    path: '/(tabs)/sleep/insights',
    icon: 'insights',
    iconBg: '#7B6DC9',
  },
  {
    key: 'sleep-schedule',
    titleKey: 'search.items.sleepScheduleTitle',
    subtitleKey: 'search.items.sleepScheduleSubtitle',
    category: 'Sleep',
    categoryKey: 'search.categories.sleep',
    path: '/(tabs)/sleep/schedule',
    icon: 'schedule',
    iconBg: '#5A3E7A',
  },
  {
    key: 'sleep-start',
    titleKey: 'search.items.sleepStartTitle',
    subtitleKey: 'search.items.sleepStartSubtitle',
    category: 'Sleep',
    categoryKey: 'search.categories.sleep',
    path: '/(tabs)/sleep/start',
    icon: 'nightlight-round',
    iconBg: '#2A1A3E',
  },
  // ── Meditation ──
  {
    key: 'meditation',
    titleKey: 'search.items.meditationTitle',
    subtitleKey: 'search.items.meditationSubtitle',
    category: 'Meditation',
    categoryKey: 'search.categories.meditation',
    path: '/(tabs)/mindful',
    icon: 'self-improvement',
    iconBg: '#5B8A5A',
  },
  {
    key: 'my-meditation',
    titleKey: 'search.items.myMeditationTitle',
    subtitleKey: 'search.items.myMeditationSubtitle',
    category: 'Meditation',
    categoryKey: 'search.categories.meditation',
    path: '/(tabs)/mindful/stats',
    icon: 'spa',
    iconBg: '#5B8A5A',
  },
  // ── Journal ──
  {
    key: 'journal',
    titleKey: 'search.items.journalTitle',
    subtitleKey: 'search.items.journalSubtitle',
    category: 'Journal',
    categoryKey: 'search.categories.journal',
    path: '/(tabs)/journal',
    icon: 'edit-note',
    iconBg: '#8B6B47',
  },
  {
    key: 'journal-prompts',
    titleKey: 'search.items.journalPromptsTitle',
    subtitleKey: 'search.items.journalPromptsSubtitle',
    category: 'Journal',
    categoryKey: 'search.categories.journal',
    path: '/(tabs)/journal/prompts',
    icon: 'lightbulb',
    iconBg: '#E8985A',
  },
  // ── Community ──
  {
    key: 'community',
    titleKey: 'search.items.communityTitle',
    subtitleKey: 'search.items.communitySubtitle',
    category: 'Community',
    categoryKey: 'search.categories.community',
    path: '/(tabs)/community',
    icon: 'people',
    iconBg: '#5B8A5A',
  },
  // ── AI Chatbot ──
  {
    key: 'chatbot',
    titleKey: 'search.items.chatbotTitle',
    subtitleKey: 'search.items.chatbotSubtitle',
    category: 'AI Chatbot',
    categoryKey: 'search.categories.aiChatbot',
    path: '/(tabs)/chat',
    icon: 'smart-toy',
    iconBg: '#7B6DC9',
  },
  // ── Resources ──
  {
    key: 'stress',
    titleKey: 'search.items.stressTitle',
    subtitleKey: 'search.items.stressSubtitle',
    category: 'Resources',
    categoryKey: 'search.categories.resources',
    path: '/(tabs)/stress',
    icon: 'psychology',
    iconBg: '#E8985A',
  },
  {
    key: 'notifications',
    titleKey: 'search.items.notificationsTitle',
    subtitleKey: 'search.items.notificationsSubtitle',
    category: 'Resources',
    categoryKey: 'search.categories.resources',
    path: '/(tabs)/notifications',
    icon: 'notifications',
    iconBg: '#8B6B47',
  },
  {
    key: 'profile',
    titleKey: 'search.items.profileTitle',
    subtitleKey: 'search.items.profileSubtitle',
    category: 'Resources',
    categoryKey: 'search.categories.resources',
    path: '/(tabs)/profile',
    icon: 'person',
    iconBg: '#8B6B47',
  },
  {
    key: 'help',
    titleKey: 'search.items.helpTitle',
    subtitleKey: 'search.items.helpSubtitle',
    category: 'Resources',
    categoryKey: 'search.categories.resources',
    path: '/(utils)/help-center',
    icon: 'help',
    iconBg: '#5A8FB5',
  },
  {
    key: 'assessment',
    titleKey: 'search.items.assessmentTitle',
    subtitleKey: 'search.items.assessmentSubtitle',
    category: 'Resources',
    categoryKey: 'search.categories.resources',
    path: '/(onboarding)/assessment',
    icon: 'assignment',
    iconBg: '#7B6DC9',
  },
];

/* ─── Category chips metadata ─── */
export const SEARCH_CATEGORIES: { label: SearchCategory; labelKey: string; icon: string }[] = [
  { label: 'Sleep', labelKey: 'search.categories.sleep', icon: 'bedtime' },
  { label: 'Mood', labelKey: 'search.categories.mood', icon: 'mood' },
  { label: 'Meditation', labelKey: 'search.categories.meditation', icon: 'self-improvement' },
  { label: 'Journal', labelKey: 'search.categories.journal', icon: 'edit-note' },
  { label: 'Community', labelKey: 'search.categories.community', icon: 'people' },
  { label: 'Home', labelKey: 'search.categories.home', icon: 'home' },
  { label: 'AI Chatbot', labelKey: 'search.categories.aiChatbot', icon: 'smart-toy' },
  { label: 'Resources', labelKey: 'search.categories.resources', icon: 'more-horiz' },
];

export function searchCatalogue(
  query: string,
  categories: SearchCategory[],
  alphabetical: boolean,
  translate: (key: string) => string,
): SearchItem[] {
  const terms = query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  const matches = SEARCH_ITEMS.filter(
    (item) =>
      (!categories.length || categories.includes(item.category)) &&
      terms.every((term) =>
        `${translate(item.titleKey)} ${translate(item.subtitleKey)} ${translate(item.categoryKey)}`
          .toLocaleLowerCase()
          .includes(term),
      ),
  );
  return alphabetical
    ? matches.sort((a, b) => translate(a.titleKey).localeCompare(translate(b.titleKey)))
    : matches;
}
