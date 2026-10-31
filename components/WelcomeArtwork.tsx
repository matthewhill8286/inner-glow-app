import React from 'react';
import Svg, { Circle, Ellipse, G, Line, Path, Rect } from 'react-native-svg';

/** Original geometric illustrations: quiet forms, one stroke weight, no stock mascots. */
export function GlowMark({ size = 32, color = '#526651' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32" accessible={false}>
      <Path
        d="M5 21a11 11 0 0 1 22 0M4 25h24M16 2v4M4 7l3 3M28 7l-3 3"
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
      />
    </Svg>
  );
}

export default function WelcomeArtwork({ step }: { step: number }) {
  return (
    <Svg
      width="100%"
      height="100%"
      viewBox="0 0 360 280"
      preserveAspectRatio="xMidYMid meet"
      accessible={false}
    >
      <Ellipse cx="180" cy="250" rx="128" ry="7" fill="#E5E7DD" />
      <G stroke="#526651" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
        {step === 0 && (
          <>
            <Circle cx="180" cy="128" r="82" fill="#E9EDE2" stroke="none" />
            <Circle cx="180" cy="128" r="57" fill="#D7DECC" stroke="none" />
            <Path
              d="M66 189c45-32 78-30 114-4s74 33 114 4M66 208c45-32 78-30 114-4s74 33 114 4M66 227c45-32 78-30 114-4s74 33 114 4"
              fill="none"
            />
            <Path d="M180 31V17M112 55l-10-10M248 55l10-10M87 128H73M273 128h14" />
          </>
        )}
        {step === 1 && (
          <>
            <Circle cx="180" cy="137" r="100" fill="#E9EDE2" stroke="none" />
            <Rect x="108" y="58" width="144" height="179" rx="12" fill="#FAF9F5" />
            <Line x1="130" y1="58" x2="130" y2="237" />
            <Path d="M154 99h72M154 120h51M154 175h72M154 196h46" fill="none" />
            <Circle cx="182" cy="148" r="13" fill="#D7DECC" stroke="none" />
            <Path d="M176 148l4 4 9-9" fill="none" />
          </>
        )}
        {step === 2 && (
          <>
            <Circle cx="180" cy="137" r="100" fill="#E9EDE2" stroke="none" />
            <Path
              d="M78 78h155a12 12 0 0 1 12 12v67a12 12 0 0 1-12 12H123l-30 24v-24H78a12 12 0 0 1-12-12V90a12 12 0 0 1 12-12Z"
              fill="#FAF9F5"
            />
            <Path
              d="M178 183h105a12 12 0 0 1 12 12v28a12 12 0 0 1-12 12h-14v16l-22-16h-69a12 12 0 0 1-12-12v-28a12 12 0 0 1 12-12Z"
              fill="#D7DECC"
            />
            <Path d="M98 108h114M98 131h82M190 209h80" fill="none" />
          </>
        )}
        {step === 3 && (
          <>
            <Circle cx="180" cy="137" r="100" fill="#E9EDE2" stroke="none" />
            <Path d="M81 218V64M81 218h205" fill="none" />
            <Path d="m103 193 43-38 47 16 41-69 35-30" fill="none" strokeWidth={2} />
            {[
              [103, 193],
              [146, 155],
              [193, 171],
              [234, 102],
              [269, 72],
            ].map(([x, y]) => (
              <Circle key={x} cx={x} cy={y} r="6" fill="#FAF9F5" />
            ))}
            <Path d="M103 232v5M146 232v5M193 232v5M234 232v5M269 232v5" />
          </>
        )}
        {step === 4 && (
          <>
            <Circle cx="180" cy="137" r="100" fill="#E9EDE2" stroke="none" />
            <Path
              d="M180 101c-37-23-68-25-99-16v139c34-8 66-5 99 16 33-21 65-24 99-16V85c-31-9-62-7-99 16Z"
              fill="#FAF9F5"
            />
            <Path
              d="M180 101v139M105 117l49 12M105 146l49 12M105 175l49 12M204 129l49-12M204 158l49-12M204 187l49-12"
              fill="none"
            />
          </>
        )}
        {step === 5 && (
          <>
            <Circle cx="180" cy="137" r="100" fill="#E9EDE2" stroke="none" />
            <Circle cx="140" cy="134" r="58" fill="#FAF9F5" />
            <Circle cx="220" cy="134" r="58" fill="#D7DECC" fillOpacity="0.75" />
            <Path d="M155 208c16 7 34 7 50 0M166 61c9-2 19-2 28 0" fill="none" />
          </>
        )}
      </G>
    </Svg>
  );
}
