import React from 'react';
import { View, Text, Pressable, ScrollView, useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Colors, UI } from '@/constants/theme';
import { STRESS_VIDEOS } from '@/data/stressVideos';

interface HorizontalVideoListProps {
  title: string;
  category: 'body' | 'mind';
  icon: string;
  iconColor: string;
}

export function HorizontalVideoList({
  title,
  category,
  icon,
  iconColor,
}: HorizontalVideoListProps) {
  const router = useRouter();
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];

  const videos = STRESS_VIDEOS.filter((v) => v.category === category).slice(0, 5);

  return (
    <View style={{ marginTop: 24, marginBottom: 8 }}>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingHorizontal: 4,
          marginBottom: 12,
        }}
      >
        <Text style={{ fontSize: 20, fontWeight: '900', color: colors.text }}>{title}</Text>
        <Pressable
          onPress={() =>
            router.push({ pathname: '/(tabs)/stress/list/[category]', params: { category } })
          }
        >
          <Text style={{ color: colors.primary, fontWeight: '600' }}>See All</Text>
        </Pressable>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 12, paddingHorizontal: 4 }}
      >
        {videos.map((video) => (
          <Pressable
            key={video.id}
            onPress={() =>
              router.push({
                pathname: '/(tabs)/stress/list/[category]/[videoId]',
                params: { category: video.category, videoId: video.id },
              })
            }
            style={{
              width: 200,
              backgroundColor: colors.card,
              borderRadius: UI.radius.lg,
              padding: 16,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 2,
            }}
          >
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: iconColor + '20',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 12,
              }}
            >
              <MaterialIcons name={icon as any} size={20} color={iconColor} />
            </View>
            <Text
              style={{
                fontSize: 16,
                fontWeight: '900',
                color: colors.text,
                marginBottom: 4,
              }}
              numberOfLines={1}
            >
              {video.title}
            </Text>
            <Text
              style={{ fontSize: 13, color: colors.mutedText, lineHeight: 18 }}
              numberOfLines={2}
            >
              {video.subtitle}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}
