import React, { useEffect, useRef, useState } from 'react';
import {
  FlatList,
  Pressable,
  Text,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { palette } from '@/constants/theme';
import { Type } from '@/constants/typography';
import { AppButton } from '@/components/ui/AppButton';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { ALL_DAYS, minuteOptions, type ReminderSchedule } from '@/lib/reminder-schedule';

const ROW = 32;
const VISIBLE = 5;

/**
 * A snapping wheel that wraps around (55 sits above 00, as in the design): the middle row is the
 * value in Regular 30 ink, the rows around it Regular 16 subtle. The list holds three copies and
 * jumps back to the middle copy after each scroll, so it never runs out.
 */
function Wheel({
  values,
  value,
  onChange,
  label,
}: {
  values: number[];
  value: number;
  onChange: (v: number) => void;
  label: string;
}) {
  const ref = useRef<FlatList<number>>(null);
  const n = values.length;
  const data = [...values, ...values, ...values];
  const [index, setIndex] = useState(n + Math.max(0, values.indexOf(value)));
  useEffect(() => {
    const i = n + Math.max(0, values.indexOf(value));
    setIndex(i);
    requestAnimationFrame(() => ref.current?.scrollToOffset({ offset: i * ROW, animated: false }));
    // Only when the sheet opens with a new value.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [n]);
  const indexAt = (e: NativeSyntheticEvent<NativeScrollEvent>) =>
    Math.min(data.length - 1, Math.max(0, Math.round(e.nativeEvent.contentOffset.y / ROW)));
  const select = (i: number, animated: boolean) => {
    const middle = n + (((i % n) + n) % n);
    setIndex(middle);
    onChange(values[middle - n]);
    if (middle !== i || animated) ref.current?.scrollToOffset({ offset: middle * ROW, animated });
  };
  const settle = (e: NativeSyntheticEvent<NativeScrollEvent>) => select(indexAt(e), false);
  return (
    <View
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={label}
      accessibilityValue={{ text: String(data[index]).padStart(2, '0') }}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={(e) =>
        select(index + (e.nativeEvent.actionName === 'increment' ? 1 : -1), true)
      }
      style={{ width: 64, height: ROW * VISIBLE }}
    >
      <FlatList
        ref={ref}
        data={data}
        keyExtractor={(v, i) => `${i}`}
        showsVerticalScrollIndicator={false}
        snapToInterval={ROW}
        decelerationRate="fast"
        getItemLayout={(_, i) => ({ length: ROW, offset: ROW * i, index: i })}
        contentContainerStyle={{ paddingVertical: ROW * 2 }}
        onScroll={(e) => setIndex(indexAt(e))}
        scrollEventThrottle={32}
        onMomentumScrollEnd={settle}
        onScrollEndDrag={(e) => {
          if (!e.nativeEvent.velocity?.y) settle(e);
        }}
        renderItem={({ item, index: i }) => (
          <View style={{ height: ROW, alignItems: 'center', justifyContent: 'center' }}>
            <Text
              style={
                i === index
                  ? [Type.body, { fontSize: 30, lineHeight: 36, color: palette.ink }]
                  : [Type.body, { fontSize: 16, lineHeight: 20, color: palette.textSubtle }]
              }
            >
              {String(item).padStart(2, '0')}
            </Text>
          </View>
        )}
      />
    </View>
  );
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);

/**
 * Settings · Edit reminder time (08 §2.9, `6787:7567`): the reminder's name, an hour and minute wheel
 * (24-hour, minutes in fives), the seven day circles, Save, and "Turn off this reminder". The quiet
 * hours tiles reuse it with no days and no turn-off.
 */
export function ReminderSheet({
  visible,
  title,
  schedule,
  showDays = true,
  onSave,
  onTurnOff,
  onClose,
}: {
  visible: boolean;
  title: string;
  schedule: ReminderSchedule;
  showDays?: boolean;
  onSave: (schedule: ReminderSchedule) => void;
  onTurnOff?: () => void;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const [hour, setHour] = useState(schedule.hour);
  const [minute, setMinute] = useState(schedule.minute);
  const [days, setDays] = useState<number[]>(schedule.weekdays);
  useEffect(() => {
    if (!visible) return;
    setHour(schedule.hour);
    setMinute(schedule.minute);
    setDays(schedule.weekdays);
  }, [visible, schedule]);
  const letters = t('me.reminderSheet.dayLetters').split(',');
  const names = t('me.reminderSheet.dayLabels').split(',');
  const minutes = minuteOptions(schedule.minute);

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      background={palette.bg}
      gap={16}
      radius={28}
      closeLabel={t('common.close')}
    >
      <Text
        accessibilityRole="header"
        style={[
          Type.titleSm,
          { fontSize: 20, lineHeight: 28, color: palette.ink, textAlign: 'center' },
        ]}
      >
        {title}
      </Text>
      {visible && (
        <View
          style={{
            alignSelf: 'stretch',
            height: 160,
            backgroundColor: palette.white,
            borderRadius: 24,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 24,
          }}
        >
          <Wheel
            values={HOURS}
            value={schedule.hour}
            onChange={setHour}
            label={t('me.reminderSheet.hours')}
          />
          <Text style={[Type.body, { fontSize: 30, lineHeight: 36, color: palette.ink }]}>:</Text>
          <Wheel
            values={minutes}
            value={schedule.minute}
            onChange={setMinute}
            label={t('me.reminderSheet.minutes')}
          />
        </View>
      )}
      {showDays && (
        <View
          accessibilityLabel={t('me.reminderSheet.days')}
          style={{ flexDirection: 'row', justifyContent: 'center', gap: 6 }}
        >
          {ALL_DAYS.map((d) => {
            const on = days.includes(d);
            return (
              <Pressable
                key={d}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: on }}
                accessibilityLabel={names[d - 1]}
                onPress={() =>
                  setDays((prev) =>
                    on ? (prev.length > 1 ? prev.filter((x) => x !== d) : prev) : [...prev, d],
                  )
                }
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: on ? palette.selected : palette.white,
                  borderWidth: on ? 1.5 : 1,
                  borderColor: on ? palette.plum : palette.borderLilac,
                }}
              >
                <Text
                  style={[
                    Type.buttonS,
                    { fontSize: 14, color: on ? palette.plum : palette.textMuted },
                  ]}
                >
                  {letters[d - 1]}
                </Text>
              </Pressable>
            );
          })}
        </View>
      )}
      <View style={{ alignSelf: 'stretch', gap: 4 }}>
        <AppButton
          title={t('me.reminderSheet.save')}
          onPress={() => onSave({ hour, minute, weekdays: days })}
        />
        {onTurnOff && (
          <AppButton title={t('me.reminderSheet.turnOff')} variant="text" onPress={onTurnOff} />
        )}
      </View>
    </BottomSheet>
  );
}
