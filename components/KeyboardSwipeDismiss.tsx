import React, { useRef } from 'react';
import { Keyboard, View, type GestureResponderEvent, type ViewProps } from 'react-native';
import { isSwipeDown } from '@/lib/keyboard';

/**
 * Closes the keyboard on a swipe down anywhere in the app, including screens that do not scroll.
 * It only watches touches as they bubble up and never takes the gesture, so taps, buttons and
 * scrolling behave as before. Scroll views also close it themselves (`KEYBOARD_DISMISS_MODE`).
 */
export function KeyboardSwipeDismiss({ children, ...props }: ViewProps) {
  const start = useRef<{ x: number; y: number } | null>(null);

  const onTouchStart = (e: GestureResponderEvent) => {
    const { pageX, pageY } = e.nativeEvent;
    start.current = Keyboard.isVisible() ? { x: pageX, y: pageY } : null;
  };
  const onTouchMove = (e: GestureResponderEvent) => {
    const from = start.current;
    if (!from || e.nativeEvent.touches.length > 1) return;
    const { pageX, pageY } = e.nativeEvent;
    if (isSwipeDown(from.x, from.y, pageX, pageY)) {
      start.current = null;
      Keyboard.dismiss();
    }
  };
  const onTouchEnd = () => {
    start.current = null;
  };

  return (
    <View {...props} onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd} onTouchCancel={onTouchEnd}>
      {children}
    </View>
  );
}
