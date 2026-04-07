import React from 'react';
import { View, Text, Pressable, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import * as Linking from 'expo-linking';
import { router } from 'expo-router';

export default function Resources() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1, padding: 24, backgroundColor: '#f6f4f2', paddingTop: insets.top + 6 }}>
      <View
        style={{
          marginTop: 14,
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Text style={{ fontSize: 24, fontWeight: '900' }}>{t('resourcesScreen.title')}</Text>
        <Pressable
          onPress={() => router.back()}
          style={{ padding: 10, borderRadius: 14, backgroundColor: '#eee' }}
        >
          <Text style={{ fontWeight: '900' }}>{t('resourcesScreen.back')}</Text>
        </Pressable>
      </View>

      <Text style={{ marginTop: 12, opacity: 0.8 }}>
        {t('resourcesScreen.warning')}
      </Text>

      <Pressable
        onPress={() =>
          Linking.openURL(
            Platform.select({ ios: 'tel:988', android: 'tel:988', default: 'tel:988' }),
          )
        }
        style={{ marginTop: 16, padding: 14, borderRadius: 18, backgroundColor: 'white' }}
      >
        <Text style={{ fontSize: 16, fontWeight: '900' }}>{t('resourcesScreen.call988')}</Text>
        <Text style={{ opacity: 0.7, marginTop: 4 }}>{t('resourcesScreen.crisisLifeline')}</Text>
      </Pressable>

      <Pressable
        onPress={() => Linking.openURL('https://findahelpline.com')}
        style={{ marginTop: 12, padding: 14, borderRadius: 18, backgroundColor: 'white' }}
      >
        <Text style={{ fontSize: 16, fontWeight: '900' }}>{t('resourcesScreen.findHelpline')}</Text>
        <Text style={{ opacity: 0.7, marginTop: 4 }}>{t('resourcesScreen.directory')}</Text>
      </Pressable>
    </View>
  );
}
