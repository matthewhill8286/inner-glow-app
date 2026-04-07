import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  Pressable,
  Animated,
  Linking,
  StyleSheet,
} from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useTranslation } from 'react-i18next';
import type { Citation } from '@/lib/citations';

/* ── Props ─────────────────────────────────────────── */

type CitationSectionProps = {
  citations: Citation[];
  /** Text & icon color for the toggle button */
  accentColor?: string;
  /** Colors from the theme */
  colors: {
    text: string;
    mutedText: string;
    subtleText: string;
    card: string;
    border: string;
    background: string;
  };
  /** Compact mode for inside message bubbles */
  compact?: boolean;
};

/* ── Component ─────────────────────────────────────── */

export default function CitationSection({
  citations,
  accentColor = '#8B6B47',
  colors,
  compact = false,
}: CitationSectionProps) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const rotation = useRef(new Animated.Value(0)).current;

  if (!citations || citations.length === 0) return null;

  const toggle = () => {
    Animated.timing(rotation, {
      toValue: expanded ? 0 : 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
    setExpanded(!expanded);
  };

  const rotateZ = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  return (
    <View style={compact ? s.wrapCompact : s.wrap}>
      {/* Toggle button */}
      <Pressable
        onPress={toggle}
        style={({ pressed }) => [
          s.toggleBtn,
          compact && s.toggleBtnCompact,
          { opacity: pressed ? 0.7 : 1 },
        ]}
        hitSlop={8}
      >
        <MaterialIcons
          name="menu-book"
          size={compact ? 12 : 14}
          color={accentColor}
        />
        <Text
          style={[
            s.toggleText,
            compact && s.toggleTextCompact,
            { color: accentColor },
          ]}
        >
          {t('citations.sources', { count: citations.length })}
        </Text>
        <Animated.View style={{ transform: [{ rotateZ }] }}>
          <MaterialIcons
            name="expand-more"
            size={compact ? 14 : 16}
            color={accentColor}
          />
        </Animated.View>
      </Pressable>

      {/* Expandable citation list */}
      {expanded && (
        <View style={[s.list, compact && s.listCompact]}>
          {citations.map((c, idx) => (
            <Pressable
              key={c.url + idx}
              onPress={() => Linking.openURL(c.url)}
              style={({ pressed }) => [
                s.citationRow,
                compact && s.citationRowCompact,
                {
                  backgroundColor: pressed
                    ? accentColor + '08'
                    : 'transparent',
                },
              ]}
            >
              <View style={[s.sourceTag, { backgroundColor: accentColor + '14' }]}>
                <Text
                  style={[
                    s.sourceText,
                    compact && s.sourceTextCompact,
                    { color: accentColor },
                  ]}
                  numberOfLines={1}
                >
                  {c.source}
                </Text>
              </View>
              <Text
                style={[
                  s.titleText,
                  compact && s.titleTextCompact,
                  { color: colors.text },
                ]}
                numberOfLines={2}
              >
                {c.title}
              </Text>
              <MaterialIcons
                name="open-in-new"
                size={compact ? 10 : 12}
                color={colors.subtleText}
                style={{ marginLeft: 4, flexShrink: 0 }}
              />
            </Pressable>
          ))}

          <Text
            style={[
              s.disclaimer,
              compact && s.disclaimerCompact,
              { color: colors.subtleText },
            ]}
          >
            {t('citations.disclaimer')}
          </Text>
        </View>
      )}
    </View>
  );
}

/* ── Styles ─────────────────────────────────────────── */

const s = StyleSheet.create({
  wrap: {
    marginTop: 10,
  },
  wrapCompact: {
    marginTop: 6,
  },

  /* toggle */
  toggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 4,
  },
  toggleBtnCompact: {
    paddingVertical: 2,
    gap: 3,
  },
  toggleText: {
    fontSize: 12,
    fontWeight: '700',
  },
  toggleTextCompact: {
    fontSize: 11,
  },

  /* list */
  list: {
    marginTop: 8,
    gap: 6,
  },
  listCompact: {
    marginTop: 5,
    gap: 4,
  },

  /* row */
  citationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
    paddingHorizontal: 4,
    borderRadius: 8,
  },
  citationRowCompact: {
    gap: 5,
    paddingVertical: 4,
    paddingHorizontal: 2,
  },

  /* source tag */
  sourceTag: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    flexShrink: 0,
  },
  sourceText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  sourceTextCompact: {
    fontSize: 9,
  },

  /* title */
  titleText: {
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
    flex: 1,
  },
  titleTextCompact: {
    fontSize: 11,
    lineHeight: 14,
  },

  /* disclaimer */
  disclaimer: {
    fontSize: 10,
    fontStyle: 'italic',
    marginTop: 4,
    lineHeight: 14,
  },
  disclaimerCompact: {
    fontSize: 9,
    marginTop: 2,
  },
});
