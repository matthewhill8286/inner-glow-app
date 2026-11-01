import React, { useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { palette } from '@/constants/theme';
import { Type } from '@/constants/typography';
import { AppField } from '@/components/ui/AppField';
import { AppButton } from '@/components/ui/AppButton';
import { ListGroup, ListRow } from '@/components/ui/ListRow';
import { Tag } from '@/components/ui/Chip';
import { LegalNote } from '@/components/ui/controls';
import { SectionCaption } from './AssessmentShell';
import SearchingRings from '@/assets/svg/illustrations/assessment/searching-rings.svg';
import { searchMedications, toggleMedication, type MedicationClassKey, type PickedMedication } from '@/lib/medications';

type Labels = {
  placeholder: string;
  results: (count: number) => string;
  selected: string;
  remove: (name: string) => string;
  noMatchTitle: (query: string) => string;
  noMatchBody: string;
  addManually: (query: string) => string;
  classLabel: (key: MedicationClassKey) => string;
  note: string;
};

/**
 * Medication search (N1 `6787:5620`, N2 `6787:5710`): the library Search Field, a result count, a
 * List Group of radio rows (name and class), the picked medicines as removable Tags, and the legal
 * note. With no results it shows the searching rings, "No match for …" and "Add … manually".
 * The Selected block stays visible in that state too when something is already picked.
 */
export function MedicationSearch({ value, onChange, labels }: { value: PickedMedication[]; onChange: (list: PickedMedication[]) => void; labels: Labels }) {
  const [query, setQuery] = useState('');
  const terms = query.trim();
  // The catalogue is on the device, so results follow every keystroke.
  const results = useMemo(() => searchMedications(terms), [terms]);

  const picked = (name: string) => value.some((m) => m.name.toLowerCase() === name.toLowerCase());
  const empty = terms.length >= 2 && results.length === 0;

  const selectedBlock = value.length > 0 && (
    <View style={{ gap: 8 }}>
      <SectionCaption>{labels.selected}</SectionCaption>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {value.map((m) => (
          <Tag key={m.name} label={m.name} onRemove={() => onChange(value.filter((x) => x !== m))} />
        ))}
      </View>
    </View>
  );

  return (
    <View style={{ gap: 24 }}>
      <AppField variant="search" value={query} onChangeText={setQuery} placeholder={labels.placeholder} autoCorrect={false} autoCapitalize="none" returnKeyType="search" />
      {empty ? (
        <View style={{ gap: 24 }}>
          <View style={{ alignItems: 'center', gap: 12, paddingTop: 16 }} accessibilityLiveRegion="polite">
            <SearchingRings width={96} height={96} />
            <Text style={[Type.titleSm, { letterSpacing: 0, color: palette.ink, textAlign: 'center' }]}>{labels.noMatchTitle(terms)}</Text>
            <Text style={[Type.bodySm, { color: palette.textMuted, textAlign: 'center' }]}>{labels.noMatchBody}</Text>
          </View>
          <AppButton
            variant="secondary"
            title={labels.addManually(terms)}
            onPress={() => {
              onChange(toggleMedication(value, { name: terms, custom: true }));
              setQuery('');
            }}
          />
          {selectedBlock}
        </View>
      ) : (
        <>
          {terms.length >= 2 && (
            <View style={{ gap: 8 }}>
              <SectionCaption>{labels.results(results.length)}</SectionCaption>
              {results.length > 0 && (
                <ListGroup>
                  {results.map((r) => (
                    <ListRow
                      key={r.name}
                      label={r.name}
                      // The class reads best ("Antidepressant"); a brand without one shows its generic instead.
                      supportingText={r.class ? labels.classLabel(r.class) : r.generic}
                      trailing="radio"
                      selected={picked(r.name)}
                      onPress={() => onChange(toggleMedication(value, { name: r.name, class: r.class, generic: r.generic, custom: false }))}
                    />
                  ))}
                </ListGroup>
              )}
            </View>
          )}
          {selectedBlock}
          <LegalNote text={labels.note} />
        </>
      )}
    </View>
  );
}
