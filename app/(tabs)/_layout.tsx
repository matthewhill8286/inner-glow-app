import { primaryTabForPath } from '@/lib/route-parents';
import { SessionGate } from '@/components/SessionGate';
import { GlowTabBar, type GlowTab } from '@/components/navigation/GlowTabBar';
import { useHealthSleepAutoSync } from '@/hooks/useHealthSleep';
import { Tabs, useSegments, usePathname } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';

export default function TabsLayout() {
  const { t } = useTranslation();
  const activeTab = primaryTabForPath(usePathname());
  useHealthSleepAutoSync();
  const segments = useSegments() as string[];
  const isChatDetail =
    segments.includes('chat') && segments.length > 2 && segments.at(-1) !== 'index';
  const hidden =
    isChatDetail ||
    (segments.includes('profile') && segments.includes('edit')) ||
    segments.includes('schedule') ||
    (segments.includes('community') && segments.includes('new-post')) ||
    // The mood check-in and Mood logged are full-screen flows with no tab bar (04 §M2–M5).
    (segments.includes('mood') && (segments.includes('check-in') || segments.includes('logged'))) ||
    // Only the Glow score screen itself keeps the tab bar (03 §2.2–2.7).
    (segments.includes('freud-score') &&
      ['history', 'insights', 'completed', 'ai-suggestions', 'ai-suggestion-category'].some((s) => segments.includes(s))) ||
    // Practice Set up, the players and the daily goal are full-screen (07 §2.6–2.7, 10 §3.7).
    (segments.includes('mindful') && ['[id]', 'goal'].some((s) => segments.includes(s)) && !segments.includes('category'));

  // Design order (00-foundations §4.5): Home, Practices, Glow AI (centre), Journal, Profile.
  const tabs: GlowTab[] = [
    { route: 'home', label: t('tabs.home'), icon: 'line/home' },
    { route: 'mindful', label: t('tabs.practices'), icon: 'line/meditate' },
    { route: 'chat', label: t('tabs.glowAi'), icon: 'line/sparkle', centre: true },
    { route: 'journal', label: t('tabs.journal'), icon: 'line/journal' },
    { route: 'profile', label: t('tabs.profile'), icon: 'line/user' },
  ];

  return (
    <SessionGate>
      <Tabs
        backBehavior="history"
        screenOptions={{ headerShown: false }}
        tabBar={(props) => <GlowTabBar {...props} tabs={tabs} activeRoute={activeTab} hidden={hidden} />}
      >
        <Tabs.Screen name="home" options={{ title: t('tabs.home') }} />
        <Tabs.Screen name="mindful" options={{ title: t('tabs.practices') }} />
        <Tabs.Screen name="chat" options={{ title: t('tabs.glowAi') }} />
        <Tabs.Screen name="journal" options={{ title: t('tabs.journal') }} />
        <Tabs.Screen name="profile" options={{ title: t('tabs.profile') }} />

        {/* Routes without a tab of their own; their owner tab stays highlighted. */}
        <Tabs.Screen name="mood" options={{ href: null }} />
        <Tabs.Screen name="search" options={{ href: null }} />
        <Tabs.Screen name="stress" options={{ href: null }} />
        <Tabs.Screen name="sleep" options={{ href: null }} />
        <Tabs.Screen name="community" options={{ href: null }} />
        <Tabs.Screen name="notifications" options={{ href: null }} />
        <Tabs.Screen name="freud-score" options={{ href: null }} />
      </Tabs>
    </SessionGate>
  );
}
