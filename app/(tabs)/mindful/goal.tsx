import React, { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { palette } from '@/constants/theme';
import { Type } from '@/constants/typography';
import { AppButton } from '@/components/ui/AppButton';
import { Chip } from '@/components/ui/Chip';
import { ListGroup, ListRow } from '@/components/ui/ListRow';
import { toast } from '@/components/Toast';
import { SettingsScreen } from '@/components/settings/SettingsParts';
import { useDailyGoal } from '@/hooks/usePractices';
import { backTo } from '@/lib/navigation';
import { goalNudgeEnabled } from '@/lib/notifications';
import { GOAL_MAX, GOAL_MIN, stepGoal } from '@/lib/practices';

const PRESETS = [5, 10, 15, 20];

function StepButton({
  glyph,
  label,
  disabled,
  onPress,
}: {
  glyph: string;
  label: string;
  disabled: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={{
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: palette.selected,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: disabled ? 0.4 : 1,
      }}
    >
      <Text style={[Type.titleSm, { fontSize: 22, lineHeight: 28, color: palette.plum }]}>
        {glyph}
      </Text>
    </Pressable>
  );
}

/**
 * Practices · Daily goal (10 §3.7): a stepper in steps of 5 from 5 to 60 minutes, presets, and one
 * gentle nudge at 19:00 on days the goal is not yet met. Save stores the goal on the profile.
 */
export default function DailyGoal() {
  const { t } = useTranslation();
  const { goal, today, setGoal, refreshNudge } = useDailyGoal();
  const [value, setValue] = useState(goal);
  const [remind, setRemind] = useState(false);
  const [busy, setBusy] = useState(false);
  useEffect(() => setValue(goal), [goal]);
  useEffect(() => {
    void goalNudgeEnabled().then(setRemind);
  }, []);

  async function save() {
    setBusy(true);
    try {
      await setGoal(value);
      await refreshNudge(today, value, remind);
      toast.success(t('practices.goal.saved'));
      backTo(undefined, '/(tabs)/mindful');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <SettingsScreen
      title={t('practices.goal.title')}
      backLabel={t('common.back')}
      onBack={() => backTo(undefined, '/(tabs)/mindful')}
      glows={[
        { color: palette.mustard, opacity: 0.15, x: 200, y: 40, width: 220, blur: 90 },
        { color: palette.lavenderSoft, opacity: 0.25, x: -70, y: -50, width: 280, blur: 90 },
      ]}
      contentStyle={{ gap: 24 }}
      cta={<AppButton title={t('practices.goal.save')} busy={busy} onPress={() => void save()} />}
    >
      <View style={{ gap: 8 }}>
        <Text
          accessibilityRole="header"
          style={[Type.titleXl, { fontSize: 30, lineHeight: 40, color: palette.ink }]}
        >
          {t('practices.goal.heading')}
        </Text>
        <Text style={[Type.bodyM, { lineHeight: 22, color: palette.textMuted }]}>
          {t('practices.goal.body')}
        </Text>
      </View>
      <View
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel={t('practices.goal.title')}
        accessibilityValue={{ text: `${value} ${t('practices.goal.perDay')}` }}
        accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
        onAccessibilityAction={(e) =>
          setValue((v) => stepGoal(v, e.nativeEvent.actionName === 'increment' ? 1 : -1))
        }
        style={{
          backgroundColor: palette.white,
          borderRadius: 28,
          paddingVertical: 24,
          paddingHorizontal: 20,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <StepButton
          glyph="−"
          label={t('practices.goal.less')}
          disabled={value <= GOAL_MIN}
          onPress={() => setValue((v) => stepGoal(v, -1))}
        />
        <View style={{ alignItems: 'center' }}>
          <Text style={[Type.body, { fontSize: 56, lineHeight: 64, color: palette.ink }]}>
            {value}
          </Text>
          <Text style={[Type.captionM, { color: palette.textMuted }]}>
            {t('practices.goal.perDay')}
          </Text>
        </View>
        <StepButton
          glyph="+"
          label={t('practices.goal.more')}
          disabled={value >= GOAL_MAX}
          onPress={() => setValue((v) => stepGoal(v, 1))}
        />
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 6 }}>
        {PRESETS.map((m) => (
          <Chip
            key={m}
            kind="preset"
            label={t('practices.minutes', { count: m })}
            selected={value === m}
            onPress={() => setValue(m)}
          />
        ))}
      </View>
      <ListGroup>
        <ListRow
          label={t('practices.goal.remind')}
          supportingText={t('practices.goal.remindBody')}
          trailing="toggle"
          toggled={remind}
          onToggle={setRemind}
        />
      </ListGroup>
    </SettingsScreen>
  );
}
