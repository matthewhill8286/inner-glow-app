import { Platform } from 'react-native';

/**
 * Dragging a list down closes the keyboard. iOS lets the keyboard follow the finger; Android has
 * no interactive mode, so it closes as soon as the drag starts.
 */
export const KEYBOARD_DISMISS_MODE = Platform.OS === 'ios' ? 'interactive' : 'on-drag';

/** A downward swipe of at least this many points, mostly vertical, closes the keyboard (`KeyboardSwipeDismiss`). */
export const SWIPE_DISMISS_DISTANCE = 24;

/** Whether a drag from (x0, y0) to (x1, y1) is a deliberate swipe down. */
export function isSwipeDown(x0: number, y0: number, x1: number, y1: number): boolean {
  const dy = y1 - y0;
  return dy >= SWIPE_DISMISS_DISTANCE && dy > Math.abs(x1 - x0) * 1.5;
}
