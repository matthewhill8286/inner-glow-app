import React, { useState } from 'react';
import { Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { palette } from '@/constants/theme';
import { Type } from '@/constants/typography';
import { AppButton } from '@/components/ui/AppButton';
import { AppField } from '@/components/ui/AppField';
import { ListGroup, ListRow } from '@/components/ui/ListRow';
import { SettingsScreen, SettingsSection } from '@/components/settings/SettingsParts';
import { SUPPORTED_LANGUAGES, setLanguage, type LanguageCode } from '@/i18n';
import { backTo } from '@/lib/navigation';

/** English names shown under each language's own name. */
const ENGLISH_NAME: Record<LanguageCode, string> = { en: 'English', el: 'Greek' };

/**
 * Language (06 P8, `6720:4839`): search, the current language, every supported language with a
 * radio, and Save. Only languages with a full translation are listed.
 */
export default function Language() {
  const { t, i18n } = useTranslation();
  const current = (
    SUPPORTED_LANGUAGES.find((l) => l.code === i18n.language) ?? SUPPORTED_LANGUAGES[0]
  ).code;
  const [chosen, setChosen] = useState<LanguageCode>(current);
  const [query, setQuery] = useState('');
  const q = query.trim().toLocaleLowerCase();
  const matches = SUPPORTED_LANGUAGES.filter(
    (l) =>
      !q ||
      l.label.toLocaleLowerCase().includes(q) ||
      ENGLISH_NAME[l.code].toLocaleLowerCase().includes(q),
  );
  const currentLang = SUPPORTED_LANGUAGES.find((l) => l.code === current)!;

  async function save() {
    if (chosen !== current) await setLanguage(chosen);
    backTo(undefined, '/(tabs)/profile/settings');
  }

  return (
    <SettingsScreen
      title={t('me.language.title')}
      backLabel={t('common.back')}
      onBack={() => backTo(undefined, '/(tabs)/profile/settings')}
      cta={<AppButton title={t('me.language.save')} onPress={() => void save()} />}
    >
      <AppField
        variant="search"
        value={query}
        onChangeText={setQuery}
        placeholder={t('me.language.search')}
        autoCorrect={false}
      />
      <SettingsSection label={t('me.language.current')}>
        <ListGroup>
          <ListRow
            label={currentLang.label}
            supportingText={ENGLISH_NAME[currentLang.code]}
            trailing="radio"
            selected={chosen === currentLang.code}
            onPress={() => setChosen(currentLang.code)}
          />
        </ListGroup>
      </SettingsSection>
      <SettingsSection label={t('me.language.all')}>
        {matches.length ? (
          <ListGroup>
            {matches.map((l) => (
              <ListRow
                key={l.code}
                label={l.label}
                supportingText={ENGLISH_NAME[l.code]}
                trailing="radio"
                selected={chosen === l.code}
                onPress={() => setChosen(l.code)}
              />
            ))}
          </ListGroup>
        ) : (
          <Text style={[Type.captionM, { color: palette.textMuted }]}>
            {t('me.language.noMatches', { query })}
          </Text>
        )}
      </SettingsSection>
    </SettingsScreen>
  );
}
