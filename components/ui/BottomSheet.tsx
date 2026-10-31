import React from 'react';
import { Modal, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { FadeIn, FadeOut, SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { palette } from '@/constants/theme';

/**
 * Bottom sheet (00-foundations §11.7), from the frames on Mood · Day details `6787:9464`,
 * Edit reminder time `6787:7644`, Choose a sound `6787:6252` and Entry options `6770:4929`.
 *
 * Overlay `#241A2E` @0.45 (@0.40 on Entry options). Sheet `#F7F4F2`, top radii 32, padding
 * 12/24/40/24, column gap 16 (20 on the practice sheets), content centred. Grabber 40×4 `#CFC6D6` r2.
 * The older white End early sheet (`6787:6575`, r40) and the crisis sheet (r36) can pass `radius`
 * and `background`.
 */
export function SheetPanel({
  children,
  gap = 16,
  radius = 32,
  background = palette.bg,
  grabber = true,
  style,
}: {
  children: React.ReactNode;
  gap?: number;
  radius?: number;
  background?: string;
  grabber?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const insets = useSafeAreaInsets();
  return (
    <View
      style={[
        {
          backgroundColor: background,
          borderTopLeftRadius: radius,
          borderTopRightRadius: radius,
          paddingTop: 12,
          paddingHorizontal: 24,
          // 40 in Figma is measured to the screen edge, over the 34pt home indicator.
          paddingBottom: Math.max(40, insets.bottom + 6),
          gap,
          alignItems: 'center',
        },
        style,
      ]}
    >
      {grabber && <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: palette.borderStrong }} />}
      {children}
    </View>
  );
}

export function BottomSheet({
  visible,
  onClose,
  children,
  overlayOpacity = 0.45,
  closeLabel = 'Close',
  ...panel
}: Omit<React.ComponentProps<typeof SheetPanel>, 'children'> & {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  overlayOpacity?: number;
  /** Accessibility label of the overlay, which closes the sheet. */
  closeLabel?: string;
}) {
  return (
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent onRequestClose={onClose}>
      {visible && (
        <View style={{ flex: 1, justifyContent: 'flex-end' }}>
          <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(200)} style={[StyleSheet.absoluteFill, { backgroundColor: `rgba(36,26,46,${overlayOpacity})` }]}>
            <Pressable accessibilityRole="button" accessibilityLabel={closeLabel} onPress={onClose} style={StyleSheet.absoluteFill} />
          </Animated.View>
          <Animated.View entering={SlideInDown.duration(260)} exiting={SlideOutDown.duration(200)} accessibilityViewIsModal>
            <SheetPanel {...panel}>{children}</SheetPanel>
          </Animated.View>
        </View>
      )}
    </Modal>
  );
}
