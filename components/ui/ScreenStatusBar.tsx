import React from 'react';
import { StatusBar, type StatusBarStyle } from 'expo-status-bar';
import { useIsFocused } from '@react-navigation/native';

/**
 * The status bar style for one screen. Tab screens stay mounted when you leave them, so a dark
 * screen's light status bar would otherwise stay on top of every light screen opened after it.
 * Rendering it only while focused hands the style back to the screen underneath.
 */
export function ScreenStatusBar({ style }: { style: StatusBarStyle }) {
  return useIsFocused() ? <StatusBar style={style} /> : null;
}
