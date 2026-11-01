import React, { useRef, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { palette } from '@/constants/theme';
import { Type } from '@/constants/typography';
import { Icon } from '@/components/icons/Icon';
import { Tag } from '@/components/ui/Chip';
import { FOCUS_RING } from './choices';

/**
 * Concerns chip input (A11 `4002:14883`): a white box, radius 40, 1px lavender stroke and the plum
 * ring while focused, padding 16; entered concerns are Tags (gap 8) followed by the text input.
 * Return or a comma adds the typed concern. Below it, "Most Common:" offers Tags to add with a tap.
 */
export function ConcernsInput({
  values,
  onChange,
  suggestions,
  labels,
}: {
  values: string[];
  onChange: (values: string[]) => void;
  suggestions: string[];
  labels: { placeholder: string; mostCommon: string; add: (name: string) => string; remove: (name: string) => string };
}) {
  const [text, setText] = useState('');
  const [focused, setFocused] = useState(false);
  const input = useRef<TextInput>(null);
  const has = (v: string) => values.some((x) => x.toLowerCase() === v.toLowerCase());
  const add = (raw: string) => {
    const v = raw.trim();
    if (v && !has(v)) onChange([...values, v]);
    setText('');
  };
  const remaining = suggestions.filter((s) => !has(s)).slice(0, 3);

  return (
    <View style={{ gap: 24 }}>
      <Pressable
        onPress={() => input.current?.focus()}
        accessible={false}
        style={{
          minHeight: 124,
          borderRadius: 40,
          padding: 16,
          backgroundColor: palette.surface,
          borderWidth: 1,
          borderColor: palette.lavender,
          boxShadow: focused ? FOCUS_RING : undefined,
          flexDirection: 'row',
          flexWrap: 'wrap',
          alignContent: 'flex-start',
          alignItems: 'center',
          gap: 8,
        }}
      >
        {values.map((v) => (
          <Tag key={v} label={v} onRemove={() => onChange(values.filter((x) => x !== v))} />
        ))}
        <TextInput
          ref={input}
          value={text}
          onChangeText={(t) => (t.endsWith(',') ? add(t.slice(0, -1)) : setText(t))}
          onSubmitEditing={() => add(text)}
          onFocus={() => setFocused(true)}
          onBlur={() => {
            setFocused(false);
            add(text);
          }}
          submitBehavior="submit"
          returnKeyType="done"
          placeholder={values.length ? undefined : labels.placeholder}
          placeholderTextColor={palette.textSubtle}
          accessibilityLabel={labels.placeholder}
          style={[Type.bodyS, { flexGrow: 1, minWidth: 96, minHeight: 22, paddingVertical: 0, color: palette.ink }]}
        />
      </Pressable>
      {remaining.length > 0 && (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', gap: 8 }}>
          <Text style={[Type.buttonS, { color: palette.plumDeep }]}>{labels.mostCommon}</Text>
          {remaining.map((s) => (
            <Pressable key={s} accessibilityRole="button" accessibilityLabel={labels.add(s)} onPress={() => add(s)} hitSlop={8}>
              <Tag label={s} />
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

export const REFLECTION_MAX = 250;

/**
 * Reflection field (A14 `4002:15033`): 184 high, white, radius 32, 1px plum stroke (with an ink @0.30
 * ring while focused), padding 24, SemiBold 20 ink text, and a note icon with the "n/250" counter at
 * the bottom right. Below it, the "Use voice instead" pill (40 high, `#F1ECF5`, 1.5 plum stroke).
 */
export function ReflectionField({
  value,
  onChange,
  onUseVoice,
  labels,
}: {
  value: string;
  onChange: (text: string) => void;
  onUseVoice: () => void;
  labels: { placeholder: string; a11y: string; useVoice: string };
}) {
  const [focused, setFocused] = useState(false);
  const input = useRef<TextInput>(null);
  return (
    <View style={{ gap: 24, alignItems: 'center' }}>
      <Pressable
        onPress={() => input.current?.focus()}
        accessible={false}
        style={{
          alignSelf: 'stretch',
          height: 184,
          borderRadius: 32,
          padding: 24,
          backgroundColor: palette.surface,
          borderWidth: 1,
          borderColor: palette.plum,
          boxShadow: focused ? '0px 0px 0px 4px rgba(36,26,46,0.30)' : undefined,
          justifyContent: 'space-between',
        }}
      >
        <TextInput
          ref={input}
          value={value}
          onChangeText={(t) => onChange(t.slice(0, REFLECTION_MAX))}
          maxLength={REFLECTION_MAX}
          multiline
          placeholder={labels.placeholder}
          placeholderTextColor={palette.textSubtle}
          accessibilityLabel={labels.a11y}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={[Type.titleSm, { letterSpacing: 0, color: palette.ink, flex: 1, paddingTop: 0, textAlignVertical: 'top' }]}
        />
        <View style={{ flexDirection: 'row', alignSelf: 'flex-end', alignItems: 'center', gap: 8 }} accessibilityLabel={`${value.length} / ${REFLECTION_MAX}`}>
          <Icon name="line/note" size={24} color={palette.textMuted} />
          <Text style={[Type.buttonL, { color: palette.textMuted }]}>
            {value.length}/{REFLECTION_MAX}
          </Text>
        </View>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        onPress={() => {
          // Dictation is the keyboard's microphone, so open the keyboard on the field first.
          input.current?.focus();
          onUseVoice();
        }}
        style={({ pressed }) => ({
          height: 40,
          paddingHorizontal: 16,
          borderRadius: 999,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          backgroundColor: palette.selected,
          borderWidth: 1.5,
          borderColor: palette.plum,
          opacity: pressed ? 0.85 : 1,
        })}
      >
        <Icon name="line/mic" size={24} />
        <Text style={[Type.buttonL, { color: palette.ink }]}>{labels.useVoice}</Text>
      </Pressable>
    </View>
  );
}
