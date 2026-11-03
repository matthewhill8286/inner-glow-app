import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { palette } from '@/constants/theme';
import { Type } from '@/constants/typography';
import { Icon } from '@/components/icons/Icon';
import { GlowField } from '@/components/glow/Glow';
import { LogoMark } from '@/components/brand/LogoMark';
import { AppButton } from '@/components/ui/AppButton';
import { IconButton } from '@/components/ui/IconButton';
import type { PaywallPlan } from '@/lib/paywall';
import { KEYBOARD_DISMISS_MODE } from '@/lib/keyboard';

export type PaywallPlanCard = {
  name: string;
  sub: string;
  /** Right-hand price, per month ("€4.99/mo"). */
  price: string;
  badge?: string | null;
};

function PlanCard({
  plan,
  selected,
  onPress,
}: {
  plan: PaywallPlanCard;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={`${plan.name}, ${plan.sub}, ${plan.price}${plan.badge ? `, ${plan.badge}` : ''}`}
      onPress={onPress}
      style={{
        minHeight: 68,
        borderRadius: 22,
        backgroundColor: palette.white,
        borderWidth: selected ? 2 : 1,
        borderColor: selected ? palette.plum : palette.borderLilac,
        flexDirection: 'row',
        alignItems: 'center',
        paddingLeft: selected ? 17 : 18,
        paddingRight: selected ? 15 : 16,
        paddingVertical: 12,
        gap: 12,
      }}
    >
      <View
        style={{
          width: 22,
          height: 22,
          borderRadius: 11,
          borderWidth: 2,
          borderColor: selected ? palette.plum : palette.borderStrong,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {selected && (
          <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: palette.plum }} />
        )}
      </View>
      <View style={{ flex: 1, gap: 4 }}>
        <Text style={[Type.bodyStrong, { lineHeight: 19, letterSpacing: 0, color: palette.ink }]}>
          {plan.name}
        </Text>
        <Text style={[Type.captionM, { color: palette.textMuted }]}>{plan.sub}</Text>
      </View>
      <View style={{ alignItems: 'flex-end', gap: 6 }}>
        {plan.badge ? (
          <View
            style={{
              backgroundColor: palette.mustard,
              borderRadius: 999,
              paddingHorizontal: 8,
              paddingVertical: 2,
            }}
          >
            <Text style={[Type.caption, { fontSize: 11, lineHeight: 13, color: palette.ink }]}>
              {plan.badge}
            </Text>
          </View>
        ) : null}
        <Text style={[Type.bodyStrong, { lineHeight: 19, letterSpacing: 0, color: palette.ink }]}>
          {plan.price}
        </Text>
      </View>
    </Pressable>
  );
}

/**
 * Shared paywall (01 §2.7 with the 08 §2.5.1 library values): glows, the 44 close button, the logo
 * mark, title and subtitle, three feature checks, the Yearly and Monthly cards, the CTA and the fine
 * print with a tappable "Restore purchase". Screens pass the copy; this component holds no logic.
 */
export function Paywall({
  title,
  subtitle,
  features,
  plans,
  selected,
  onSelect,
  cta,
  finePrint,
  restoreLabel,
  onRestore,
  onClose,
  closeLabel,
  notice,
  footer,
}: {
  title: string;
  subtitle: string;
  features: string[];
  plans: Record<PaywallPlan, PaywallPlanCard>;
  selected: PaywallPlan;
  onSelect: (plan: PaywallPlan) => void;
  cta: { label: string; onPress: () => void; busy?: boolean; disabled?: boolean };
  finePrint: string;
  restoreLabel?: string;
  onRestore?: () => void;
  onClose: () => void;
  closeLabel: string;
  /** A line above the CTA, for example when prices could not load. */
  notice?: React.ReactNode;
  footer?: React.ReactNode;
}) {
  const insets = useSafeAreaInsets();
  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <GlowField
        glows={[
          { color: palette.mustard, opacity: 0.28, x: 37.5, y: 0, width: 300, blur: 80 },
          { color: palette.lavenderSoft, opacity: 0.25, x: 160, y: 90, width: 200, blur: 80 },
        ]}
      />
      <ScrollView keyboardDismissMode={KEYBOARD_DISMISS_MODE}
        contentContainerStyle={{
          flexGrow: 1,
          paddingTop: insets.top + 52,
          paddingHorizontal: 24,
          paddingBottom: Math.max(insets.bottom, 16) + 16,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ alignItems: 'center', gap: 28 }}>
          <LogoMark size={72} />
          <View style={{ alignItems: 'center', gap: 8 }}>
            <Text
              accessibilityRole="header"
              style={[Type.titleXl, { letterSpacing: 0, color: palette.ink, textAlign: 'center' }]}
            >
              {title}
            </Text>
            <Text
              style={[
                Type.bodyM,
                { lineHeight: 21, color: palette.textMuted, textAlign: 'center', maxWidth: 287 },
              ]}
            >
              {subtitle}
            </Text>
          </View>
        </View>

        <View style={{ marginTop: 48, gap: 14, paddingHorizontal: 32 }}>
          {features.map((f) => (
            <View key={f} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 12,
                  backgroundColor: 'rgba(226,204,64,0.30)',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Icon name="line/check" size={14} color={palette.plumDeep} />
              </View>
              <Text style={[Type.body, { flex: 1, color: palette.ink }]}>{f}</Text>
            </View>
          ))}
        </View>

        <View accessibilityRole="radiogroup" style={{ marginTop: 48, gap: 10 }}>
          {(['yearly', 'monthly'] as const).map((plan) => (
            <PlanCard
              key={plan}
              plan={plans[plan]}
              selected={selected === plan}
              onPress={() => onSelect(plan)}
            />
          ))}
        </View>

        <View style={{ flex: 1, minHeight: 24 }} />
        {notice}
        <AppButton
          title={cta.label}
          size="lg"
          busy={cta.busy}
          disabled={cta.disabled}
          onPress={cta.onPress}
        />
        <Text
          style={[
            Type.caption,
            {
              fontFamily: Type.chip.fontFamily,
              fontWeight: Type.chip.fontWeight,
              color: palette.textSubtle,
              textAlign: 'center',
              marginTop: 16,
              lineHeight: 16,
            },
          ]}
        >
          {finePrint}
          {onRestore && restoreLabel ? (
            <>
              {' · '}
              <Text
                accessibilityRole="button"
                onPress={onRestore}
                suppressHighlighting
                style={{ textDecorationLine: 'underline' }}
              >
                {restoreLabel}
              </Text>
            </>
          ) : null}
        </Text>
        {footer}
      </ScrollView>
      <IconButton
        icon="arrow/close"
        variant="nav"
        accessibilityLabel={closeLabel}
        onPress={onClose}
        style={{
          position: 'absolute',
          top: insets.top + 8,
          right: 18,
          backgroundColor: palette.white,
        }}
      />
    </View>
  );
}
