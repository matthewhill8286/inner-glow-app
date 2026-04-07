import React, { useMemo, useState, useCallback } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, Dimensions } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, UI } from '@/constants/theme';
import { STRESS_VIDEOS } from '@/data/stressVideos';
import { getStressQuotes } from '@/constants/quotes';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import ScreenHeader from '@/components/ScreenHeader';
import YoutubePlayer from 'react-native-youtube-iframe';

const { width } = Dimensions.get('window');

export default function WatchVideoScreen() {
  const { videoId } = useLocalSearchParams<{ videoId: string; category: string }>();
  const { t } = useTranslation();
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];
  const [playing, setPlaying] = useState(false);

  const video = STRESS_VIDEOS.find((v) => v.id === videoId);

  const onStateChange = useCallback((state: string) => {
    if (state === 'ended') {
      setPlaying(false);
    }
  }, []);

  const randomQuote = useMemo(() => {
    const quotes = getStressQuotes(t);
    return quotes[Math.floor(Math.random() * quotes.length)];
  }, [t]);

  if (!video) {
    return (
      <View
        style={[
          styles.container,
          {
            backgroundColor: colors.background,
            justifyContent: 'center',
            alignItems: 'center',
            padding: 24,
          },
        ]}
      >
        <Text style={{ color: colors.text }}>{t('videoDetail.notFound')}</Text>
        <Pressable onPress={() => router.back()} style={{ marginTop: 20 }}>
          <Text style={{ color: colors.primary, fontWeight: '900' }}>
            {t('videoDetail.goBack')}
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={{ paddingHorizontal: UI.spacing.xl }}>
        <ScreenHeader title={video.title} showBack />
      </View>
      <ScrollView showsVerticalScrollIndicator={false} style={{ marginTop: 14 }}>
        <View style={styles.videoContainer}>
          <YoutubePlayer
            height={(width * 9) / 16}
            play={playing}
            videoId={video.youtubeId}
            onChangeState={onStateChange}
          />
        </View>

        <View style={[styles.quoteCard, { backgroundColor: colors.card }]}>
          <MaterialIcons
            name="format-quote"
            size={32}
            color={colors.primary}
            style={{ opacity: 0.3 }}
          />
          <Text style={[styles.quoteText, { color: colors.text }]}>{randomQuote}</Text>
          <Text style={[styles.videoSubtitle, { color: colors.mutedText }]}>{video.subtitle}</Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 8,
  },
  videoContainer: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#000',
  },
  quoteCard: {
    margin: UI.spacing.xl,
    padding: 24,
    borderRadius: UI.radius.xl,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  quoteText: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 26,
    marginBottom: 16,
  },
  videoSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    opacity: 0.8,
  },
});
