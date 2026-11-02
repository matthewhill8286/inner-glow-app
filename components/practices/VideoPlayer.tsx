import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  BackHandler,
  Image,
  Pressable,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import YoutubePlayer, { type YoutubeIframeRef } from 'react-native-youtube-iframe';
import { palette } from '@/constants/theme';
import { Type } from '@/constants/typography';
import { Icon } from '@/components/icons/Icon';
import { GlowField } from '@/components/glow/Glow';
import { IconButton } from '@/components/ui/IconButton';
import {
  CompleteModal,
  EndEarlySheet,
  usePracticeText,
} from '@/components/practices/PracticeParts';
import type { Practice } from '@/data/practices';
import { useMindfulness } from '@/hooks/useMindfulness';
import { useDailyGoal } from '@/hooks/usePractices';
import { mmss } from '@/lib/practices';
import { thumbnailUrl } from '@/components/practices/VideoDetails';

/** Leaving after this share of the video counts as finished (07 §5.10). */
const DONE_SHARE = 0.9;
const MIN_SAVE_SECONDS = 10;

/**
 * Video player (07 §2.13, redrawn in 10 §3.8): title, length and body tag, the video card with one
 * centre play/pause button, the progress row, the level chips and the closing line. YouTube's own
 * controls are hidden and the card drives the player. Leaving early asks first; the end, or leaving
 * after 90 %, shows Complete. Each session is saved with how much was watched.
 */
