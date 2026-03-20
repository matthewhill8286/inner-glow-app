import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, UI } from '@/constants/theme';
import { IconSymbol } from '@/components/icon-symbol';
import { useTranslation } from 'react-i18next';

export default function TabsLayout() {
  const { t } = useTranslation();
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];
  const insets = useSafeAreaInsets();

  // On devices with a home indicator (insets.bottom > 0), position just above it.
  // On devices without one, use a small fixed offset.
  const tabBarBottom = insets.bottom > 0 ? insets.bottom - 6 : (Platform.OS === 'ios' ? 8 : 8);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          position: 'absolute',
          bottom: tabBarBottom,
          left: 16,
          right: 16,
          backgroundColor: colors.tabBarBg,
          borderRadius: UI.radius.xxl,
          height: 64,
          paddingBottom: 0,
          borderTopWidth: 0,
          borderWidth: 1,
          borderColor: colors.border,
          ...UI.shadow.lg,
        },
        tabBarItemStyle: {
          paddingTop: 8,
          paddingBottom: 8,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '700',
          marginTop: 2,
        },
        tabBarActiveTintColor: colors.tabIconSelected,
        tabBarInactiveTintColor: colors.tabIconDefault,
      }}
    >
      {/* Visible tabs */}
      <Tabs.Screen
        name="home"
        options={{
          title: t('tabs.home'),
          tabBarIcon: ({ color }) => <IconSymbol size={24} name="house.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: t('tabs.chat'),
          tabBarIcon: ({ color }) => <IconSymbol size={24} name="text.bubble" color={color} />,
        }}
      />
      <Tabs.Screen
        name="journal"
        options={{
          title: t('tabs.journal'),
          tabBarIcon: ({ color }) => <IconSymbol size={24} name="note.text" color={color} />,
        }}
      />
      <Tabs.Screen
        name="mood"
        options={{
          title: t('tabs.mood'),
          tabBarIcon: ({ color }) => <IconSymbol size={24} name="face.smiling" color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('tabs.profile'),
          tabBarIcon: ({ color }) => <IconSymbol size={24} name="person.2.fill" color={color} />,
        }}
      />

      {/* Hidden from the tab bar but present for tab layout persistence */}
      <Tabs.Screen name="search" options={{ href: null }} />
      <Tabs.Screen name="stress" options={{ href: null }} />
      <Tabs.Screen name="sleep" options={{ href: null }} />
      <Tabs.Screen name="chat/history" options={{ href: null }} />
      <Tabs.Screen name="chat/[issueKey]" options={{ href: null }} />
      <Tabs.Screen name="chat/ai-profile" options={{ href: null }} />
      <Tabs.Screen name="chat/new-conversation" options={{ href: null }} />
      <Tabs.Screen name="chat/customize" options={{ href: null }} />
      <Tabs.Screen name="mindful" options={{ href: null }} />
      <Tabs.Screen name="community" options={{ href: null }} />
      <Tabs.Screen name="notifications" options={{ href: null }} />
      <Tabs.Screen name="settings" options={{ href: null }} />
      <Tabs.Screen name="profile-edit" options={{ href: null }} />
      <Tabs.Screen name="profile-overview" options={{ href: null }} />
      <Tabs.Screen name="notification-detail" options={{ href: null }} />
      <Tabs.Screen name="community-new-post" options={{ href: null }} />
      <Tabs.Screen name="community-post-success" options={{ href: null }} />
      <Tabs.Screen name="community-post" options={{ href: null }} />
      <Tabs.Screen name="community-notifs" options={{ href: null }} />
      <Tabs.Screen name="community-filter" options={{ href: null }} />
      <Tabs.Screen name="community-profile" options={{ href: null }} />
      <Tabs.Screen name="freud-score" options={{ href: null }} />
    </Tabs>
  );
}
