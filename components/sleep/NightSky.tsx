import React from 'react';
import { type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

/**
 * Star field shared by the dark sleep screens (06 §4.1). One field exported from the largest
 * frame (`6712:4503`, 375x740) and cropped to each screen's height: [cx, cy, r, opacity].
 */
const STARS: [number, number, number, number][] = [
  [0, 20, 1.4, 0.9], [83, 157, 0.8, 0.45], [249, 431, 0.8, 0.7], [332, 568, 0.8, 0.3], [40, 705, 0.8, 0.6],
  [123, 142, 1.4, 0.9], [289, 416, 0.8, 0.45], [372, 553, 0.8, 0.7], [80, 690, 0.8, 0.3], [163, 127, 0.8, 0.6],
  [329, 401, 0.8, 0.9], [37, 538, 0.8, 0.45], [120, 675, 0.8, 0.7], [203, 112, 0.8, 0.3], [286, 249, 0.8, 0.6],
  [369, 386, 1.4, 0.9], [77, 523, 0.8, 0.45], [160, 660, 0.8, 0.7], [243, 97, 0.8, 0.3], [326, 234, 0.8, 0.6],
  [34, 371, 0.8, 0.9], [117, 508, 1.4, 0.45], [200, 645, 0.8, 0.7], [283, 82, 0.8, 0.3], [366, 219, 0.8, 0.6],
  [74, 356, 0.8, 0.9], [157, 493, 0.8, 0.45], [240, 630, 1.4, 0.7], [323, 67, 0.8, 0.3], [31, 204, 0.8, 0.6],
  [197, 478, 0.8, 0.9], [280, 615, 0.8, 0.45], [363, 52, 1.4, 0.7], [71, 189, 0.8, 0.3], [237, 463, 0.8, 0.6],
];

const DESIGN_WIDTH = 375;

/** Stars for a dark area `width` wide and `height` tall; x scales with width, y is kept as designed. */
export function StarField({ width, height, style }: { width: number; height: number; style?: StyleProp<ViewStyle> }) {
  const sx = width / DESIGN_WIDTH;
  return (
    <Svg width={width} height={height} style={style} pointerEvents="none">
      {STARS.filter(([, cy]) => cy <= height).map(([cx, cy, r, o], i) => (
        <Circle key={i} cx={cx * sx} cy={cy} r={r} fill="#FFFFFF" fillOpacity={o} />
      ))}
    </Svg>
  );
}

/** Crescent moon `6712:4235`, 72x72 artboard. */
export function Moon({ size = 72, color = '#F3E9F3', style }: { size?: number; color?: string; style?: StyleProp<ViewStyle> }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 72 72" style={style} pointerEvents="none">
      <Path
        fill={color}
        d="M46.5 7.5C41.9483 7.52049 37.4677 8.63091 33.4332 10.7383C29.3986 12.8457 25.9276 15.8888 23.3104 19.6129C20.6933 23.3371 19.0062 27.6339 18.3904 32.1438C17.7745 36.6537 18.2478 41.2455 19.7707 45.5349C21.2936 49.8244 23.8217 53.6867 27.1435 56.7986C30.4654 59.9105 34.4842 62.1816 38.8638 63.4216C43.2434 64.6617 47.8563 64.8348 52.3165 63.9263C56.7766 63.0178 60.9544 61.0543 64.5 58.2C61.171 59.3819 57.6418 59.8965 54.1139 59.7145C50.586 59.5325 47.1285 58.6574 43.9388 57.1391C37.4969 54.0729 32.5369 48.5732 30.15 41.85C27.763 35.1268 28.1446 27.7307 31.2109 21.2888C34.2771 14.8469 39.7767 9.88695 46.5 7.5Z"
      />
    </Svg>
  );
}
