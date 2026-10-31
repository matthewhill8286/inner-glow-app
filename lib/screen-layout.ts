export const TAB_BAR_HEIGHT = 72;
export function tabBarOffset(bottomInset: number): number {
  return Math.max(8, bottomInset - 6);
}
export function screenBottomPadding(bottomInset: number, tabBarVisible = true): number {
  return tabBarVisible
    ? TAB_BAR_HEIGHT + tabBarOffset(bottomInset) + 24
    : Math.max(bottomInset, 16) + 16;
}

export function welcomeLayout(width: number, height: number, fontScale = 1) {
  const compact = height < 700 || fontScale > 1.3;
  const contentWidth = Math.max(0, Math.min(width, 520) - 56);
  return {
    artworkHeight: Math.min((contentWidth * 280) / 360, compact ? 160 : 240),
    copyTop: compact ? 24 : 44,
  };
}