export function VideoPlayer({ practice }: { practice: Practice }) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const text = usePracticeText()(practice);
  const { addSession } = useMindfulness();
  const { today, goal, refreshNudge } = useDailyGoal();
  const ref = useRef<YoutubeIframeRef>(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  // iOS ignores a scripted play until the video itself has been tapped once. Until then only the centre
  // of the card lets a tap through to the frame, which starts the video; the rest of the card blocks
  // YouTube's title, share and "Watch on YouTube" links. Once started, the card's button drives the
  // player and the frame gets no taps at all.
  const [playing, setPlaying] = useState(false);
  const [started, setStarted] = useState(false);
  const [position, setPosition] = useState(0);
  const [length, setLength] = useState(practice.video!.seconds);
  const [endOpen, setEndOpen] = useState(false);
  const [done, setDone] = useState(false);
  const watched = useRef(0);
  const saved = useRef(false);
  const cardW = width - 32;

  const togglePlay = () => {
    setPlaying((p) => !p);
  };

  useEffect(() => {
    if (!ready) return;
    void ref.current?.getDuration().then((d) => d > 0 && setLength(d));
    const id = setInterval(() => {
      void ref.current?.getCurrentTime().then((s) => {
        setPosition(s);
        watched.current = Math.max(watched.current, s);
      });
    }, 500);
    return () => clearInterval(id);
  }, [ready]);

  const save = useCallback(
    async (completed: boolean) => {
      if (saved.current) return;
      const seconds = Math.round(Math.min(length, watched.current));
      if (!completed && seconds < MIN_SAVE_SECONDS) return;
      saved.current = true;
      try {
        await addSession({
          seconds,
          note: text.title,
          practice: {
            id: practice.id,
            category: practice.category,
            completed,
            plannedSeconds: Math.round(length),
          },
        });
        await refreshNudge(today + Math.round(seconds / 60), goal);
      } catch {
        // The session stays unsaved; the player still closes.
      }
    },
    [length, addSession, text.title, practice.id, practice.category, refreshNudge, today, goal],
  );

  const finish = useCallback(() => {
    setPlaying(false);
    setDone(true);
    void save(true);
  }, [save]);

  const askToLeave = useCallback(() => {
    if (done) return false;
    if (watched.current >= length * DONE_SHARE) {
      finish();
      return true;
    }
    setPlaying(false);
    setEndOpen(true);
    return true;
  }, [done, length, finish]);
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', askToLeave);
    return () => sub.remove();
  }, [askToLeave]);

  const elapsed = watched.current;
  const total = mmss(length);
  const endBody =
    elapsed < 60
      ? t('practices.video.watchedSeconds', { count: Math.floor(elapsed), total })
      : t('practices.video.watchedMinutes', { elapsed: mmss(elapsed), total });

  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <GlowField
        glows={[{ color: palette.rose, opacity: 0.22, x: 180, y: 110, width: 230, blur: 90 }]}
      />
      <View style={{ marginTop: insets.top + 6, marginHorizontal: 16 }}>
        <IconButton
          variant="nav"
          accessibilityLabel={t('common.back')}
          onPress={() => (askToLeave() ? undefined : router.back())}
        />
      </View>
      <View style={{ alignItems: 'center', gap: 14, paddingHorizontal: 24, marginTop: 16 }}>
        <Text
          accessibilityRole="header"
          style={[
            Type.titleMd,
            { fontSize: 30, lineHeight: 38, color: palette.plumDeep, textAlign: 'center' },
          ]}
        >
          {text.title}
        </Text>
        <Text
          style={[Type.bodyMMedium, { fontSize: 16, color: palette.textMuted }]}
        >{`${total.replace(/^0/, '')} · ${text.tag}`}</Text>
        <Text
          style={[
            Type.bodyMMedium,
            { fontSize: 16, lineHeight: 24, color: palette.textMuted, textAlign: 'center' },
          ]}
        >
          {t('practices.video.instruction')}
        </Text>
      </View>

      <View
        style={{
          marginTop: 24,
          marginHorizontal: 16,
          height: 212,
          borderRadius: 24,
          overflow: 'hidden',
          backgroundColor: palette.ink,
          boxShadow: '0px 0px 0px 4px rgba(107,82,121,0.25)',
        }}
      >
        {/* A playing iOS web view can draw above its siblings, so the overlays below carry zIndex and,
            once started, the frame takes no touches. */}
        {!failed && (
          <View pointerEvents={started ? 'none' : 'auto'} style={{ zIndex: 0 }}>
            <YoutubePlayer
              ref={ref}
              height={212}
              width={cardW}
              videoId={practice.video!.youtubeId}
              play={playing}
              initialPlayerParams={{
                controls: false,
                modestbranding: true,
                rel: false,
                iv_load_policy: 3,
              }}
              onReady={() => setReady(true)}
              onError={() => setFailed(true)}
              onChangeState={(state: string) => {
                if (state === 'playing') {
                  setStarted(true);
                  setPlaying(true);
                } else if (state === 'paused') setPlaying(false);
                else if (state === 'ended') finish();
              }}
            />
          </View>
        )}
        {/* Video (10 §3.8): the thumbnail with the shade stands in for the video whenever it is not
            playing, which also hides YouTube's paused overlay. */}
        {!playing && (
          <View pointerEvents="none" style={{ position: 'absolute', inset: 0, zIndex: 1 }}>
            {/* hqdefault is 4:3 with the 16:9 frame letterboxed; the slight zoom hides the bars. */}
            <Image
              source={{ uri: thumbnailUrl(practice.video!.youtubeId) }}
              resizeMode="cover"
              style={{ position: 'absolute', inset: 0, transform: [{ scale: 1.06 }] }}
            />
            <Svg style={{ position: 'absolute', inset: 0 }} width="100%" height="100%">
              <Defs>
                <LinearGradient id="videoShade" x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0.5" stopColor={palette.ink} stopOpacity={0} />
                  <Stop offset="1" stopColor={palette.ink} stopOpacity={0.35} />
                </LinearGradient>
              </Defs>
              <Rect x={0} y={0} width="100%" height="100%" fill="url(#videoShade)" />
            </Svg>
          </View>
        )}
        {ready && !failed && !started && (
          // Blockers around a centre gap: a tap in the gap reaches the video and starts it.
          <>
            <View
              style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 56, zIndex: 1 }}
            />
            <View
              style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 56, zIndex: 1 }}
            />
            <View
              style={{
                position: 'absolute',
                left: 0,
                top: 56,
                bottom: 56,
                width: cardW / 2 - 60,
                zIndex: 1,
              }}
            />
            <View
              style={{
                position: 'absolute',
                right: 0,
                top: 56,
                bottom: 56,
                width: cardW / 2 - 60,
                zIndex: 1,
              }}
            />
          </>
        )}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={playing ? t('practices.player.pause') : t('practices.player.play')}
          disabled={!ready || failed}
          onPress={togglePlay}
          pointerEvents={started || !ready || failed ? 'auto' : 'none'}
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 2,
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            padding: 24,
          }}
        >
          {failed ? (
            <Text style={[Type.bodySm, { color: palette.white, textAlign: 'center' }]}>
              {t('practices.video.error')}
            </Text>
          ) : !ready ? (
            <>
              <ActivityIndicator color={palette.white} />
              <Text style={[Type.captionM, { color: palette.white }]}>
                {t('practices.video.loading')}
              </Text>
            </>
          ) : (
            <View
              style={{
                width: 60,
                height: 60,
                borderRadius: 30,
                backgroundColor: palette.white,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon name={playing ? 'line/pause' : 'line/play'} size={24} color={palette.plum} />
            </View>
          )}
        </Pressable>
      </View>

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          paddingHorizontal: 32,
          marginTop: 14,
        }}
      >
        <Text style={[Type.micro, { fontSize: 12, color: palette.textMuted }]}>
          {mmss(position)}
        </Text>
        <View
          accessibilityRole="progressbar"
          accessibilityValue={{ min: 0, max: Math.round(length), now: Math.round(position) }}
          style={{
            flex: 1,
            height: 4,
            borderRadius: 2,
            backgroundColor: palette.borderLilac,
            overflow: 'hidden',
          }}
        >
          <View
            style={{
              height: 4,
              width: `${Math.min(100, (position / Math.max(1, length)) * 100)}%`,
              backgroundColor: palette.plum,
            }}
          />
        </View>
        <Text style={[Type.micro, { fontSize: 12, color: palette.textMuted }]}>{total}</Text>
      </View>

      <View style={{ alignItems: 'center', gap: 10, marginTop: 24, paddingHorizontal: 24 }}>
        <Text
          style={[Type.bodyMMedium, { fontSize: 16, color: palette.textMuted }]}
        >{`${text.tag} · ${text.level}`}</Text>
        <Text
          style={[
            Type.bodyMMedium,
            { fontSize: 16, lineHeight: 24, color: palette.textMuted, textAlign: 'center' },
          ]}
        >
          {t('practices.video.closing')}
        </Text>
      </View>

      <EndEarlySheet
        visible={endOpen}
        elapsed={elapsed}
        totalMinutes={Math.max(1, Math.round(length / 60))}
        bodyText={endBody}
        onKeep={() => {
          setEndOpen(false);
          setPlaying(true);
        }}
        onEnd={() => {
          setEndOpen(false);
          void save(false).then(() => router.dismissTo('/(tabs)/mindful'));
        }}
      />
      <CompleteModal
        visible={done}
        title={t('practices.complete.practice', { title: text.title })}
        body={t('practices.complete.body')}
        onBack={() => router.dismissTo('/(tabs)/mindful')}
        onReflect={() =>
          router.replace({
            pathname: '/(tabs)/chat/new-conversation',
            params: {
              initialMessage: t('practices.complete.reflectPrompt', { title: text.title }),
              from: '/(tabs)/mindful',
            },
          })
        }
      />
    </View>
  );
}
